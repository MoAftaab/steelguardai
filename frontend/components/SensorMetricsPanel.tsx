"use client";

import { useState } from "react";
import { 
  Activity, 
  Droplets, 
  Gauge, 
  Grid, 
  List, 
  RotateCcw, 
  Thermometer, 
  Timer, 
  Waves, 
  Wrench, 
  Zap 
} from "lucide-react";
import type { HealthMetric, RiskLevel } from "@/lib/types";
import { MetricTile } from "./MetricTile";

interface SensorMetricsPanelProps {
  metrics: HealthMetric[];
}

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

const remarks: Record<RiskLevel, string> = {
  low: "In band",
  medium: "Watch trend",
  high: "Inspect soon",
  critical: "Act now"
};

export function SensorMetricsPanel({ metrics }: SensorMetricsPanelProps) {
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [activeCategory, setActiveCategory] = useState<"all" | "mechanical" | "fluid" | "electrical">("all");

  const getMetricCategory = (name: string): "mechanical" | "fluid" | "electrical" => {
    if (["vibration_mm_s", "speed_rpm", "torque_nm", "tool_wear_min"].includes(name)) {
      return "mechanical";
    }
    if (["temperature_c", "pressure_bar", "flow_m3_h", "oil_particles_ppm"].includes(name)) {
      return "fluid";
    }
    return "electrical";
  };

  const filteredMetrics = metrics.filter((metric) => {
    if (activeCategory === "all") return true;
    return getMetricCategory(metric.name) === activeCategory;
  });

  const getRatio = (metric: HealthMetric) => {
    const thresholdValue = Number.parseFloat(metric.threshold.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(thresholdValue) && thresholdValue > 0
      ? Math.min(100, Math.max(8, (metric.value / thresholdValue) * 100))
      : 35;
  };

  const getRemarkColor = (status: RiskLevel) => {
    switch (status) {
      case "critical":
        return "bg-red-500/10 text-red-400 border border-red-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-400 border border-orange-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      default:
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    }
  };

  const getDotColor = (status: RiskLevel) => {
    switch (status) {
      case "critical":
        return "bg-red-400";
      case "high":
        return "bg-orange-400";
      case "medium":
        return "bg-amber-400";
      default:
        return "bg-emerald-400";
    }
  };

  const getBarColor = (status: RiskLevel) => {
    switch (status) {
      case "critical":
        return "bg-red-500 shadow-[0_0_8px_#f43f5e]";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-amber-500";
      default:
        return "bg-emerald-500";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header controls: Tabs + View Switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1 bg-white/[0.02] border border-white/[0.04] p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
              activeCategory === "all"
                ? "bg-white/[0.06] text-white shadow-insetline"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All Signals ({metrics.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("mechanical")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
              activeCategory === "mechanical"
                ? "bg-white/[0.06] text-white shadow-insetline"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Mechanical
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("fluid")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
              activeCategory === "fluid"
                ? "bg-white/[0.06] text-white shadow-insetline"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Thermal & Fluid
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("electrical")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
              activeCategory === "electrical"
                ? "bg-white/[0.06] text-white shadow-insetline"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Electrical
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-white/[0.02] border border-white/[0.04] p-1 rounded-lg self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            title="Table View (Compact)"
            className={`p-1.5 rounded-md transition-all duration-200 ${
              viewMode === "table"
                ? "bg-theme-accent-glow text-theme-accent shadow-theme-glow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <List size={16} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            title="Grid View (Detailed)"
            className={`p-1.5 rounded-md transition-all duration-200 ${
              viewMode === "grid"
                ? "bg-theme-accent-glow text-theme-accent shadow-theme-glow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Grid size={16} />
          </button>
        </div>
      </div>

      {/* Render list content */}
      {filteredMetrics.length === 0 ? (
        <div className="panel flex min-h-[140px] items-center justify-center text-center text-xs font-semibold text-slate-500">
          No telemetry signals found in this category.
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View: uses standard MetricTile components */
        <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredMetrics.map((metric) => (
            <MetricTile key={metric.name} metric={metric} />
          ))}
        </div>
      ) : (
        /* Table View: Compact SCADA HMI style table, completely immune to vertical/horizontal distortion */
        <div className="panel-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[700px]">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.01] text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                  <th className="py-3 px-4">Signal Metric</th>
                  <th className="py-3 px-4 text-right">Current Value</th>
                  <th className="py-3 px-4 text-center">Status Remark</th>
                  <th className="py-3 px-4 text-right">Threshold Limit</th>
                  <th className="py-3 px-4 pl-6">Safety Margin Deviation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredMetrics.map((metric) => {
                  const Icon = metricIcons[metric.name as keyof typeof metricIcons] ?? Gauge;
                  const ratio = getRatio(metric);
                  return (
                    <tr
                      key={metric.name}
                      className="hover:bg-white/[0.02] transition-colors duration-200 group"
                    >
                      {/* Signal Metric Column */}
                      <td className="py-3.5 px-4 flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.04] text-slate-400 group-hover:text-theme-accent group-hover:border-theme-accent/35 transition-colors">
                          <Icon size={14} />
                        </span>
                        <div>
                          <p className="font-bold text-white leading-normal">
                            {labels[metric.name] ?? metric.name}
                          </p>
                          <p className="text-[9px] text-slate-500 uppercase tracking-wide font-semibold mt-0.5">
                            {getMetricCategory(metric.name)}
                          </p>
                        </div>
                      </td>

                      {/* Current Value Column */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono text-sm font-bold text-white tabular-nums">
                          {metric.value.toLocaleString(undefined, {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span className="ml-1 text-[10px] text-slate-500 font-bold uppercase">
                          {metric.unit}
                        </span>
                      </td>

                      {/* Status Column */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${getRemarkColor(metric.status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${getDotColor(metric.status)} ${metric.status === "critical" ? "animate-pulse" : ""}`} />
                          {remarks[metric.status]}
                        </span>
                      </td>

                      {/* Threshold Limit Column */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono bg-white/[0.04] border border-white/[0.06] text-slate-300 font-bold px-2 py-0.5 rounded text-[10px]">
                          {metric.threshold}
                        </span>
                      </td>

                      {/* Safety Margin Progress Column */}
                      <td className="py-3.5 px-4 pl-6">
                        <div className="flex items-center gap-3 max-w-[200px]">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08] border border-white/[0.02]">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${getBarColor(metric.status)}`}
                              style={{ width: `${ratio}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] font-bold text-slate-500 w-8 text-right">
                            {Math.round(ratio)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
