"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { EquipmentHealth } from "@/lib/types";

const colors = ["#0f9b8e", "#2563eb", "#c46a2b", "#d33f49", "#4b6572"];

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

function normalizeToLimit(value: number, threshold?: Record<string, number>) {
  if (!threshold) return value;
  if (typeof threshold.max === "number" && threshold.max > 0) {
    return Math.round((value / threshold.max) * 100);
  }
  if (typeof threshold.min === "number" && threshold.min > 0) {
    return Math.round((value / threshold.min) * 100);
  }
  return value;
}

export function HealthChart({ health }: { health: EquipmentHealth }) {
  const metricKeys = Object.keys(health.latest_reading.metrics);
  const rows = health.trend.map((reading) => {
    const time = new Date(reading.timestamp);
    return {
      time: time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      ...Object.fromEntries(
        metricKeys.map((key) => [key, normalizeToLimit(reading.metrics[key], health.equipment.thresholds[key])])
      )
    };
  });

  return (
    <div className="panel h-[350px] w-full p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="muted-label">Telemetry trend</p>
          <h3 className="mt-1 text-base font-bold text-steel-900">{health.equipment.name}</h3>
          <p className="mt-1 text-xs font-semibold text-steel-500">Signals shown as percent of their limit</p>
        </div>
        <span className="card-muted px-2 py-1 text-xs font-semibold text-steel-600">
          {rows.length} samples
        </span>
      </div>
      <div className="mt-4 h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 10, right: 22, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dfe7ea" vertical={false} />
            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#637985", fontSize: 12 }} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#637985", fontSize: 12 }}
              width={42}
              domain={[0, 140]}
              tickFormatter={(value) => `${value}%`}
            />
            <ReferenceLine y={100} stroke="#971d2a" strokeDasharray="4 4" />
            <Tooltip
              contentStyle={{
                borderColor: "#cfd9de",
                borderRadius: 8,
                boxShadow: "0 18px 44px rgba(14,23,27,0.12)"
              }}
              labelStyle={{ color: "#172126", fontWeight: 700 }}
              formatter={(value, name) => [`${Number(value).toFixed(0)}%`, name]}
            />
            <Legend verticalAlign="top" height={28} iconType="line" wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
            {metricKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={labelMetric(key)}
                stroke={colors[index % colors.length]}
                strokeWidth={2.4}
                dot={false}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
