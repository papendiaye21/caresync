/** Shows how this screen maps to the paired clinic/patient capability. */
export function FlowRibbon({
  direction,
  label,
  counterpart,
}: {
  direction: "to-clinic" | "from-clinic" | "bidirectional";
  label: string;
  counterpart: string;
}) {
  const arrow =
    direction === "bidirectional"
      ? "↔"
      : direction === "to-clinic"
        ? "──→"
        : "←──";
  return (
    <div className="rounded-lg border border-teal-200 bg-teal-50/80 px-4 py-3 text-sm text-teal-900">
      <span className="font-medium">Platform map:</span>{" "}
      <span className="font-mono text-teal-800">{arrow}</span>{" "}
      <span>{label}</span>
      <span className="text-slate-600"> · pairs with </span>
      <span className="font-medium">{counterpart}</span>
    </div>
  );
}
