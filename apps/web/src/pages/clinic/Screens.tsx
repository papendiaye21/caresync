import { FlowRibbon } from "../../components/FlowRibbon";

export function ClinicMessaging() {
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold text-slate-800">Secure messaging</h1>
      <FlowRibbon
        direction="bidirectional"
        label="Clinic inbox & threads"
        counterpart="Teleconsult / chat (patient)"
      />
      <p className="text-slate-600 text-sm">
        Clinicians answer patient messages and launch teleconsults from the same queue
        backed by Socket.io namespaces in Phase 2.
      </p>
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-slate-500 text-sm">
        Inbox placeholder — thread list + attachment policy.
      </div>
    </div>
  );
}

export function ClinicPrescriptions() {
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold text-slate-800">Digital prescription writer</h1>
      <FlowRibbon
        direction="to-clinic"
        label="Structured e-Rx + pharmacy routing"
        counterpart="Receive prescription (patient)"
      />
      <p className="text-slate-600 text-sm">
        Writers generate verification codes, line items, and pharmacy stubs; reminders
        auto-queue from finalized scripts.
      </p>
      <FlowRibbon
        direction="to-clinic"
        label="Reminder jobs"
        counterpart="Medication reminders (patient)"
      />
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-slate-500 text-sm">
        Rx composer placeholder — uses POST /api/prescriptions in MVP API.
      </div>
    </div>
  );
}

export function ClinicVitalsDashboard() {
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold text-slate-800">Vitals dashboard</h1>
      <FlowRibbon
        direction="from-clinic"
        label="Population & per-patient trends"
        counterpart="Log vitals daily (patient)"
      />
      <p className="text-slate-600 text-sm">
        Charts highlight excursions; alerting rules tie back to care plans for chronic
        cohorts.
      </p>
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-slate-500 text-sm">
        Dashboard placeholder — Phase 3 vitals series + alerts.
      </div>
    </div>
  );
}

export function ClinicLabUpload() {
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold text-slate-800">Lab result upload portal</h1>
      <FlowRibbon
        direction="to-clinic"
        label="HL7 / PDF ingest"
        counterpart="View lab results (patient)"
      />
      <p className="text-slate-600 text-sm">
        Partner labs drop files to S3 with clinic QA before releasing to patients.
      </p>
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-slate-500 text-sm">
        Upload UI placeholder — uses presigned URLs + document table (Phase 2).
      </div>
    </div>
  );
}

export function ClinicBilling() {
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold text-slate-800">Billing & insurance</h1>
      <FlowRibbon
        direction="to-clinic"
        label="Claims + patient responsibility"
        counterpart="Receive invoice (patient)"
      />
      <p className="text-slate-600 text-sm">
        Encounters drive invoices; portals stay in sync with payer status and patient
        copays.
      </p>
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-slate-500 text-sm">
        Billing workbench placeholder — Phase 4 revenue module.
      </div>
    </div>
  );
}

export function ClinicEmergency() {
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold text-slate-800">Emergency access portal</h1>
      <FlowRibbon
        direction="from-clinic"
        label="Break-glass workflow + audit"
        counterpart="Emergency QR code (patient)"
      />
      <p className="text-slate-600 text-sm">
        Authorized providers scan QR or enter PIN to retrieve the minimum necessary
        dataset during emergencies.
      </p>
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-slate-500 text-sm">
        Verification UI placeholder — pairs with patient QR issuer.
      </div>
    </div>
  );
}
