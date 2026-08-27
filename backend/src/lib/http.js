import axios from "axios";

const DEFAULT_TIMEOUT_MS = 15_000;

const DESKTOP_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
const MOBILE_UA =
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36";

export async function getJSON(url, config = {}) {
  const res = await axios.get(url, {
    timeout: DEFAULT_TIMEOUT_MS,
    headers: { "User-Agent": DESKTOP_UA, Accept: "application/json, text/plain, */*", ...(config.headers || {}) },
    ...config,
  });
  return res.data;
}

export async function postJSON(url, body = {}, config = {}) {
  const res = await axios.post(url, body, {
    timeout: DEFAULT_TIMEOUT_MS,
    headers: { "User-Agent": DESKTOP_UA, Accept: "application/json, text/plain, */*", ...(config.headers || {}) },
    ...config,
  });
  return res.data;
}

export { DEFAULT_TIMEOUT_MS, DESKTOP_UA, MOBILE_UA };
