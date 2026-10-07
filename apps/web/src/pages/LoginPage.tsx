import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authPublicFetch, clearSession, setSession, type PortalRole } from "../api";
import { GoogleSignInButton } from "../components/GoogleSignInButton";

export function LoginPage() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get("reason") === "session_expired";
  const oauthError = searchParams.get("error");
  const oauthHint =
    oauthError === "oauth"
      ? "Google sign-in failed or was cancelled."
      : oauthError === "no_email"
        ? "Google account has no email — use email login."
        : oauthError === "no_clinic"
          ? "Demo clinic missing — run npm run db:seed."
          : oauthError
            ? `Google sign-in error: ${oauthError}`
            : null;
  const [email, setEmail] = useState("dr.jones@demo-clinic.local");
  const [password, setPassword] = useState("ChangeMe123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    clearSession();
    try {
      const res = await authPublicFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as {
        error?: unknown;
        accessToken?: string;
        refreshToken?: string;
        user?: { clinicId?: string; role?: string };
      };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Login failed");
        return;
      }
      if (!data.accessToken || !data.user?.clinicId || !data.user?.role) {
        setError("Unexpected response");
        return;
      }
      setSession(
        data.accessToken,
        data.user.clinicId,
        data.user.role as PortalRole,
        data.refreshToken
      );
      nav("/");
    } catch {
      setError("Network error — is the API running on port 4000?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg border border-slate-200">
        <h1 className="text-2xl font-semibold text-slate-800">Caresync</h1>
        <p className="mt-1 text-sm text-slate-600">Sign in with your email and password.</p>
        {sessionExpired && (
          <p className="mt-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Your session expired. Please sign in again.
          </p>
        )}
        {oauthHint && (
          <p className="mt-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {oauthHint}
          </p>
        )}
        <div className="mt-3 rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-xs text-slate-700 space-y-1">
          <p>
            <strong>Demo clinician</strong> (after <code className="bg-white px-1 rounded">npm run db:seed</code>):
          </p>
          <p>
            Email <code className="bg-white px-1 rounded">dr.jones@demo-clinic.local</code>
          </p>
          <p>
            Password <code className="bg-white px-1 rounded">ChangeMe123!</code>{" "}
            <span className="text-slate-500">(override with env <code>SEED_PASSWORD</code>)</span>
          </p>
          <p className="pt-1 border-t border-slate-200">
            Demo patient: <code className="bg-white px-1 rounded">patient@demo-clinic.local</code> — same
            password unless you changed the seed.
          </p>
        </div>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-500">or</span>
          </div>
        </div>
        <GoogleSignInButton />
        <p className="mt-2 text-center text-xs text-slate-500">
          Needs Google OAuth env vars on the API — see docs/GOOGLE_CLOUD.md
        </p>
        <p className="mt-6 text-center text-sm text-slate-600">
          New to Caresync?{" "}
          <Link to="/register" className="font-medium text-teal-700 hover:underline">
            Create an account
          </Link>
        </p>
        <p className="mt-3 text-xs text-slate-500 text-center">
          Run Postgres, migrate, and seed first — see README in repo root.
        </p>
      </div>
    </div>
  );
}
