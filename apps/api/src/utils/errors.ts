/**
 * Custom error classes for the ManufactureHub API.
 *
 * These are compatible with the global error handler defined in
 * src/middleware/errorHandler.ts, which checks for `AppError` instances
 * (statusCode, code, message, details).
 *
 * NOTE: The errorHandler.ts file already defines its own AppError class.
 * These subclasses extend that same shape so they are caught by the same
 * `instanceof AppError` check. We re-export AppError from here for
 * convenience.
 */

import { AppError } from "../middleware/errorHandler";

export { AppError };

export class NotFoundError extends AppError {
  constructor(message = "The requested resource was not found", details?: unknown) {
    super(404, "NOT_FOUND", message, details);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: unknown) {
    super(400, "VALIDATION_ERROR", message, details);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication is required", details?: unknown) {
    super(401, "UNAUTHORIZED", message, details);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action", details?: unknown) {
    super(403, "FORBIDDEN", message, details);
    this.name = "ForbiddenError";
  }
}
