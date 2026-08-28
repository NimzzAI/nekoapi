const express = require("express");
const chalk = require("chalk");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const config = require("./src/lib/config");
const telegram = require("./src/lib/telegram");
const { securityMiddleware, stats, incrementErrors } = require("./src/middleware/security");
const { loadRoutes } = require("./src/lib/routeLoader");

const app = express();
const PUBLIC_DIR = path.join(__dirname, "public");

// ========== CORE MIDDLEWARE ==========
app.set("trust proxy", true);
app.set("json spaces", 2);
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: false }));

// ========== SECURITY: RATE LIMIT (IP + DEVICE ID) ==========
app.use(securityMiddleware);

// ========== JSON RESPONSE WRAPPER ==========
app.use((req, res, next) => {
  const original = res.json;
  res.json = function (data) {
    if (data && typeof data === "object" && !Array.isArray(data)) {
      data = {
        status: data.status ?? true,
        creator: data.creator || config.API_CREATOR,
        ...data
      };
    }
    return original.call(this, data);
  };
  next();
});

// ========== REQUEST LOGGER ==========
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const isError = res.statusCode >= 400;
    const line = `${isError ? "❌" : "✅"} [${req.method}] ${req.originalUrl} | ${res.statusCode} | ${duration}ms | IP: ${req.clientIp}`;
    console.log(isError ? chalk.red(line) : chalk.green(line));

    telegram.notifyRequest({
      ip: req.clientIp,
      deviceId: req.deviceId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration
    });
  });
  next();
});

// ========== PAGE RENDERER (suntik SITE_URL & meta tag ke HTML statis) ==========
// File di public/*.html berisi placeholder %%SITE_URL%%, %%API_NAME%%, %%API_DESCRIPTION%%
// yang diganti saat request masuk, supaya og:url/canonical selalu ikut domain aktif
// dari SITE_URL di .env — tanpa perlu template engine tambahan.
function renderPage(fileName) {
  return (req, res) => {
    const filePath = path.join(PUBLIC_DIR, fileName);
    fs.readFile(filePath, "utf8", (err, html) => {
      if (err) {
        incrementErrors();
        return res.status(500).sendFile(path.join(PUBLIC_DIR, "500.html"));
      }
      const out = html
        .replace(/%%SITE_URL%%/g, config.SITE_URL)
        .replace(/%%API_NAME%%/g, config.API_NAME)
        .replace(/%%API_DESCRIPTION%%/g, config.API_DESCRIPTION)
        .replace(/%%API_CREATOR%%/g, config.API_CREATOR);
      res.set("Content-Type", "text/html").send(out);
    });
  };
}

// ========== STATIC FILES (CSS/JS/gambar — HTML ditangani lewat renderPage) ==========
app.use(express.static(PUBLIC_DIR, { index: false }));
app.use("/src-assets", express.static(path.join(__dirname, "src", "assets")));

// ========== LOAD API ROUTES (flat per-category, dari src/api) ==========
const { manifest, totalRoutes } = loadRoutes(app, path.join(__dirname, "src", "api"));

const categoryCounts = manifest.reduce((acc, r) => {
  acc[r.category] = (acc[r.category] || 0) + 1;
  return acc;
}, {});

console.log(chalk.bgGreen.black(` Total files loaded: ${totalRoutes} | Total endpoints: ${manifest.length} `));
telegram.notifyServerStart(manifest.length, config.PORT, config.SITE_URL);

// ========== CONFIG / DOCS / DASHBOARD DATA ==========
app.get("/api/config", (req, res) => {
  res.json({
    status: true,
    result: {
      name: config.API_NAME,
      creator: config.API_CREATOR,
      description: config.API_DESCRIPTION,
      siteUrl: config.SITE_URL
    }
  });
});

app.get("/api/list", (req, res) => {
  res.json({
    status: true,
    name: config.API_NAME,
    creator: config.API_CREATOR,
    siteUrl: config.SITE_URL,
    totalEndpoints: manifest.length,
    categories: categoryCounts,
    routes: manifest
  });
});

app.get("/api/dashboard-stats", (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    status: true,
    result: {
      name: config.API_NAME,
      siteUrl: config.SITE_URL,
      uptimeSeconds: Math.floor(process.uptime()),
      startedAt: new Date(stats.startedAt).toISOString(),
      totalRequests: stats.totalRequests,
      totalEndpoints: manifest.length,
      totalCategories: Object.keys(categoryCounts).length,
      totalBlocked429: stats.totalBlocked429,
      totalBanned: stats.totalBanned,
      totalErrors: stats.totalErrors,
      memoryUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      nodeVersion: process.version,
      telegramEnabled: telegram.isConfigured()
    }
  });
});

// ========== TELEGRAM WEBHOOK RECEIVER ==========
// Endpoint penerima update dari Telegram Bot API (opsional, untuk integrasi bot admin).
// URL webhook di Telegram diarahkan ke: %%SITE_URL%%/webhook/telegram/<TELEGRAM_WEBHOOK_SECRET>
app.post("/webhook/telegram/:secret", (req, res) => {
  const expected = config.TELEGRAM_WEBHOOK_SECRET;
  if (!expected || req.params.secret !== expected) {
    return res.status(403).json({ status: false, message: "Invalid webhook secret" });
  }

  console.log(chalk.cyan("[telegram webhook] Update diterima:"), JSON.stringify(req.body).slice(0, 300));
  telegram.notify(`📩 <b>Update Telegram diterima</b>\n<code>${JSON.stringify(req.body).slice(0, 500)}</code>`);

  res.status(200).json({ ok: true });
});

// ========== SEO: robots.txt & sitemap.xml (dibangun dari SITE_URL) ==========
app.get("/robots.txt", (req, res) => {
  res.type("text/plain").send(
    `User-agent: *\nAllow: /\nSitemap: ${config.SITE_URL}/sitemap.xml\n`
  );
});

app.get("/sitemap.xml", (req, res) => {
  const pages = ["/", "/docs", "/dashboard", "/terms", "/privacy"];
  const urls = pages
    .map((p) => `  <url><loc>${config.SITE_URL}${p}</loc></url>`)
    .join("\n");
  res.type("application/xml").send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`
  );
});

// ========== MAIN PAGES ==========
app.get("/", renderPage("index.html"));
app.get("/docs", renderPage("docs.html"));
app.get("/dashboard", renderPage("dashboard.html"));
app.get("/terms", renderPage("terms.html"));
app.get("/privacy", renderPage("privacy.html"));

// ========== 404 ==========
app.use((req, res) => {
  res.status(404);
  renderPage("404.html")(req, res);
});

// ========== ERROR HANDLER ==========
app.use((err, req, res, next) => {
  console.error(chalk.red(err.stack));
  incrementErrors();
  telegram.notifyError({ method: req.method, url: req.originalUrl, message: err.message });
  res.status(500);
  renderPage("500.html")(req, res);
});

// ========== START ==========
app.listen(config.PORT, () => {
  console.log(chalk.bgGreen.black(`  ${config.API_NAME} running on port ${config.PORT}  `));
  console.log(chalk.gray(`  Site URL : ${config.SITE_URL}  `));
  console.log(chalk.gray(`  Rate limit: ${config.RATE_LIMIT_MAX_IP}/min per IP, ${config.RATE_LIMIT_MAX_DEVICE}/min per Device  `));
});

module.exports = app;
