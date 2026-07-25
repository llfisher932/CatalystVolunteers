import express from "express";
import jwt from "jsonwebtoken";
import { SECRET, type JWTClaim } from "../jwtclaim.js";
import { Unauthorized } from "../middleware/errors.js";

export type AuthedRequest = express.Request & { user?: JWTClaim };

export const RequiresAuth = (req: AuthedRequest, _res: express.Response, next: express.NextFunction) => {
  const header = req.headers.authorization;
  if (!header) {
    throw Unauthorized("Unauthorized Request");
  }

  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    throw Unauthorized("Unauthorized Request");
  }

  try {
    req.user = jwt.verify(token, SECRET) as JWTClaim;
  } catch {
    throw Unauthorized("Unauthorized Request");
  }

  next();
};
