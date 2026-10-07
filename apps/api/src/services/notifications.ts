import sgMail from "@sendgrid/mail";
import Twilio from "twilio";
import { eq, and, lte } from "drizzle-orm";
import { db } from "../db/client.js";
import { notificationJobs } from "../db/schema.js";
import type { Env } from "../config/env.js";

export async function queueNotification(
  env: Env,
  input: {
    clinicId: string;
    channel: "email" | "sms";
    templateKey: string;
    payload: Record<string, unknown>;
    runAt: Date;
    idempotencyKey: string;
  }
): Promise<void> {
  try {
    await db.insert(notificationJobs).values({
      clinicId: input.clinicId,
      channel: input.channel,
      templateKey: input.templateKey,
      payload: input.payload,
      runAt: input.runAt,
      idempotencyKey: input.idempotencyKey,
      status: "pending",
    });
  } catch (err: unknown) {
    const code =
      typeof err === "object" && err !== null && "code" in err
        ? String((err as { code?: string }).code)
        : "";
    if (code === "23505") {
      return;
    }
    throw err;
  }

  if (input.runAt.getTime() <= Date.now() + 1000) {
    await processDueJobs(env);
  }
}

export async function processDueJobs(env: Env): Promise<number> {
  const now = new Date();
  const due = await db
    .select()
    .from(notificationJobs)
    .where(
      and(
        eq(notificationJobs.status, "pending"),
        lte(notificationJobs.runAt, now)
      )
    )
    .limit(50);

  let processed = 0;
  for (const job of due) {
    try {
      if (job.channel === "email") {
        await sendEmail(env, job.templateKey, job.payload);
      } else {
        await sendSms(env, job.templateKey, job.payload);
      }
      await db
        .update(notificationJobs)
        .set({ status: "sent", lastError: null })
        .where(eq(notificationJobs.id, job.id));
      processed += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await db
        .update(notificationJobs)
        .set({ status: "failed", lastError: message })
        .where(eq(notificationJobs.id, job.id));
    }
  }
  return processed;
}

async function sendEmail(
  env: Env,
  templateKey: string,
  payload: Record<string, unknown>
): Promise<void> {
  if (!env.SENDGRID_API_KEY || !env.SENDGRID_FROM_EMAIL) {
    console.warn(
      "[notifications] Email skipped: SENDGRID_API_KEY / SENDGRID_FROM_EMAIL not set",
      { templateKey }
    );
    return;
  }
  sgMail.setApiKey(env.SENDGRID_API_KEY);
  const to = String(payload.to ?? "");
  const subject =
    templateKey === "appointment_reminder"
      ? "Appointment reminder"
      : templateKey === "appointment_booked"
        ? "Appointment confirmed"
        : "Caresync notification";
  const text =
    typeof payload.body === "string"
      ? payload.body
      : JSON.stringify(payload, null, 2);
  await sgMail.send({
    to,
    from: env.SENDGRID_FROM_EMAIL,
    subject,
    text,
  });
}

async function sendSms(
  env: Env,
  templateKey: string,
  payload: Record<string, unknown>
): Promise<void> {
  if (
    !env.TWILIO_ACCOUNT_SID ||
    !env.TWILIO_AUTH_TOKEN ||
    !env.TWILIO_FROM_NUMBER
  ) {
    console.warn(
      "[notifications] SMS skipped: Twilio env not configured",
      { templateKey }
    );
    return;
  }
  const client = Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  const to = String(payload.to ?? "");
  const body =
    typeof payload.body === "string"
      ? payload.body
      : JSON.stringify(payload);
  await client.messages.create({
    from: env.TWILIO_FROM_NUMBER,
    to,
    body,
  });
}
