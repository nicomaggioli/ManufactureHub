import { getRedisClient } from "../lib/redis";
import { logger } from "../config/logger";

function getClient() {
  return getRedisClient();
}

export const cache = {
  /**
   * Retrieve a cached value. Returns `null` on miss, Redis failure, or when Redis is disabled.
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const c = getClient();
      if (!c) return null;
      const raw = await c.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (err) {
      logger.warn("Cache get failed", { key, error: (err as Error).message });
      return null;
    }
  },

  /**
   * Store a value in the cache.
   * @param ttl  Time-to-live in seconds. Omit for no expiry.
   */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      const c = getClient();
      if (!c) return;
      const serialized = JSON.stringify(value);
      if (ttl) {
        await c.set(key, serialized, "EX", ttl);
      } else {
        await c.set(key, serialized);
      }
    } catch (err) {
      logger.warn("Cache set failed", { key, error: (err as Error).message });
    }
  },

  /**
   * Delete one or more cache keys.
   */
  async del(...keys: string[]): Promise<void> {
    try {
      const c = getClient();
      if (!c) return;
      if (keys.length > 0) {
        await c.del(...keys);
      }
    } catch (err) {
      logger.warn("Cache del failed", { keys, error: (err as Error).message });
    }
  },

  /**
   * Fetch from cache or execute `fetchFn`, cache the result, and return it.
   * On Redis failure (or when disabled) the fetch function is still called.
   */
  async getOrSet<T>(
    key: string,
    ttl: number,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const cached = await cache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetchFn();
    await cache.set(key, fresh, ttl);
    return fresh;
  },

  /**
   * Returns the underlying ioredis client (or null if Redis is disabled).
   */
  getClient,
};
