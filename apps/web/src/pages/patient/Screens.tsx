import { FlowRibbon } from "../../components/FlowRibbon";

export function PatientBookAppointment() {
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold text-slate-800">Book appointment</h1>
      <FlowRibbon
        direction="to-clinic"
        label="Your booking request"
        counterpart="Appointment calendar (clinic)"
      />
      <p className="text-slate-600 text-sm">
        Online scheduling with reminders is part of the Caresync roadmap. When live,
        your slots appear on the clinic appointment calendar for staff confirmation.
      </p>
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-slate-500 text-sm">
        Booking UI placeholder — connects to clinic calendar & waitlist.
      </div>
    </div>
  );
}

export function PatientPreVisit() {
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold text-slate-800">Pre-visit form</h1>
      <FlowRibbon
        direction="to-clinic"
        label="Structured intake you submit"
        counterpart="Patient EHR + history (clinic)"
      />
      <p className="text-slate-600 text-sm">
        Visit questionnaires and consent flow into the chart so clinicians review
        allergies, meds, and chief complaint before the encounter.
      </p>
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-slate-500 text-sm">
        Form builder placeholder — writes to EHR / problem list.
      </div>
    </div>
  );
}

export function PatientMessages() {
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold text-slate-800">Teleconsult / chat</h1>
      <FlowRibbon
        direction="bidirectional"
        label="Secure patient ↔ clinic chat"
        counterpart="Secure messaging (clinic)"
      />
      <p className="text-slate-600 text-sm">
        Async messaging and televisit sessions share the same threaded inbox on both
        sides, with Socket.io realtime in the API shell.
      </p>
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-slate-500 text-sm">
        Messaging UI placeholder — Phase 2 realtime module.
      </div>
    </div>
  );
}

export function PatientPrescriptions() {
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold text-slate-800">Your prescriptions</h1>
      <FlowRibbon
        direction="from-clinic"
        label="Rx issued to you"
        counterpart="Digital prescription writer (clinic)"
      />
      <p className="text-slate-600 text-sm">
        Digitally generated prescriptions include a verification code for the pharmacy
        and replace handwritten scripts.
      </p>
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-slate-500 text-sm">
        List of active Rx placeholder — data from clinic writer + pharmacy link.
      </div>
    </div>
  );
}

export function PatientMedications() {
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold text-slate-800">Medication reminders</h1>
      <FlowRibbon
        direction="from-clinic"
        label="Push / SMS reminders"
        counterpart="Auto-triggered from Rx (clinic)"
      />
      <p className="text-slate-600 text-sm">
        When a clinician finalizes a prescription, schedules seed reminder jobs (SMS /
        email) without extra setup from you.
      </p>
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-slate-500 text-sm">
        Reminder preferences placeholder — Phase 3 schedules from Rx lines.
      </div>
    </div>
  );
}

export function PatientVitals() {
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold text-slate-800">Log vitals</h1>
      <FlowRibbon
        direction="to-clinic"
        label="Daily home readings"
        counterpart="Doctor vitals dashboard (clinic)"
      />
      <p className="text-slate-600 text-sm">
        BP, glucose, weight, and custom flows feed a clinician dashboard with
        out-of-range alerts.
      </p>
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-slate-500 text-sm">
        Vitals entry placeholder — Phase 3 time series + thresholds.
      </div>
    </div>
  );
}

export function PatientLabs() {
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold text-slate-800">Lab results</h1>
      <FlowRibbon
        direction="from-clinic"
        label="Released results & notifications"
        counterpart="Lab upload portal (clinic)"
      />
      <p className="text-slate-600 text-sm">
        Labs push PDFs / structured results into the chart; you get instant notice and
        a copy in your record.
      </p>
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-slate-500 text-sm">
        Results list placeholder — Phase 2 lab portal ingest.
      </div>
    </div>
  );
}

export function PatientBilling() {
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold text-slate-800">Invoices & billing</h1>
      <FlowRibbon
        direction="from-clinic"
        label="Patient payment portal"
        counterpart="Billing & insurance module (clinic)"
      />
      <p className="text-slate-600 text-sm">
        Per-visit invoices, claims status, and transparent balances sync from the
        clinic billing layer.
      </p>
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-slate-500 text-sm">
        Payments placeholder — Phase 4 Stripe / claims integration.
      </div>
    </div>
  );
}

export function PatientEmergencyQr() {
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold text-slate-800">Emergency QR & PIN</h1>
      <FlowRibbon
        direction="to-clinic"
        label="Break-glass patient profile"
        counterpart="Emergency access portal (clinic)"
      />
      <p className="text-slate-600 text-sm">
        A QR or PIN lets authorized emergency clinicians view critical allergies,
        conditions, and contacts with full audit logging.
      </p>
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-slate-500 text-sm">
        QR / PIN management placeholder — high-security release gating.
      </div>
    </div>
  );
}
