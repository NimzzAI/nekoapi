const { ok } = require("../../lib/respond");
const branding = require("../../branding");

module.exports = function (app) {
  app.get("/status", (req, res) => {
    const s = req.app.locals.store.snapshot();
    const telegram = req.app.locals.telegram.configured() ? "configured" : "unconfigured";
    const database = process.env.DATABASE_URL ? "sql (DATABASE_URL configured)" : "in-memory";
    ok(res, {
      api: "operational",
      database,
      telegram,
      uptimeMs: s.uptimeMs,
      startedAt: new Date(Date.now() - s.uptimeMs).toISOString(),
      version: branding.version,
      owner: branding.owner,
    });
  });
};
