import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearSession } from "../api";

const nav = [
  { to: "/patient", end: true, label: "Home" },
  { to: "/patient/appointments/book", label: "Book appointment" },
  { to: "/patient/pre-visit", label: "Pre-visit form" },
  { to: "/patient/messages", label: "Teleconsult / chat" },
  { to: "/patient/prescriptions", label: "Prescriptions" },
  { to: "/patient/medications", label: "Medication reminders" },
  { to: "/patient/vitals", label: "Log vitals" },
  { to: "/patient/labs", label: "Lab results" },
  { to: "/patient/billing", label: "Invoices & billing" },
  { to: "/patient/emergency-qr", label: "Emergency QR" },
  { to: "/map", label: "Platform map" },
];

export function PatientLayout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 shrink-0 border-r border-slate-200 bg-white p-4 flex flex-col gap-1">
        <div className="font-semibold text-slate-800 mb-2 px-2">Caresync</div>
        <p className="text-xs text-slate-500 px-2 mb-2">Patient</p>
        {nav.map(({ to, end, label }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm ${
                isActive
                  ? "bg-teal-100 text-teal-900 font-medium"
                  : "text-slate-700 hover:bg-slate-100"
              }`
            }
          >
            {label}
          </NavLink>
        ))}
        <button
          type="button"
          className="mt-auto text-left text-sm text-slate-600 underline px-3 py-2"
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
