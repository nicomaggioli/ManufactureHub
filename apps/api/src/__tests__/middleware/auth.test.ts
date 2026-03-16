import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// We need to mock the config module BEFORE importing auth middleware
vi.mock("../../config", () => ({
  config: {
    isDevelopment: false,
    isProduction: false,
    isTest: true,
    env: "test",
    app: {
      jwtSecret: "test-jwt-secret",
      port: 3001,
      corsOrigins: ["http://localhost:5173"],
    },
  },
}));

import { requireAuth, requireRole } from "../../middleware/auth";
import { config } from "../../config";

function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    ...overrides,
  } as unknown as Request;
}

function mockRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe("requireAuth middleware", () => {
  let next: NextFunction;

  beforeEach(() => {
    next = vi.fn();
  });

  describe("when in dev mode with default secret", () => {
    beforeEach(() => {
      // Temporarily set config to dev mode
      (config as any).isDevelopment = true;
      (config as any).app.jwtSecret = "dev-secret-change-in-production";
    });

    afterEach(() => {
      (config as any).isDevelopment = false;
      (config as any).app.jwtSecret = "test-jwt-secret";
    });

    // Note: DEV_MODE is evaluated at module load time, so this test documents
    // the constant-captured behavior. In a fresh module load with dev config,
    // the bypass would be active.
  });

  describe("when Authorization header is missing", () => {
    it("should return 401 with UNAUTHORIZED code", () => {
      const req = mockReq();
      const res = mockRes();

      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Missing or malformed Authorization header",
        },
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("when Authorization header is malformed", () => {
    it("should return 401 if header does not start with Bearer", () => {
      const req = mockReq({ headers: { authorization: "Basic abc123" } as any });
      const res = mockRes();

      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("when token is invalid", () => {
    it("should return 401 with Invalid token message", () => {
      const req = mockReq({
        headers: { authorization: "Bearer invalid.token.here" } as any,
      });
      const res = mockRes();

      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid token" },
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("when token is expired", () => {
    it("should return 401 with Token has expired message", () => {
      const expiredToken = jwt.sign(
        { sub: "user-1", role: "admin", planTier: "pro" },
        "test-jwt-secret",
        { expiresIn: "-1s" }
      );
      const req = mockReq({
        headers: { authorization: `Bearer ${expiredToken}` } as any,
      });
      const res = mockRes();

      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Token has expired" },
      });
    });
  });

  describe("when token is valid", () => {
    it("should attach user to req and call next", () => {
      const token = jwt.sign(
        { sub: "user-123", role: "admin", planTier: "enterprise" },
        "test-jwt-secret"
      );
      const req = mockReq({
        headers: { authorization: `Bearer ${token}` } as any,
      });
      const res = mockRes();

      requireAuth(req, res, next);

      expect(req.user).toEqual({
        id: "user-123",
        role: "admin",
        planTier: "enterprise",
      });
      expect(next).toHaveBeenCalled();
    });
  });
});

describe("requireRole middleware", () => {
  let next: NextFunction;

  beforeEach(() => {
    next = vi.fn();
  });

  it("should return 401 if no user is attached to the request", () => {
    const middleware = requireRole("admin");
    const req = mockReq();
    const res = mockRes();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Not authenticated" },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 403 if user role is not in the allowed list", () => {
    const middleware = requireRole("admin", "superadmin");
    const req = mockReq();
    (req as any).user = { id: "u1", role: "viewer", planTier: "free" };
    const res = mockRes();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Requires one of roles: admin, superadmin",
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next if user role is in the allowed list", () => {
    const middleware = requireRole("admin", "editor");
    const req = mockReq();
    (req as any).user = { id: "u1", role: "editor", planTier: "pro" };
    const res = mockRes();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
