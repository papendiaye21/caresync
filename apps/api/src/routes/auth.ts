import { Router } from "express";
import type { Env } from "../config/env.js";
import { db } from "../db/client.js";
import {
  users,
  refreshTokens,
  userClinicMemberships,
  clinics,
  patients,
} from "../db/schema.js";
import { eq, and, or } from "drizzle-orm";
import {
  registerSchema,
  loginSchema,
} from "@caresync/shared";
import { hashPassword, verifyPassword } from "../services/password.js";
import {
  signAccessToken,
  randomRefreshToken,
  hashRefreshToken,
} from "../services/jwt.js";
import { writeAudit } from "../services/audit.js";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Request } from "express";
import type { UserRole } from "@caresync/shared";
import type { AuthedRequest } from "../middleware/auth.js";
import { createAuthMiddleware } from "../middleware/auth.js";

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

export function createAuthRouter(env: Env): Router {
  const router = Router();
  const auth = createAuthMiddleware(env);

  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CALLBACK_URL) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          callbackURL: env.GOOGLE_CALLBACK_URL,
        },
        (_accessToken, _refreshToken, profile, done) => {
          done(null, profile);
        }
      )
    );
  }

  router.post("/register", async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const { email, password, firstName, lastName, clinicId: bodyClinicId } =
      parsed.data;

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await hashPassword(password);

    let clinicId = bodyClinicId;
    if (!clinicId) {
      const [c] = await db
        .select()
        .from(clinics)
        .where(eq(clinics.slug, "demo-clinic"))
        .limit(1);
      if (!c) {
        res.status(400).json({
          error:
            "No clinic specified and demo clinic not seeded. Run db:seed or pass clinicId.",
        });
        return;
      }
      clinicId = c.id;
    }

    const [user] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
      })
      .returning();

    await db.insert(userClinicMemberships).values({
      userId: user.id,
      clinicId,
      role: "patient",
    });

    await db.insert(patients).values({
      clinicId,
      userId: user.id,
    });

    await writeAudit({
      clinicId,
      userId: user.id,
      action: "user.register",
      entityType: "user",
      entityId: user.id,
    });

    const membership = {
      userId: user.id,
      clinicId,
      role: "patient" as UserRole,
    };

    const accessToken = signAccessToken(env, {
      sub: user.id,
      email: user.email,
      clinicId: membership.clinicId,
      role: membership.role,
    });

    const rawRefresh = randomRefreshToken();
    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: hashRefreshToken(rawRefresh),
      expiresAt: daysFromNow(env.JWT_REFRESH_EXPIRES_DAYS),
    });

    res.status(201).json({
      accessToken,
      refreshToken: rawRefresh,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        clinicId: membership.clinicId,
        role: membership.role,
      },
    });
  });

  router.post("/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const { email, password } = parsed.data;
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    if (!user?.passwordHash) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const memberships = await db
      .select()
      .from(userClinicMemberships)
      .where(eq(userClinicMemberships.userId, user.id));

    if (memberships.length === 0) {
      res.status(403).json({ error: "No clinic membership" });
      return;
    }

    const primary = memberships[0];
    const accessToken = signAccessToken(env, {
      sub: user.id,
      email: user.email,
      clinicId: primary.clinicId,
      role: primary.role as UserRole,
    });

    const rawRefresh = randomRefreshToken();
    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: hashRefreshToken(rawRefresh),
      expiresAt: daysFromNow(env.JWT_REFRESH_EXPIRES_DAYS),
    });

    await writeAudit({
      clinicId: primary.clinicId,
      userId: user.id,
      action: "user.login",
      entityType: "user",
      entityId: user.id,
    });

    res.json({
      accessToken,
      refreshToken: rawRefresh,
      memberships: memberships.map((m) => ({
        clinicId: m.clinicId,
        role: m.role,
      })),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        clinicId: primary.clinicId,
        role: primary.role,
      },
    });
  });

  router.post("/refresh", async (req, res) => {
    const raw =
      typeof req.body?.refreshToken === "string"
        ? req.body.refreshToken
        : null;
    if (!raw) {
      res.status(400).json({ error: "refreshToken required" });
      return;
    }
    const hash = hashRefreshToken(raw);
    const [row] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, hash))
      .limit(1);
    if (!row || row.expiresAt < new Date()) {
      res.status(401).json({ error: "Invalid refresh token" });
      return;
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, row.userId))
      .limit(1);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const memberships = await db
      .select()
      .from(userClinicMemberships)
      .where(eq(userClinicMemberships.userId, user.id));

    if (memberships.length === 0) {
      res.status(403).json({ error: "No clinic membership" });
      return;
    }

    const clinicHeader = req.headers["x-clinic-id"];
    const clinicId =
      typeof clinicHeader === "string" && clinicHeader.length > 0
        ? clinicHeader
        : memberships[0].clinicId;

    const membership =
      memberships.find((m) => m.clinicId === clinicId) ?? memberships[0];

    const accessToken = signAccessToken(env, {
      sub: user.id,
      email: user.email,
      clinicId: membership.clinicId,
      role: membership.role as UserRole,
    });

    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        clinicId: membership.clinicId,
        role: membership.role,
      },
    });
  });

  router.get("/me", auth, (req: AuthedRequest, res) => {
    res.json({ auth: req.auth });
  });

  const googleReady =
    Boolean(env.GOOGLE_CLIENT_ID) &&
    Boolean(env.GOOGLE_CLIENT_SECRET) &&
    Boolean(env.GOOGLE_CALLBACK_URL);

  if (googleReady) {
    router.get(
      "/google",
      passport.authenticate("google", {
        scope: ["profile", "email"],
        session: false,
      })
    );

    router.get(
      "/google/callback",
      passport.authenticate("google", {
        session: false,
        failureRedirect: `${env.WEB_ORIGIN}/login?error=oauth`,
      }),
      async (req: Request, res) => {
        const profile = req.user as {
          id: string;
          name?: { givenName?: string; familyName?: string };
          emails?: { value: string }[];
        };
        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (!email) {
          res.redirect(`${env.WEB_ORIGIN}/login?error=no_email`);
          return;
        }

        const [existing] = await db
          .select()
          .from(users)
          .where(
            or(
              eq(users.email, email),
              and(
                eq(users.oauthProvider, "google"),
                eq(users.oauthSubject, profile.id)
              )
            )
          )
          .limit(1);

        let user = existing;
        if (!user) {
          const [c] = await db
            .select()
            .from(clinics)
            .where(eq(clinics.slug, "demo-clinic"))
            .limit(1);
          if (!c) {
            res.redirect(`${env.WEB_ORIGIN}/login?error=no_clinic`);
            return;
          }
          const [created] = await db
            .insert(users)
            .values({
              email,
              oauthProvider: "google",
              oauthSubject: profile.id,
              firstName: profile.name?.givenName ?? "User",
              lastName: profile.name?.familyName ?? "",
            })
            .returning();
          user = created;
          await db.insert(userClinicMemberships).values({
            userId: user.id,
            clinicId: c.id,
            role: "patient",
          });
          await db.insert(patients).values({
            clinicId: c.id,
            userId: user.id,
          });
        } else if (!user.oauthSubject) {
          await db
            .update(users)
            .set({ oauthProvider: "google", oauthSubject: profile.id })
            .where(eq(users.id, user.id));
        }

        const memberships = await db
          .select()
          .from(userClinicMemberships)
          .where(eq(userClinicMemberships.userId, user.id));
        const primary = memberships[0];
        if (!primary) {
          res.redirect(`${env.WEB_ORIGIN}/login?error=no_membership`);
          return;
        }

        const accessToken = signAccessToken(env, {
          sub: user.id,
          email: user.email,
          clinicId: primary.clinicId,
          role: primary.role as UserRole,
        });
        const rawRefresh = randomRefreshToken();
        await db.insert(refreshTokens).values({
          userId: user.id,
          tokenHash: hashRefreshToken(rawRefresh),
          expiresAt: daysFromNow(env.JWT_REFRESH_EXPIRES_DAYS),
        });

        const redirectUrl = new URL(`${env.WEB_ORIGIN}/auth/callback`);
        redirectUrl.searchParams.set("access_token", accessToken);
        redirectUrl.searchParams.set("refresh_token", rawRefresh);
        res.redirect(redirectUrl.toString());
      }
    );
  } else {
    router.get("/google", (_req, res) => {
      res.status(501).json({ error: "Google OAuth not configured" });
    });
    router.get("/google/callback", (_req, res) => {
      res.status(501).json({ error: "Google OAuth not configured" });
    });
  }

  return router;
}
