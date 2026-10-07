import { Router } from "express";
import { z } from "zod";
import type { Env } from "../config/env.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { createAuthMiddleware, requireRole } from "../middleware/auth.js";
import { tenantMiddleware } from "../middleware/tenant.js";
import { getPresignedPutUrl } from "../services/s3.js";
import { randomUUID } from "crypto";

const presignSchema = z.object({
  contentType: z.string().min(3),
  prefix: z.enum(["attachments", "labs", "rx-pdfs"]).default("attachments"),
});

export function createUploadsRouter(env: Env): Router {
  const router = Router();
  const auth = createAuthMiddleware(env);

  router.post(
    "/presign",
    auth,
    tenantMiddleware,
    requireRole("admin", "clinician", "staff"),
    async (req: AuthedRequest, res) => {
      if (!req.auth) return;
      const parsed = presignSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
      }

      const key = `${parsed.data.prefix}/${req.auth.clinicId}/${randomUUID()}`;
      const signed = await getPresignedPutUrl(env, {
        key,
        contentType: parsed.data.contentType,
      });

      if (!signed) {
        res.status(503).json({
          error: "S3 not configured",
          hint: "Set AWS_REGION, AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY",
        });
        return;
      }

      res.json({ uploadUrl: signed.url, key, bucket: signed.bucket });
    }
  );

  return router;
}
