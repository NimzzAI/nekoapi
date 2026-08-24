/**
 * Shared axios instance + helpers for calling public third-party APIs
 * directly from an endpoint file. Every endpoint validates its own input
 * and calls this itself — there is no shared "bridge" layer, matching the
 * one-file-one-endpoint structure under src/api/<category>/.
 */
const axios = require("axios");

const DEFAULT_TIMEOUT_MS = 15_000;

const DESKTOP_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
const MOBILE_UA =
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36";

async function getJSON(url, config = {}) {
  const res = await axios.get(url, {
    timeout: DEFAULT_TIMEOUT_MS,
    headers: { "User-Agent": DESKTOP_UA, Accept: "application/json, text/plain, */*", ...(config.headers || {}) },
    ...config,
  });
  return res.data;
}

async function postJSON(url, body = {}, config = {}) {
  const res = await axios.post(url, body, {
    timeout: DEFAULT_TIMEOUT_MS,
    headers: { "User-Agent": DESKTOP_UA, Accept: "application/json, text/plain, */*", ...(config.headers || {}) },
    ...config,
  });
  return res.data;
}

module.exports = { getJSON, postJSON, DEFAULT_TIMEOUT_MS, DESKTOP_UA, MOBILE_UA };
