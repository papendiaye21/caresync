import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../../api";
import { FlowRibbon } from "../../components/FlowRibbon";

export function ClinicPatientEhr() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<{
    patient?: { id: string; mrn: string | null };
    demographics?: Record<string, unknown> | null;
    allergies?: { id: string; substance: string }[];
    conditions?: { id: string; name: string }[];
  } | null>(null);
  const [timeline, setTimeline] = useState<{
    appointments?: { id: string; startsAt: string; status: string }[];
    encounters?: { id: string; startedAt: string }[];
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      const res = await apiFetch(`/api/patients/${id}`);
      const j = (await res.json()) as typeof data & { error?: string };
      if (!res.ok) {
        setErr(j.error ?? `HTTP ${res.status}`);
        return;
      }
      setData(j);
      const tRes = await apiFetch(`/api/patients/${id}/timeline`);
      const tj = (await tRes.json()) as typeof timeline & { error?: string };
      if (tRes.ok) setTimeline(tj);
    })();
  }, [id]);

  if (!id) return <p>Missing patient id</p>;

  return (
    <div>
      <Link to="/clinic/patients" className="text-sm text-teal-700 hover:underline">
        ← Patients
      </Link>
      <h1 className="text-2xl font-semibold text-slate-800 mt-2">Patient EHR</h1>
      <FlowRibbon
        direction="from-clinic"
        label="Clinical record & history"
        counterpart="Pre-visit form + patient timeline"
      />
      {err && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>
      )}
      {data?.patient && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="font-medium text-slate-800">Demographics</h2>
            <pre className="mt-2 text-xs overflow-auto text-slate-600">
              {JSON.stringify(data.demographics ?? data.patient, null, 2)}
            </pre>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="font-medium text-slate-800">Allergies</h2>
            <ul className="mt-2 text-sm list-disc pl-5">
              {(data.allergies ?? []).map((a) => (
                <li key={a.id}>{a.substance}</li>
              ))}
            </ul>
            <h2 className="font-medium text-slate-800 mt-4">Conditions</h2>
            <ul className="mt-2 text-sm list-disc pl-5">
              {(data.conditions ?? []).map((c) => (
                <li key={c.id}>{c.name}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {timeline && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="font-medium text-slate-800">Timeline</h2>
          <p className="text-xs text-slate-500 mt-1">Appointments & encounters</p>
          <ul className="mt-3 text-sm space-y-1">
            {(timeline.appointments ?? []).map((a) => (
              <li key={a.id}>
                Appt {new Date(a.startsAt).toLocaleString()} — {a.status}
              </li>
            ))}
            {(timeline.encounters ?? []).map((e) => (
              <li key={e.id}>Encounter {new Date(e.startedAt).toLocaleString()}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
