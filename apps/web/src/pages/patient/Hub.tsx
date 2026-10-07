import { Link } from "react-router-dom";

const tiles = [
  { to: "/patient/appointments/book", title: "Book appointment", sub: "→ Clinic calendar" },
  { to: "/patient/pre-visit", title: "Pre-visit form", sub: "→ EHR & history" },
  { to: "/patient/messages", title: "Teleconsult / chat", sub: "↔ Secure messaging" },
  { to: "/patient/prescriptions", title: "Prescriptions", sub: "← Digital Rx" },
  { to: "/patient/medications", title: "Medication reminders", sub: "← From your Rx" },
  { to: "/patient/vitals", title: "Log vitals", sub: "→ Vitals dashboard" },
  { to: "/patient/labs", title: "Lab results", sub: "← Lab upload portal" },
  { to: "/patient/billing", title: "Invoices", sub: "← Billing module" },
  { to: "/patient/emergency-qr", title: "Emergency QR", sub: "→ Emergency access" },
];

export function PatientHub() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800">Patient home</h1>
      <p className="mt-1 text-slate-600 text-sm">
        Your Caresync tools line up with your care team’s workflows.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-teal-300 hover:shadow transition"
          >
            <div className="font-medium text-slate-800">{t.title}</div>
            <div className="text-xs text-slate-500 mt-1">{t.sub}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
