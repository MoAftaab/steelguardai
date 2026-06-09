import type { RiskLevel } from "@/lib/types";

const styles: Record<RiskLevel, string> = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  high: "border-orange-200 bg-orange-50 text-orange-800",
  critical: "border-red-200 bg-red-50 text-red-700"
};

const dots: Record<RiskLevel, string> = {
  low: "bg-emerald-500",
  medium: "bg-amber-500",
  high: "bg-orange-500",
  critical: "bg-signal"
};

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide shadow-sm ${styles[risk]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dots[risk]}`} />
      {risk}
    </span>
  );
}
