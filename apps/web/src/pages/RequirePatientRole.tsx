import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getRole } from "../api";

export function RequirePatientRole({ children }: { children: ReactNode }) {
  const role = getRole();
  if (role !== "patient") {
    if (role === "clinician" || role === "admin" || role === "staff") {
      return <Navigate to="/clinic" replace />;
    }
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
