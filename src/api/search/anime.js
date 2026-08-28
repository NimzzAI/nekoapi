import { getJSON } from "../../lib/http.js";
import { ok, fail } from "../../lib/respond.js";

export default function (app) {
  app.get("/search/anime", async (req, res) => {
    const q = req.query.q;
    if (!q || !String(q).trim()) return fail(res, "BAD_REQUEST", "q is required");
    if (String(q).length > 200) return fail(res, "BAD_REQUEST", "q must be 200 characters or fewer");

    try {
      const body = await getJSON("https://api.jikan.moe/v4/anime", { params: { q, limit: 10 } });
      const results = (body.data || []).map((d) => ({
        title: d.title,
        type: d.type,
        score: d.score,
        status: d.status,
        url: d.url,
        image: d.images?.jpg?.image_url,
      }));
      ok(res, { query: q, results });
    } catch {
      fail(res, "UPSTREAM_ERROR", "anime search upstream did not respond");
    }
  });
}
