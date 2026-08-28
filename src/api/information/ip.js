import { ok } from "../../lib/respond.js";
import { clientIP, maskIP } from "../../lib/security.js";

export default function (app) {
  app.get("/ip", (req, res) => {
    const raw = clientIP(req);
    const family = raw.includes(":") ? "IPv6" : "IPv4";
    ok(res, {
      ip: maskIP(raw),
      family,
      country: req.headers["cf-ipcountry"] || null,
      note: "Only the masked network prefix is returned and logged.",
    });
  });
}
