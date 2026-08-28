/**
 * Central App Config
 * ---------------------------------------------------------
 * Dua sumber digabung di sini:
 *  - .env       -> nilai yang WAJIB beda tiap deploy / rahasia
 *                  (PORT, SITE_URL, kredensial Telegram)
 *  - settings.json -> nilai yang jarang berubah & aman di-commit
 *                  (nama/deskripsi API, tuning rate limit & ban)
 *
 * Modul lain cukup require("./config") — tidak perlu tahu dari mana
 * tiap nilai berasal.
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");

const settings = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "config", "settings.json"), "utf8")
);

const PORT = process.env.PORT || 4000;

// Kalau SITE_URL tidak diisi di .env, fallback ke localhost:PORT (mode development)
const RAW_SITE_URL = (process.env.SITE_URL || `http://localhost:${PORT}`).trim();
const SITE_URL = RAW_SITE_URL.endsWith("/") ? RAW_SITE_URL.slice(0, -1) : RAW_SITE_URL;

module.exports = {
  // ---- dari .env (per-deploy / rahasia) ----
  PORT,
  SITE_URL,
  TELEGRAM_ENABLED: String(process.env.TELEGRAM_ENABLED).toLowerCase() === "true",
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "",
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || "",
  TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET || "",

  // ---- dari settings.json (tuning, aman di-commit) ----
  API_NAME: settings.apiName,
  API_CREATOR: settings.apiCreator,
  API_DESCRIPTION: settings.apiDescription,
  TELEGRAM_LOG_ALL_REQUESTS: !!settings.telegramLogAllRequests,
  RATE_LIMIT_WINDOW_MS: settings.rateLimit.windowMs,
  RATE_LIMIT_MAX_IP: settings.rateLimit.maxIp,
  RATE_LIMIT_MAX_DEVICE: settings.rateLimit.maxDevice,
  BAN_THRESHOLD: settings.ban.threshold,
  BAN_WINDOW_MS: settings.ban.windowMs,
  BAN_DURATION_MS: settings.ban.durationMs
};
