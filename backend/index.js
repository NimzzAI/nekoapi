/**
 * NekoAPI backend — Express, Takanashi-style structure.
 *
 * Every route lives in its own file under src/api/<category>/<name>.js and
 * self-registers by exporting `function (app) { app.get(...) }`. This file
 * scans that folder tree once at boot and requires every .js file it finds
 * — drop a new file in, restart, done. No route list to maintain here.
 */
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const { fail } = require("./src/lib/respond");
const { Limiter, clientIP, maskIP, deviceID } = require("./src/lib/security");
const { MemoryStore } = require("./src/lib/store");
const { TelegramConnector } = require("./src/lib/telegram");

const PORT = process.env.PORT || 8080;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const app = express();

// Shared state every route file can reach through req.app.locals.
app.locals.store = new MemoryStore();
app.locals.limiter = new Limiter();
app.locals.telegram = new TelegramConnector(process.env.TELEGRAM_BOT_TOKEN || "");

app.set("json spaces", 2);
app.enable("trust proxy");
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: false }));

// When deployed as a Vercel Service under routePrefix "/api" (see the root
// vercel.json), incoming requests keep that prefix — Express sees
// "/api/ping" instead of "/ping". Every route file below registers its
// path without the prefix (app.get("/ping", ...)), so strip it here, once,
// before any route matching happens. A no-op locally and on a plain VPS.
app.use((req, res, next) => {
  if (req.url === "/api" || req.url.startsWith("/api/")) {
    req.url = req.url.slice(4) || "/";
  }
  next();
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true); // same-origin / curl / server-to-server
      if (ALLOWED_ORIGINS.includes("*") || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["content-type", "x-api-key"],
    maxAge: 600,
  }),
);

for (const [key, value] of Object.entries({
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "no-referrer",
  "cross-origin-resource-policy": "same-site",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "x-nekoapi-owner": "Nimzz",
})) {
  app.use((req, res, next) => {
    res.setHeader(key, value);
    next();
  });
}

// Per-request accounting: rate limit, in-flight counter, request log —
// wraps every route the same way regardless of which file registered it.
app.use((req, res, next) => {
  const started = Date.now();
  const device = deviceID(req);
  const apiKey = req.headers["x-api-key"];
  const identity = apiKey ? `key:${apiKey}` : device;

  const rate = req.app.locals.limiter.check(identity, req.path);
  res.setHeader("x-ratelimit-limit", String(rate.limit));
  res.setHeader("x-ratelimit-remaining", String(rate.remaining));

  req.app.locals.store.incr(1);
  res.on("finish", () => {
    req.app.locals.store.incr(-1);
    const entry = {
      id: `${Date.now()}.${Math.random().toString(36).slice(2, 8)}`,
      ts: Date.now(),
      method: req.method,
      path: req.path,
      ip: maskIP(clientIP(req)),
      deviceId: device,
      status: res.statusCode,
      ms: Date.now() - started,
      apiKey: apiKey ? String(apiKey).slice(0, 6) + "…" : undefined,
    };
    req.app.locals.store.record(entry);
    console.log(`${entry.method} ${entry.path} -> ${entry.status} (${entry.ms}ms)`);
  });

  if (!rate.allowed) {
    res.setHeader("retry-after", String(rate.retryAfter));
    req.app.locals.store.markSuspicious(device);
    return fail(res, "RATE_LIMITED", rate.blocked ? "Temporarily blocked for abusive traffic" : "Too many requests");
  }

  next();
});

/* ---------- auto-load every route under src/api/<category>/*.js ---------- */

let totalRoutes = 0;
const apiFolder = path.join(__dirname, "src", "api");
for (const category of fs.readdirSync(apiFolder)) {
  const categoryPath = path.join(apiFolder, category);
  if (!fs.statSync(categoryPath).isDirectory()) continue;
  for (const file of fs.readdirSync(categoryPath)) {
    if (path.extname(file) !== ".js") continue;
    require(path.join(categoryPath, file))(app);
    totalRoutes++;
    console.log(`[nekoapi] loaded route: ${category}/${file}`);
  }
}
console.log(`[nekoapi] ${totalRoutes} routes loaded`);

// Never serve the route source files themselves.
app.use("/src", (req, res) => fail(res, "FORBIDDEN", "Forbidden"));

app.use((req, res) => fail(res, "NOT_FOUND", `no endpoint matches ${req.method} ${req.path}`));

// Last-resort handler so a thrown error in any route file still returns
// the standard envelope instead of Express's default HTML error page.
app.use((err, req, res, _next) => {
  console.error(`[nekoapi] unhandled error on ${req.method} ${req.path}:`, err);
  fail(res, "INTERNAL", "Something went wrong");
});

// On Vercel, @vercel/node imports this file as a module and calls the
// exported handler per-request — it never runs index.js as a standalone
// process, so app.listen() would just hold an unused port open. On a VPS
// (npm start / pm2 / systemd) this is a real long-running process and
// needs the listener. VERCEL is set automatically in Vercel's build and
// runtime environment, so this needs no extra configuration either way.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[nekoapi] listening on :${PORT}`);
  });
}

module.exports = app;
