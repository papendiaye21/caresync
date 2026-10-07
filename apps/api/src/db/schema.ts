import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  pgEnum,
  varchar,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "clinician",
  "staff",
  "patient",
]);

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "scheduled",
  "completed",
  "cancelled",
  "no_show",
]);

export const prescriptionStatusEnum = pgEnum("prescription_status", [
  "draft",
  "sent",
  "filled",
  "cancelled",
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "email",
  "sms",
]);

export const notificationJobStatusEnum = pgEnum("notification_job_status", [
  "pending",
  "sent",
  "failed",
]);

export const clinics = pgTable("clinics", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 320 }).notNull(),
    passwordHash: text("password_hash"),
    oauthProvider: varchar("oauth_provider", { length: 32 }),
    oauthSubject: varchar("oauth_subject", { length: 255 }),
    firstName: varchar("first_name", { length: 120 }).notNull(),
    lastName: varchar("last_name", { length: 120 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    emailUnique: uniqueIndex("users_email_unique").on(t.email),
    oauthUnique: uniqueIndex("users_oauth_unique").on(
      t.oauthProvider,
      t.oauthSubject
    ),
  })
);

export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const userClinicMemberships = pgTable(
  "user_clinic_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    clinicId: uuid("clinic_id")
      .references(() => clinics.id, { onDelete: "cascade" })
      .notNull(),
    role: userRoleEnum("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userClinicUnique: uniqueIndex("ucm_user_clinic_unique").on(
      t.userId,
      t.clinicId
    ),
  })
);

export const patients = pgTable(
  "patients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clinicId: uuid("clinic_id")
      .references(() => clinics.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    mrn: varchar("mrn", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    clinicMrnIdx: index("patients_clinic_mrn_idx").on(t.clinicId, t.mrn),
  })
);

export const patientDemographics = pgTable("patient_demographics", {
  patientId: uuid("patient_id")
    .primaryKey()
    .references(() => patients.id, { onDelete: "cascade" }),
  dob: varchar("dob", { length: 32 }),
  sex: varchar("sex", { length: 16 }),
  phone: varchar("phone", { length: 32 }),
  addressLine1: varchar("address_line1", { length: 255 }),
  city: varchar("city", { length: 120 }),
  region: varchar("region", { length: 120 }),
  postalCode: varchar("postal_code", { length: 32 }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const allergies = pgTable("allergies", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id")
    .references(() => patients.id, { onDelete: "cascade" })
    .notNull(),
  substance: varchar("substance", { length: 255 }).notNull(),
  reaction: text("reaction"),
  severity: varchar("severity", { length: 32 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const conditions = pgTable("conditions", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id")
    .references(() => patients.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  icd10: varchar("icd10", { length: 16 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicId: uuid("clinic_id")
    .references(() => clinics.id, { onDelete: "cascade" })
    .notNull(),
  patientId: uuid("patient_id")
    .references(() => patients.id, { onDelete: "cascade" })
    .notNull(),
  providerUserId: uuid("provider_user_id")
    .references(() => users.id, { onDelete: "restrict" })
    .notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  status: appointmentStatusEnum("status").notNull().default("scheduled"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const waitlistEntries = pgTable("waitlist_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicId: uuid("clinic_id")
    .references(() => clinics.id, { onDelete: "cascade" })
    .notNull(),
  patientId: uuid("patient_id")
    .references(() => patients.id, { onDelete: "cascade" })
    .notNull(),
  providerUserId: uuid("provider_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const encounters = pgTable("encounters", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicId: uuid("clinic_id")
    .references(() => clinics.id, { onDelete: "cascade" })
    .notNull(),
  patientId: uuid("patient_id")
    .references(() => patients.id, { onDelete: "cascade" })
    .notNull(),
  appointmentId: uuid("appointment_id").references(() => appointments.id, {
    onDelete: "set null",
  }),
  providerUserId: uuid("provider_user_id")
    .references(() => users.id, { onDelete: "restrict" })
    .notNull(),
  startedAt: timestamp("started_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const clinicalNotes = pgTable("clinical_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  encounterId: uuid("encounter_id")
    .references(() => encounters.id, { onDelete: "cascade" })
    .notNull(),
  content: text("content").notNull(),
  structured: jsonb("structured").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const prescriptions = pgTable("prescriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicId: uuid("clinic_id")
    .references(() => clinics.id, { onDelete: "cascade" })
    .notNull(),
  patientId: uuid("patient_id")
    .references(() => patients.id, { onDelete: "cascade" })
    .notNull(),
  encounterId: uuid("encounter_id").references(() => encounters.id, {
    onDelete: "set null",
  }),
  prescriberUserId: uuid("prescriber_user_id")
    .references(() => users.id, { onDelete: "restrict" })
    .notNull(),
  verificationCode: varchar("verification_code", { length: 32 }).notNull(),
  status: prescriptionStatusEnum("status").notNull().default("sent"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const prescriptionItems = pgTable("prescription_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  prescriptionId: uuid("prescription_id")
    .references(() => prescriptions.id, { onDelete: "cascade" })
    .notNull(),
  drugName: varchar("drug_name", { length: 255 }).notNull(),
  dose: varchar("dose", { length: 120 }),
  frequency: varchar("frequency", { length: 120 }),
  duration: varchar("duration", { length: 120 }),
  instructions: text("instructions"),
});

export const pharmacyLinks = pgTable("pharmacy_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  prescriptionId: uuid("prescription_id")
    .references(() => prescriptions.id, { onDelete: "cascade" })
    .notNull(),
  pharmacyName: varchar("pharmacy_name", { length: 255 }),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
});

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clinicId: uuid("clinic_id").references(() => clinics.id, {
      onDelete: "set null",
    }),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: varchar("action", { length: 64 }).notNull(),
    entityType: varchar("entity_type", { length: 64 }).notNull(),
    entityId: uuid("entity_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    clinicCreatedIdx: index("audit_clinic_created_idx").on(
      t.clinicId,
      t.createdAt
    ),
  })
);

export const notificationJobs = pgTable(
  "notification_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clinicId: uuid("clinic_id")
      .references(() => clinics.id, { onDelete: "cascade" })
      .notNull(),
    channel: notificationChannelEnum("channel").notNull(),
    templateKey: varchar("template_key", { length: 64 }).notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    runAt: timestamp("run_at", { withTimezone: true }).notNull(),
    status: notificationJobStatusEnum("status").notNull().default("pending"),
    idempotencyKey: varchar("idempotency_key", { length: 128 }).notNull(),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    idemUnique: uniqueIndex("notification_jobs_idem_unique").on(
      t.idempotencyKey
    ),
    runIdx: index("notification_jobs_run_idx").on(t.status, t.runAt),
  })
);
