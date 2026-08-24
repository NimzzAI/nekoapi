/**
 * Telegram connector abstraction.
 * Every endpoint talks to Telegram through this module — no bot logic leaks
 * into route handlers, and the token never leaves the server.
 */
import { ApiError } from "../core/respond";

const API = "https://api.telegram.org";

export type SendKind = "message" | "photo" | "document" | "audio";

function token(): string | null {
  const t = process.env["TELEGRAM_BOT_TOKEN"];
  return t && t.length > 10 ? t : null;
}

export function isConfigured(): boolean {
  return token() !== null;
}

async function call<T>(method: string, payload: Record<string, unknown>): Promise<T> {
  const t = token();
  if (!t) throw new ApiError("FORBIDDEN", "Telegram connector is not configured on this server");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(`${API}/bot${t}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const body = (await res.json()) as { ok: boolean; result?: T; description?: string };
    if (!body.ok) throw new ApiError("UPSTREAM_ERROR", body.description ?? "Telegram rejected the request");
    return body.result as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if ((err as Error).name === "AbortError") throw new ApiError("TIMEOUT", "Telegram request timed out");
    throw new ApiError("UPSTREAM_ERROR", "Telegram connector is unreachable");
  } finally {
    clearTimeout(timer);
  }
}

export type BotInfo = { id: number; username: string; first_name: string };

export async function getMe(): Promise<BotInfo> {
  return call<BotInfo>("getMe", {});
}

export async function getUpdates(limit = 5) {
  return call<unknown[]>("getUpdates", { limit: Math.min(Math.max(limit, 1), 20), timeout: 0 });
}

export async function send(input: {
  kind: SendKind;
  chatId: string;
  text?: string;
  url?: string;
}): Promise<{ messageId: number; kind: SendKind }> {
  const { kind, chatId, text, url } = input;
  const base: Record<string, unknown> = { chat_id: chatId };

  let method: string;
  if (kind === "message") {
    if (!text) throw new ApiError("BAD_REQUEST", "text is required for kind=message");
    method = "sendMessage";
    base["text"] = text;
  } else {
    if (!url) throw new ApiError("BAD_REQUEST", `url is required for kind=${kind}`);
    const field = kind === "photo" ? "photo" : kind === "audio" ? "audio" : "document";
    method = kind === "photo" ? "sendPhoto" : kind === "audio" ? "sendAudio" : "sendDocument";
    base[field] = url;
    if (text) base["caption"] = text;
  }

  const result = await call<{ message_id: number }>(method, base);
  return { messageId: result.message_id, kind };
}
