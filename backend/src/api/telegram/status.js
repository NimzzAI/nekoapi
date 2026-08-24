const { ok, fail } = require("../../lib/respond");

module.exports = function (app) {
  app.get("/telegram/status", async (req, res) => {
    const telegram = req.app.locals.telegram;
    if (!telegram.configured()) {
      return ok(res, {
        configured: false,
        status: "unconfigured",
        hint: "Set TELEGRAM_BOT_TOKEN in the server environment to enable the connector.",
      });
    }
    try {
      const info = await telegram.getMe();
      const updates = await telegram.getUpdates(5).catch(() => []);
      ok(res, {
        configured: true,
        status: "operational",
        bot: { id: info.id, username: info.username, name: info.firstName },
        pendingUpdates: updates.length,
      });
    } catch (err) {
      fail(res, err.code || "UPSTREAM_ERROR", err.message);
    }
  });
};
