import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getRole } from "../api";

export function RequireClinicRole({ children }: { children: ReactNode }) {
  const role = getRole();
  if (role === "patient") return <Navigate to="/patient" replace />;
  if (!role) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
