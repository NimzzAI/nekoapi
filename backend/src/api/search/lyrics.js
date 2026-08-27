import { getJSON } from "../../lib/http.js";
import { ok, fail } from "../../lib/respond.js";

export default function (app) {
  app.get("/search/lyrics", async (req, res) => {
    const q = req.query.q;
    if (!q || !String(q).trim()) return fail(res, "BAD_REQUEST", "q is required");
    if (String(q).length > 200) return fail(res, "BAD_REQUEST", "q must be 200 characters or fewer");

    try {
      const suggest = await getJSON(`https://api.lyrics.ovh/suggest/${encodeURIComponent(q)}`);
      if (!suggest.data || suggest.data.length === 0) {
        return fail(res, "NOT_FOUND", "no song matched that query");
      }
      const match = suggest.data[0];
      const title = match.title;
      const artist = match.artist?.name;

      const lyricsRes = await getJSON(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
      );
      if (!lyricsRes.lyrics) {
        return fail(res, "NOT_FOUND", "no lyrics matched that query");
      }

      ok(res, { title, artist, lyrics: lyricsRes.lyrics });
    } catch {
      fail(res, "NOT_FOUND", "no lyrics matched that query");
    }
  });
}
