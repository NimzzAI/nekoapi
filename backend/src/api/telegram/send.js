const { ok, fail } = require("../../lib/respond");

module.exports = function (app) {
  app.post("/telegram/send", async (req, res) => {
    const { kind, chatId, text, url } = req.body || {};

    if (url && !String(url).startsWith("https://")) {
      return fail(res, "BAD_REQUEST", "url must be an https URL");
    }
    if (text && String(text).length > 4000) {
      return fail(res, "BAD_REQUEST", "text must be at most 4000 characters");
    }

    try {
      const messageId = await req.app.locals.telegram.send({ kind, chatId, text, url });
      ok(res, { messageId, kind: kind || "message", chatId });
    } catch (err) {
      fail(res, err.code || "UPSTREAM_ERROR", err.message);
    }
  });
};
