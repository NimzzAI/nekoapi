import { ApiError } from "../core/respond";
import { buildZip } from "../core/zip";
import clipAsset from "../../assets/neko-clip.mp4.asset.json";
import type { Ctx } from "../types";

/** Deterministic identicon — pure SVG, no image library needed. */
export function avatar(ctx: Ctx): Response {
  const q = ctx.url.searchParams;
  const seed = (q.get("seed") ?? "nekoapi").slice(0, 64);
  if (!/^[\w .:@-]{1,64}$/.test(seed))
    throw new ApiError("BAD_REQUEST", "seed may only contain letters, digits, space, . : @ _ -");
  const size = Number(q.get("size") ?? 256);
  if (!Number.isInteger(size) || size < 32 || size > 512)
    throw new ApiError("BAD_REQUEST", "size must be an integer between 32 and 512");

  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const hue = h % 360;
  const cells: string[] = [];
  const grid = 5;
  const cell = size / grid;
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < Math.ceil(grid / 2); x++) {
      const bit = (h >>> ((y * 3 + x) % 31)) & 1;
      if (!bit) continue;
      const mx = grid - 1 - x;
      cells.push(`<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}"/>`);
      if (mx !== x)
        cells.push(`<rect x="${mx * cell}" y="${y * cell}" width="${cell}" height="${cell}"/>`);
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="identicon for ${seed}"><rect width="${size}" height="${size}" fill="hsl(${hue} 18% 12%)"/><g fill="hsl(${hue} 62% 58%)">${cells.join("")}</g></svg>`;

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "content-disposition": `inline; filename="avatar-${seed.replace(/[^\w-]/g, "_")}.svg"`,
      "cache-control": "public, max-age=3600",
    },
  });
}

const CLIPS: Record<string, { url: string; filename: string; mime: string }> = {
  neko: { url: clipAsset.url, filename: "neko-clip.mp4", mime: "video/mp4" },
};

/**
 * Video is never streamed to a player: it is packaged into a ZIP archive
 * with a manifest and returned as a download.
 */
export async function videoPack(ctx: Ctx): Promise<Response> {
  const clipId = (ctx.url.searchParams.get("clip") ?? "neko").toLowerCase();
  const clip = CLIPS[clipId];
  if (!clip)
    throw new ApiError("BAD_REQUEST", `unknown clip; allowed: ${Object.keys(CLIPS).join(", ")}`);

  // Allowlisted, server-side resolved source — no user supplied URLs (SSRF safe).
  const source = clip.url.startsWith("http") ? clip.url : `${ctx.origin}${clip.url}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  let bytes: Uint8Array;
  try {
    const res = await fetch(source, { signal: controller.signal });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const type = res.headers.get("content-type") ?? "";
    if (!type.startsWith("video/") && !type.includes("octet-stream"))
      throw new ApiError("UPSTREAM_ERROR", "source did not return a video payload");
    bytes = new Uint8Array(await res.arrayBuffer());
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof ApiError) throw err;
    throw new ApiError("UPSTREAM_ERROR", "unable to fetch the clip source");
  }
  clearTimeout(timer);

  const manifest = JSON.stringify(
    {
      generator: "NekoAPI",
      owner: "Nimzz",
      clip: clipId,
      filename: clip.filename,
      mime: clip.mime,
      bytes: bytes.length,
      packagedAt: new Date().toISOString(),
      note: "Video payloads are always delivered as a ZIP archive, never as a stream.",
    },
    null,
    2,
  );

  const zip = buildZip([
    { name: clip.filename, data: bytes },
    { name: "manifest.json", data: new TextEncoder().encode(manifest) },
  ]);
  const filename = `nekoapi-${clipId}.zip`;

  return new Response(zip as unknown as BodyInit, {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${filename}"`,
      "content-length": String(zip.length),
      "x-neko-archive-name": filename,
      "x-neko-archive-bytes": String(zip.length),
      "x-neko-source-mime": clip.mime,
    },
  });
}
