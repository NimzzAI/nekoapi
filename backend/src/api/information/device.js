import { ok } from "../../lib/respond.js";
import { deviceID, coarseClient } from "../../lib/security.js";

export default function (app) {
  app.get("/device", (req, res) => {
    const id = deviceID(req);
    const d = req.app.locals.store.getDevices()[id] || { requests: 0, firstSeen: 0, rateLimitHits: 0 };
    ok(res, {
      deviceId: id,
      rotation: "daily",
      client: coarseClient(req),
      requests: d.requests,
      firstSeen: d.firstSeen ? new Date(d.firstSeen).toISOString() : null,
      suspiciousHits: d.rateLimitHits,
    });
  });
}
