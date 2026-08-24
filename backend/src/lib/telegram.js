/**
 * The single place that talks to the Telegram Bot API. The bot token is
 * read from the environment and never leaves the server. This powers the
 * internal notifier (/telegram/status, /telegram/send) the bot uses to
 * push logs, errors and daily/weekly/monthly reports — not a public,
 * general-purpose feature (it's excluded from the public catalog).
 */
const axios = require("axios");

const API = "https://api.telegram.org";

class TelegramConnector {
  constructor(token) {
    this.token = token || "";
    this.client = axios.create({ timeout: 10_000 });
  }

  configured() {
    return this.token.length > 10;
  }

  async call(method, payload) {
    if (!this.configured()) {
      const err = new Error("Telegram connector is not configured on this server");
      err.code = "FORBIDDEN";
      throw err;
    }
    let res;
    try {
      res = await this.client.post(`${API}/bot${this.token}/${method}`, payload, {
        headers: { "content-type": "application/json" },
      });
    } catch (e) {
      if (e.code === "ECONNABORTED") {
        const err = new Error("Telegram connector is unreachable");
        err.code = "TIMEOUT";
        throw err;
      }
      const err = new Error("Telegram request failed");
      err.code = "UPSTREAM_ERROR";
      throw err;
    }
    const body = res.data;
    if (!body || !body.ok) {
      const err = new Error(body?.description || "Telegram rejected the request");
      err.code = "UPSTREAM_ERROR";
      throw err;
    }
    return body.result;
  }

  async getMe() {
    const info = await this.call("getMe", {});
    return { id: info.id, username: info.username, firstName: info.first_name };
  }

  async getUpdates(limit = 5) {
    const clamped = Math.min(20, Math.max(1, limit));
    return this.call("getUpdates", { limit: clamped, timeout: 0 });
  }

  async send({ kind = "message", chatId, text, url }) {
    if (!chatId) {
      const err = new Error("chatId is required");
      err.code = "BAD_REQUEST";
      throw err;
    }
    const payload = { chat_id: chatId };
    let method;

    if (kind === "message") {
      if (!text) {
        const err = new Error("text is required for kind=message");
        err.code = "BAD_REQUEST";
        throw err;
      }
      method = "sendMessage";
      payload.text = text;
    } else if (kind === "photo" || kind === "document" || kind === "audio") {
      if (!url) {
        const err = new Error(`url is required for kind=${kind}`);
        err.code = "BAD_REQUEST";
        throw err;
      }
      method = { photo: "sendPhoto", document: "sendDocument", audio: "sendAudio" }[kind];
      payload[kind] = url;
      if (text) payload.caption = text;
    } else {
      const err = new Error("kind must be message|photo|document|audio");
      err.code = "BAD_REQUEST";
      throw err;
    }

    const result = await this.call(method, payload);
    return result.message_id;
  }
}

module.exports = { TelegramConnector };
