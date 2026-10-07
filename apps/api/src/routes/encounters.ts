import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client.js";
import {
  encounters,
  clinicalNotes,
  patients,
  appointments,
} from "../db/schema.js";
import type { Env } from "../config/env.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { createAuthMiddleware, requireRole } from "../middleware/auth.js";
import { tenantMiddleware } from "../middleware/tenant.js";
import { encounterCreateSchema } from "@caresync/shared";
import { writeAudit } from "../services/audit.js";
import { routeParam } from "../util/routeParams.js";

export function createEncountersRouter(env: Env): Router {
  const router = Router();
  const auth = createAuthMiddleware(env);

  router.use(auth, tenantMiddleware);

  router.post("/", requireRole("admin", "clinician"), async (req: AuthedRequest, res) => {
    if (!req.auth) return;
    const parsed = encounterCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const [p] = await db
      .select()
      .from(patients)
      .where(
        and(
          eq(patients.id, parsed.data.patientId),
          eq(patients.clinicId, req.auth.clinicId)
        )
      )
      .limit(1);

    if (!p) {
      res.status(404).json({ error: "Patient not found" });
      return;
    }

    if (parsed.data.appointmentId) {
      const [ap] = await db
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.id, parsed.data.appointmentId),
            eq(appointments.clinicId, req.auth.clinicId)
          )
        )
        .limit(1);
      if (!ap) {
        res.status(400).json({ error: "Appointment not found" });
        return;
      }
    }

    const [enc] = await db
      .insert(encounters)
      .values({
        clinicId: req.auth.clinicId,
        patientId: parsed.data.patientId,
        appointmentId: parsed.data.appointmentId ?? null,
        providerUserId: req.auth.sub,
      })
      .returning();

    const [note] = await db
      .insert(clinicalNotes)
      .values({
        encounterId: enc.id,
        content: parsed.data.noteContent,
        structured: parsed.data.structured ?? {},
      })
      .returning();

    await writeAudit({
      clinicId: req.auth.clinicId,
      userId: req.auth.sub,
      action: "encounter.create",
      entityType: "encounter",
      entityId: enc.id,
    });

    res.status(201).json({ encounter: enc, note });
  });

  router.get("/:id", async (req: AuthedRequest, res) => {
    if (!req.auth) return;

    const encId = routeParam(req.params.id);
    if (!encId) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const [enc] = await db
      .select()
      .from(encounters)
      .where(
        and(
          eq(encounters.id, encId),
          eq(encounters.clinicId, req.auth.clinicId)
        )
      )
      .limit(1);

    if (!enc) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    if (req.auth.role === "patient") {
      const [p] = await db
        .select()
        .from(patients)
        .where(eq(patients.id, enc.patientId))
        .limit(1);
      if (!p || p.userId !== req.auth.sub) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
    }

    const notes = await db
      .select()
      .from(clinicalNotes)
      .where(eq(clinicalNotes.encounterId, enc.id));

    await writeAudit({
      clinicId: req.auth.clinicId,
      userId: req.auth.sub,
      action: "encounter.read",
      entityType: "encounter",
      entityId: enc.id,
    });

    res.json({ encounter: enc, notes });
  });

  return router;
}
