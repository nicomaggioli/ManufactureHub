import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { logger } from "../config/logger";

export interface JwtPayload {
  sub: string;
  role: string;
  planTier: "free" | "pro" | "enterprise";
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        planTier: "free" | "pro" | "enterprise";
      };
    }
  }
}

// In dev mode with default JWT secret, auto-attach a mock user so the app
// works without any auth provider configured.
const DEV_MODE =
  config.isDevelopment &&
  config.app.jwtSecret === "dev-secret-change-in-production";

const DEV_USER_ID = "dev-user-1"; // matches the first seeded user

/**
 * Validates the JWT from the Authorization header and attaches user info to req.
 * In dev mode (no auth configured), automatically injects a mock admin user.
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Dev bypass — no auth required
  if (DEV_MODE) {
    req.user = {
      id: DEV_USER_ID,
      role: "admin",
      planTier: "enterprise",
    };
    return next();
  }

  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Missing or malformed Authorization header",
      },
    });
    return;
  }

  const token = header.slice(7);

  try {
    const decoded = jwt.verify(token, config.app.jwtSecret) as JwtPayload;

    req.user = {
      id: decoded.sub,
      role: decoded.role,
      planTier: decoded.planTier,
    };

    next();
  } catch (err) {
    const message =
      err instanceof jwt.TokenExpiredError
        ? "Token has expired"
        : "Invalid token";

    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message },
    });
  }
}

/**
 * Returns middleware that checks whether the authenticated user has the required role.
 * Must be used after `requireAuth`.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Not authenticated" },
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: `Requires one of roles: ${roles.join(", ")}`,
        },
      });
      return;
    }

    next();
  };
}
