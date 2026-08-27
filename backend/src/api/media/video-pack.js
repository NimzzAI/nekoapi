import axios from "axios";
import archiver from "archiver";
import { fail } from "../../lib/respond.js";

// SSRF guard: only these vetted URLs can be fetched, selected by short key.
const CLIP_ALLOWLIST = {
  neko: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  demo: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
};

export default function (app) {
  app.get("/video/pack", async (req, res) => {
    const clip = req.query.clip || "neko";
    const src = CLIP_ALLOWLIST[clip];
    if (!src) return fail(res, "BAD_REQUEST", "clip must be one of: neko, demo");

    let data;
    try {
      const upstream = await axios.get(src, {
        responseType: "arraybuffer",
        timeout: 15_000,
        maxContentLength: 32 * 1024 * 1024,
      });
      data = Buffer.from(upstream.data);
    } catch {
      return fail(res, "UPSTREAM_ERROR", "clip source is unavailable");
    }

    const manifest = JSON.stringify(
      {
        clip,
        bytes: data.length,
        contentType: "video/mp4",
        packedAt: new Date().toISOString(),
        note: "Video responses are always delivered as a ZIP archive.",
      },
      null,
      2,
    );

    res.setHeader("content-type", "application/zip");
    res.setHeader("content-disposition", `attachment; filename="nekoapi-${clip}.zip"`);

    const archive = archiver("zip");
    archive.on("error", () => {
      if (!res.headersSent) fail(res, "INTERNAL", "archive could not be created");
      else res.end();
    });
    archive.pipe(res);
    archive.append(data, { name: `${clip}.mp4` });
    archive.append(manifest, { name: "manifest.json" });
    archive.finalize();
  });
}
