"use client";

import { Calendar, Clock, Info, Package, Truck, Wrench } from "lucide-react";
import type { Equipment, EquipmentHealth } from "@/lib/types";

interface MaintenanceTimelineProps {
  equipment: Equipment[];
  healthMap: Record<string, EquipmentHealth>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function MaintenanceTimeline({
  equipment,
  healthMap,
  selectedId,
  onSelect,
}: MaintenanceTimelineProps) {
  // Let's define the time span: 7 days = 168 hours
  const totalHours = 168;

  const getEquipmentTasks = (item: Equipment, health?: EquipmentHealth) => {
    const status = health?.risk_level ?? item.status;
    
    // Determine planned downtime & maintenance tasks based on status
    if (status === "critical") {
      return {
        taskName: "Emergency Component Overhaul",
        startHour: 8,
        durationHours: 12,
        type: "downtime",
        downtimeSaved: 180,
      };
    } else if (status === "high") {
      return {
        taskName: "Urgent Sensor & Valve Replacement",
        startHour: 24,
        durationHours: 8,
        type: "maintenance",
        downtimeSaved: 120,
      };
    } else if (status === "medium") {
      return {
        taskName: "Preventive Calibration & Lubrication",
        startHour: 72,
        durationHours: 6,
        type: "maintenance",
        downtimeSaved: 45,
      };
    } else {
      return {
        taskName: "Routine System Diagnostics",
        startHour: 120,
        durationHours: 4,
        type: "routine",
        downtimeSaved: 15,
      };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical":
        return "from-red-500 to-rose-600";
      case "high":
        return "from-orange-500 to-amber-600";
      case "medium":
        return "from-amber-400 to-yellow-500";
      default:
        return "from-emerald-400 to-teal-500";
    }
  };

  return (
    <section className="panel-soft overflow-hidden p-5 transition-all duration-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.06] pb-4 mb-4">
        <div>
          <span className="kicker">Operational Schedule</span>
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-1">
            <Calendar size={18} className="text-theme-accent" />
            Predictive Maintenance Gantt Timeline
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Visualizing remaining useful life (RUL), scheduled work packages, and critical parts shipping ETAs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-5 rounded bg-gradient-to-r from-red-500 to-rose-600" />
            <span>RUL Margin</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-5 rounded bg-blue-500/30 border border-blue-400/30" />
            <span>Scheduled Maintenance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Truck size={14} className="text-cyan-400" />
            <span>Parts Shipment</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[760px] space-y-4">
          {/* Timeline header grid */}
          <div className="grid grid-cols-[220px_1fr] text-[10px] font-bold uppercase tracking-wider text-slate-500 pb-2">
            <div>Equipment Asset</div>
            <div className="grid grid-cols-7 text-center relative">
              <div className="border-l border-white/[0.04] py-1">Day 1 (24h)</div>
              <div className="border-l border-white/[0.04] py-1">Day 2 (48h)</div>
              <div className="border-l border-white/[0.04] py-1">Day 3 (72h)</div>
              <div className="border-l border-white/[0.04] py-1">Day 4 (96h)</div>
              <div className="border-l border-white/[0.04] py-1">Day 5 (120h)</div>
              <div className="border-l border-white/[0.04] py-1">Day 6 (144h)</div>
              <div className="border-l border-white/[0.04] py-1">Day 7 (168h)</div>
            </div>
          </div>

          {/* Timeline rows */}
          <div className="space-y-3">
            {equipment.map((item) => {
              const health = healthMap[item.id];
              const selected = selectedId === item.id;
              const status = health?.risk_level ?? item.status;
              const rulHours = health?.rul_estimate.hours ?? Math.max(1, Math.round((1 - item.criticality) * 72));
              
              // Calculate width percentages
              const rulPercent = Math.min(100, (rulHours / totalHours) * 100);
              const taskInfo = getEquipmentTasks(item, health);
              const taskLeft = (taskInfo.startHour / totalHours) * 100;
              const taskWidth = (taskInfo.durationHours / totalHours) * 100;

              // Find spare parts shipment ETAs
              const criticalSpare = health?.spares?.find(s => s.critical || s.lead_time_days > 0);
              const partsEtaDays = criticalSpare ? criticalSpare.lead_time_days : null;
              const partsEtaHour = partsEtaDays ? partsEtaDays * 24 : null;
              const partsEtaPercent = partsEtaHour ? (partsEtaHour / totalHours) * 100 : null;

              return (
                <div
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  className={`grid grid-cols-[220px_1fr] items-center rounded-lg border transition-all duration-300 cursor-pointer p-3 ${
                    selected
                      ? "border-theme-accent bg-theme-accent-glow/20 shadow-theme-glow"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
                  }`}
                >
                  {/* Left Column: Equipment Info */}
                  <div className="pr-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate max-w-[140px]">
                        {item.name}
                      </span>
                      <span className={`text-[9px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                        status === "critical"
                          ? "border-red-500/30 bg-red-500/10 text-red-400"
                          : status === "high"
                          ? "border-orange-500/30 bg-orange-500/10 text-orange-400"
                          : status === "medium"
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      }`}>
                        {status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span className="truncate">{item.area}</span>
                      <span className="font-mono text-slate-500">RUL: {rulHours}h</span>
                    </div>
                  </div>

                  {/* Right Column: Interactive Gantt Bars */}
                  <div className="relative h-12 w-full bg-slate-950/45 rounded border border-white/[0.04] overflow-hidden">
                    {/* Grid line dividers overlay */}
                    <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
                      <div className="border-l border-white/[0.04] h-full" />
                      <div className="border-l border-white/[0.04] h-full" />
                      <div className="border-l border-white/[0.04] h-full" />
                      <div className="border-l border-white/[0.04] h-full" />
                      <div className="border-l border-white/[0.04] h-full" />
                      <div className="border-l border-white/[0.04] h-full" />
                      <div className="border-l border-white/[0.04] h-full" />
                    </div>

                    {/* Remaining Useful Life (RUL) Bar */}
                    <div
                      className={`absolute top-2.5 h-2 rounded bg-gradient-to-r ${getStatusColor(status)} shadow-[0_0_10px_rgba(255,255,255,0.05)] transition-all duration-500`}
                      style={{ width: `${rulPercent}%`, left: "0" }}
                      title={`RUL Margin: ${rulHours} hours remaining`}
                    />

                    {/* Scheduled Maintenance Window */}
                    <div
                      className={`absolute top-7 h-3.5 rounded border text-[8px] font-mono font-bold flex items-center px-1 transition-all duration-500 ${
                        taskInfo.type === "downtime"
                          ? "border-red-500/40 bg-red-950/20 text-red-300"
                          : taskInfo.type === "maintenance"
                          ? "border-blue-500/40 bg-blue-950/20 text-blue-300"
                          : "border-slate-500/40 bg-slate-800/20 text-slate-300"
                      }`}
                      style={{ left: `${taskLeft}%`, width: `${taskWidth}%` }}
                      title={`${taskInfo.taskName} (${taskInfo.durationHours}h downtime. Est. savings: $${taskInfo.downtimeSaved * 15})`}
                    >
                      <span className="truncate flex items-center gap-0.5">
                        <Wrench size={8} />
                        {taskInfo.taskName}
                      </span>
                    </div>

                    {/* Parts Shipment Milestone Indicator */}
                    {partsEtaPercent && (
                      <div
                        className="absolute top-1 -translate-x-1/2 flex flex-col items-center group z-10"
                        style={{ left: `${partsEtaPercent}%` }}
                      >
                        <div className="h-4 w-4 rounded-full bg-cyan-950 border border-cyan-400 flex items-center justify-center shadow-[0_0_8px_rgba(34,211,238,0.4)] animate-bounce">
                          <Truck size={8} className="text-cyan-400" />
                        </div>
                        {/* Tooltip content visible on hover */}
                        <div className="absolute bottom-5 hidden group-hover:block bg-slate-900 border border-white/[0.08] text-[9px] text-white p-1 rounded whitespace-nowrap shadow-xl">
                          {criticalSpare?.name} (ETA {partsEtaDays}d)
                        </div>
                      </div>
                    )}

                    {/* Timeline Overlap Alert (Warn if Parts ETA is AFTER RUL expires) */}
                    {partsEtaHour && rulHours < partsEtaHour && (
                      <div
                        className="absolute right-2 top-1 flex items-center gap-1 rounded bg-red-950/80 border border-red-500/40 px-1 py-0.5 text-[8px] font-bold text-red-400 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                        title="Critical Alert: Parts shipment ETA exceeds equipment remaining useful life!"
                      >
                        <Info size={8} />
                        <span>Supply Chain Risk</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
