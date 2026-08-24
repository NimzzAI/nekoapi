const { ok } = require("../../lib/respond");
const { DEFAULT_LIMIT, ENDPOINT_LIMITS } = require("../../lib/security");

module.exports = function (app) {
  app.get("/security", (req, res) => {
    const snap = req.app.locals.limiter.snapshot();
    const devices = req.app.locals.store.getDevices();

    let suspicious = Object.entries(devices)
      .filter(([, d]) => d.rateLimitHits > 0)
      .map(([id, d]) => ({
        deviceId: id,
        requests: d.requests,
        rateLimitHits: d.rateLimitHits,
        lastSeen: new Date(d.lastSeen).toISOString(),
      }))
      .sort((a, b) => b.rateLimitHits - a.rateLimitHits)
      .slice(0, 20);

    const limited = req.app.locals.store.getLogs().filter((l) => l.status === 429).length;

    ok(res, {
      limits: { default: DEFAULT_LIMIT, perEndpoint: ENDPOINT_LIMITS },
      activeBuckets: snap.activeBuckets,
      blockedIdentities: snap.blockedIdentities,
      throttledIdentities: snap.throttledIdentities,
      knownDevices: Object.keys(devices).length,
      rateLimited: limited,
      suspicious,
      controls: [
        { name: "Rate limiting", detail: "per identity + per endpoint, fixed window with temporary block", enabled: true },
        { name: "Security headers", detail: "nosniff, DENY frames, no-referrer, permissions policy", enabled: true },
        { name: "Strict CORS", detail: "origin allowlist via ALLOWED_ORIGINS", enabled: true },
        { name: "Input validation", detail: "typed validation on every query and body field", enabled: true },
        { name: "Request size limit", detail: "2 MB JSON body cap", enabled: true },
        { name: "Upstream timeouts", detail: "10-20s abort on outbound calls", enabled: true },
        { name: "IP masking", detail: "only /24 and /48 prefixes are stored", enabled: true },
      ],
    });
  });
};
