import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { logger } from "./logger";

// Lazily initialised — avoids crashing at build time if env vars aren't set
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return null; // Rate limiting disabled (dev / env not configured)
  }
  if (!redis) {
    redis = Redis.fromEnv();
  }
  return redis;
}

// Cache limiter instances so we don't recreate them on every request
const limiterCache = new Map<string, Ratelimit>();

function getLimiter(action: string, requests: number, window: string): Ratelimit {
  const cacheKey = `${action}:${requests}:${window}`;
  const cached = limiterCache.get(cacheKey);
  if (cached) return cached;

  const r = getRedis()!;
  const limiter = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(requests, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
    prefix: `petage:rl:${action}`,
    analytics: false,
  });
  limiterCache.set(cacheKey, limiter);
  return limiter;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  /** Unix timestamp (ms) when the window resets */
  reset: number;
}

/**
 * Check rate limit for an action + identifier (uid or IP).
 *
 * Gracefully no-ops if Upstash Redis is not configured, so local
 * development works without Redis.
 *
 * @param action   Unique name for this limit (e.g. "pets:create")
 * @param id       Per-user or per-IP key
 * @param requests Max requests allowed in the window
 * @param window   Sliding window duration e.g. "1 m", "10 s", "1 h"
 */
export async function checkRateLimit(
  action: string,
  id: string,
  requests: number,
  window: string
): Promise<RateLimitResult> {
  if (!getRedis()) {
    return { success: true, limit: requests, remaining: requests, reset: 0 };
  }

  const limiter = getLimiter(action, requests, window);
  const result = await limiter.limit(`${action}:${id}`);

  if (!result.success) {
    logger.warn("rate_limit.hit", {
      action,
      identifier: id,
      remaining: result.remaining,
      reset: result.reset,
    });
  }

  return result;
}

/**
 * Extract the best available IP from a Next.js request.
 * Prefers x-forwarded-for (set by Vercel/proxies) then x-real-ip.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Build standard rate-limit response headers.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    ...(result.reset
      ? { "Retry-After": String(Math.ceil((result.reset - Date.now()) / 1000)) }
      : {}),
  };
}
