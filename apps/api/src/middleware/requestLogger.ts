import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";

/**
 * Logs each incoming HTTP request with method, URL, status code, and
 * response time in milliseconds.
 *
 * The /api/health endpoint is excluded to avoid noisy logs from
 * readiness / liveness probes.
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip health-check endpoint
  if (req.path === "/api/health") {
    return next();
  }

  const start = Date.now();

  // Hook into the response "finish" event so we can log after the
  // status code and headers have been set.
  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const correlationId = (req as unknown as Record<string, unknown>)
      .correlationId as string | undefined;

    const meta: Record<string, unknown> = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
    };

    if (correlationId) {
      meta.correlationId = correlationId;
    }

    // Use warn level for server errors, info for everything else
    if (res.statusCode >= 500) {
      logger.warn(`${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`, meta);
    } else {
      logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`, meta);
    }
  });

  next();
}
