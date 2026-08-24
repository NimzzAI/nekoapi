import { ApiError, jsonOk } from "../core/respond";
import { snapshot, state } from "../core/state";
import { ENDPOINTS } from "../core/registry";
import { clientIp, coarseClient, maskIp } from "../core/device";
import { isConfigured } from "../telegram/connector";
import type { Ctx } from "../types";

export function ping(): Response {
  return jsonOk({ pong: true, at: new Date().toISOString() });
}

export function status(): Response {
  const s = snapshot();
  return jsonOk({
    api: "operational",
    database: "in-memory (edge runtime)",
    telegram: isConfigured() ? "configured" : "unconfigured",
    uptimeMs: s.uptimeMs,
    startedAt: new Date(s.bootedAt).toISOString(),
    version: "1.0.0",
    owner: "Nimzz",
  });
}

export function system(ctx: Ctx): Response {
  const s = snapshot();
  const cf = (ctx.request as unknown as { cf?: Record<string, unknown> }).cf;
  const nodeProc = globalThis as unknown as {
    process?: { platform?: string; version?: string; memoryUsage?: () => { rss: number; heapUsed: number; heapTotal: number } };
  };
  const mem = nodeProc.process?.memoryUsage?.();
  return jsonOk({
    runtime: nodeProc.process?.version ? `node ${nodeProc.process.version}` : "edge-worker",
    os: nodeProc.process?.platform ?? null,
    location: (cf?.["colo"] as string) ?? null,
    region: (cf?.["country"] as string) ?? null,
    uptimeMs: s.uptimeMs,
    // Measured where the runtime exposes it, null where it does not.
    // The Node backend (see /backend) reports real host CPU/RAM/disk.
    cpu: null,
    memory: mem
      ? { rssBytes: mem.rss, heapUsedBytes: mem.heapUsed, heapTotalBytes: mem.heapTotal }
      : null,
    storage: null,
    services: {
      api: "up",
      logger: "up",
      rateLimiter: "up",
      telegram: isConfigured() ? "up" : "disabled",
    },
  });
}

export function stats(): Response {
  const s = snapshot();
  const st = state();
  const perEndpoint = [...st.perEndpoint.entries()].map(([path, v]) => ({
    path,
    count: v.count,
    errors: v.errors,
    avgMs: v.count ? Math.round(v.totalMs / v.count) : 0,
  }));
  return jsonOk({ ...s, endpoints: ENDPOINTS.length, perEndpoint });
}

export function ip(ctx: Ctx): Response {
  const raw = clientIp(ctx.request);
  const cf = (ctx.request as unknown as { cf?: Record<string, unknown> }).cf;
  return jsonOk({
    ip: maskIp(raw),
    family: raw.includes(":") ? "IPv6" : "IPv4",
    country: (cf?.["country"] as string) ?? ctx.request.headers.get("cf-ipcountry") ?? null,
    colo: (cf?.["colo"] as string) ?? null,
    note: "Only the masked network prefix is returned and logged.",
  });
}

export function device(ctx: Ctx): Response {
  const st = state();
  const seen = st.devices.get(ctx.deviceId);
  return jsonOk({
    deviceId: ctx.deviceId,
    rotation: "daily",
    client: coarseClient(ctx.request),
    requests: seen?.count ?? 0,
    firstSeen: seen ? new Date(seen.firstSeen).toISOString() : null,
    suspiciousHits: seen?.suspicious ?? 0,
  });
}

export function random(ctx: Ctx): Response {
  const q = ctx.url.searchParams;
  const type = (q.get("type") ?? "uuid").toLowerCase();
  if (!["uuid", "int", "bytes", "string"].includes(type))
    throw new ApiError("BAD_REQUEST", "type must be one of uuid|int|bytes|string");

  if (type === "uuid") return jsonOk({ type, value: crypto.randomUUID() });

  if (type === "int") {
    const min = Number(q.get("min") ?? 0);
    const max = Number(q.get("max") ?? 100);
    if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max)
      throw new ApiError("BAD_REQUEST", "min and max must be finite numbers with min < max");
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    const value = Math.floor(min + (buf[0]! / 2 ** 32) * (max - min));
    return jsonOk({ type, min, max, value });
  }

  const length = Number(q.get("length") ?? 16);
  if (!Number.isInteger(length) || length < 1 || length > 256)
    throw new ApiError("BAD_REQUEST", "length must be an integer between 1 and 256");
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  if (type === "bytes")
    return jsonOk({ type, length, hex: [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("") });

  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const value = [...bytes].map((b) => alphabet[b % alphabet.length]).join("");
  return jsonOk({ type, length, value });
}

export function time(ctx: Ctx): Response {
  const tz = ctx.url.searchParams.get("tz");
  const now = new Date();
  let local: string | null = null;
  if (tz) {
    if (!/^[A-Za-z_]+\/[A-Za-z_+\-0-9]+$/.test(tz))
      throw new ApiError("BAD_REQUEST", "tz must be a valid IANA timezone, e.g. Asia/Jakarta");
    try {
      local = new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeStyle: "long", timeZone: tz }).format(now);
    } catch {
      throw new ApiError("BAD_REQUEST", `unknown timezone: ${tz}`);
    }
  }
  return jsonOk({
    iso: now.toISOString(),
    epoch: Math.floor(now.getTime() / 1000),
    epochMs: now.getTime(),
    timezone: tz ?? "UTC",
    local,
  });
}

export function endpoints(): Response {
  const st = state();
  return jsonOk({
    count: ENDPOINTS.length,
    endpoints: ENDPOINTS.map((e) => ({
      id: e.id,
      method: e.method,
      path: e.path,
      category: e.category,
      description: e.description,
      rateLimit: e.rateLimit,
      responseKind: e.responseKind,
      calls: st.perEndpoint.get(e.path)?.count ?? 0,
    })),
  });
}
