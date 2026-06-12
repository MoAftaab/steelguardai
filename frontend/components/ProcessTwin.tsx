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
