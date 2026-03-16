import { Request } from "express";

// ---------------------------------------------------------------------------
// Authenticated request
// ---------------------------------------------------------------------------

/**
 * An Express Request whose `user` property is guaranteed to be present
 * (i.e. the request has passed through `requireAuth` middleware).
 *
 * The user shape matches the JWT payload attached in src/middleware/auth.ts.
 */
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: string;
    planTier: "free" | "pro" | "enterprise";
  };
}

// ---------------------------------------------------------------------------
// Standard API response wrappers
// ---------------------------------------------------------------------------

/** Successful API response. */
export interface ApiResponse<T> {
  success: true;
  data: T;
}

/** Failed API response. */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// ---------------------------------------------------------------------------
// Paginated response
// ---------------------------------------------------------------------------

/**
 * Cursor-based paginated response used by all list endpoints.
 */
export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}
