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
        <div className="rounded-lg border border-dashed border-steel-300 bg-white/80 p-4 text-sm font-semibold text-steel-500 shadow-sm">
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
            className={`focus-ring relative min-h-[116px] w-full overflow-hidden rounded-lg border p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:border-coolant-300 hover:shadow-lifted ${
              selected
                ? "border-coolant-300 bg-coolant-50/80 shadow-[0_0_0_3px_rgba(15,155,142,0.10)]"
                : "border-steel-200/90 bg-white/95"
            }`}
          >
            <span className={`absolute inset-y-0 left-0 w-1 ${selected ? "bg-coolant" : "bg-steel-200"}`} />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-steel-900">{item.name}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-steel-600">
                  <MapPin size={13} />
                  {item.area}
                </p>
              </div>
              <RiskBadge risk={health?.risk_level ?? item.status} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-steel-200/70 bg-steel-50/80 px-2.5 py-2 text-xs text-steel-600 shadow-insetline">
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
