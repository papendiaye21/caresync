import { Router } from "express";
import { z } from "zod";
import type { Env } from "../config/env.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { createAuthMiddleware } from "../middleware/auth.js";
import { tenantMiddleware } from "../middleware/tenant.js";

const geocodeSchema = z.object({
  address: z.string().min(3).max(500),
});

/**
 * Server-side Maps Geocoding so the API key is not exposed in the browser.
 * Enable "Geocoding API" (and optionally Places) in Google Cloud Console.
 */
export function createMapsRouter(env: Env): Router {
  const router = Router();
  const auth = createAuthMiddleware(env);

  router.post(
    "/geocode",
    auth,
    tenantMiddleware,
    async (req: AuthedRequest, res) => {
      if (!req.auth) return;
      const parsed = geocodeSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
      }

      if (!env.GOOGLE_API_KEY) {
        res.status(503).json({
          error: "GOOGLE_API_KEY not configured",
          hint: "Add a Maps-restricted API key to apps/api/.env — see docs/GOOGLE_CLOUD.md",
        });
        return;
      }

      try {
        const url = new URL(
          "https://maps.googleapis.com/maps/api/geocode/json"
        );
        url.searchParams.set("address", parsed.data.address);
        url.searchParams.set("key", env.GOOGLE_API_KEY);

        const gRes = await fetch(url);
        const body = (await gRes.json()) as {
          status: string;
          error_message?: string;
          results?: {
            formatted_address?: string;
            geometry?: { location?: { lat: number; lng: number } };
          }[];
        };

        if (body.status !== "OK" && body.status !== "ZERO_RESULTS") {
          res.status(502).json({
            error: body.error_message ?? body.status,
          });
          return;
        }

        res.json({
          status: body.status,
          results: (body.results ?? []).slice(0, 5).map((r) => ({
            formattedAddress: r.formatted_address,
            lat: r.geometry?.location?.lat,
            lng: r.geometry?.location?.lng,
          })),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(502).json({ error: message });
      }
    }
  );

  return router;
}
