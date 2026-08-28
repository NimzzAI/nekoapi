import crypto from "crypto";

export function clientIP(req) {
  for (const key of ["cf-connecting-ip", "x-real-ip"]) {
    const v = (req.headers[key] || "").toString().trim();
    if (v) return v;
  }
  const xff = req.headers["x-forwarded-for"];
  if (xff) return xff.toString().split(",")[0].trim();
  return req.socket?.remoteAddress || req.ip || "unknown";
}

// Only a network prefix is ever kept — raw IPs are never stored.
export function maskIP(ip) {
  if (!ip || ip === "unknown") return "unknown";
  if (ip.includes(":")) {
    const parts = ip.split(":");
    if (parts.length >= 3) return parts.slice(0, 3).join(":") + "::/48";
    return "unknown";
  }
  const parts = ip.split(".");
  if (parts.length !== 4) return "unknown";
  return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
}

// Coarse signals + a daily rotating salt — never a persistent tracking ID.
export function deviceID(req) {
  const daySalt = Math.floor(Date.now() / 86_400_000).toString();
  const material = [
    clientIP(req),
    req.headers["user-agent"] || "",
    req.headers["accept-language"] || "",
    req.headers["sec-ch-ua-platform"] || "",
    daySalt,
  ].join("|");
  const sum = crypto.createHash("sha256").update(material).digest("hex");
  return "dev_" + sum.slice(0, 20);
}

export function coarseClient(req) {
  const ua = req.headers["user-agent"] || "";
  let platform = "unknown";
  if (/Windows/i.test(ua)) platform = "Windows";
  else if (/Mac OS X|Macintosh/i.test(ua)) platform = "macOS";
  else if (/Android/i.test(ua)) platform = "Android";
  else if (/iPhone|iPad|iOS/i.test(ua)) platform = "iOS";
  else if (/Linux/i.test(ua)) platform = "Linux";

  let engine = "unknown";
  if (ua.includes("Firefox/")) engine = "Gecko";
  else if (ua.includes("Edg/")) engine = "Blink (Edge)";
  else if (ua.includes("Chrome/")) engine = "Blink";
  else if (ua.includes("Safari/")) engine = "WebKit";

  const formFactor = /Mobi|Android|iPhone|iPad/i.test(ua) ? "mobile" : "desktop";
  return { platform, engine, formFactor };
}

const DEFAULT_LIMIT = { windowMs: 60_000, max: 90 };

const ENDPOINT_LIMITS = {
  "/telegram/send": { windowMs: 60_000, max: 8 },
  "/video/pack": { windowMs: 60_000, max: 6 },
  "/image/avatar": { windowMs: 60_000, max: 60 },
  "/ai/chat": { windowMs: 60_000, max: 20 },
  "/download/tiktok": { windowMs: 60_000, max: 20 },
  "/download/youtube": { windowMs: 60_000, max: 15 },
  "/download/instagram": { windowMs: 60_000, max: 20 },
  "/search/anime": { windowMs: 60_000, max: 30 },
  "/search/lyrics": { windowMs: 60_000, max: 30 },
  "/search/npm": { windowMs: 60_000, max: 30 },
};

export class Limiter {
  constructor() {
    this.buckets = new Map();
  }

  check(identity, path) {
    const limit = ENDPOINT_LIMITS[path] || DEFAULT_LIMIT;
    const now = Date.now();
    const key = `${identity}:${path}`;

    let b = this.buckets.get(key);
    if (b && b.blockedUntil > now) {
      return {
        allowed: false,
        limit: limit.max,
        remaining: 0,
        resetAt: b.blockedUntil,
        retryAfter: Math.floor((b.blockedUntil - now) / 1000) + 1,
        blocked: true,
      };
    }
    if (!b || b.resetAt <= now) {
      b = { count: 0, resetAt: now + limit.windowMs, blockedUntil: 0 };
      this.buckets.set(key, b);
    }
    b.count++;
    if (b.count > limit.max * 3) {
      b.blockedUntil = now + 300_000;
    }
    const allowed = b.count <= limit.max;
    const result = {
      allowed,
      limit: limit.max,
      remaining: Math.max(0, limit.max - b.count),
      resetAt: b.resetAt,
      blocked: false,
    };
    if (!allowed) result.retryAfter = Math.floor((b.resetAt - now) / 1000) + 1;
    return result;
  }

  snapshot() {
    const now = Date.now();
    let blocked = 0;
    let throttled = 0;
    for (const b of this.buckets.values()) {
      if (b.blockedUntil > now) blocked++;
      if (b.count > DEFAULT_LIMIT.max) throttled++;
    }
    return { activeBuckets: this.buckets.size, blockedIdentities: blocked, throttledIdentities: throttled };
  }

  sweep() {
    const now = Date.now();
    for (const [key, b] of this.buckets) {
      if (b.resetAt <= now && b.blockedUntil <= now) this.buckets.delete(key);
    }
  }
}

export { DEFAULT_LIMIT, ENDPOINT_LIMITS };
