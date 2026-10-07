import { useEffect, useState } from "react";
import { apiFetch } from "../../api";
import { FlowRibbon } from "../../components/FlowRibbon";

type Appt = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: string;
  patientId: string;
};

export function ClinicCalendar() {
  const [rows, setRows] = useState<Appt[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const from = new Date();
      from.setMonth(from.getMonth() - 1);
      const res = await apiFetch(
        `/api/appointments?from=${encodeURIComponent(from.toISOString())}`
      );
      const data = (await res.json()) as { appointments?: Appt[]; error?: string };
      if (!res.ok) {
        setErr(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setRows(data.appointments ?? []);
    })();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800">Appointment calendar</h1>
      <FlowRibbon
        direction="from-clinic"
        label="Scheduled visits for providers"
        counterpart="Book appointment (patient)"
      />
      <p className="mt-2 text-slate-600 text-sm max-w-2xl">
        Patient self-service booking will land in the same schedule; today this view
        reads appointments created from the API.
      </p>
      {err && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>
      )}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-4 py-2">Start</th>
              <th className="px-4 py-2">End</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Patient ID</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !err ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No appointments — create via API or future booking UI.
                </td>
              </tr>
            ) : (
              rows.map((a) => (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">{new Date(a.startsAt).toLocaleString()}</td>
                  <td className="px-4 py-2">{new Date(a.endsAt).toLocaleString()}</td>
                  <td className="px-4 py-2">{a.status}</td>
                  <td className="px-4 py-2 font-mono text-xs">{a.patientId}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
