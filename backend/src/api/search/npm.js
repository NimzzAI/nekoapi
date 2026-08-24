/**
 * GET /search/npm — npm registry package search via the official public
 * registry API (registry.npmjs.org). No key needed.
 */
const { getJSON } = require("../../lib/http");
const { ok, fail } = require("../../lib/respond");

module.exports = function (app) {
  app.get("/search/npm", async (req, res) => {
    const q = req.query.q;
    if (!q || !String(q).trim()) return fail(res, "BAD_REQUEST", "q is required");
    if (String(q).length > 200) return fail(res, "BAD_REQUEST", "q must be 200 characters or fewer");

    try {
      const body = await getJSON("https://registry.npmjs.org/-/v1/search", { params: { text: q, size: 10 } });
      const results = (body.objects || []).map((o) => ({
        name: o.package.name,
        version: o.package.version,
        description: o.package.description ?? null,
        url: o.package.links?.npm ?? `https://www.npmjs.com/package/${o.package.name}`,
      }));
      ok(res, { query: q, results });
    } catch {
      fail(res, "UPSTREAM_ERROR", "npm registry did not respond");
    }
  });
};
