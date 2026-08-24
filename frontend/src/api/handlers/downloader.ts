import { ApiError, jsonOk } from "../core/respond";
import type { Ctx } from "../types";

/**
 * Downloader category. Each route fetches the same free public upstream
 * Takanashi uses and the Node backend (backend/src/api/download/) also
 * calls — no key, no subprocess, one fetch per request.
 */

const TIMEOUT_MS = 20_000;

function requireUrl(raw: string | null, mustContainAny: string[], label: string): string {
  if (!raw) throw new ApiError("BAD_REQUEST", "url is required");
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new ApiError("BAD_REQUEST", "url must be a valid URL");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new ApiError("BAD_REQUEST", "url must be a valid URL");
  }
  if (!mustContainAny.some((frag) => parsed.hostname.includes(frag))) {
    throw new ApiError("BAD_REQUEST", `url must be a ${label} link`);
  }
  return raw;
}

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) throw new Error("non-2xx");
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/* ---------- TikTok — tikwm.com ---------- */

type TikwmResponse = {
  code: number;
  data: {
    title: string;
    cover: string;
    play: string;
    wmplay: string;
    hdplay: string;
    duration: number;
    music_info: { title: string; author: string; play: string };
    author: { unique_id: string; nickname: string; avatar: string };
  };
};

function prefixTikwm(path: string): string {
  if (!path || path.startsWith("http")) return path;
  return `https://www.tikwm.com${path}`;
}

export async function tiktok(ctx: Ctx): Promise<Response> {
  const url = requireUrl(ctx.url.searchParams.get("url"), ["tiktok.com"], "tiktok.com");
  const endpoint = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&count=12&cursor=0&web=1&hd=1`;

  let body: TikwmResponse;
  try {
    body = await fetchJSON<TikwmResponse>(endpoint, {
      method: "POST",
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
      },
    });
  } catch {
    throw new ApiError("UPSTREAM_ERROR", "unable to resolve this TikTok link");
  }
  if (body.code !== 0) throw new ApiError("UPSTREAM_ERROR", "unable to resolve this TikTok link");

  const d = body.data;
  return jsonOk({
    title: d.title,
    cover: prefixTikwm(d.cover),
    noWatermark: prefixTikwm(d.play),
    watermark: prefixTikwm(d.wmplay),
    noWatermarkHD: prefixTikwm(d.hdplay),
    duration: d.duration,
    music: { title: d.music_info.title, author: d.music_info.author, url: prefixTikwm(d.music_info.play) },
    author: { username: d.author.unique_id, nickname: d.author.nickname, avatar: prefixTikwm(d.author.avatar) },
  });
}

/* ---------- YouTube — a2zconverter.com ---------- */

export async function youtube(ctx: Ctx): Promise<Response> {
  const url = requireUrl(ctx.url.searchParams.get("url"), ["youtube.com", "youtu.be"], "YouTube");
  const endpoint = `https://www.a2zconverter.com/api/files/new-proxy?url=${encodeURIComponent(url)}`;

  let body: unknown;
  try {
    body = await fetchJSON<unknown>(endpoint);
  } catch {
    throw new ApiError("UPSTREAM_ERROR", "unable to resolve this YouTube link");
  }

  return jsonOk(body);
}

/* ---------- Instagram — api.nekolabs.my.id ---------- */

type NekolabsInstagramResponse = {
  success: boolean;
  result: {
    metadata: { caption: string; thumbnail: string; username: string; like: number; comment: number; isVideo: boolean };
    downloadUrl: string[];
  };
};

export async function instagram(ctx: Ctx): Promise<Response> {
  const url = requireUrl(ctx.url.searchParams.get("url"), ["instagram.com"], "instagram.com");
  const endpoint = `https://api.nekolabs.my.id/downloader/instagram?url=${encodeURIComponent(url)}`;

  let body: NekolabsInstagramResponse;
  try {
    body = await fetchJSON<NekolabsInstagramResponse>(endpoint);
  } catch {
    throw new ApiError("UPSTREAM_ERROR", "unable to resolve this Instagram link");
  }
  if (!body.success) throw new ApiError("UPSTREAM_ERROR", "unable to resolve this Instagram link");

  const m = body.result.metadata;
  return jsonOk({
    title: m.caption,
    thumbnail: m.thumbnail,
    username: m.username,
    likes: m.like,
    comments: m.comment,
    mediaType: m.isVideo ? "video" : "image",
    downloadUrl: body.result.downloadUrl,
  });
}
