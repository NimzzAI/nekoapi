// Express backend. Every route lives under src/api/<category>/<name>.js and
// self-registers via `export default function (app) { app.get(...) }`.
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

import { fail } from "./src/lib/respond.js";
import { Limiter, clientIP, maskIP, deviceID } from "./src/lib/security.js";
import { MemoryStore } from "./src/lib/store.js";
import { TelegramConnector } from "./src/lib/telegram.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 8080;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const app = express();

app.locals.store = new MemoryStore();
app.locals.limiter = new Limiter();
app.locals.telegram = new TelegramConnector(process.env.TELEGRAM_BOT_TOKEN || "");

app.set("json spaces", 2);
app.enable("trust proxy");
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: false }));

// Strip the "/api" prefix Vercel Services routes under (see root vercel.json).
// A no-op locally and on a plain VPS.
app.use((req, res, next) => {
  if (req.url === "/api" || req.url.startsWith("/api/")) {
    req.url = req.url.slice(4) || "/";
  }
  next();
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
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

let totalRoutes = 0;
const apiFolder = path.join(__dirname, "src", "api");
for (const category of fs.readdirSync(apiFolder)) {
  const categoryPath = path.join(apiFolder, category);
  if (!fs.statSync(categoryPath).isDirectory()) continue;
  for (const file of fs.readdirSync(categoryPath)) {
    if (path.extname(file) !== ".js") continue;
    const filePath = path.join(categoryPath, file);
    const mod = await import(pathToFileURL(filePath).href);
    mod.default(app);
    totalRoutes++;
    console.log(`[nekoapi] loaded route: ${category}/${file}`);
  }
}
console.log(`[nekoapi] ${totalRoutes} routes loaded`);

app.use("/src", (req, res) => fail(res, "FORBIDDEN", "Forbidden"));

app.use((req, res) => fail(res, "NOT_FOUND", `no endpoint matches ${req.method} ${req.path}`));

app.use((err, req, res, _next) => {
  console.error(`[nekoapi] unhandled error on ${req.method} ${req.path}:`, err);
  fail(res, "INTERNAL", "Something went wrong");
});

// @vercel/node imports this file and calls the exported app per-request, so
// app.listen() only runs outside Vercel (VPS / local).
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[nekoapi] listening on :${PORT}`);
  });
}

export default app;
