import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { BadRequest } from "./errors.js";

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
      const issue = result.error.issues[0];

      if (!issue) {
        throw BadRequest("Invalid request body");
      }

      const prefix = issue.path.length ? `${issue.path.join(".")}: ` : "";
      throw BadRequest(`${prefix}${issue.message}`);
    }

    req.body = result.data;
    next();
  };
