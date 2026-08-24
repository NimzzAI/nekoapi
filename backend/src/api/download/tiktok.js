/**
 * GET /download/tiktok — no-watermark TikTok download links via tikwm.com,
 * the same free public upstream Takanashi's download-tiktok.js uses.
 */
const { postJSON, MOBILE_UA } = require("../../lib/http");
const { ok, fail } = require("../../lib/respond");

function prefixTikwm(path) {
  if (!path || path.startsWith("http")) return path;
  return `https://www.tikwm.com${path}`;
}

module.exports = function (app) {
  app.get("/download/tiktok", async (req, res) => {
    const url = req.query.url;
    if (!url) return fail(res, "BAD_REQUEST", "url is required");
    if (!/tiktok\.com/.test(url)) return fail(res, "BAD_REQUEST", "url must be a tiktok.com link");

    try {
      const body = await postJSON(
        "https://www.tikwm.com/api/",
        {},
        {
          headers: {
            "User-Agent": MOBILE_UA,
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
          },
          params: { url, count: 12, cursor: 0, web: 1, hd: 1 },
        },
      );

      if (body.code !== 0 || !body.data) {
        return fail(res, "UPSTREAM_ERROR", "unable to resolve this TikTok link");
      }

      const d = body.data;
      ok(res, {
        title: d.title,
        cover: prefixTikwm(d.cover),
        noWatermark: prefixTikwm(d.play),
        watermark: prefixTikwm(d.wmplay),
        noWatermarkHD: prefixTikwm(d.hdplay),
        duration: d.duration,
        music: {
          title: d.music_info?.title,
          author: d.music_info?.author,
          url: prefixTikwm(d.music_info?.play),
        },
        author: {
          username: d.author?.unique_id,
          nickname: d.author?.nickname,
          avatar: prefixTikwm(d.author?.avatar),
        },
      });
    } catch {
      fail(res, "UPSTREAM_ERROR", "unable to resolve this TikTok link");
    }
  });
};
