import { siteConfig } from "./site-config";

/**
 * Public API prefix. Empty VITE_API_BASE_URL means same-origin, and on this
 * deployment same-origin /api routes to the Node/Express backend service
 * (see the root vercel.json). Set VITE_API_BASE_URL only when the backend
 * is on a different domain entirely.
 */
export const API_PREFIX = siteConfig.apiBaseUrl ? `${siteConfig.apiBaseUrl}` : "/api";

export type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  meta?: Record<string, unknown>;
  error?: { code: string; message: string };
};

export function apiUrl(path: string, params?: Record<string, string>) {
  const qs = params && Object.keys(params).length ? `?${new URLSearchParams(params).toString()}` : "";
  return `${API_PREFIX}${path}${qs}`;
}

export async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const res = await fetch(apiUrl(path, params), { headers: { accept: "application/json" } });
  const body = (await res.json()) as ApiEnvelope<T>;
  if (!body.success || body.data === undefined) {
    throw new Error(body.error?.message ?? `Request failed with status ${res.status}`);
  }
  return body.data;
}

export type RawResult = {
  status: number;
  statusText: string;
  ms: number;
  headers: Record<string, string>;
  contentType: string;
  kind: "json" | "image" | "audio" | "zip" | "file" | "text";
  json?: unknown;
  text?: string;
  blobUrl?: string;
  filename?: string;
  size?: number;
};

function kindOf(contentType: string): RawResult["kind"] {
  if (contentType.includes("json")) return "json";
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("audio/")) return "audio";
  if (contentType.includes("zip")) return "zip";
  if (contentType.startsWith("text/")) return "text";
  return "file";
}

/** Executes an arbitrary endpoint and auto-detects the response media type. */
export async function execute(
  method: "GET" | "POST",
  path: string,
  options: { query?: Record<string, string>; body?: string; headers?: Record<string, string> } = {},
): Promise<RawResult> {
  const started = performance.now();
  const res = await fetch(apiUrl(path, options.query), {
    method,
    headers: {
      ...(method === "POST" ? { "content-type": "application/json" } : {}),
      ...(options.headers ?? {}),
    },
    ...(method === "POST" && options.body ? { body: options.body } : {}),
  });
  const ms = Math.round(performance.now() - started);
  const contentType = res.headers.get("content-type") ?? "application/octet-stream";
  const headers: Record<string, string> = {};
  res.headers.forEach((v, k) => {
    headers[k] = v;
  });
  const kind = kindOf(contentType);

  const base: RawResult = { status: res.status, statusText: res.statusText, ms, headers, contentType, kind };

  if (kind === "json") {
    return { ...base, json: await res.json() };
  }
  if (kind === "text") {
    return { ...base, text: await res.text() };
  }
  const blob = await res.blob();
  const disposition = headers["content-disposition"] ?? "";
  const match = /filename="?([^"]+)"?/.exec(disposition);
  return {
    ...base,
    blobUrl: URL.createObjectURL(blob),
    filename: match?.[1] ?? path.split("/").filter(Boolean).join("-"),
    size: blob.size,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d) return `${d}d ${h}h ${m}m`;
  if (h) return `${h}h ${m}m ${sec}s`;
  if (m) return `${m}m ${sec}s`;
  return `${sec}s`;
}
