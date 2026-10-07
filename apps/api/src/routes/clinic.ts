import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { clinics, userClinicMemberships, users } from "../db/schema.js";
import type { Env } from "../config/env.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { createAuthMiddleware } from "../middleware/auth.js";
import { tenantMiddleware } from "../middleware/tenant.js";

export function createClinicRouter(env: Env): Router {
  const router = Router();
  const auth = createAuthMiddleware(env);

  router.use(auth, tenantMiddleware);

  router.get("/me", async (req: AuthedRequest, res) => {
    if (!req.auth) return;
    const [c] = await db
      .select()
      .from(clinics)
      .where(eq(clinics.id, req.auth.clinicId))
      .limit(1);
    if (!c) {
      res.status(404).json({ error: "Clinic not found" });
      return;
    }
    res.json({ clinic: c });
  });

  router.get("/team", async (req: AuthedRequest, res) => {
    if (!req.auth) return;
    const memberships = await db
      .select({
        userId: userClinicMemberships.userId,
        role: userClinicMemberships.role,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(userClinicMemberships)
      .innerJoin(users, eq(users.id, userClinicMemberships.userId))
      .where(eq(userClinicMemberships.clinicId, req.auth.clinicId));

    res.json({ members: memberships });
  });

  return router;
}
