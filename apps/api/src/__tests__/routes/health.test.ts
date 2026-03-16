import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import prisma from "../../lib/prisma";
import { cache } from "../../utils/cache";

const mockPrisma = prisma as unknown as {
  $queryRaw: ReturnType<typeof vi.fn>;
};
const mockCache = cache as unknown as {
  getClient: ReturnType<typeof vi.fn>;
};

// Build a minimal app that mirrors the health endpoint from src/index.ts
function createApp() {
  const app = express();

  app.get("/api/health", async (_req, res) => {
    const checks: Record<string, "ok" | "error" | "disabled"> = {
      database: "error",
      redis: "disabled",
    };

    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = "ok";
    } catch {
      // leave as error
    }

    try {
      const redis = cache.getClient();
      if (redis) {
        await (redis as any).ping();
        checks.redis = "ok";
      }
    } catch {
      checks.redis = "error";
    }

    const healthy = checks.database === "ok";

    res.status(healthy ? 200 : 503).json({
      success: healthy,
      status: healthy ? "healthy" : "degraded",
      checks,
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}

describe("GET /api/health", () => {
  let app: express.Express;

  beforeEach(() => {
    app = createApp();
  });

  it("should return 200 with healthy status when database is up", async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);
    mockCache.getClient.mockReturnValue(null); // Redis disabled

    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe("healthy");
    expect(res.body.checks.database).toBe("ok");
    expect(res.body.checks.redis).toBe("disabled");
    expect(res.body.timestamp).toBeDefined();
  });

  it("should return 503 with degraded status when database is down", async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error("Connection refused"));
    mockCache.getClient.mockReturnValue(null);

    const res = await request(app).get("/api/health");

    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.status).toBe("degraded");
    expect(res.body.checks.database).toBe("error");
  });

  it("should show redis as ok when redis is available and responds to ping", async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);
    const mockRedisClient = { ping: vi.fn().mockResolvedValue("PONG") };
    mockCache.getClient.mockReturnValue(mockRedisClient);

    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body.checks.redis).toBe("ok");
    expect(mockRedisClient.ping).toHaveBeenCalled();
  });

  it("should show redis as error when ping fails", async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);
    const mockRedisClient = {
      ping: vi.fn().mockRejectedValue(new Error("Redis down")),
    };
    mockCache.getClient.mockReturnValue(mockRedisClient);

    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200); // DB is still up, so server is healthy
    expect(res.body.checks.redis).toBe("error");
  });
});
