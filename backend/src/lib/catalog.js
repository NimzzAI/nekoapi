/**
 * Public endpoint catalog, mirrors ENDPOINTS in
 * frontend/src/api/core/registry.ts. Used by GET /endpoints to report live
 * call counts. The Telegram notifier is intentionally excluded — see
 * src/api/telegram/*.js and the comment in index.js.
 */
const CATALOG = [
  { id: "ping", method: "GET", path: "/ping", category: "General", description: "Health check.", rateLimit: "90 req / min", responseKind: "json" },
  { id: "status", method: "GET", path: "/status", category: "General", description: "Aggregated service status.", rateLimit: "90 req / min", responseKind: "json" },
  { id: "system", method: "GET", path: "/system", category: "System", description: "Host runtime, CPU and memory measured from the process.", rateLimit: "90 req / min", responseKind: "json" },
  { id: "stats", method: "GET", path: "/stats", category: "System", description: "Live request counters and latency percentiles.", rateLimit: "90 req / min", responseKind: "json" },
  { id: "ip", method: "GET", path: "/ip", category: "Information", description: "Masked network prefix of the caller.", rateLimit: "90 req / min", responseKind: "json" },
  { id: "device", method: "GET", path: "/device", category: "Information", description: "Daily-rotating device fingerprint.", rateLimit: "90 req / min", responseKind: "json" },
  { id: "random", method: "GET", path: "/random", category: "Utility", description: "Cryptographically secure random values.", rateLimit: "90 req / min", responseKind: "json" },
  { id: "time", method: "GET", path: "/time", category: "Utility", description: "Server clock with optional IANA timezone.", rateLimit: "90 req / min", responseKind: "json" },
  { id: "endpoints", method: "GET", path: "/endpoints", category: "General", description: "Endpoint catalog with live call counts.", rateLimit: "90 req / min", responseKind: "json" },
  { id: "logs", method: "GET", path: "/logs", category: "System", description: "Filterable request log.", rateLimit: "90 req / min", responseKind: "json" },
  { id: "security", method: "GET", path: "/security", category: "System", description: "Rate limiter and security posture.", rateLimit: "90 req / min", responseKind: "json" },
  { id: "image-avatar", method: "GET", path: "/image/avatar", category: "Media", description: "Deterministic SVG identicon.", rateLimit: "60 req / min", responseKind: "image" },
  { id: "video-pack", method: "GET", path: "/video/pack", category: "Media", description: "Video delivered as a ZIP archive.", rateLimit: "6 req / min", responseKind: "zip" },
  { id: "ai-chat", method: "GET", path: "/ai/chat", category: "AI", description: "General-purpose chat completion.", rateLimit: "20 req / min", responseKind: "json" },
  { id: "dl-tiktok", method: "GET", path: "/download/tiktok", category: "Downloader", description: "TikTok video without watermark.", rateLimit: "20 req / min", responseKind: "json" },
  { id: "dl-youtube", method: "GET", path: "/download/youtube", category: "Downloader", description: "YouTube download links and metadata.", rateLimit: "15 req / min", responseKind: "json" },
  { id: "dl-instagram", method: "GET", path: "/download/instagram", category: "Downloader", description: "Instagram post/reel media links.", rateLimit: "20 req / min", responseKind: "json" },
  { id: "search-anime", method: "GET", path: "/search/anime", category: "Search", description: "Searches anime titles by keyword.", rateLimit: "30 req / min", responseKind: "json" },
  { id: "search-lyrics", method: "GET", path: "/search/lyrics", category: "Search", description: "Finds song lyrics by title/artist.", rateLimit: "30 req / min", responseKind: "json" },
  { id: "search-npm", method: "GET", path: "/search/npm", category: "Search", description: "Searches the npm registry.", rateLimit: "30 req / min", responseKind: "json" },
];

module.exports = { CATALOG };
