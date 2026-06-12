import type { RiskLevel } from "@/lib/types";

const styles: Record<RiskLevel, string> = {
  low: "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
  medium: "border-amber-500/30 bg-amber-500/15 text-amber-400",
  high: "border-orange-500/30 bg-orange-500/15 text-orange-400",
  critical: "border-red-500/30 bg-red-500/15 text-red-400"
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
