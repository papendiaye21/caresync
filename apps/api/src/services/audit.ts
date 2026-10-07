import { db } from "../db/client.js";
import { auditLogs } from "../db/schema.js";

export async function writeAudit(input: {
  clinicId?: string | null;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await db.insert(auditLogs).values({
    clinicId: input.clinicId ?? null,
    userId: input.userId ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    metadata: input.metadata ?? {},
  });
}
