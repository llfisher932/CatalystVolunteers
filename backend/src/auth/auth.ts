import express from "express";
import jwt from "jsonwebtoken";
import { SECRET, type JWTClaim } from "../jwtclaim.js";

export type AuthedRequest = express.Request & { user?: JWTClaim };

export const RequiresAuth = (req: AuthedRequest, res: express.Response, next: express.NextFunction) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ status: 401, message: "Unauthorized Request" });
  } else {
    const [scheme, token] = req.headers.authorization.split(" ");
    if (scheme !== "Bearer") {
      return res.status(401).json({ status: 401, message: "Unauthorized Request" });
    } else if (!token) {
      return res.status(401).json({ status: 401, message: "Unauthorized Request" });
    } else {
      jwt.verify(token, SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).json({ status: 401, message: "Unauthorized Request" });
        } else {
          req.user = decoded as unknown as JWTClaim;
          next();
        }
      });
    }
  }
};
