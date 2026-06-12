import { Activity, Droplets, Gauge, RotateCcw, Thermometer, Timer, Waves, Wrench, Zap } from "lucide-react";
import type { HealthMetric } from "@/lib/types";
import { RiskBadge } from "./RiskBadge";

const labels: Record<string, string> = {
  temperature_c: "Temperature",
  vibration_mm_s: "Vibration",
  current_a: "Current",
  speed_rpm: "Speed",
  delay_minutes: "Delay",
  pressure_bar: "Pressure",
  flow_m3_h: "Flow",
  oil_particles_ppm: "Oil particles",
  torque_nm: "Torque",
  tool_wear_min: "Tool wear"
};

const statusBars: Record<HealthMetric["status"], string> = {
  low: "bg-emerald-400",
  medium: "bg-amber-400",
  high: "bg-orange-400",
  critical: "bg-signal"
};

const remarks: Record<HealthMetric["status"], string> = {
  low: "In band",
  medium: "Watch trend",
  high: "Inspect soon",
  critical: "Act now"
};

const metricIcons = {
  temperature_c: Thermometer,
  vibration_mm_s: Activity,
  current_a: Zap,
  speed_rpm: Gauge,
  delay_minutes: Timer,
  pressure_bar: Gauge,
  flow_m3_h: Waves,
  oil_particles_ppm: Droplets,
  torque_nm: RotateCcw,
  tool_wear_min: Wrench
};

function formatMetricValue(value: number) {
  if (!Number.isFinite(value)) return "-";
  if (Math.abs(value) >= 100) return value.toFixed(1);
  if (Number.isInteger(value)) return value.toFixed(0);
  return value.toFixed(2);
}

export function MetricTile({ metric }: { metric: HealthMetric }) {
  const Icon = metricIcons[metric.name as keyof typeof metricIcons] ?? Gauge;
  const displayValue = formatMetricValue(metric.value);
  const thresholdValue = Number.parseFloat(metric.threshold.replace(/[^0-9.-]/g, ""));
  const ratio = Number.isFinite(thresholdValue) && thresholdValue > 0
    ? Math.min(100, Math.max(8, (metric.value / thresholdValue) * 100))
    : 35;

  return (
    <div className="panel flex min-h-[198px] flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="icon-tile h-10 w-10 bg-white/[0.06]">
          <Icon size={18} />
        </span>
        <RiskBadge risk={metric.status} />
      </div>

      <div className="mt-3 min-w-0">
        <p className="truncate text-xs font-bold uppercase tracking-wide text-slate-500">{labels[metric.name] ?? metric.name}</p>
        <p className="mt-0.5 text-[11px] font-semibold text-slate-500">Current reading</p>
      </div>

      <div className="mt-4">
        <p className="break-words text-[1.55rem] font-bold tabular-nums leading-8 tracking-normal text-white">
          {displayValue}
          <span className="ml-1 whitespace-nowrap text-sm font-semibold text-slate-500">{metric.unit}</span>
        </p>
        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">{metric.status}</p>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-3 text-xs">
        <div className="card-muted min-w-0 px-2 py-2">
          <dt className="font-bold uppercase tracking-wide text-slate-500">Limit</dt>
          <dd className="mt-1 break-words font-semibold leading-5 text-slate-300">{metric.threshold}</dd>
        </div>
        <div className="card-muted min-w-0 px-2 py-2">
          <dt className="font-bold uppercase tracking-wide text-slate-500">Remark</dt>
          <dd className="mt-1 break-words font-semibold leading-5 text-slate-300">{remarks[metric.status]}</dd>
        </div>
      </dl>

      <div className="mt-auto pt-4">
        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.1]">
          <div className={`h-full rounded-full ${statusBars[metric.status]}`} style={{ width: `${ratio}%` }} />
        </div>
      </div>
    </div>
  );
}
