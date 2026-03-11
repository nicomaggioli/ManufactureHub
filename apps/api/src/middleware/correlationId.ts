import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

declare global {
  namespace Express {
    interface Request {
      correlationId: string;
    }
  }
}

/**
 * Attaches a unique correlation ID to every incoming request.
 * If the client sends an `X-Correlation-ID` header it is reused;
 * otherwise a new UUID v4 is generated.
 * The ID is also returned in the response headers.
 */
export function correlationId(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const id =
    (req.headers["x-correlation-id"] as string | undefined) ?? uuidv4();

  req.correlationId = id;
  res.setHeader("X-Correlation-ID", id);

  next();
}
