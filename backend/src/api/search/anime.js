/**
 * GET /search/anime — anime title search via the official free Jikan API
 * (api.jikan.moe/v4), structured JSON, no key, more stable than scraping
 * MyAnimeList HTML directly.
 */
const { getJSON } = require("../../lib/http");
const { ok, fail } = require("../../lib/respond");

module.exports = function (app) {
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
};
