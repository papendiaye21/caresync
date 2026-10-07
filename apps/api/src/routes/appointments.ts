import { Router } from "express";
import { eq, and, gte, desc } from "drizzle-orm";
import { db } from "../db/client.js";
import {
  appointments,
  patients,
  userClinicMemberships,
  patientDemographics,
  users,
} from "../db/schema.js";
import type { Env } from "../config/env.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { createAuthMiddleware, requireRole } from "../middleware/auth.js";
import { tenantMiddleware } from "../middleware/tenant.js";
import { appointmentCreateSchema } from "@caresync/shared";
import { writeAudit } from "../services/audit.js";
import { routeParam } from "../util/routeParams.js";
import { queueNotification } from "../services/notifications.js";

export function createAppointmentsRouter(env: Env): Router {
  const router = Router();
  const auth = createAuthMiddleware(env);

  router.use(auth, tenantMiddleware);

  router.get("/", async (req: AuthedRequest, res) => {
    if (!req.auth) return;
    const from = req.query.from
      ? new Date(String(req.query.from))
      : new Date();

    if (req.auth.role === "patient") {
      const [selfPatient] = await db
        .select()
        .from(patients)
        .where(
          and(
            eq(patients.userId, req.auth.sub),
            eq(patients.clinicId, req.auth.clinicId)
          )
        )
        .limit(1);
      if (!selfPatient) {
        res.json({ appointments: [] });
        return;
      }
      const rows = await db
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.clinicId, req.auth.clinicId),
            eq(appointments.patientId, selfPatient.id),
            gte(appointments.startsAt, from)
          )
        )
        .orderBy(desc(appointments.startsAt));
      res.json({ appointments: rows });
      return;
    }

    if (req.auth.role === "clinician") {
      const rows = await db
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.clinicId, req.auth.clinicId),
            eq(appointments.providerUserId, req.auth.sub),
            gte(appointments.startsAt, from)
          )
        )
        .orderBy(desc(appointments.startsAt));
      res.json({ appointments: rows });
      return;
    }

    const rows = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.clinicId, req.auth.clinicId),
          gte(appointments.startsAt, from)
        )
      )
      .orderBy(desc(appointments.startsAt));

    res.json({ appointments: rows });
  });

  router.post("/", async (req: AuthedRequest, res) => {
    if (!req.auth) return;
    const parsed = appointmentCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    if (req.auth.role === "patient") {
      res.status(403).json({ error: "Patients cannot book via this endpoint in MVP" });
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

    const [provMembership] = await db
      .select()
      .from(userClinicMemberships)
      .where(
        and(
          eq(userClinicMemberships.userId, parsed.data.providerUserId),
          eq(userClinicMemberships.clinicId, req.auth.clinicId)
        )
      )
      .limit(1);
    if (!provMembership || provMembership.role !== "clinician") {
      res.status(400).json({ error: "Invalid provider" });
      return;
    }

    const startsAt = new Date(parsed.data.startsAt);
    const endsAt = new Date(parsed.data.endsAt);

    const [appt] = await db
      .insert(appointments)
      .values({
        clinicId: req.auth.clinicId,
        patientId: parsed.data.patientId,
        providerUserId: parsed.data.providerUserId,
        startsAt,
        endsAt,
        notes: parsed.data.notes,
        status: "scheduled",
      })
      .returning();

    await writeAudit({
      clinicId: req.auth.clinicId,
      userId: req.auth.sub,
      action: "appointment.create",
      entityType: "appointment",
      entityId: appt.id,
    });

    const [demo] = await db
      .select()
      .from(patientDemographics)
      .where(eq(patientDemographics.patientId, p.id))
      .limit(1);

    const reminderAt = new Date(startsAt.getTime() - 24 * 60 * 60 * 1000);

    if (demo?.phone) {
      await queueNotification(env, {
        clinicId: req.auth.clinicId,
        channel: "sms",
        templateKey: "appointment_reminder",
        payload: {
          to: demo.phone,
          body: `Reminder: you have an appointment on ${startsAt.toISOString()}.`,
        },
        runAt: reminderAt > new Date() ? reminderAt : new Date(),
        idempotencyKey: `appt-${appt.id}-reminder-24h-sms`,
      });
    }

    if (p.userId) {
      const [u] = await db
        .select()
        .from(users)
        .where(eq(users.id, p.userId))
        .limit(1);
      if (u?.email) {
        await queueNotification(env, {
          clinicId: req.auth.clinicId,
          channel: "email",
          templateKey: "appointment_booked",
          payload: {
            to: u.email,
            body: `Appointment booked for ${startsAt.toISOString()}.`,
          },
          runAt: new Date(),
          idempotencyKey: `appt-${appt.id}-confirm-email`,
        });
      }
    }

    res.status(201).json({ appointment: appt });
  });

  router.patch(
    "/:id/cancel",
    requireRole("admin", "clinician", "staff"),
    async (req: AuthedRequest, res) => {
      if (!req.auth) return;
      const apptId = routeParam(req.params.id);
      if (!apptId) {
        res.status(400).json({ error: "Invalid id" });
        return;
      }
      const [row] = await db
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.id, apptId),
            eq(appointments.clinicId, req.auth.clinicId)
          )
        )
        .limit(1);
      if (!row) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      await db
        .update(appointments)
        .set({ status: "cancelled" })
        .where(eq(appointments.id, row.id));

      await writeAudit({
        clinicId: req.auth.clinicId,
        userId: req.auth.sub,
        action: "appointment.cancel",
        entityType: "appointment",
        entityId: row.id,
      });

      res.json({ ok: true });
    }
  );

  return router;
}
