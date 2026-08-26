/**
 * NekoAPI site config — branding and metadata only. Nothing here is a
 * secret, so it lives in a plain JS file instead of .env: edit this file
 * directly, no rebuild-the-env-file dance, no restart-required env vars.
 *
 * Real secrets (API keys, tokens, DB URLs) stay in .env — see .env.example.
 * Deployment-specific values that differ per environment (like pointing the
 * frontend at an external API host) can still be overridden with
 * VITE_API_BASE_URL if you need that; everything below is meant to be the
 * same across every environment for a given deployment of this project.
 */
export const siteConfig = {
  name: "NekoAPI",
  tagline: "REST API Neko",
  description:
    "NekoAPI is a free, open API service providing AI, downloader and search endpoints for your development needs.",
  owner: "Nimzz",
  // TODO: replace with your real Vercel domain once you have it, e.g.
  // "https://your-project.vercel.app" or your custom domain.
  url: "https://nekoapi.dev",
  favicon: "/favicon.ico",
  /** Homepage "About" illustration. Any absolute URL or /public path. Hidden automatically if missing — never renders as a broken-image icon. */
  heroImage: "/hero.jpg",
  version: "1.0.0",
};
