import { getJSON } from "../../lib/http.js";
import { ok, fail } from "../../lib/respond.js";

export default function (app) {
  app.get("/download/instagram", async (req, res) => {
    const url = req.query.url;
    if (!url) return fail(res, "BAD_REQUEST", "url is required");
    if (!/instagram\.com/.test(url)) return fail(res, "BAD_REQUEST", "url must be an instagram.com link");

    try {
      const body = await getJSON("https://api.nekolabs.my.id/downloader/instagram", { params: { url } });
      if (!body.success || !body.result) {
        return fail(res, "UPSTREAM_ERROR", "unable to resolve this Instagram link");
      }
      const m = body.result.metadata || {};
      ok(res, {
        title: m.caption,
        thumbnail: m.thumbnail,
        username: m.username,
        likes: m.like,
        comments: m.comment,
        mediaType: m.isVideo ? "video" : "image",
        downloadUrl: body.result.downloadUrl,
      });
    } catch {
      fail(res, "UPSTREAM_ERROR", "unable to resolve this Instagram link");
    }
  });
}
