import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authPublicFetch, clearSession, setSession, type PortalRole } from "../api";
import { GoogleSignInButton } from "../components/GoogleSignInButton";

export function RegisterPage() {
  const nav = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    clearSession();
    try {
      const res = await authPublicFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      });
      const data = (await res.json()) as {
        error?:
          | string
          | {
              fieldErrors?: Record<string, string[] | undefined>;
              formErrors?: string[];
            };
        accessToken?: string;
        refreshToken?: string;
        user?: { clinicId?: string; role?: string };
      };

      if (!res.ok) {
        const { error: errBody } = data;
        if (typeof errBody === "string") {
          setError(errBody);
          return;
        }
        if (errBody && typeof errBody === "object") {
          const fieldParts = Object.entries(errBody.fieldErrors ?? {})
            .flatMap(([k, v]) => (v ?? []).map((m) => `${k}: ${m}`))
            .join(" · ");
          const formParts = (errBody.formErrors ?? []).join(" · ");
          const msg = [fieldParts, formParts].filter(Boolean).join(" · ");
          setError(msg || "Registration failed");
          return;
        }
        setError("Registration failed");
        return;
      }

      if (!data.accessToken || !data.user?.clinicId || !data.user?.role) {
        setError("Unexpected response from server");
        return;
      }

      setSession(
        data.accessToken,
        data.user.clinicId,
        data.user.role as PortalRole,
        data.refreshToken
      );
      nav("/app");
    } catch {
      setError("Network error — is the API running on port 4000?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg border border-slate-200">
        <h1 className="text-2xl font-semibold text-slate-800">Create account</h1>
        <p className="mt-1 text-sm text-slate-600">
          New accounts join the demo clinic as a <strong>patient</strong>. Staff and
          clinicians are added by your organization (e.g. via seed or admin tools).
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                First name
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                autoComplete="given-name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Last name
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                autoComplete="family-name"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              autoComplete="email"
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
              required
              minLength={8}
              autoComplete="new-password"
            />
            <p className="mt-1 text-xs text-slate-500">At least 8 characters</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Confirm password
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              type="password"
              required
              autoComplete="new-password"
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
            {loading ? "Creating account…" : "Create account"}
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
        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-teal-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
