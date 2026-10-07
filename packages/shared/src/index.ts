import { z } from "zod";

export const UserRole = z.enum(["admin", "clinician", "staff", "patient"]);
export type UserRole = z.infer<typeof UserRole>;

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  clinicId: z.string().uuid().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createPatientSchema = z.object({
  mrn: z.string().min(1).optional(),
  demographics: z
    .object({
      dob: z.string().optional(),
      sex: z.enum(["male", "female", "other", "unknown"]).optional(),
      phone: z.string().optional(),
      addressLine1: z.string().optional(),
      city: z.string().optional(),
      region: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
});

export const allergySchema = z.object({
  substance: z.string().min(1),
  reaction: z.string().optional(),
  severity: z.enum(["mild", "moderate", "severe", "unknown"]).optional(),
});

export const conditionSchema = z.object({
  name: z.string().min(1),
  icd10: z.string().optional(),
});

export const appointmentCreateSchema = z.object({
  patientId: z.string().uuid(),
  providerUserId: z.string().uuid(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  notes: z.string().optional(),
});

export const encounterCreateSchema = z.object({
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  noteContent: z.string().min(1),
  structured: z.record(z.unknown()).optional(),
});

export const prescriptionCreateSchema = z.object({
  patientId: z.string().uuid(),
  encounterId: z.string().uuid().optional(),
  pharmacyName: z.string().optional(),
  items: z
    .array(
      z.object({
        drugName: z.string().min(1),
        dose: z.string().optional(),
        frequency: z.string().optional(),
        duration: z.string().optional(),
        instructions: z.string().optional(),
      })
    )
    .min(1),
});
