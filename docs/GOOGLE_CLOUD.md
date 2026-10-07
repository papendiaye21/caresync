# Google Cloud setup for Caresync

This project uses **three different Google credentials** for three jobs.

| Goal | Credential type | Env vars |
|------|-----------------|----------|
| Sign in with Google | OAuth Client ID + Secret | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` |
| Maps geocoding | API key (restricted) | `GOOGLE_API_KEY` |
| Gemini symptom helper | Same or separate API key | `GOOGLE_API_KEY`, optional `GEMINI_MODEL` |

---

## What “Finish Sign in with Google (already in code)” means

**Already built in Caresync:**

- Backend routes: `GET /api/auth/google` and `GET /api/auth/google/callback`
- Creates/links a user, issues JWT + refresh token, redirects to `/auth/callback`
- Login/Register pages now show a **Continue with Google** button

**What you still must do in Google Cloud (cannot be coded for you):**

1. Create an OAuth client
2. Paste Client ID / Secret / Callback URL into `apps/api/.env`
3. Restart the API

Until those env vars exist, `/api/auth/google` returns **501 Google OAuth not configured**.

---

## Priority 1 — Sign in with Google (OAuth)

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. **APIs & Services → OAuth consent screen**
   - User type: **External** (for personal/dev) or Internal (Workspace).
   - App name: `Caresync`
   - Add your email as a test user (required while app is in Testing).
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Application type: **Web application**
   - Name: `Caresync local`
   - **Authorized JavaScript origins:**
     - `http://localhost:5173`
     - `http://localhost:4000`
   - **Authorized redirect URIs:**
     - `http://localhost:4000/api/auth/google/callback`
5. Copy Client ID and Client Secret into `apps/api/.env`:

```env
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
WEB_ORIGIN=http://localhost:5173
```

6. Restart API (`npm run dev:api` or `npm run dev`).
7. Open http://localhost:5173/login → **Continue with Google**.

New Google users become **patients** on the demo clinic (same as email register).

---

## Priority 2 — Maps API key (clinic address / geocode)

1. **APIs & Services → Library** → enable **Geocoding API** (and Places if you add autocomplete later).
2. **Credentials → Create credentials → API key**.
3. Edit the key → **Application restrictions**: prefer **IP addresses** of your laptop/server for backend use.
4. **API restrictions**: restrict to Geocoding API (and Places if needed).
5. Put the key in `apps/api/.env`:

```env
GOOGLE_API_KEY=AIza...
```

6. Call from an authenticated session:

```http
POST /api/maps/geocode
Authorization: Bearer <accessToken>
Content-Type: application/json

{ "address": "1 Market St, San Francisco, CA" }
```

---

## Priority 3 — Gemini (symptom helper, Phase 5)

1. Enable **Generative Language API** (Gemini) in the same project (or a separate non-PHI project for demos).
2. Use an API key (can reuse `GOOGLE_API_KEY` if both Maps + Gemini are allowed on that key, or create a second key).
3. Optional:

```env
GEMINI_MODEL=gemini-2.0-flash
```

4. Call:

```http
POST /api/ai/symptom-check
Authorization: Bearer <accessToken>
Content-Type: application/json

{ "symptoms": "mild headache and fatigue for 2 days" }
```

**Do not send real patient chart data** to Gemini until you have a Google Cloud **BAA** and confirm the product is HIPAA-eligible.

---

## Security rules

- Never put `GOOGLE_CLIENT_SECRET` or `GOOGLE_API_KEY` in the React app or git.
- Keep keys on the **API** only (already how Maps/Gemini routes work).
- Restrict API keys by API + IP/referrer.
- For production PHI: prefer **service accounts** + Secret Manager, and sign the BAA.
