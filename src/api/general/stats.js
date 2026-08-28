import { ok } from "../../lib/respond.js";
import { CATALOG } from "../../lib/catalog.js";

export default function (app) {
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
}
