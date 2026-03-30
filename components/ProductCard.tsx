export function ProductCard({
  label,
  value,
  tone = "default"
}: {
  label: string;
  value: string | number;
  tone?: "default" | "emerald" | "amber";
}) {
  const accentColor =
    tone === "emerald"
      ? "bg-emerald-500"
      : tone === "amber"
        ? "bg-amber-500"
        : "bg-zinc-700";

  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      {/* Left accent line */}
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${accentColor}`} />
      <p className="mono tabular text-[40px] font-bold leading-none text-zinc-50">{value}</p>
      <p className="mt-1 text-[12px] uppercase tracking-wider text-zinc-400">{label}</p>
    </div>
  );
}
