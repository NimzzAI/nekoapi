import os from "os";
import { ok } from "../../lib/respond.js";

export default function (app) {
  app.get("/system", (req, res) => {
    const s = req.app.locals.store.snapshot();
    const mem = process.memoryUsage();
    const telegram = req.app.locals.telegram.configured() ? "up" : "disabled";
    ok(res, {
      runtime: `node ${process.version}`,
      os: os.platform(),
      arch: os.arch(),
      uptimeMs: s.uptimeMs,
      cpu: { cores: os.cpus().length, loadAvg: os.loadavg() },
      memory: {
        rssBytes: mem.rss,
        heapUsedBytes: mem.heapUsed,
        heapTotalBytes: mem.heapTotal,
        externalBytes: mem.external,
      },
      services: { api: "up", logger: "up", rateLimiter: "up", telegram },
    });
  });
}
