import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { clearSession, getToken, validateSession } from "../api";

export function RequireAuth({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"loading" | "ok" | "invalid">("loading");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (!getToken()) {
        if (!cancelled) setStatus("invalid");
        return;
      }
      const ok = await validateSession();
      if (!cancelled) setStatus(ok ? "ok" : "invalid");
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600 text-sm">
        Checking session…
      </div>
    );
  }

  if (status === "invalid") {
    clearSession();
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
