import express from "express";
import cors from "cors";
import helmet from "helmet";

import { config } from "./config";
import { logger } from "./config/logger";
import { correlationId } from "./middleware/correlationId";
import { errorHandler } from "./middleware/errorHandler";
import { cache } from "./utils/cache";
import prisma from "./lib/prisma";

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------
const app = express();

// Global middleware (order matters)
app.use(helmet());
app.use(
  cors({
    origin: config.app.corsOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));
app.use(correlationId);

// ---------------------------------------------------------------------------
// Health check (no auth required)
// ---------------------------------------------------------------------------
app.get("/api/health", async (_req, res) => {
  const checks: Record<string, "ok" | "error"> = {
    database: "error",
    redis: "error",
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    // leave as error
  }

  try {
    const redis = cache.getClient();
    if (!redis) throw new Error('Redis not configured');
    await redis.ping();
    checks.redis = "ok";
  } catch {
    // leave as error
  }

  const healthy = Object.values(checks).every((v) => v === "ok");

  res.status(healthy ? 200 : 503).json({
    success: healthy,
    status: healthy ? "healthy" : "degraded",
    checks,
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// Route groups
// ---------------------------------------------------------------------------
import apiRoutes from "./routes/index";
app.use("/api/v1", apiRoutes);

// ---------------------------------------------------------------------------
// 404 fallback
// ---------------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "The requested resource was not found",
    },
  });
});

// ---------------------------------------------------------------------------
// Global error handler (must be registered last)
// ---------------------------------------------------------------------------
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
async function main() {
  try {
    await prisma.$connect();
    logger.info("Connected to database");

    const server = app.listen(config.app.port, () => {
      logger.info(`Server listening on port ${config.app.port}`, {
        env: config.env,
        port: config.app.port,
      });
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received – shutting down`);
      server.close(async () => {
        await prisma.$disconnect();
        logger.info("Server stopped");
        process.exit(0);
      });

      // Force exit after 10 s
      setTimeout(() => process.exit(1), 10_000);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (err) {
    logger.error("Failed to start server", { error: err });
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();

export { app };
