# Caresync

## Run locally (full stack)

**1. Start PostgreSQL** (Docker):

```bash
cd /path/to/caresync
docker compose up -d
```

**2. Configure the API** — create `apps/api/.env`:

```env
DATABASE_URL=postgresql://clinic:clinic@localhost:5432/clinic
JWT_ACCESS_SECRET=dev-access-secret-at-least-16-chars
JWT_REFRESH_SECRET=dev-refresh-secret-at-least-16-chars
WEB_ORIGIN=http://localhost:5173
```

**3. Apply schema and seed demo users:**

```bash
npm install
npm run db:push
npm run db:seed
```

**4. Start API + web UI** (needs **two servers** — API on 4000, Vite on 5173):

```bash
npm run dev
```

If the browser says **“can’t connect” on port 5173**, the **frontend is not running**. Common causes: only `dev:api` was started, or the web process exited — check the terminal for errors. You can run them in **two terminals**:

```bash
npm run dev:api
```

```bash
npm run dev:web
```

- **UI:** [http://localhost:5173](http://localhost:5173) (or the “Network” URL Vite prints)  
- **API health:** [http://localhost:4000/health](http://localhost:4000/health)

**5. Sign in or register**

- **Log in:** [http://localhost:5173/login](http://localhost:5173/login) — use your email and password.
- **New account:** [http://localhost:5173/register](http://localhost:5173/register) — creates a **patient** in the demo clinic (needs `db:seed` so that clinic exists).
- **Seeded demo password** (unless you set `SEED_PASSWORD`): `ChangeMe123!`
  - Clinician: `dr.jones@demo-clinic.local` → clinic portal `/clinic`
  - Patient: `patient@demo-clinic.local` → patient portal `/patient`

Open **Platform map** from the sidebar (`/map`) to see how patient and clinic screens pair (booking ↔ calendar, vitals ↔ dashboard, etc.).

If `npm run dev` fails, run two terminals: `npm run dev:api` and `npm run dev:web`.

## Google Cloud (Sign-In, Maps, Gemini)

See [docs/GOOGLE_CLOUD.md](docs/GOOGLE_CLOUD.md) for OAuth + API key setup.

## Note

The monorepo packages are scoped as `@caresync/*`. The web app proxies `/api` to the backend on port 4000.

Re-run `**npm run db:seed`** after pulling if you need the demo patient account.