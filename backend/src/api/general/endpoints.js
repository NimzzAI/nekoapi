const { ok } = require("../../lib/respond");
const { CATALOG } = require("../../lib/catalog");

module.exports = function (app) {
  app.get("/endpoints", (req, res) => {
    const calls = {};
    for (const e of req.app.locals.store.getEndpoints()) calls[e.path] = e.count;

    const items = CATALOG.map((e) => ({
      id: e.id,
      method: e.method,
      path: e.path,
      category: e.category,
      description: e.description,
      rateLimit: e.rateLimit,
      responseKind: e.responseKind,
      calls: calls[e.path] || 0,
    }));

    ok(res, { count: CATALOG.length, endpoints: items });
  });
};
