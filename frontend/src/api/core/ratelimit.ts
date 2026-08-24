/**
 * Fixed-window rate limiter with temporary blocking on repeated abuse.
 * Keyed per identity (API key > device fingerprint) + endpoint.
 */
import { state } from "./state";

export type Limit = { windowMs: number; max: number };

export const DEFAULT_LIMIT: Limit = { windowMs: 60_000, max: 90 };

export const ENDPOINT_LIMITS: Record<string, Limit> = {
  "/telegram/send": { windowMs: 60_000, max: 8 },
  "/video/pack": { windowMs: 60_000, max: 6 },
  "/image/avatar": { windowMs: 60_000, max: 60 },
};

export type RateResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter: number;
  blocked: boolean;
};

export function checkRate(identity: string, path: string): RateResult {
  const s = state();
  const limit = ENDPOINT_LIMITS[path] ?? DEFAULT_LIMIT;
  const key = `${identity}:${path}`;
  const now = Date.now();
  let bucket = s.buckets.get(key);

  if (bucket && bucket.blockedUntil > now) {
    return {
      allowed: false,
      limit: limit.max,
      remaining: 0,
      resetAt: bucket.blockedUntil,
      retryAfter: Math.ceil((bucket.blockedUntil - now) / 1000),
      blocked: true,
    };
  }

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + limit.windowMs, blockedUntil: 0 };
  }

  bucket.count += 1;
  // sustained flooding (3x over the limit) triggers a 5 minute block
  if (bucket.count > limit.max * 3) bucket.blockedUntil = now + 300_000;
  s.buckets.set(key, bucket);
  if (s.buckets.size > 5000) s.buckets.delete(s.buckets.keys().next().value as string);

  const allowed = bucket.count <= limit.max;
  return {
    allowed,
    limit: limit.max,
    remaining: Math.max(0, limit.max - bucket.count),
    resetAt: bucket.resetAt,
    retryAfter: allowed ? 0 : Math.ceil((bucket.resetAt - now) / 1000),
    blocked: false,
  };
}
