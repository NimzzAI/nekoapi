import { ApiError, jsonOk } from "../core/respond";
import type { Ctx } from "../types";

/**
 * Search category. Each route fetches a free public upstream directly —
 * the same ones the Node backend (backend/src/api/search/) calls.
 */

const TIMEOUT_MS = 15_000;

function requireQuery(ctx: Ctx): string {
  const q = ctx.url.searchParams.get("q");
  if (!q || !q.trim()) throw new ApiError("BAD_REQUEST", "q is required");
  if (q.length > 200) throw new ApiError("BAD_REQUEST", "q must be 200 characters or fewer");
  return q.trim();
}

async function fetchJSON<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error("non-2xx");
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/* ---------- Anime — api.jikan.moe/v4 (official free Jikan/MyAnimeList API) ---------- */

type JikanSearchResponse = {
  data: {
    title: string;
    type: string;
    score: number;
    status: string;
    url: string;
    images: { jpg: { image_url: string } };
  }[];
};

export async function anime(ctx: Ctx): Promise<Response> {
  const q = requireQuery(ctx);
  const endpoint = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=10`;

  let body: JikanSearchResponse;
  try {
    body = await fetchJSON<JikanSearchResponse>(endpoint);
  } catch {
    throw new ApiError("UPSTREAM_ERROR", "anime search upstream did not respond");
  }

  const results = body.data.map((d) => ({
    title: d.title,
    type: d.type,
    score: d.score,
    status: d.status,
    url: d.url,
    image: d.images.jpg.image_url,
  }));

  return jsonOk({ query: q, results });
}

/* ---------- Lyrics — api.lyrics.ovh (free public lyrics API) ---------- */

type LyricsOvhSuggestResponse = { data: { title: string; artist: { name: string } }[] };
type LyricsOvhLyricsResponse = { lyrics: string };

export async function lyrics(ctx: Ctx): Promise<Response> {
  const q = requireQuery(ctx);

  let suggest: LyricsOvhSuggestResponse;
  try {
    suggest = await fetchJSON<LyricsOvhSuggestResponse>(`https://api.lyrics.ovh/suggest/${encodeURIComponent(q)}`);
  } catch {
    throw new ApiError("UPSTREAM_ERROR", "lyrics search upstream did not respond");
  }
  if (!suggest.data.length) throw new ApiError("NOT_FOUND", "no song matched that query");
  const match = suggest.data[0]!;

  let result: LyricsOvhLyricsResponse;
  try {
    result = await fetchJSON<LyricsOvhLyricsResponse>(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(match.artist.name)}/${encodeURIComponent(match.title)}`,
    );
  } catch {
    throw new ApiError("NOT_FOUND", "no lyrics matched that query");
  }
  if (!result.lyrics) throw new ApiError("NOT_FOUND", "no lyrics matched that query");

  return jsonOk({ title: match.title, artist: match.artist.name, lyrics: result.lyrics });
}

/* ---------- npm — registry.npmjs.org (official public registry search) ---------- */

type NpmSearchResponse = {
  objects: { package: { name: string; version: string; description?: string; links?: { npm?: string } } }[];
};

export async function npm(ctx: Ctx): Promise<Response> {
  const q = requireQuery(ctx);
  const endpoint = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(q)}&size=10`;

  let body: NpmSearchResponse;
  try {
    body = await fetchJSON<NpmSearchResponse>(endpoint);
  } catch {
    throw new ApiError("UPSTREAM_ERROR", "npm registry did not respond");
  }

  const results = body.objects.map((o) => ({
    name: o.package.name,
    version: o.package.version,
    description: o.package.description ?? null,
    url: o.package.links?.npm ?? `https://www.npmjs.com/package/${o.package.name}`,
  }));

  return jsonOk({ query: q, results });
}
