import { getJSON } from "../../lib/http.js";
import { ok, fail } from "../../lib/respond.js";

export default function (app) {
  app.get("/download/youtube", async (req, res) => {
    const url = req.query.url;
    if (!url) return fail(res, "BAD_REQUEST", "url is required");
    if (!/youtube\.com|youtu\.be/.test(url)) return fail(res, "BAD_REQUEST", "url must be a YouTube link");

    try {
      const body = await getJSON("https://www.a2zconverter.com/api/files/new-proxy", {
        params: { url },
        timeout: 20_000,
      });
      ok(res, body);
    } catch {
      fail(res, "UPSTREAM_ERROR", "unable to resolve this YouTube link");
    }
  });
}
