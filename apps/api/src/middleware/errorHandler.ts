import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger";
import { config } from "../config";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const correlationId = (req as unknown as Record<string, unknown>)
    .correlationId as string | undefined;

  if (err instanceof AppError) {
    logger.warn("Application error", {
      correlationId,
      code: err.code,
      statusCode: err.statusCode,
      message: err.message,
      path: req.path,
    });

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: err.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
    });
    return;
  }

  logger.error("Unhandled error", {
    correlationId,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: config.isProduction
        ? "An unexpected error occurred"
        : err.message,
    },
  });
}
