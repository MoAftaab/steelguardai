import { Activity, MapPin } from "lucide-react";
import type { Equipment, EquipmentHealth } from "@/lib/types";
import { RiskBadge } from "./RiskBadge";

interface Props {
  equipment: Equipment[];
  selectedId: string | null;
  healthMap: Record<string, EquipmentHealth>;
  onSelect: (id: string) => void;
}

export function EquipmentList({ equipment, selectedId, healthMap, onSelect }: Props) {
  return (
    <div className="space-y-3">
      {!equipment.length && (
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-4 text-sm font-semibold text-slate-500">
          No matching assets.
        </div>
      )}
      {equipment.map((item) => {
        const health = healthMap[item.id];
        const selected = selectedId === item.id;
        return (
          <button
            key={item.id}
            type="button"
            title={`Open ${item.name}`}
            onClick={() => onSelect(item.id)}
            className={`focus-ring relative min-h-[116px] w-full overflow-hidden rounded-lg border p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-coolant-500/30 hover:bg-white/[0.06] hover:shadow-[0_0_20px_rgba(20,184,166,0.15)] ${
              selected
                ? "border-coolant-500/40 bg-coolant-500/10 shadow-[0_0_0_3px_rgba(20,184,166,0.15)]"
                : "border-white/[0.08] bg-white/[0.03]"
            }`}
          >
            <span className={`absolute inset-y-0 left-0 w-1 ${selected ? "bg-coolant-400" : "bg-white/[0.1]"}`} />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{item.name}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                  <MapPin size={13} />
                  {item.area}
                </p>
              </div>
              <RiskBadge risk={health?.risk_level ?? item.status} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-2 text-xs text-slate-400">
              <span className="flex min-w-0 items-center gap-1">
                <Activity size={13} />
                <span className="truncate">Priority {health?.priority_score ?? Math.round(item.criticality * 100)}</span>
              </span>
              <span className="shrink-0">RUL {health?.rul_estimate.hours ?? "-"}h</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
