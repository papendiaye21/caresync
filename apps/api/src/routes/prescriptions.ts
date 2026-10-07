import { Router } from "express";
import rateLimit from "express-rate-limit";
import { eq, and } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { db } from "../db/client.js";
import {
  prescriptions,
  prescriptionItems,
  pharmacyLinks,
  patients,
  encounters,
} from "../db/schema.js";
import type { Env } from "../config/env.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { createAuthMiddleware, requireRole } from "../middleware/auth.js";
import { tenantMiddleware } from "../middleware/tenant.js";
import { prescriptionCreateSchema } from "@caresync/shared";
import { writeAudit } from "../services/audit.js";
import { routeParam } from "../util/routeParams.js";

const verifyCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 10);

const verifyLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

export function createPrescriptionsRouter(env: Env): Router {
  const router = Router();
  const auth = createAuthMiddleware(env);

  router.post("/verify", verifyLimiter, async (req, res) => {
    const code = typeof req.body?.code === "string" ? req.body.code : "";
    if (!code) {
      res.status(400).json({ error: "code required" });
      return;
    }

    const [rx] = await db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.verificationCode, code.trim()))
      .limit(1);

    if (!rx) {
      res.status(404).json({ error: "Invalid code" });
      return;
    }

    const items = await db
      .select()
      .from(prescriptionItems)
      .where(eq(prescriptionItems.prescriptionId, rx.id));

    res.json({
      valid: true,
      clinicId: rx.clinicId,
      prescriptionId: rx.id,
      items,
    });
  });

  router.use(auth, tenantMiddleware);

  router.post(
    "/",
    requireRole("admin", "clinician"),
    async (req: AuthedRequest, res) => {
      if (!req.auth) return;
      const parsed = prescriptionCreateSchema.safeParse(req.body);
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

      if (parsed.data.encounterId) {
        const [e] = await db
          .select()
          .from(encounters)
          .where(
            and(
              eq(encounters.id, parsed.data.encounterId),
              eq(encounters.clinicId, req.auth.clinicId)
            )
          )
          .limit(1);
        if (!e) {
          res.status(400).json({ error: "Encounter not found" });
          return;
        }
      }

      const code = verifyCode();

      const [rx] = await db
        .insert(prescriptions)
        .values({
          clinicId: req.auth.clinicId,
          patientId: parsed.data.patientId,
          encounterId: parsed.data.encounterId ?? null,
          prescriberUserId: req.auth.sub,
          verificationCode: code,
          status: "sent",
        })
        .returning();

      for (const item of parsed.data.items) {
        await db.insert(prescriptionItems).values({
          prescriptionId: rx.id,
          drugName: item.drugName,
          dose: item.dose,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.instructions,
        });
      }

      await db.insert(pharmacyLinks).values({
        prescriptionId: rx.id,
        pharmacyName: parsed.data.pharmacyName ?? null,
        metadata: { stub: true, message: "Pharmacy webhook placeholder" },
      });

      await writeAudit({
        clinicId: req.auth.clinicId,
        userId: req.auth.sub,
        action: "prescription.create",
        entityType: "prescription",
        entityId: rx.id,
      });

      res.status(201).json({
        prescription: rx,
        verificationCode: code,
      });
    }
  );

  router.get("/:id", async (req: AuthedRequest, res) => {
    if (!req.auth) return;

    const rxId = routeParam(req.params.id);
    if (!rxId) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const [rx] = await db
      .select()
      .from(prescriptions)
      .where(
        and(
          eq(prescriptions.id, rxId),
          eq(prescriptions.clinicId, req.auth.clinicId)
        )
      )
      .limit(1);

    if (!rx) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    if (req.auth.role === "patient") {
      const [p] = await db
        .select()
        .from(patients)
        .where(eq(patients.id, rx.patientId))
        .limit(1);
      if (!p || p.userId !== req.auth.sub) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
    }

    const items = await db
      .select()
      .from(prescriptionItems)
      .where(eq(prescriptionItems.prescriptionId, rx.id));

    const [link] = await db
      .select()
      .from(pharmacyLinks)
      .where(eq(pharmacyLinks.prescriptionId, rx.id))
      .limit(1);

    res.json({ prescription: rx, items, pharmacyLink: link ?? null });
  });

  return router;
}
