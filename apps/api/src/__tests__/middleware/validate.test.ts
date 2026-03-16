import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { validate } from "../../middleware/validate";

function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    query: {},
    params: {},
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

describe("validate middleware", () => {
  let next: NextFunction;

  beforeEach(() => {
    next = vi.fn();
  });

  describe("body validation (default)", () => {
    const schema = z.object({
      title: z.string().min(1),
      description: z.string().optional(),
    });

    it("should call next and replace body with parsed data on valid input", () => {
      const req = mockReq({ body: { title: "My Project", description: "desc" } });
      const res = mockRes();
      const middleware = validate(schema);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body).toEqual({ title: "My Project", description: "desc" });
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should strip unknown fields from body", () => {
      const strictSchema = z.object({ title: z.string() }).strict();
      const req = mockReq({ body: { title: "Test", extraField: "ignored" } });
      const res = mockRes();
      const middleware = validate(strictSchema);

      middleware(req, res, next);

      // strict schema will reject unknown fields
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 with validation details on invalid input", () => {
      const req = mockReq({ body: { title: "" } });
      const res = mockRes();
      const middleware = validate(schema);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: expect.arrayContaining([
            expect.objectContaining({
              path: "title",
              message: expect.any(String),
            }),
          ]),
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 when required fields are missing", () => {
      const req = mockReq({ body: {} });
      const res = mockRes();
      const middleware = validate(schema);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: "VALIDATION_ERROR",
            details: expect.arrayContaining([
              expect.objectContaining({ path: "title" }),
            ]),
          }),
        })
      );
    });
  });

  describe("query validation", () => {
    const querySchema = z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(20),
    });

    it("should validate and transform query params", () => {
      const req = mockReq({ query: { page: "2", limit: "50" } as any });
      const res = mockRes();
      const middleware = validate(querySchema, "query");

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.query).toEqual({ page: 2, limit: 50 });
    });

    it("should apply defaults for missing query params", () => {
      const req = mockReq({ query: {} as any });
      const res = mockRes();
      const middleware = validate(querySchema, "query");

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.query).toEqual({ page: 1, limit: 20 });
    });
  });

  describe("params validation", () => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    it("should validate route params", () => {
      const req = mockReq({
        params: { id: "550e8400-e29b-41d4-a716-446655440000" } as any,
      });
      const res = mockRes();
      const middleware = validate(paramsSchema, "params");

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should reject invalid uuid params", () => {
      const req = mockReq({ params: { id: "not-a-uuid" } as any });
      const res = mockRes();
      const middleware = validate(paramsSchema, "params");

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("nested object validation", () => {
    const nestedSchema = z.object({
      user: z.object({
        name: z.string(),
        email: z.string().email(),
      }),
    });

    it("should return nested path in error details", () => {
      const req = mockReq({
        body: { user: { name: "Test", email: "not-an-email" } },
      });
      const res = mockRes();
      const middleware = validate(nestedSchema);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            details: expect.arrayContaining([
              expect.objectContaining({ path: "user.email" }),
            ]),
          }),
        })
      );
    });
  });
});
