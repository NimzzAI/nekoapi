/**
 * Central site configuration. Branding/metadata comes from src/config.js —
 * edit that file directly, it's not a secret. Only deployment-specific
 * values (where the API lives) come from env, since those legitimately
 * differ per environment for the same codebase.
 */
import { siteConfig as branding } from "@/config.js";

const env = import.meta.env as unknown as Record<string, string | undefined>;

export const siteConfig = {
  ...branding,
  url: branding.url.replace(/\/$/, ""),
  /** Empty = same-origin backend served by this deployment. */
  apiBaseUrl: (env["VITE_API_BASE_URL"] ?? "").replace(/\/$/, ""),
} as const;

/** Absolute URL builder for canonical/OG tags. */
export const absoluteUrl = (path: string) =>
  `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;

/** Displayable API base: external Node backend when configured, else same origin. */
export const apiBase = () =>
  siteConfig.apiBaseUrl ||
  (typeof window === "undefined" ? "/api/public" : `${window.location.origin}/api/public`);
