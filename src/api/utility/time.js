import { ok, fail } from "../../lib/respond.js";

const TZ_PATTERN = /^[A-Za-z_]+\/[A-Za-z_+\-0-9]+$/;

export default function (app) {
  app.get("/time", (req, res) => {
    const tz = req.query.tz;
    const now = new Date();
    let zone = "UTC";
    let local = null;

    if (tz) {
      if (!TZ_PATTERN.test(tz)) {
        return fail(res, "BAD_REQUEST", "tz must be a valid IANA timezone, e.g. Asia/Jakarta");
      }
      try {
        local = new Intl.DateTimeFormat("en-GB", {
          timeZone: tz,
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(now);
        zone = tz;
      } catch {
        return fail(res, "BAD_REQUEST", `unknown timezone: ${tz}`);
      }
    }

    ok(res, {
      iso: now.toISOString(),
      epoch: Math.floor(now.getTime() / 1000),
      epochMs: now.getTime(),
      timezone: zone,
      local,
    });
  });
}
