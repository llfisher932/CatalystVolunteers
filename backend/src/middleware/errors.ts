import type { Request, Response, NextFunction } from "express";

/**
 * Thrown by route handlers when they want to fail with a specific status.
 * Anything else that reaches the error handler is treated as a 500.
 */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/** Convenience constructors for the statuses we actually use. */
export const BadRequest = (message: string) => new HttpError(400, message);
export const Unauthorized = (message = "Unauthorized") => new HttpError(401, message);
export const NotFound = (message = "Not found") => new HttpError(404, message);
export const Conflict = (message: string) => new HttpError(409, message);

/** Prisma error codes we know how to translate into HTTP responses. */
const PRISMA_ERRORS: Record<string, (error: any) => HttpError> = {
  // Unique constraint violation
  P2002: (error) => {
    const field = error.meta?.target?.[0] ?? "value";
    return Conflict(`That ${field} is already in use`);
  },
  // Record required for the operation was not found
  P2025: () => NotFound("Record not found"),
  // Foreign key constraint failed
  P2003: () => BadRequest("Referenced record does not exist"),
  // Value too long for the column
  P2000: () => BadRequest("A provided value is too long"),
};

/**
 * Central error handler. Mount AFTER all routes.
 * Translates known Prisma errors, honours HttpError, and falls back to 500.
 */
export function errorHandler(error: any, _req: Request, res: Response, _next: NextFunction) {
  // Explicitly thrown by a handler — trust the status it asked for.
  if (error instanceof HttpError) {
    return res.status(error.status).json({ status: error.status, message: error.message });
  }

  // Known Prisma failure — translate it.
  const translate = error?.code ? PRISMA_ERRORS[error.code] : undefined;
  if (translate) {
    const httpError = translate(error);
    return res.status(httpError.status).json({
      status: httpError.status,
      message: httpError.message,
    });
  }

  // Errors from express.json() and other middleware that set a status
  if (typeof error?.status === "number" && error.expose) {
    return res.status(error.status).json({ status: error.status, message: "Malformed request body" });
  }

  // Anything else is a genuine server error.
  console.error("Unhandled error:", error);
  return res.status(500).json({ status: 500, message: "An error occurred" });
}

/** 404 handler for unmatched routes. Mount after routes, before errorHandler. */
export function notFoundHandler(_req: Request, res: Response) {
  return res.status(404).json({ status: 404, message: "Route not found" });
}
