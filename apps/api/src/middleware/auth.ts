import type { Request, Response, NextFunction } from "express";
import type { Env } from "../config/env.js";
import { verifyAccessToken, type AccessPayload } from "../services/jwt.js";
import type { UserRole } from "@caresync/shared";

export type AuthedRequest = Request & { auth?: AccessPayload };

export function createAuthMiddleware(env: Env) {
  return function authMiddleware(
    req: AuthedRequest,
    res: Response,
    next: NextFunction
  ): void {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing bearer token" });
      return;
    }
    const token = header.slice(7);
    try {
      req.auth = verifyAccessToken(env, token);
      next();
    } catch {
      res.status(401).json({ error: "Invalid or expired token" });
    }
  };
}

export function requireRole(...allowed: UserRole[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (!allowed.includes(req.auth.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
