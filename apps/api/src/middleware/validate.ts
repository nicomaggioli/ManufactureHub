import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

type RequestField = "body" | "query" | "params";

/**
 * Creates an Express middleware that validates the specified request field
 * against a Zod schema. On success the parsed (and transformed) data replaces
 * the original value on the request. On failure a 400 response is returned.
 */
export function validate(schema: ZodSchema, field: RequestField = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[field]);

    if (!result.success) {
      const formatted = formatZodError(result.error);

      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: formatted,
        },
      });
      return;
    }

    // Replace with parsed (and potentially transformed) data
    (req as unknown as Record<string, unknown>)[field] = result.data;
    next();
  };
}

function formatZodError(error: ZodError): Array<{ path: string; message: string }> {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}
