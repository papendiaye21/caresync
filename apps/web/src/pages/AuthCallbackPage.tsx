import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setSession, type PortalRole } from "../api";

export function AuthCallbackPage() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [msg, setMsg] = useState("Completing Google sign-in…");

  useEffect(() => {
    const access = params.get("access_token");
    const refresh = params.get("refresh_token") ?? undefined;
    if (!access) {
      setMsg("Missing access token — try email login or Google again.");
      return;
    }
    void (async () => {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${access}` },
      });
      const data = (await res.json()) as {
        auth?: { clinicId?: string; role?: string };
        error?: string;
      };
      if (!res.ok || !data.auth?.clinicId || !data.auth?.role) {
        setMsg(data.error ?? "Could not load session");
        return;
      }
      setSession(
        access,
        data.auth.clinicId,
        data.auth.role as PortalRole,
        refresh
      );
      nav("/", { replace: true });
    })();
  }, [params, nav]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <p className="text-slate-600">{msg}</p>
    </div>
  );
}
