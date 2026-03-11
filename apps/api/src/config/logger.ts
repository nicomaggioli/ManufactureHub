import winston from "winston";
import { config } from "./index";

const LOG_LEVELS: Record<string, string> = {
  production: "warn",
  development: "debug",
  test: "silent",
};

export const logger = winston.createLogger({
  level: LOG_LEVELS[config.env] ?? "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "ISO" }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "manufacturehub-api" },
  transports: [new winston.transports.Console()],
});

/**
 * Creates a child logger that includes the correlation ID in every log entry.
 */
export function createRequestLogger(correlationId: string): winston.Logger {
  return logger.child({ correlationId });
}
