import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../api";
import { FlowRibbon } from "../../components/FlowRibbon";

type Patient = { id: string; mrn: string | null };

export function ClinicPatientsList() {
  const [rows, setRows] = useState<Patient[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await apiFetch("/api/patients");
      const data = (await res.json()) as { patients?: Patient[]; error?: string };
      if (!res.ok) {
        setErr(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setRows(data.patients ?? []);
    })();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800">Patients & EHR</h1>
      <FlowRibbon
        direction="from-clinic"
        label="Chart + longitudinal history"
        counterpart="Pre-visit form (patient)"
      />
      <p className="mt-2 text-slate-600 text-sm">
        Open a patient to see demographics, allergies, conditions, and visit timeline.
      </p>
      {err && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>
      )}
      <ul className="mt-6 space-y-2">
        {rows.map((p) => (
          <li key={p.id}>
            <Link
              to={`/clinic/patients/${p.id}`}
              className="block rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-teal-400"
            >
              <span className="font-medium text-slate-800">
                {p.mrn ?? "Patient"}
              </span>
              <span className="ml-2 font-mono text-xs text-slate-500">{p.id}</span>
            </Link>
          </li>
        ))}
        {rows.length === 0 && !err && (
          <li className="text-slate-500 text-sm">No patients in this clinic.</li>
        )}
      </ul>
    </div>
  );
}
