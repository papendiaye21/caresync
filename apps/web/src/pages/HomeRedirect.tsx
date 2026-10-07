import { Navigate } from "react-router-dom";
import { clearSession, getRole } from "../api";

export function HomeRedirect() {
  const role = getRole();
  if (role === "patient") return <Navigate to="/patient" replace />;
  if (role === "clinician" || role === "admin" || role === "staff") {
    return <Navigate to="/clinic" replace />;
  }
  clearSession();
  return <Navigate to="/login" replace />;
}
