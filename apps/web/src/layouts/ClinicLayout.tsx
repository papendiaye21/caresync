import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearSession } from "../api";

const nav = [
  { to: "/clinic", end: true, label: "Home" },
  { to: "/clinic/calendar", label: "Appointment calendar" },
  { to: "/clinic/patients", label: "Patients & EHR" },
  { to: "/clinic/messages", label: "Secure messaging" },
  { to: "/clinic/prescriptions", label: "Digital Rx writer" },
  { to: "/clinic/vitals-dashboard", label: "Vitals dashboard" },
  { to: "/clinic/labs", label: "Lab upload portal" },
  { to: "/clinic/billing", label: "Billing & insurance" },
  { to: "/clinic/emergency", label: "Emergency access" },
  { to: "/map", label: "Platform map" },
];

export function ClinicLayout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 shrink-0 border-r border-slate-200 bg-slate-900 text-slate-100 p-4 flex flex-col gap-1">
        <div className="font-semibold mb-2 px-2">Caresync</div>
        <p className="text-xs text-slate-400 px-2 mb-2">Clinic / doctor</p>
        {nav.map(({ to, end, label }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm ${
                isActive
                  ? "bg-teal-600 text-white font-medium"
                  : "text-slate-200 hover:bg-slate-800"
              }`
            }
          >
            {label}
          </NavLink>
        ))}
        <button
          type="button"
          className="mt-auto text-left text-sm text-slate-400 underline px-3 py-2"
          onClick={() => {
            clearSession();
            navigate("/login");
          }}
        >
          Log out
        </button>
      </aside>
      <main className="flex-1 p-8 overflow-auto bg-slate-50">
        <Outlet />
      </main>
    </div>
  );
}
