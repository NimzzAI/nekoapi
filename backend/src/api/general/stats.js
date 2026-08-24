const { ok } = require("../../lib/respond");
const { CATALOG } = require("../../lib/catalog");

module.exports = function (app) {
  app.get("/stats", (req, res) => {
    const s = req.app.locals.store.snapshot();
    ok(res, {
      uptimeMs: s.uptimeMs,
      totalRequests: s.totalRequests,
      totalErrors: s.totalErrors,
      requestsPerMinute: s.requestsPerMinute,
      errorRate: s.errorRate,
      avgResponseMs: s.avgResponseMs,
      p95ResponseMs: s.p95ResponseMs,
      inFlight: s.inFlight,
      samples: s.samples,
      endpoints: CATALOG.length,
      perEndpoint: req.app.locals.store.getEndpoints(),
    });
  });
};
