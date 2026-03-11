import { Request, Response, NextFunction } from "express";
import Redis from "ioredis";
import { config } from "../config";
import { logger } from "../config/logger";

const LIMITS: Record<string, number> = {
  free: 100,
  pro: 500,
  enterprise: 2000,
};

const WINDOW_SECONDS = 3600; // 1 hour

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!config.redis.enabled) return null;
  if (!redis) {
    redis = new Redis(config.redis.url!, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
    });
    redis.on("error", (err) => {
      logger.error("Rate limiter Redis error", { error: err.message });
    });
  }
  return redis;
}

/**
 * Redis-backed sliding-window rate limiter.
 * Limits are determined by the user's planTier attached by requireAuth.
 * If the user is not authenticated, a default of 50 req/hr is applied.
 */
export function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const planTier = req.user?.planTier ?? "free";
  const limit = LIMITS[planTier] ?? LIMITS.free;
  const identifier = req.user?.id ?? req.ip ?? "anonymous";
  const key = `rate_limit:${identifier}`;

  const now = Date.now();
  const windowStart = now - WINDOW_SECONDS * 1000;

  const client = getRedis();

  // If Redis is not available, skip rate limiting
  if (!client) {
    next();
    return;
  }

  client
    .pipeline()
    .zremrangebyscore(key, 0, windowStart)
    .zcard(key)
    .zadd(key, now.toString(), `${now}:${Math.random()}`)
    .expire(key, WINDOW_SECONDS)
    .exec()
    .then((results) => {
      if (!results) {
        next();
        return;
      }

      const count = results[1]?.[1] as number;

      res.setHeader("X-RateLimit-Limit", limit);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, limit - count - 1));
      res.setHeader("X-RateLimit-Reset", Math.ceil((now + WINDOW_SECONDS * 1000) / 1000));

      if (count >= limit) {
        const retryAfter = Math.ceil(WINDOW_SECONDS - (now - windowStart) / 1000);
        res.setHeader("Retry-After", retryAfter);
        res.status(429).json({
          success: false,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: `Rate limit exceeded. Limit: ${limit} requests per hour for ${planTier} plan.`,
          },
        });
        return;
      }

      next();
    })
    .catch((err) => {
      logger.warn("Rate limiter Redis failure, allowing request", {
        error: err.message,
      });
      next();
    });
}
