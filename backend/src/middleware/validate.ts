import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { BadRequest } from "./errors.js";

/** Turns the first Zod issue into a readable "field: problem" message. */
const firstIssueMessage = (error: { issues: { path: PropertyKey[]; message: string }[] }): string => {
  const issue = error.issues[0];
  if (!issue) {
    return "Invalid request";
  }

  const prefix = issue.path.length ? `${issue.path.join(".")}: ` : "";
  return `${prefix}${issue.message}`;
};

/**
 * Validates and normalizes req.body against a Zod schema.
 * On success, req.body is replaced with the parsed (trimmed, coerced,
 * defaulted) data. On failure, throws a BadRequest naming the first issue.
 */
export const validateBody =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      throw BadRequest(firstIssueMessage(result.error));
    }

    req.body = result.data;
    next();
  };

/**
 * Validates and normalizes the query string against a Zod schema.
 *
 * NOTE: Express 5 makes req.query a getter-only property, so it cannot be
 * reassigned the way req.body can. The parsed result is attached to
 * res.locals.query instead. We read it from there in the handler.
 */
export const validateQuery =
  (schema: ZodType): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      throw BadRequest(firstIssueMessage(result.error));
    }

    res.locals.query = result.data;
    next();
  };
