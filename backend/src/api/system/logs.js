const { ok } = require("../../lib/respond");

module.exports = function (app) {
  app.get("/logs", (req, res) => {
    const q = req.query;
    let items = req.app.locals.store.getLogs();

    if (q.method) {
      const m = String(q.method).toUpperCase();
      items = items.filter((l) => l.method === m);
    }
    if (q.endpoint) {
      items = items.filter((l) => l.path.includes(String(q.endpoint)));
    }
    if (q.ip) {
      items = items.filter((l) => l.ip.includes(String(q.ip)));
    }
    if (q.date) {
      items = items.filter((l) => new Date(l.ts).toISOString().slice(0, 10) === q.date);
    }
    if (q.status) {
      const s = String(q.status);
      if (s.length === 3 && /[xX]/.test(s[1])) {
        const cls = parseInt(s[0], 10);
        items = items.filter((l) => Math.floor(l.status / 100) === cls);
      } else {
        const code = parseInt(s, 10);
        if (Number.isFinite(code)) items = items.filter((l) => l.status === code);
      }
    }

    let page = parseInt(q.page, 10);
    if (!Number.isInteger(page) || page < 1) page = 1;
    let perPage = parseInt(q.perPage, 10);
    if (!Number.isInteger(perPage) || perPage < 1 || perPage > 100) perPage = 25;

    const total = items.length;
    const start = Math.min(total, (page - 1) * perPage);
    const end = Math.min(total, start + perPage);
    const pages = Math.max(1, Math.ceil(total / perPage));

    ok(res, { total, page, perPage, pages, items: items.slice(start, end) });
  });
};
