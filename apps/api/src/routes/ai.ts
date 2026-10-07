import { Router } from "express";
import { z } from "zod";
import type { Env } from "../config/env.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { createAuthMiddleware } from "../middleware/auth.js";
import { tenantMiddleware } from "../middleware/tenant.js";

const symptomSchema = z.object({
  symptoms: z.string().min(3).max(2000),
});

/**
 * Gemini calls stay on the server — never expose GOOGLE_API_KEY to the browser.
 * Do not send real PHI until Google Cloud BAA + eligible Gemini product are confirmed.
 */
export function createAiRouter(env: Env): Router {
  const router = Router();
  const auth = createAuthMiddleware(env);

  router.post(
    "/symptom-check",
    auth,
    tenantMiddleware,
    async (req: AuthedRequest, res) => {
      if (!req.auth) return;
      const parsed = symptomSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
      }

      if (!env.GOOGLE_API_KEY) {
        res.status(503).json({
          error: "GOOGLE_API_KEY not configured",
          hint: "Add a Gemini-capable API key to apps/api/.env — see docs/GOOGLE_CLOUD.md",
        });
        return;
      }

      const prompt = [
        "You are a cautious triage assistant for a clinic app.",
        "You are NOT a doctor. Do not diagnose.",
        "Give brief, general educational guidance and when to seek care.",
        "End with: This is not medical advice.",
        "",
        `Patient-described symptoms: ${parsed.data.symptoms}`,
      ].join("\n");

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${encodeURIComponent(env.GOOGLE_API_KEY)}`;
        const gRes = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        });
        const body = (await gRes.json()) as {
          error?: { message?: string };
          candidates?: { content?: { parts?: { text?: string }[] } }[];
        };
        if (!gRes.ok) {
          res.status(502).json({
            error: body.error?.message ?? "Gemini request failed",
          });
          return;
        }
        const text =
          body.candidates?.[0]?.content?.parts
            ?.map((p) => p.text ?? "")
            .join("")
            .trim() ?? "";
        res.json({
          disclaimer: "Not medical advice. For emergencies call local emergency services.",
          advice: text || "No response generated.",
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(502).json({ error: message });
      }
    }
  );

  return router;
}
