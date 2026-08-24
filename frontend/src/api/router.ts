/**
 * Thin dispatcher: security middleware pipeline -> modular handler.
 */
import { ApiError, SECURITY_HEADERS, corsHeaders, jsonFail } from "./core/respond";
import { checkRate } from "./core/ratelimit";
import { deviceId, clientIp, maskIp } from "./core/device";
import { record, state } from "./core/state";
import type { Ctx } from "./types";
import * as general from "./handlers/general";
import * as media from "./handlers/media";
import * as ops from "./handlers/ops";
import * as ai from "./handlers/ai";
import * as downloader from "./handlers/downloader";
import * as search from "./handlers/search";

type Handler = (ctx: Ctx) => Response | Promise<Response>;

const ROUTES: Record<string, Handler> = {
  "GET /ping": general.ping,
  "GET /status": general.status,
  "GET /system": general.system,
  "GET /stats": general.stats,
  "GET /ip": general.ip,
  "GET /device": general.device,
  "GET /random": general.random,
  "GET /time": general.time,
  "GET /endpoints": general.endpoints,
  "GET /logs": ops.logs,
  "GET /security": ops.security,
  "GET /image/avatar": media.avatar,
  "GET /video/pack": media.videoPack,
  // Internal notifier — reachable, rate-limited and logged like any route,
  // but intentionally excluded from ENDPOINTS/CATEGORIES so it never shows
  // up in /docs, the API Explorer or the public /endpoints catalog.
  "GET /telegram/status": ops.telegramStatus,
  "POST /telegram/send": ops.telegramSend,
  "GET /ai/chat": ai.chat,
  "GET /download/tiktok": downloader.tiktok,
  "GET /download/youtube": downloader.youtube,
  "GET /download/instagram": downloader.instagram,
  "GET /search/anime": search.anime,
  "GET /search/lyrics": search.lyrics,
  "GET /search/npm": search.npm,
};

function allowedOrigins(): string[] {
  const raw = process.env["ALLOWED_ORIGINS"];
  if (!raw) return ["*"];
  return raw.split(",").map((o) => o.trim()).filter(Boolean);
}

export async function handleApi(request: Request, apiPath: string): Promise<Response> {
  const started = Date.now();
  const url = new URL(request.url);
  const path = `/${apiPath.replace(/^\/+|\/+$/g, "")}`;
  const cors = corsHeaders(request.headers.get("origin"), allowedOrigins());

  const finish = async (res: Response, status = res.status) => {
    const headers = new Headers(res.headers);
    for (const [k, v] of Object.entries({ ...SECURITY_HEADERS, ...cors })) headers.set(k, v);
    const ms = Date.now() - started;
    headers.set("x-response-time", `${ms}ms`);

    let body: BodyInit | null = res.body;
    if ((headers.get("content-type") ?? "").includes("application/json")) {
      const text = await res.text();
      try {
        const parsed = JSON.parse(text) as Record<string, unknown>;
        if (parsed["success"] === true) {
          parsed["meta"] = { ...(parsed["meta"] as object), responseTime: `${ms}ms`, path, method: request.method };
        }
        body = JSON.stringify(parsed, null, 2);
      } catch {
        body = text;
      }
    }
    return { response: new Response(body, { status, headers }), ms };
  };

  if (request.method === "OPTIONS") {
    return (await finish(new Response(null, { status: 204 }))).response;
  }

  const s = state();
  s.inFlight += 1;
  const id = await deviceId(request);
  const apiKey = request.headers.get("x-api-key");
  const identity = apiKey ? `key:${apiKey.slice(0, 24)}` : id;

  let response: Response;
  try {
    const handler = ROUTES[`${request.method} ${path}`];
    if (!handler) throw new ApiError("NOT_FOUND", `no endpoint matches ${request.method} ${path}`);

    const rate = checkRate(identity, path);
    if (!rate.allowed) {
      const res = jsonFail("RATE_LIMITED", rate.blocked ? "Temporarily blocked for abusive traffic" : "Too many requests");
      res.headers.set("retry-after", String(rate.retryAfter));
      response = res;
    } else {
      const ctx: Ctx = { request, url, path, deviceId: id, origin: url.origin };
      const raw = await Promise.race([
        Promise.resolve(handler(ctx)),
        new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new ApiError("TIMEOUT", "handler timed out")), 20_000),
        ),
      ]);
      response = raw;
      response.headers.set("x-ratelimit-limit", String(rate.limit));
      response.headers.set("x-ratelimit-remaining", String(rate.remaining));
    }
  } catch (err) {
    if (err instanceof ApiError) {
      response = jsonFail(err.code, err.message, err.details);
    } else {
      // Never leak stack traces to clients.
      console.error("[nekoapi]", err);
      response = jsonFail("INTERNAL", "Unexpected server error");
    }
  } finally {
    s.inFlight = Math.max(0, s.inFlight - 1);
  }

  const done = await finish(response);
  record({
    id: crypto.randomUUID(),
    ts: Date.now(),
    method: request.method,
    path,
    ip: maskIp(clientIp(request)),
    deviceId: id,
    status: done.response.status,
    ms: done.ms,
    apiKey: apiKey ? `${apiKey.slice(0, 6)}…` : null,
  });
  return done.response;
}
