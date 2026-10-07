import { Router } from "express";
import { eq, and, desc, isNull } from "drizzle-orm";
import { db } from "../db/client.js";
import {
  patients,
  patientDemographics,
  allergies,
  conditions,
  encounters,
  appointments,
} from "../db/schema.js";
import type { Env } from "../config/env.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { createAuthMiddleware } from "../middleware/auth.js";
import { tenantMiddleware } from "../middleware/tenant.js";
import { requireRole } from "../middleware/auth.js";
import {
  createPatientSchema,
  allergySchema,
  conditionSchema,
} from "@caresync/shared";
import { writeAudit } from "../services/audit.js";
import { routeParam } from "../util/routeParams.js";

export function createPatientsRouter(env: Env): Router {
  const router = Router();
  const auth = createAuthMiddleware(env);

  router.use(auth, tenantMiddleware);

  router.get("/", requireRole("admin", "clinician", "staff"), async (req: AuthedRequest, res) => {
    if (!req.auth) return;
    const rows = await db
      .select()
      .from(patients)
      .where(
        and(
          eq(patients.clinicId, req.auth.clinicId),
          isNull(patients.deletedAt)
        )
      )
      .orderBy(desc(patients.createdAt));

    res.json({ patients: rows });
  });

  router.post(
    "/",
    requireRole("admin", "clinician", "staff"),
    async (req: AuthedRequest, res) => {
      if (!req.auth) return;
      const parsed = createPatientSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
      }

      const [p] = await db
        .insert(patients)
        .values({
          clinicId: req.auth.clinicId,
          mrn: parsed.data.mrn,
        })
        .returning();

      const d = parsed.data.demographics;
      if (d) {
        await db.insert(patientDemographics).values({
          patientId: p.id,
          dob: d.dob,
          sex: d.sex,
          phone: d.phone,
          addressLine1: d.addressLine1,
          city: d.city,
          region: d.region,
          postalCode: d.postalCode,
        });
      }

      await writeAudit({
        clinicId: req.auth.clinicId,
        userId: req.auth.sub,
        action: "patient.create",
        entityType: "patient",
        entityId: p.id,
      });

      res.status(201).json({ patient: p });
    }
  );

  router.get("/:id", async (req: AuthedRequest, res) => {
    if (!req.auth) return;
    const id = routeParam(req.params.id);
    if (!id) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const [p] = await db
      .select()
      .from(patients)
      .where(
        and(
          eq(patients.id, id),
          eq(patients.clinicId, req.auth.clinicId),
          isNull(patients.deletedAt)
        )
      )
      .limit(1);

    if (!p) {
      res.status(404).json({ error: "Patient not found" });
      return;
    }

    if (req.auth.role === "patient") {
      if (p.userId !== req.auth.sub) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
    }

    const [demo] = await db
      .select()
      .from(patientDemographics)
      .where(eq(patientDemographics.patientId, id))
      .limit(1);

    const alList = await db
      .select()
      .from(allergies)
      .where(eq(allergies.patientId, id));

    const condList = await db
      .select()
      .from(conditions)
      .where(eq(conditions.patientId, id));

    await writeAudit({
      clinicId: req.auth.clinicId,
      userId: req.auth.sub,
      action: "patient.read",
      entityType: "patient",
      entityId: id,
    });

    res.json({
      patient: p,
      demographics: demo ?? null,
      allergies: alList,
      conditions: condList,
    });
  });

  router.post(
    "/:id/allergies",
    requireRole("admin", "clinician", "staff"),
    async (req: AuthedRequest, res) => {
      if (!req.auth) return;
      const patientId = routeParam(req.params.id);
      if (!patientId) {
        res.status(400).json({ error: "Invalid id" });
        return;
      }
      const parsed = allergySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
      }

      const [p] = await db
        .select()
        .from(patients)
        .where(
          and(
            eq(patients.id, patientId),
            eq(patients.clinicId, req.auth.clinicId)
          )
        )
        .limit(1);
      if (!p) {
        res.status(404).json({ error: "Patient not found" });
        return;
      }

      const [row] = await db
        .insert(allergies)
        .values({
          patientId: p.id,
          substance: parsed.data.substance,
          reaction: parsed.data.reaction,
          severity: parsed.data.severity,
        })
        .returning();

      await writeAudit({
        clinicId: req.auth.clinicId,
        userId: req.auth.sub,
        action: "allergy.create",
        entityType: "allergy",
        entityId: row.id,
      });

      res.status(201).json({ allergy: row });
    }
  );

  router.post(
    "/:id/conditions",
    requireRole("admin", "clinician", "staff"),
    async (req: AuthedRequest, res) => {
      if (!req.auth) return;
      const patientId = routeParam(req.params.id);
      if (!patientId) {
        res.status(400).json({ error: "Invalid id" });
        return;
      }
      const parsed = conditionSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
      }

      const [p] = await db
        .select()
        .from(patients)
        .where(
          and(
            eq(patients.id, patientId),
            eq(patients.clinicId, req.auth.clinicId)
          )
        )
        .limit(1);
      if (!p) {
        res.status(404).json({ error: "Patient not found" });
        return;
      }

      const [row] = await db
        .insert(conditions)
        .values({
          patientId: p.id,
          name: parsed.data.name,
          icd10: parsed.data.icd10,
        })
        .returning();

      await writeAudit({
        clinicId: req.auth.clinicId,
        userId: req.auth.sub,
        action: "condition.create",
        entityType: "condition",
        entityId: row.id,
      });

      res.status(201).json({ condition: row });
    }
  );

  router.get("/:id/timeline", async (req: AuthedRequest, res) => {
    if (!req.auth) return;
    const id = routeParam(req.params.id);
    if (!id) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const [p] = await db
      .select()
      .from(patients)
      .where(
        and(
          eq(patients.id, id),
          eq(patients.clinicId, req.auth.clinicId),
          isNull(patients.deletedAt)
        )
      )
      .limit(1);

    if (!p) {
      res.status(404).json({ error: "Patient not found" });
      return;
    }

    if (req.auth.role === "patient" && p.userId !== req.auth.sub) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const appts = await db
      .select()
      .from(appointments)
      .where(eq(appointments.patientId, id))
      .orderBy(desc(appointments.startsAt));

    const enc = await db
      .select()
      .from(encounters)
      .where(eq(encounters.patientId, id))
      .orderBy(desc(encounters.startedAt));

    res.json({ appointments: appts, encounters: enc });
  });

  return router;
}
