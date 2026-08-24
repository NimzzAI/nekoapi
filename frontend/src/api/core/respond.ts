/**
 * NekoAPI — consistent response envelopes + security headers.
 */

export const SECURITY_HEADERS: Record<string, string> = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "no-referrer",
  "cross-origin-resource-policy": "same-site",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "x-nekoapi-owner": "Nimzz",
};

export type ErrorCode =
  | "BAD_REQUEST"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "PAYLOAD_TOO_LARGE"
  | "UPSTREAM_ERROR"
  | "TIMEOUT"
  | "FORBIDDEN"
  | "UNAUTHORIZED"
  | "INTERNAL";

export const STATUS_FOR: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  PAYLOAD_TOO_LARGE: 413,
  RATE_LIMITED: 429,
  TIMEOUT: 504,
  UPSTREAM_ERROR: 502,
  INTERNAL: 500,
};

export class ApiError extends Error {
  code: ErrorCode;
  details?: Record<string, unknown>;
  constructor(code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    if (details) this.details = details;
  }
}

export function corsHeaders(origin: string | null, allowed: string[]): Record<string, string> {
  const allowAll = allowed.includes("*");
  const ok = origin ? allowAll || allowed.includes(origin) : false;
  const headers: Record<string, string> = {
    vary: "Origin",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,x-api-key",
    "access-control-max-age": "600",
  };
  if (ok && origin) headers["access-control-allow-origin"] = allowAll ? "*" : origin;
  return headers;
}

export function jsonOk(data: unknown, meta: Record<string, unknown> = {}, status = 200): Response {
  return new Response(JSON.stringify({ success: true, data, meta }, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export function jsonFail(code: ErrorCode, message: string, details?: Record<string, unknown>): Response {
  const body: Record<string, unknown> = { success: false, error: { code, message } };
  if (details) (body["error"] as Record<string, unknown>)["details"] = details;
  return new Response(JSON.stringify(body, null, 2), {
    status: STATUS_FOR[code],
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
