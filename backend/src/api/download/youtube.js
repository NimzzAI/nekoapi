/**
 * GET /download/youtube — download links and metadata via a2zconverter.com,
 * the same free public upstream Takanashi's download-youtube.js uses.
 */
const { getJSON } = require("../../lib/http");
const { ok, fail } = require("../../lib/respond");

module.exports = function (app) {
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
};
