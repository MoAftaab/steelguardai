"use client";

import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { Equipment, EquipmentHealth, HealthMetric, RiskLevel } from "@/lib/types";

const riskColors: Record<RiskLevel, string> = {
  low: "#0f9b8e",
  medium: "#d89b2b",
  high: "#d97706",
  critical: "#d33f49"
};

type RiskMatrixPoint = {
  id: string;
  name: string;
  criticality: number;
  priority: number;
  probability: number;
  risk: RiskLevel;
  selected: boolean;
};

type TrendPoint = {
  sample: string;
  time: string;
  probability: number;
  threshold: number;
  likely: boolean;
};

type DriverPoint = {
  signal: string;
  label: string;
  score: number;
  displayScore: number;
  valueLabel: string;
  status: RiskLevel;
};

function toPercentScale(value: number) {
  return Math.round((value <= 1 ? value * 100 : value) || 0);
}

function percent(value: number) {
  return `${Math.round(value)}%`;
}

function labelMetric(metric: string) {
  return metric
    .replace("_c", "")
    .replace("_a", "")
    .replace("_rpm", "")
    .replace("_mm_s", "")
    .replace("_m3_h", "")
    .replace("_bar", "")
    .replace("_ppm", "")
    .replaceAll("_", " ");
}

function formatReading(value: number | undefined, metric?: HealthMetric) {
  if (typeof value !== "number") return "No reading";
  const unit = metric?.unit ? ` ${metric.unit}` : "";
  return `${new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(value)}${unit}`;
}

function metricRisk(value: number | undefined, threshold?: Record<string, number>) {
  if (typeof value !== "number" || !threshold) return 0;
  const scores: number[] = [];
  if (typeof threshold.max === "number" && threshold.max > 0) {
    scores.push(Math.max(0, (value - threshold.max * 0.75) / (threshold.max * 0.25)));
  }
  if (typeof threshold.min === "number" && threshold.min > 0) {
    scores.push(Math.max(0, (threshold.min * 1.15 - value) / (threshold.min * 0.15)));
  }
  return Math.round(Math.min(1, Math.max(...scores, 0)) * 100);
}

function emptyPanel(title: string, detail: string) {
  return (
    <section className="panel flex min-h-[360px] flex-col p-5">
      <p className="muted-label">{title}</p>
      <div className="flex flex-1 items-center justify-center text-center text-sm font-semibold text-steel-500">
        {detail}
      </div>
    </section>
  );
}

function TrendTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: TrendPoint }> }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-md border border-steel-200 bg-white px-3 py-2 text-xs shadow-command">
      <p className="font-bold text-steel-950">{point.time}</p>
      <p className="mt-1 font-semibold text-coolant-700">Probability: {percent(point.probability)}</p>
      <p className="font-semibold text-steel-500">Threshold: {percent(point.threshold)}</p>
    </div>
  );
}

function RiskTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: RiskMatrixPoint }> }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-md border border-steel-200 bg-white px-3 py-2 text-xs shadow-command">
      <p className="font-bold text-steel-950">{point.name}</p>
      <p className="mt-1 font-semibold text-steel-600">Criticality: {point.criticality}/100</p>
      <p className="font-semibold text-steel-600">Priority: {point.priority}/100</p>
      <p className="font-semibold text-steel-600">ML failure: {percent(point.probability)}</p>
    </div>
  );
}

function FailureProbabilityTrend({ health }: { health: EquipmentHealth | null }) {
  if (!health?.ml_trend?.length) {
    return emptyPanel("Failure probability trend", "Waiting for model trend data");
  }

  const rows: TrendPoint[] = health.ml_trend.map((point, index) => ({
    sample: String(index + 1),
    time: new Date(point.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    probability: Math.round(point.failure_probability * 100),
    threshold: Math.round(point.threshold * 100),
    likely: point.failure_likely
  }));
  const latest = rows[rows.length - 1];

  return (
    <section className="panel min-h-[360px] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="muted-label">Failure probability trend</p>
          <h3 className="mt-1 truncate text-base font-bold text-steel-950">{health.equipment.name}</h3>
        </div>
        <span className={`rounded-md border px-2 py-1 text-xs font-bold ${latest.likely ? "border-red-100 bg-red-50 text-red-700" : "border-coolant-100 bg-coolant-50 text-coolant-700"}`}>
          {percent(latest.probability)}
        </span>
      </div>
      <div className="mt-4 h-[235px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dfe7ea" vertical={false} />
            <XAxis dataKey="sample" axisLine={false} tickLine={false} tick={{ fill: "#637985", fontSize: 11 }} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#637985", fontSize: 11 }}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<TrendTooltip />} />
            <Line type="monotone" dataKey="threshold" stroke="#8da0aa" strokeDasharray="5 5" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="probability" stroke="#0f9b8e" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function RiskCriticalityMatrix({
  equipment,
  healthMap,
  selectedId,
  onSelect
}: {
  equipment: Equipment[];
  healthMap: Record<string, EquipmentHealth>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const rows: RiskMatrixPoint[] = equipment.map((item) => {
    const health = healthMap[item.id];
    return {
      id: item.id,
      name: item.name,
      criticality: toPercentScale(item.criticality),
      priority: health?.priority_score ?? 0,
      probability: Math.round((health?.ml_prediction?.failure_probability ?? 0) * 100),
      risk: health?.risk_level ?? item.status,
      selected: item.id === selectedId
    };
  });

  if (!rows.length) {
    return emptyPanel("Risk vs criticality", "Waiting for equipment health data");
  }

  return (
    <section className="panel min-h-[360px] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="muted-label">Risk vs criticality</p>
          <h3 className="mt-1 text-base font-bold text-steel-950">Priority matrix</h3>
        </div>
        <span className="card-muted px-2 py-1 text-xs font-bold text-steel-600">
          {rows.length} assets
        </span>
      </div>
      <div className="mt-4 h-[235px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, bottom: 8, left: -16 }}>
            <CartesianGrid stroke="#dfe7ea" strokeDasharray="3 3" />
            <XAxis
              dataKey="criticality"
              name="Criticality"
              type="number"
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#637985", fontSize: 11 }}
              tickFormatter={(value) => `${value}`}
            />
            <YAxis
              dataKey="priority"
              name="Priority"
              type="number"
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#637985", fontSize: 11 }}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip cursor={{ stroke: "#8da0aa", strokeDasharray: "3 3" }} content={<RiskTooltip />} />
            <Scatter data={rows} onClick={(point: RiskMatrixPoint) => onSelect(point.id)}>
              {rows.map((point) => (
                <Cell key={point.id} fill={riskColors[point.risk]} stroke={point.selected ? "#172126" : "#ffffff"} strokeWidth={point.selected ? 3 : 1.5} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function TopFailureDrivers({ health }: { health: EquipmentHealth | null }) {
  if (!health?.ml_prediction?.top_signals?.length) {
    return emptyPanel("Top failure drivers", "Waiting for selected asset drivers");
  }

  const drivers: DriverPoint[] = health.ml_prediction.top_signals.map((signal) => {
    const metric = health.metrics.find((item) => item.name === signal);
    const value = health.latest_reading.metrics[signal];
    const score = metricRisk(value, health.equipment.thresholds[signal]);
    return {
      signal,
      label: labelMetric(signal),
      score,
      displayScore: Math.max(score, 4),
      valueLabel: formatReading(value, metric),
      status: metric?.status ?? "low"
    };
  });

  return (
    <section className="panel min-h-[360px] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="muted-label">Top failure drivers</p>
          <h3 className="mt-1 truncate text-base font-bold text-steel-950">{health.equipment.name}</h3>
        </div>
        <span className="card-muted px-2 py-1 text-xs font-bold text-steel-600">
          ML signals
        </span>
      </div>
      <div className="mt-5 space-y-4">
        {drivers.map((driver, index) => (
          <div key={driver.signal}>
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-steel-200 bg-white text-[10px] font-bold text-steel-600 shadow-sm">
                  {index + 1}
                </span>
                <span className="truncate font-bold text-steel-900">{driver.label}</span>
              </div>
              <span className="shrink-0 font-semibold text-steel-500">{driver.valueLabel}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-steel-100">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${driver.displayScore}%`,
                  backgroundColor: riskColors[driver.status]
                }}
              />
            </div>
            <div className="mt-1 text-right text-[11px] font-bold text-steel-500">{driver.score}/100 risk load</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PredictiveInsights({
  equipment,
  healthMap,
  selectedId,
  onSelect
}: {
  equipment: Equipment[];
  healthMap: Record<string, EquipmentHealth>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const selectedHealth = selectedId ? healthMap[selectedId] ?? null : null;

  return (
    <section className="grid gap-6 xl:grid-cols-3">
      <FailureProbabilityTrend health={selectedHealth} />
      <RiskCriticalityMatrix equipment={equipment} healthMap={healthMap} selectedId={selectedId} onSelect={onSelect} />
      <TopFailureDrivers health={selectedHealth} />
    </section>
  );
}
