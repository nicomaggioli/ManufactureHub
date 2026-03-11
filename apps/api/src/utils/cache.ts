import Redis from "ioredis";
import { config } from "../config";
import { logger } from "../config/logger";

let client: Redis | null = null;

function getClient(): Redis {
  if (!client) {
    client = new Redis(config.redis.url, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: false,
    });
    client.on("error", (err) => {
      logger.error("Cache Redis error", { error: err.message });
    });
  }
  return client;
}

export const cache = {
  /**
   * Retrieve a cached value. Returns `null` on miss or Redis failure.
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const raw = await getClient().get(key);
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
      const serialized = JSON.stringify(value);
      if (ttl) {
        await getClient().set(key, serialized, "EX", ttl);
      } else {
        await getClient().set(key, serialized);
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
      if (keys.length > 0) {
        await getClient().del(...keys);
      }
    } catch (err) {
      logger.warn("Cache del failed", { keys, error: (err as Error).message });
    }
  },

  /**
   * Fetch from cache or execute `fetchFn`, cache the result, and return it.
   * On Redis failure the fetch function is still called (cache-aside pattern).
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
   * Returns the underlying ioredis client for health checks or advanced ops.
   */
  getClient,
};
