import Redis from "ioredis";
import { config } from "../config";
import { logger } from "../config/logger";

let client: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (!config.redis.enabled) return null;
  if (!client) {
    client = new Redis(config.redis.url!, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: false,
      lazyConnect: true,
    });
    client.on("error", (err) => {
      logger.error("Redis connection error", { error: err.message });
    });
  }
  return client;
}

export async function disconnectRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}
