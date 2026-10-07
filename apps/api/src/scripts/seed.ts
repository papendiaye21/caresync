import "../loadEnv.js";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import {
  clinics,
  users,
  userClinicMemberships,
  patients,
  patientDemographics,
} from "../db/schema.js";
import { hashPassword } from "../services/password.js";

async function main(): Promise<void> {
  const adminEmail =
    process.env.SEED_ADMIN_EMAIL ?? "admin@demo-clinic.local";
  const clinicianEmail =
    process.env.SEED_CLINICIAN_EMAIL ?? "dr.jones@demo-clinic.local";
  const patientEmail =
    process.env.SEED_PATIENT_EMAIL ?? "patient@demo-clinic.local";
  const password = process.env.SEED_PASSWORD ?? "ChangeMe123!";

  const [existingClinic] = await db
    .select()
    .from(clinics)
    .where(eq(clinics.slug, "demo-clinic"))
    .limit(1);

  let clinicId: string;
  if (existingClinic) {
    clinicId = existingClinic.id;
    console.log("Using existing demo clinic:", clinicId);
  } else {
    const [c] = await db
      .insert(clinics)
      .values({ name: "Caresync Demo", slug: "demo-clinic" })
      .returning();
    clinicId = c.id;
    console.log("Created demo clinic:", clinicId);
  }

  async function ensureUser(
    email: string,
    role: "admin" | "clinician",
    firstName: string,
    lastName: string
  ): Promise<void> {
    const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (u) {
      console.log("User exists:", email);
      const [existingMember] = await db
        .select()
        .from(userClinicMemberships)
        .where(
          and(
            eq(userClinicMemberships.userId, u.id),
            eq(userClinicMemberships.clinicId, clinicId)
          )
        )
        .limit(1);
      if (!existingMember) {
        await db.insert(userClinicMemberships).values({
          userId: u.id,
          clinicId,
          role,
        });
      }
      return;
    }
    const hash = await hashPassword(password);
    const [created] = await db
      .insert(users)
      .values({
        email,
        passwordHash: hash,
        firstName,
        lastName,
      })
      .returning();
    await db.insert(userClinicMemberships).values({
      userId: created.id,
      clinicId,
      role,
    });
    console.log("Created user:", email, role);
  }

  await ensureUser(adminEmail, "admin", "Ada", "Admin");
  await ensureUser(clinicianEmail, "clinician", "Jamie", "Jones");

  async function ensurePortalPatient(): Promise<void> {
    const [u] = await db
      .select()
      .from(users)
      .where(eq(users.email, patientEmail))
      .limit(1);
    if (u) {
      const [member] = await db
        .select()
        .from(userClinicMemberships)
        .where(
          and(
            eq(userClinicMemberships.userId, u.id),
            eq(userClinicMemberships.clinicId, clinicId)
          )
        )
        .limit(1);
      if (!member) {
        await db.insert(userClinicMemberships).values({
          userId: u.id,
          clinicId,
          role: "patient",
        });
      }
      const [pRow] = await db
        .select()
        .from(patients)
        .where(
          and(eq(patients.userId, u.id), eq(patients.clinicId, clinicId))
        )
        .limit(1);
      if (!pRow) {
        const [p] = await db
          .insert(patients)
          .values({ clinicId, userId: u.id, mrn: "MRN-PAT-1" })
          .returning();
        await db.insert(patientDemographics).values({
          patientId: p.id,
          dob: "1992-01-20",
          sex: "male",
          phone: "+15555550999",
          city: "Oakland",
          region: "CA",
        });
        console.log("Linked patient portal row for existing user:", u.email);
      }
      return;
    }

    const hash = await hashPassword(password);
    const [created] = await db
      .insert(users)
      .values({
        email: patientEmail,
        passwordHash: hash,
        firstName: "Pat",
        lastName: "Patient",
      })
      .returning();
    await db.insert(userClinicMemberships).values({
      userId: created.id,
      clinicId,
      role: "patient",
    });
    const [p] = await db
      .insert(patients)
      .values({ clinicId, userId: created.id, mrn: "MRN-PAT-1" })
      .returning();
    await db.insert(patientDemographics).values({
      patientId: p.id,
      dob: "1992-01-20",
      sex: "male",
      phone: "+15555550999",
      city: "Oakland",
      region: "CA",
    });
    console.log("Created portal patient:", patientEmail);
  }

  await ensurePortalPatient();

  const [samplePatient] = await db
    .select()
    .from(patients)
    .where(eq(patients.clinicId, clinicId))
    .limit(5);

  if (!samplePatient) {
    const [p] = await db
      .insert(patients)
      .values({ clinicId, mrn: "MRN-10001" })
      .returning();
    await db.insert(patientDemographics).values({
      patientId: p.id,
      dob: "1988-04-12",
      sex: "female",
      phone: "+15555550123",
      city: "San Francisco",
      region: "CA",
    });
    console.log("Created sample patient:", p.id);
  }

  console.log("Seed complete. Default password:", password);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
