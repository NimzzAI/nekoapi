/**
 * Telegram Webhook Notifier
 * ---------------------------------------------------------
 * Mengirim notifikasi ke Telegram (via Bot API) untuk event-event
 * penting: server start, rate limit terlampaui, IP/device diblokir,
 * dan error server. Pesan di-queue lalu dikirim gabungan tiap 2 detik
 * supaya tidak kena flood limit dari Telegram.
 *
 * Diaktifkan lewat .env:
 *   TELEGRAM_ENABLED=true
 *   TELEGRAM_BOT_TOKEN=xxxx
 *   TELEGRAM_CHAT_ID=xxxx
 */

const axios = require("axios");
const chalk = require("chalk");
const config = require("./config");

const ENABLED = config.TELEGRAM_ENABLED;
const BOT_TOKEN = config.TELEGRAM_BOT_TOKEN;
const CHAT_ID = config.TELEGRAM_CHAT_ID;
const LOG_ALL = config.TELEGRAM_LOG_ALL_REQUESTS;

const API_URL = BOT_TOKEN ? `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage` : null;

let queue = [];
let warnedMissingConfig = false;

function isConfigured() {
  return ENABLED && BOT_TOKEN && CHAT_ID;
}

function warnOnce() {
  if (warnedMissingConfig) return;
  warnedMissingConfig = true;
  console.log(
    chalk.yellow(
      "[telegram] Notifikasi Telegram nonaktif (TELEGRAM_ENABLED/BOT_TOKEN/CHAT_ID belum diisi di .env)"
    )
  );
}

async function flush() {
  if (queue.length === 0) return;
  if (!isConfigured()) {
    queue = [];
    return;
  }

  const batch = queue.join("\n\n");
  queue = [];

  try {
    await axios.post(API_URL, {
      chat_id: CHAT_ID,
      text: batch,
      parse_mode: "HTML",
      disable_web_page_preview: true
    });
  } catch (err) {
    console.error(chalk.red(`[telegram] Gagal kirim notifikasi: ${err.message}`));
  }
}

setInterval(flush, 2000);

function push(message) {
  if (!isConfigured()) {
    warnOnce();
    return;
  }
  queue.push(message);
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

module.exports = {
  isConfigured,

  notifyServerStart(totalRoutes, port, siteUrl) {
    push(`🟢 <b>NekoAPI started</b>\nRoutes loaded: <b>${totalRoutes}</b>\nPort: <b>${port}</b>\nSite URL: <code>${escapeHtml(siteUrl || "-")}</code>\nTime: ${new Date().toISOString()}`);
  },

  notifyRequest({ ip, deviceId, method, url, status, duration }) {
    if (!LOG_ALL) return;
    push(
      `🟡 <b>Request</b>\n<code>[${method}] ${escapeHtml(url)}\nStatus: ${status} | ${duration}ms\nIP: ${ip} | Device: ${deviceId || "-"}</code>`
    );
  },

  notifyRateLimit({ ip, deviceId, endpoint, kind }) {
    push(
      `⚠️ <b>Rate limit terlampaui (${kind})</b>\nEndpoint: <code>${escapeHtml(endpoint)}</code>\nIP: <code>${ip}</code>\nDevice: <code>${deviceId || "-"}</code>`
    );
  },

  notifyBan({ ip, deviceId, reason, durationMs }) {
    const minutes = Math.round(durationMs / 60000);
    push(
      `🚫 <b>Klien diblokir sementara</b>\nIP: <code>${ip}</code>\nDevice: <code>${deviceId || "-"}</code>\nAlasan: ${escapeHtml(reason)}\nDurasi: ${minutes} menit`
    );
  },

  notifyError({ method, url, message }) {
    push(`🚨 <b>Server Error</b>\n<code>[${method}] ${escapeHtml(url)}</code>\n${escapeHtml(message)}`);
  },

  notify(message) {
    push(message);
  }
};
