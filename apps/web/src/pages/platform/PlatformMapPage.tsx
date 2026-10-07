import { Fragment } from "react";
import { Link } from "react-router-dom";
import { getRole } from "../../api";

const rows = [
  {
    patient: "Book appointment",
    patientPath: "/patient/appointments/book",
    arrow: "──→",
    clinic: "Appointment calendar",
    clinicPath: "/clinic/calendar",
  },
  {
    patient: "Fill pre-visit form",
    patientPath: "/patient/pre-visit",
    arrow: "──→",
    clinic: "Patient EHR + history",
    clinicPath: "/clinic/patients",
  },
  {
    patient: "Teleconsult / chat",
    patientPath: "/patient/messages",
    arrow: "↔",
    clinic: "Secure messaging",
    clinicPath: "/clinic/messages",
  },
  {
    patient: "Receive prescription",
    patientPath: "/patient/prescriptions",
    arrow: "←──",
    clinic: "Digital prescription writer",
    clinicPath: "/clinic/prescriptions",
  },
  {
    patient: "Medication reminders",
    patientPath: "/patient/medications",
    arrow: "←──",
    clinic: "Auto-triggered from Rx",
    clinicPath: "/clinic/prescriptions",
  },
  {
    patient: "Log vitals daily",
    patientPath: "/patient/vitals",
    arrow: "──→",
    clinic: "Doctor vitals dashboard",
    clinicPath: "/clinic/vitals-dashboard",
  },
  {
    patient: "View lab results",
    patientPath: "/patient/labs",
    arrow: "←──",
    clinic: "Lab result upload portal",
    clinicPath: "/clinic/labs",
  },
  {
    patient: "Receive invoice",
    patientPath: "/patient/billing",
    arrow: "←──",
    clinic: "Billing & insurance module",
    clinicPath: "/clinic/billing",
  },
  {
    patient: "Emergency QR code",
    patientPath: "/patient/emergency-qr",
    arrow: "──→",
    clinic: "Emergency access portal",
    clinicPath: "/clinic/emergency",
  },
] as const;

export function PlatformMapPage() {
  const role = getRole();
  const isPatient = role === "patient";

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-semibold text-slate-800">Caresync platform map</h1>
      <p className="mt-2 text-slate-600 text-sm max-w-2xl">
        Each patient capability is paired with the matching clinic workflow. Links
        respect your role (patient vs clinic).
      </p>

      <div className="mt-8 grid grid-cols-[1fr_auto_1fr] gap-x-4 gap-y-3 items-center text-sm">
        <div className="font-semibold text-teal-800 border-b border-teal-200 pb-2">
          Patient side
        </div>
        <div className="font-semibold text-slate-400 border-b border-slate-200 pb-2 text-center">
          Flow
        </div>
        <div className="font-semibold text-slate-800 border-b border-slate-200 pb-2">
          Doctor / clinic side
        </div>

        {rows.map((row) => (
          <Fragment key={row.patient}>
            <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
              {isPatient ? (
                <Link
                  to={row.patientPath}
                  className="text-teal-700 font-medium hover:underline"
                >
                  {row.patient}
                </Link>
              ) : (
                <span className="text-slate-700">{row.patient}</span>
              )}
            </div>
            <div className="text-center font-mono text-slate-500 tabular-nums">
              {row.arrow}
            </div>
            <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
              {!isPatient ? (
                <Link
                  to={row.clinicPath}
                  className="text-teal-700 font-medium hover:underline"
                >
                  {row.clinic}
                </Link>
              ) : (
                <span className="text-slate-700">{row.clinic}</span>
              )}
            </div>
          </Fragment>
        ))}
      </div>

      {role === "patient" && (
        <p className="mt-6 text-xs text-slate-500">
          Sign in as a clinician to open clinic-side links from this map.
        </p>
      )}
      {(role === "clinician" || role === "admin" || role === "staff") && (
        <p className="mt-6 text-xs text-slate-500">
          Sign in as a patient to open patient-side links from this map.
        </p>
      )}
    </div>
  );
}
