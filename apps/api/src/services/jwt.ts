import jwt, { type SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import type { Env } from "../config/env.js";
import type { UserRole } from "@caresync/shared";

export type AccessPayload = {
  sub: string;
  email: string;
  clinicId: string;
  role: UserRole;
};

export function signAccessToken(
  env: Env,
  payload: AccessPayload
): string {
  const opts: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES as SignOptions["expiresIn"],
    issuer: "caresync-api",
    audience: "caresync-web",
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, opts);
}

/** Tokens issued before the Caresync rename used clinic-* issuer/audience. */
const JWT_ISSUERS = ["caresync-api", "clinic-api"] as const;
const JWT_AUDIENCES = ["caresync-web", "clinic-web"] as const;

export function verifyAccessToken(env: Env, token: string): AccessPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: [...JWT_ISSUERS],
    audience: [...JWT_AUDIENCES],
  });
  if (typeof decoded !== "object" || decoded === null) {
    throw new Error("Invalid token payload");
  }
  const d = decoded as Record<string, unknown>;
  return {
    sub: String(d.sub),
    email: String(d.email),
    clinicId: String(d.clinicId),
    role: d.role as UserRole,
  };
}

export function randomRefreshToken(): string {
  return crypto.randomBytes(48).toString("base64url");
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
