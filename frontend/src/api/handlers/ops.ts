import { ApiError, jsonOk } from "../core/respond";
import { state } from "../core/state";
import { DEFAULT_LIMIT, ENDPOINT_LIMITS } from "../core/ratelimit";
import { getMe, getUpdates, isConfigured, send, type SendKind } from "../telegram/connector";
import type { Ctx } from "../types";

export function logs(ctx: Ctx): Response {
  const q = ctx.url.searchParams;
  const method = q.get("method")?.toUpperCase() ?? "";
  const statusFilter = q.get("status") ?? "";
  const endpoint = q.get("endpoint") ?? "";
  const ipFilter = q.get("ip") ?? "";
  const date = q.get("date") ?? "";
  const page = Math.max(1, Number(q.get("page") ?? 1) || 1);
  const perPage = Math.min(100, Math.max(1, Number(q.get("perPage") ?? 25) || 25));

  let items = state().logs;
  if (method) items = items.filter((l) => l.method === method);
  if (endpoint) items = items.filter((l) => l.path.includes(endpoint));
  if (ipFilter) items = items.filter((l) => l.ip.includes(ipFilter));
  if (date) items = items.filter((l) => new Date(l.ts).toISOString().slice(0, 10) === date);
  if (statusFilter) {
    if (/^\dxx$/i.test(statusFilter)) {
      const cls = Number(statusFilter[0]);
      items = items.filter((l) => Math.floor(l.status / 100) === cls);
    } else {
      const code = Number(statusFilter);
      if (Number.isFinite(code)) items = items.filter((l) => l.status === code);
    }
  }

  const total = items.length;
  const start = (page - 1) * perPage;
  return jsonOk({
    total,
    page,
    perPage,
    pages: Math.max(1, Math.ceil(total / perPage)),
    items: items.slice(start, start + perPage),
  });
}

export function security(): Response {
  const s = state();
  const now = Date.now();
  let blocked = 0;
  let throttled = 0;
  for (const bucket of s.buckets.values()) {
    if (bucket.blockedUntil > now) blocked += 1;
    if (bucket.count > DEFAULT_LIMIT.max) throttled += 1;
  }
  const suspicious = [...s.devices.entries()]
    .filter(([, d]) => d.suspicious > 0)
    .sort((a, b) => b[1].suspicious - a[1].suspicious)
    .slice(0, 20)
    .map(([id, d]) => ({ deviceId: id, requests: d.count, rateLimitHits: d.suspicious, lastSeen: new Date(d.lastSeen).toISOString() }));

  return jsonOk({
    limits: { default: DEFAULT_LIMIT, perEndpoint: ENDPOINT_LIMITS },
    activeBuckets: s.buckets.size,
    blockedIdentities: blocked,
    throttledIdentities: throttled,
    knownDevices: s.devices.size,
    rateLimited: s.logs.filter((l) => l.status === 429).length,
    suspicious,
    controls: [
      { name: "Rate limiting", detail: "per identity + per endpoint, fixed window with temporary block", enabled: true },
      { name: "Security headers", detail: "nosniff, DENY frames, no-referrer, permissions policy", enabled: true },
      { name: "Strict CORS", detail: "origin allowlist via ALLOWED_ORIGINS", enabled: true },
      { name: "Input validation", detail: "typed validation on every query and body field", enabled: true },
      { name: "Request size limit", detail: "16 KB JSON body cap", enabled: true },
      { name: "Upstream timeouts", detail: "10-15s abort on outbound calls", enabled: true },
      { name: "SSRF protection", detail: "outbound fetch restricted to a server-side allowlist", enabled: true },
      { name: "IP masking", detail: "only /24 and /48 prefixes are stored", enabled: true },
    ],
  });
}

export async function telegramStatus(): Promise<Response> {
  if (!isConfigured())
    return jsonOk({
      configured: false,
      status: "unconfigured",
      hint: "Set TELEGRAM_BOT_TOKEN on the backend to activate the connector.",
      capabilities: ["message", "photo", "document", "audio", "updates"],
    });
  const me = await getMe();
  let updates = 0;
  try {
    updates = (await getUpdates(5)).length;
  } catch {
    updates = 0;
  }
  return jsonOk({
    configured: true,
    status: "operational",
    bot: { id: me.id, username: me.username, name: me.first_name },
    pendingUpdates: updates,
    capabilities: ["message", "photo", "document", "audio", "updates"],
  });
}

const KINDS: SendKind[] = ["message", "photo", "document", "audio"];

export async function telegramSend(ctx: Ctx): Promise<Response> {
  const raw = await ctx.request.text();
  if (raw.length > 16 * 1024) throw new ApiError("PAYLOAD_TOO_LARGE", "body must be under 16 KB");
  let body: Record<string, unknown>;
  try {
    body = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    throw new ApiError("BAD_REQUEST", "body must be valid JSON");
  }

  const chatId = String(body["chatId"] ?? "").trim();
  if (!/^-?\d{1,20}$|^@[\w]{3,64}$/.test(chatId))
    throw new ApiError("BAD_REQUEST", "chatId must be a numeric chat id or @username");

  const kind = String(body["kind"] ?? "message") as SendKind;
  if (!KINDS.includes(kind)) throw new ApiError("BAD_REQUEST", `kind must be one of ${KINDS.join("|")}`);

  const text = body["text"] === undefined ? undefined : String(body["text"]).slice(0, 3500);
  const url = body["url"] === undefined ? undefined : String(body["url"]);
  if (url && !/^https:\/\/[\w.-]+\.[a-z]{2,}\/\S*$/i.test(url))
    throw new ApiError("BAD_REQUEST", "url must be an absolute https URL");

  const result = await send({ kind, chatId, ...(text ? { text } : {}), ...(url ? { url } : {}) });
  return jsonOk(result);
}
