import { Link } from "react-router-dom";

const tiles = [
  { to: "/clinic/calendar", title: "Appointment calendar", sub: "← Patient booking" },
  { to: "/clinic/patients", title: "Patients & EHR", sub: "← Pre-visit + chart" },
  { to: "/clinic/messages", title: "Secure messaging", sub: "↔ Teleconsult" },
  { to: "/clinic/prescriptions", title: "Digital Rx writer", sub: "→ Patient Rx" },
  { to: "/clinic/vitals-dashboard", title: "Vitals dashboard", sub: "← Home vitals" },
  { to: "/clinic/labs", title: "Lab upload", sub: "→ Patient results" },
  { to: "/clinic/billing", title: "Billing & insurance", sub: "→ Patient invoices" },
  { to: "/clinic/emergency", title: "Emergency access", sub: "← Emergency QR" },
];

export function ClinicHub() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800">Clinic home</h1>
      <p className="mt-1 text-slate-600 text-sm">
        Caresync mirrors each workflow with the patient app.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-teal-400 hover:shadow transition"
          >
            <div className="font-medium text-slate-800">{t.title}</div>
            <div className="text-xs text-slate-500 mt-1">{t.sub}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
