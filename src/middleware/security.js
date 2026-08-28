/**
 * Security Middleware — Rate Limiting by IP & Device ID
 * ---------------------------------------------------------
 * - Setiap klien diidentifikasi lewat 2 kunci: IP address & Device ID
 *   (header `X-Device-Id`, biasanya UUID yang dibuat & disimpan oleh
 *   aplikasi client). Kalau client tidak kirim X-Device-Id, dipakai
 *   fallback hash dari IP + User-Agent supaya tetap bisa dibatasi.
 * - Dua limit dicek terpisah: RATE_LIMIT_MAX_IP dan RATE_LIMIT_MAX_DEVICE,
 *   dalam jendela waktu RATE_LIMIT_WINDOW_MS. Kalau salah satu terlampaui,
 *   request ditolak 429.
 * - Kalau sebuah IP/device kena rate-limit berkali-kali (>= BAN_THRESHOLD)
 *   dalam BAN_WINDOW_MS, dia diblokir sementara selama BAN_DURATION_MS
 *   dan dicatat ke blocked_clients.json (persisten lintas restart).
 * - Semua pelanggaran dikirim ke Telegram lewat lib/telegram.js.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const chalk = require("chalk");
const telegram = require("../lib/telegram");
const config = require("../lib/config");

const WINDOW_MS = config.RATE_LIMIT_WINDOW_MS;
const MAX_IP = config.RATE_LIMIT_MAX_IP;
const MAX_DEVICE = config.RATE_LIMIT_MAX_DEVICE;
const BAN_THRESHOLD = config.BAN_THRESHOLD;
const BAN_WINDOW_MS = config.BAN_WINDOW_MS;
const BAN_DURATION_MS = config.BAN_DURATION_MS;

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const BLOCKED_FILE = path.join(DATA_DIR, "blocked_clients.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ---- in-memory state ----
const requestCounters = new Map(); // key -> { count, windowStart }
const violationLog = new Map(); // key -> [timestamps]
let blocked = new Map(); // key -> { reason, blockedAt, expiresAt }

// ---- stats exposed for /api/status & dashboard ----
const stats = {
  totalRequests: 0,
  totalBlocked429: 0,
  totalBanned: 0,
  totalErrors: 0,
  startedAt: Date.now()
};

function incrementErrors() {
  stats.totalErrors++;
}

function resetErrors() {
  const prev = stats.totalErrors;
  stats.totalErrors = 0;
  return prev;
}

function loadBlocked() {
  try {
    if (fs.existsSync(BLOCKED_FILE)) {
      const raw = JSON.parse(fs.readFileSync(BLOCKED_FILE, "utf8"));
      blocked = new Map(Object.entries(raw));
      console.log(chalk.gray(`[security] Loaded ${blocked.size} entri blokir dari disk`));
    }
  } catch (err) {
    console.error(chalk.red(`[security] Gagal load blocked_clients.json: ${err.message}`));
  }
}

function saveBlocked() {
  try {
    const obj = Object.fromEntries(blocked.entries());
    fs.writeFileSync(BLOCKED_FILE, JSON.stringify(obj, null, 2));
  } catch (err) {
    console.error(chalk.red(`[security] Gagal simpan blocked_clients.json: ${err.message}`));
  }
}

loadBlocked();

function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (xff) return xff.split(",")[0].trim();
  return req.socket?.remoteAddress || req.ip || "unknown";
}

function getDeviceId(req) {
  const header = req.headers["x-device-id"];
  if (header && String(header).trim()) return String(header).trim().slice(0, 128);

  // fallback: hash IP + User-Agent so anonymous clients are still trackable
  const ua = req.headers["user-agent"] || "unknown-ua";
  const hash = crypto.createHash("sha1").update(getClientIp(req) + ua).digest("hex").slice(0, 16);
  return `anon-${hash}`;
}

function isBanned(key) {
  const entry = blocked.get(key);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    blocked.delete(key);
    saveBlocked();
    return false;
  }
  return entry;
}

function recordViolation(key) {
  const now = Date.now();
  const arr = (violationLog.get(key) || []).filter((t) => now - t < BAN_WINDOW_MS);
  arr.push(now);
  violationLog.set(key, arr);
  return arr.length;
}

function banClient(key, reason) {
  const expiresAt = Date.now() + BAN_DURATION_MS;
  blocked.set(key, { reason, blockedAt: Date.now(), expiresAt });
  saveBlocked();
  stats.totalBanned++;
}

function checkLimit(key, max) {
  const now = Date.now();
  const entry = requestCounters.get(key);

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    requestCounters.set(key, { count: 1, windowStart: now });
    return { limited: false, count: 1 };
  }

  entry.count += 1;
  return { limited: entry.count > max, count: entry.count };
}

/**
 * Main middleware. Urutan cek: ban list -> rate limit IP -> rate limit device.
 */
function securityMiddleware(req, res, next) {
  stats.totalRequests++;

  const ip = getClientIp(req);
  const deviceId = getDeviceId(req);
  req.clientIp = ip;
  req.deviceId = deviceId;

  const banIp = isBanned(ip);
  const banDevice = isBanned(deviceId);
  if (banIp || banDevice) {
    const entry = banIp || banDevice;
    const retryAfter = Math.ceil((entry.expiresAt - Date.now()) / 1000);
    res.setHeader("Retry-After", retryAfter);
    return res.status(429).json({
      status: false,
      creator: config.API_CREATOR,
      message: "Kamu diblokir sementara karena aktivitas mencurigakan.",
      reason: entry.reason,
      retryAfterSeconds: retryAfter
    });
  }

  const ipCheck = checkLimit(`ip:${ip}`, MAX_IP);
  const deviceCheck = checkLimit(`device:${deviceId}`, MAX_DEVICE);

  if (ipCheck.limited || deviceCheck.limited) {
    stats.totalBlocked429++;
    const kind = ipCheck.limited ? "IP" : "Device";
    const key = ipCheck.limited ? ip : deviceId;

    telegram.notifyRateLimit({ ip, deviceId, endpoint: req.originalUrl, kind });

    const violations = recordViolation(key);
    if (violations >= BAN_THRESHOLD) {
      const reason = `Rate limit terlampaui ${violations}x dalam ${Math.round(BAN_WINDOW_MS / 60000)} menit`;
      banClient(key, reason);
      telegram.notifyBan({ ip, deviceId, reason, durationMs: BAN_DURATION_MS });
      console.log(chalk.bgRed.white(`[security] BANNED ${kind} ${key} — ${reason}`));
    }

    return res.status(429).json({
      status: false,
      creator: config.API_CREATOR,
      message: `Terlalu banyak request dari ${kind.toLowerCase()} kamu. Coba lagi sebentar lagi.`,
      limit: kind === "IP" ? MAX_IP : MAX_DEVICE,
      windowMs: WINDOW_MS
    });
  }

  next();
}

module.exports = {
  securityMiddleware,
  stats,
  incrementErrors,
  resetErrors,
  getClientIp,
  getDeviceId,
  _blocked: blocked
};
