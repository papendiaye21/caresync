import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "./auth.js";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client.js";
import { userClinicMemberships } from "../db/schema.js";
import type { UserRole } from "@caresync/shared";

/**
 * Resolves active clinic from X-Clinic-Id header when valid; otherwise JWT clinic.
 * Overwrites auth.role with the membership role for that clinic.
 */
export async function tenantMiddleware(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.auth) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const headerClinic = req.headers["x-clinic-id"];
  const clinicId =
    typeof headerClinic === "string" && headerClinic.length > 0
      ? headerClinic
      : req.auth.clinicId;

  const [membership] = await db
    .select()
    .from(userClinicMemberships)
    .where(
      and(
        eq(userClinicMemberships.userId, req.auth.sub),
        eq(userClinicMemberships.clinicId, clinicId)
      )
    )
    .limit(1);

  if (!membership) {
    res.status(403).json({ error: "No access to this clinic" });
    return;
  }

  req.auth = {
    sub: req.auth.sub,
    email: req.auth.email,
    clinicId,
    role: membership.role as UserRole,
  };

  next();
}
