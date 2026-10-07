import { Link, Outlet, useNavigate } from "react-router-dom";
import { clearSession, getRole } from "../api";

export function MapLayout() {
  const role = getRole();
  const navigate = useNavigate();
  const home =
    role === "patient" ? "/patient" : "/clinic";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-3 flex items-center gap-4">
        <Link to={home} className="text-sm text-teal-700 font-medium hover:underline">
          ← Back to {role === "patient" ? "patient" : "clinic"} home
        </Link>
        <span className="text-slate-400">|</span>
        <span className="font-semibold text-slate-800">Caresync</span>
        <button
          type="button"
          className="ml-auto text-sm text-slate-600 underline"
          onClick={() => {
            clearSession();
            navigate("/login");
          }}
        >
          Log out
        </button>
      </header>
      <div className="p-8">
        <Outlet />
      </div>
    </div>
  );
}
