import { Factory, Gauge, Waves, Zap } from "lucide-react";
import type { Equipment, EquipmentHealth } from "@/lib/types";
import { RiskBadge } from "./RiskBadge";

const icons = [Factory, Waves, Zap];

interface Props {
  equipment: Equipment[];
  healthMap: Record<string, EquipmentHealth>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ProcessTwin({ equipment, healthMap, selectedId, onSelect }: Props) {
  return (
    <section className="panel p-5">
      {/* SVG SCADA Pipeline Flow */}
      <div className="mb-6 rounded-lg bg-slate-950/60 p-4 border border-white/[0.04] relative overflow-hidden">
        <svg className="w-full h-24" viewBox="0 0 800 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <style>{`
            @keyframes flow-dash {
              to {
                stroke-dashoffset: -20;
              }
            }
            .animate-flow-dash {
              animation: flow-dash 1.5s linear infinite;
            }
          `}</style>
          
          {/* Animated Flowing Telemetry Paths */}
          <path
            d="M 160 50 L 400 50"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M 160 50 L 400 50"
            stroke="url(#flowGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="6 10"
            className="animate-flow-dash"
          />

          <path
            d="M 400 50 L 640 50"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M 400 50 L 640 50"
            stroke="url(#flowGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="6 10"
            className="animate-flow-dash"
          />

          <defs>
            <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
          </defs>

          {/* Render click-active equipment nodes */}
          {equipment.map((item, index) => {
            const health = healthMap[item.id];
            const selected = selectedId === item.id;
            const severity = health?.risk_level ?? item.status;
            
            // Status colors mapping
            const colorClass = 
              severity === "critical" ? "#f43f5e" :
              severity === "high" ? "#fb923c" :
              severity === "medium" ? "#fbbf24" :
              "#10b981";

            const xPos = index === 0 ? 160 : index === 1 ? 400 : 640;

            return (
              <g 
                key={item.id} 
                className="cursor-pointer group"
                onClick={() => onSelect(item.id)}
              >
                {/* Selected Glowing Halo */}
                {selected && (
                  <circle
                    cx={xPos}
                    cy="50"
                    r="22"
                    fill="none"
                    stroke={colorClass}
                    strokeWidth="2.5"
                    className="animate-pulse"
                    style={{ opacity: 0.5 }}
                  />
                )}
                {/* Outer ring */}
                <circle
                  cx={xPos}
                  cy="50"
                  r="18"
                  fill="#0f172a"
                  stroke={selected ? colorClass : "rgba(255,255,255,0.12)"}
                  strokeWidth={selected ? "3" : "1.5"}
                  className="transition-all duration-300 group-hover:stroke-coolant-400"
                />
                {/* Inner status dot */}
                <circle
                  cx={xPos}
                  cy="50"
                  r="8"
                  fill={colorClass}
                  className={severity === "critical" ? "animate-pulse" : ""}
                />
                {/* Label */}
                <text
                  x={xPos}
                  y="88"
                  textAnchor="middle"
                  fill={selected ? "#ffffff" : "#94a3b8"}
                  className="text-[10px] font-bold tracking-wide transition-colors font-sans"
                >
                  {item.area}
                </text>
                {/* Small Type indicator */}
                <text
                  x={xPos}
                  y="24"
                  textAnchor="middle"
                  fill={colorClass}
                  className="text-[9px] font-mono tracking-wider transition-colors uppercase font-bold"
                >
                  {severity}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-stretch xl:justify-between">
        <div className="flex min-w-[230px] flex-col justify-between rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
          <div>
            <p className="kicker">Digital twin stream</p>
            <h2 className="mt-2 text-base font-bold text-white">Steel plant equipment line</h2>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-400">
            Assets are sequenced by production flow with live RUL, priority, and risk state.
          </p>
        </div>
        <div className="grid flex-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {equipment.map((item, index) => {
            const Icon = icons[index % icons.length];
            const health = healthMap[item.id];
            const selected = selectedId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                title={`Inspect ${item.name}`}
                onClick={() => onSelect(item.id)}
                className={`focus-ring min-h-[140px] rounded-md border p-4 text-left transition-all duration-300 hover:-translate-y-0.5 ${
                  selected
                    ? "border-coolant-500/40 bg-coolant-500/10 shadow-[0_0_0_3px_rgba(20,184,166,0.15)]"
                    : "border-white/[0.08] bg-white/[0.04] hover:border-coolant-500/30 hover:shadow-[0_0_20px_rgba(20,184,166,0.15)]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-md ${
                    selected ? "bg-coolant-500 text-white" : "bg-white/[0.1] text-slate-300"
                  }`}>
                    <Icon size={18} />
                  </span>
                  <RiskBadge risk={health?.risk_level ?? item.status} />
                </div>
                <p className="mt-3 truncate text-sm font-bold text-white">{item.area}</p>
                <p className="mt-1 truncate text-xs text-slate-500">{item.asset_type}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-slate-400">
                    Priority {health?.priority_score ?? "-"}
                  </span>
                  <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-slate-400">
                    RUL {health?.rul_estimate.hours ?? "-"}h
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.1]">
        <div className="h-2 rounded-full bg-gradient-to-r from-coolant via-purple-500 to-signal" style={{ width: "72%" }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs font-semibold text-slate-500">
        <span>UCI AI4I rows</span>
        <span className="flex items-center gap-1">
          <Gauge size={13} />
          live telemetry mapping
        </span>
      </div>
    </section>
  );
}
