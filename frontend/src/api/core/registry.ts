/**
 * NekoAPI endpoint catalog — single source of truth shared by the router,
 * the docs page and the API Explorer. Pure data, safe to import anywhere.
 */

export type ParamSpec = {
  name: string;
  in: "query" | "body" | "header";
  type: "string" | "number" | "boolean";
  required?: boolean;
  description: string;
  example?: string;
};

export type EndpointCategory =
  | "General"
  | "System"
  | "Media"
  | "Utility"
  | "Information"
  | "AI"
  | "Downloader"
  | "Search";

/** Which runtime actually implements the endpoint. Shown as a badge in the docs. */
export type Runtime = "go" | "node" | "php" | "python";

export type EndpointSpec = {
  id: string;
  name: string;
  method: "GET" | "POST";
  path: string;
  category: EndpointCategory;
  description: string;
  params: ParamSpec[];
  rateLimit: string;
  responseKind: "json" | "image" | "zip" | "audio" | "file";
  exampleResponse: unknown;
  errors: string[];
  /** Defaults to "go" for historical reasons; the primary backend runtime is now Node. */
  runtime?: Runtime;
};

/**
 * Internal-only routes: real endpoints (still routed, rate-limited and
 * logged) that power the bot/notifier rather than public API consumers.
 * Kept out of ENDPOINTS/CATEGORIES so they never show up in the docs, the
 * API Explorer or the public /endpoints catalog count.
 */
export type InternalEndpointSpec = Omit<EndpointSpec, "category"> & { category: "Internal" };

export const INTERNAL_ENDPOINTS: InternalEndpointSpec[] = [
  {
    id: "telegram-status",
    name: "Telegram connector status",
    method: "GET",
    path: "/telegram/status",
    category: "Internal",
    description: "Bot identity and connector health. Never returns the bot token.",
    params: [],
    rateLimit: "90 req / min",
    responseKind: "json",
    exampleResponse: { success: true, data: { configured: false, status: "unconfigured" } },
    errors: ["UPSTREAM_ERROR", "RATE_LIMITED"],
  },
  {
    id: "telegram-send",
    name: "Telegram send",
    method: "POST",
    path: "/telegram/send",
    category: "Internal",
    description:
      "Internal notifier used by the bot to push logs, error reports and daily/weekly/monthly summaries to the owner's Telegram. Not part of the public catalog.",
    params: [
      { name: "chatId", in: "body", type: "string", required: true, description: "Target chat id", example: "123456789" },
      { name: "kind", in: "body", type: "string", description: "message | photo | document | audio", example: "message" },
      { name: "text", in: "body", type: "string", description: "Message text or media caption", example: "Hello from NekoAPI" },
      { name: "url", in: "body", type: "string", description: "https media URL (required for photo/document/audio)" },
    ],
    rateLimit: "8 req / min",
    responseKind: "json",
    exampleResponse: { success: true, data: { messageId: 12 } },
    errors: ["BAD_REQUEST", "FORBIDDEN", "UPSTREAM_ERROR", "RATE_LIMITED"],
  },
];

export const ENDPOINTS: EndpointSpec[] = [
  {
    id: "ping",
    name: "Ping",
    method: "GET",
    path: "/ping",
    category: "General",
    description: "Health check. Returns pong and the measured round-trip handling time.",
    params: [],
    rateLimit: "90 req / min",
    responseKind: "json",
    exampleResponse: { success: true, data: { pong: true }, meta: { responseTime: "1ms" } },
    errors: ["RATE_LIMITED"],
  },
  {
    id: "status",
    name: "Service status",
    method: "GET",
    path: "/status",
    category: "General",
    description: "Aggregated status of the API, database layer and Telegram connector.",
    params: [],
    rateLimit: "90 req / min",
    responseKind: "json",
    exampleResponse: {
      success: true,
      data: { api: "operational", telegram: "unconfigured", uptimeMs: 120000 },
    },
    errors: ["RATE_LIMITED"],
  },
  {
    id: "system",
    name: "System information",
    method: "GET",
    path: "/system",
    category: "System",
    description:
      "Runtime and host information measured from the running process. Fields that the runtime cannot measure are returned as null instead of a fabricated value.",
    params: [],
    rateLimit: "90 req / min",
    responseKind: "json",
    exampleResponse: { success: true, data: { runtime: "edge-worker", cpu: null, memory: null } },
    errors: ["RATE_LIMITED"],
  },
  {
    id: "stats",
    name: "API statistics",
    method: "GET",
    path: "/stats",
    category: "System",
    description: "Live counters: total requests, error rate, latency percentiles, RPM samples.",
    params: [],
    rateLimit: "90 req / min",
    responseKind: "json",
    exampleResponse: { success: true, data: { totalRequests: 42, errorRate: 0, p95ResponseMs: 4 } },
    errors: ["RATE_LIMITED"],
  },
  {
    id: "ip",
    name: "IP information",
    method: "GET",
    path: "/ip",
    category: "Information",
    description: "Returns the masked network prefix of the caller plus edge geo hints.",
    params: [],
    rateLimit: "90 req / min",
    responseKind: "json",
    exampleResponse: { success: true, data: { ip: "203.0.113.0/24", country: "ID" } },
    errors: ["RATE_LIMITED"],
  },
  {
    id: "device",
    name: "Device fingerprint",
    method: "GET",
    path: "/device",
    category: "Information",
    description:
      "Privacy-conscious request fingerprint (daily-rotating hash) with coarse client hints and request frequency.",
    params: [],
    rateLimit: "90 req / min",
    responseKind: "json",
    exampleResponse: { success: true, data: { deviceId: "dev_ab12…", requests: 3 } },
    errors: ["RATE_LIMITED"],
  },
  {
    id: "random",
    name: "Random generator",
    method: "GET",
    path: "/random",
    category: "Utility",
    description: "Cryptographically secure random values: integers, bytes, uuid or string.",
    params: [
      {
        name: "type",
        in: "query",
        type: "string",
        description: "uuid | int | bytes | string",
        example: "uuid",
      },
      { name: "min", in: "query", type: "number", description: "Lower bound for int", example: "1" },
      { name: "max", in: "query", type: "number", description: "Upper bound for int", example: "100" },
      { name: "length", in: "query", type: "number", description: "Length for bytes/string (1-256)", example: "16" },
    ],
    rateLimit: "90 req / min",
    responseKind: "json",
    exampleResponse: { success: true, data: { type: "uuid", value: "0f2c…" } },
    errors: ["BAD_REQUEST", "RATE_LIMITED"],
  },
  {
    id: "time",
    name: "Server time",
    method: "GET",
    path: "/time",
    category: "Utility",
    description: "Server clock in ISO-8601, epoch and an optional IANA timezone.",
    params: [
      { name: "tz", in: "query", type: "string", description: "IANA timezone", example: "Asia/Jakarta" },
    ],
    rateLimit: "90 req / min",
    responseKind: "json",
    exampleResponse: { success: true, data: { iso: "2026-01-01T00:00:00.000Z", epoch: 1767225600 } },
    errors: ["BAD_REQUEST", "RATE_LIMITED"],
  },
  {
    id: "image-avatar",
    name: "Identicon image",
    method: "GET",
    path: "/image/avatar",
    category: "Media",
    description: "Deterministic SVG identicon generated from a seed. Returns raw image/svg+xml.",
    params: [
      { name: "seed", in: "query", type: "string", description: "Any short seed string", example: "nimzz" },
      { name: "size", in: "query", type: "number", description: "Pixel size 32-512", example: "256" },
    ],
    rateLimit: "60 req / min",
    responseKind: "image",
    exampleResponse: "<svg …/>",
    errors: ["BAD_REQUEST", "RATE_LIMITED"],
  },
  {
    id: "video-pack",
    name: "Video pack (ZIP)",
    method: "GET",
    path: "/video/pack",
    category: "Media",
    description:
      "Video responses are never streamed to a player. The clip is packaged into a ZIP archive together with a manifest and returned as a download.",
    params: [
      { name: "clip", in: "query", type: "string", description: "Clip id from the allowlist", example: "neko" },
    ],
    rateLimit: "6 req / min",
    responseKind: "zip",
    exampleResponse: "binary application/zip",
    errors: ["BAD_REQUEST", "UPSTREAM_ERROR", "RATE_LIMITED"],
  },
  {
    id: "endpoints",
    name: "Endpoint catalog",
    method: "GET",
    path: "/endpoints",
    category: "General",
    description: "Machine readable catalog of every endpoint with live call counters.",
    params: [],
    rateLimit: "90 req / min",
    responseKind: "json",
    exampleResponse: { success: true, data: { count: 15, endpoints: [] } },
    errors: ["RATE_LIMITED"],
  },
  {
    id: "logs",
    name: "Request logs",
    method: "GET",
    path: "/logs",
    category: "System",
    description: "Recent request log with filters and pagination. IPs are stored masked.",
    params: [
      { name: "method", in: "query", type: "string", description: "Filter by HTTP method" },
      { name: "status", in: "query", type: "string", description: "Filter by status class or code, e.g. 4xx" },
      { name: "endpoint", in: "query", type: "string", description: "Filter by path fragment" },
      { name: "ip", in: "query", type: "string", description: "Filter by masked ip fragment" },
      { name: "date", in: "query", type: "string", description: "YYYY-MM-DD" },
      { name: "page", in: "query", type: "number", description: "1-based page", example: "1" },
      { name: "perPage", in: "query", type: "number", description: "Max 100", example: "25" },
    ],
    rateLimit: "90 req / min",
    responseKind: "json",
    exampleResponse: { success: true, data: { total: 0, items: [] } },
    errors: ["RATE_LIMITED"],
  },
  {
    id: "security",
    name: "Security overview",
    method: "GET",
    path: "/security",
    category: "System",
    description: "Rate limiter configuration, blocked identities and suspicious activity counters.",
    params: [],
    rateLimit: "90 req / min",
    responseKind: "json",
    exampleResponse: { success: true, data: { blocked: 0, limits: {} } },
    errors: ["RATE_LIMITED"],
  },

  /* ---------- AI ---------- */
  {
    id: "ai-chat",
    name: "AI chat",
    method: "GET",
    path: "/ai/chat",
    category: "AI",
    runtime: "node",
    description: "General-purpose chat completion via the free Siputzx GPT-3 API. Prompt in, plain-text answer out.",
    params: [
      { name: "prompt", in: "query", type: "string", required: true, description: "User message", example: "Explain recursion simply" },
      { name: "content", in: "query", type: "string", description: "Optional system instruction. When set, prompt is used as the system role instead.", example: "You are a pirate." },
    ],
    rateLimit: "20 req / min",
    responseKind: "json",
    exampleResponse: { success: true, data: { prompt: "Explain recursion simply", answer: "Recursion is …" } },
    errors: ["BAD_REQUEST", "UPSTREAM_ERROR", "RATE_LIMITED"],
  },

  /* ---------- Downloader ---------- */
  {
    id: "dl-tiktok",
    name: "TikTok downloader",
    method: "GET",
    path: "/download/tiktok",
    category: "Downloader",
    runtime: "php",
    description: "Resolves a TikTok video URL to no-watermark download links.",
    params: [
      { name: "url", in: "query", type: "string", required: true, description: "TikTok video URL", example: "https://vt.tiktok.com/xxxxxxx" },
    ],
    rateLimit: "20 req / min",
    responseKind: "json",
    exampleResponse: { success: true, data: { title: "…", noWatermark: "https://…mp4", noWatermarkHD: "https://…mp4", cover: "https://…jpg" } },
    errors: ["BAD_REQUEST", "UPSTREAM_ERROR", "RATE_LIMITED"],
  },
  {
    id: "dl-youtube",
    name: "YouTube downloader",
    method: "GET",
    path: "/download/youtube",
    category: "Downloader",
    runtime: "node",
    description: "Resolves a YouTube URL to available download links and metadata.",
    params: [
      { name: "url", in: "query", type: "string", required: true, description: "YouTube video URL", example: "https://youtu.be/xxxxxxxxxxx" },
    ],
    rateLimit: "15 req / min",
    responseKind: "json",
    exampleResponse: { success: true, data: { title: "…", formats: [] } },
    errors: ["BAD_REQUEST", "UPSTREAM_ERROR", "RATE_LIMITED"],
  },
  {
    id: "dl-instagram",
    name: "Instagram downloader",
    method: "GET",
    path: "/download/instagram",
    category: "Downloader",
    runtime: "node",
    description: "Resolves an Instagram post/reel URL to direct media links.",
    params: [
      { name: "url", in: "query", type: "string", required: true, description: "Instagram post or reel URL", example: "https://www.instagram.com/reel/xxxxxxxxxxx" },
    ],
    rateLimit: "20 req / min",
    responseKind: "json",
    exampleResponse: { success: true, data: { title: "…", mediaType: "video", downloadUrl: ["https://…mp4"] } },
    errors: ["BAD_REQUEST", "UPSTREAM_ERROR", "RATE_LIMITED"],
  },

  /* ---------- Search ---------- */
  {
    id: "search-anime",
    name: "Anime search",
    method: "GET",
    path: "/search/anime",
    category: "Search",
    runtime: "node",
    description: "Searches anime titles by keyword via the free Jikan (MyAnimeList) API.",
    params: [
      { name: "q", in: "query", type: "string", required: true, description: "Search keyword", example: "kimetsu no yaiba" },
    ],
    rateLimit: "30 req / min",
    responseKind: "json",
    exampleResponse: { success: true, data: { results: [{ title: "…", type: "TV", score: 8.5, url: "https://myanimelist.net/anime/…" }] } },
    errors: ["BAD_REQUEST", "UPSTREAM_ERROR", "RATE_LIMITED"],
  },
  {
    id: "search-lyrics",
    name: "Lyrics search",
    method: "GET",
    path: "/search/lyrics",
    category: "Search",
    runtime: "node",
    description: "Finds song lyrics by free-text query via the free Lyrics.ovh API.",
    params: [
      { name: "q", in: "query", type: "string", required: true, description: "Song title, optionally with artist", example: "yoasobi idol" },
    ],
    rateLimit: "30 req / min",
    responseKind: "json",
    exampleResponse: { success: true, data: { title: "…", artist: "…", lyrics: "…" } },
    errors: ["BAD_REQUEST", "NOT_FOUND", "UPSTREAM_ERROR", "RATE_LIMITED"],
  },
  {
    id: "search-npm",
    name: "NPM package search",
    method: "GET",
    path: "/search/npm",
    category: "Search",
    runtime: "node",
    description: "Searches the npm registry for packages.",
    params: [
      { name: "q", in: "query", type: "string", required: true, description: "Package name or keyword", example: "express" },
    ],
    rateLimit: "30 req / min",
    responseKind: "json",
    exampleResponse: { success: true, data: { results: [] } },
    errors: ["BAD_REQUEST", "UPSTREAM_ERROR", "RATE_LIMITED"],
  },
];

export const CATEGORIES: EndpointCategory[] = [
  "AI",
  "Downloader",
  "Search",
  "General",
  "System",
  "Media",
  "Utility",
  "Information",
];

export function findEndpoint(method: string, path: string): EndpointSpec | undefined {
  return (
    ENDPOINTS.find((e) => e.method === method && e.path === path) ??
    INTERNAL_ENDPOINTS.find((e) => e.method === method && e.path === path)
  );
}
