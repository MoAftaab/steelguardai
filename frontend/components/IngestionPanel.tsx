"use client";

import { Bell, ClipboardList, Database, FileText, Loader2, Package, Siren, UploadCloud } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type {
  Equipment,
  IngestAlertsPayload,
  IngestDocumentPayload,
  IngestFaultEventsPayload,
  IngestLogsPayload,
  IngestSparesPayload,
  RiskLevel,
  SensorBatchPayload
} from "@/lib/types";

type IngestMode = "document" | "log" | "sensor" | "fault" | "alert" | "spare";
type IngestPayload =
  | IngestDocumentPayload
  | IngestLogsPayload
  | SensorBatchPayload
  | IngestFaultEventsPayload
  | IngestAlertsPayload
  | IngestSparesPayload;

interface Props {
  equipment: Equipment[];
  selectedId?: string | null;
  busy?: boolean;
  onSelectEquipment: (equipmentId: string) => void;
  onIngest: (mode: IngestMode, payload: IngestPayload) => Promise<void>;
}

const modeItems = [
  { id: "document", label: "Document", icon: FileText, target: "RAG evidence" },
  { id: "log", label: "Log", icon: ClipboardList, target: "RAG evidence" },
  { id: "sensor", label: "Sensor", icon: Database, target: "Health chart" },
  { id: "fault", label: "Fault", icon: Siren, target: "Alerts + RAG" },
  { id: "alert", label: "Alert", icon: Bell, target: "Alerts panel" },
  { id: "spare", label: "Spare", icon: Package, target: "Spare strategy" }
] as const;

export function IngestionPanel({ equipment, selectedId, busy, onSelectEquipment, onIngest }: Props) {
  const [mode, setMode] = useState<IngestMode>("document");
  const [equipmentId, setEquipmentId] = useState(selectedId ?? equipment[0]?.id ?? "");
  const [sourceType, setSourceType] = useState<IngestDocumentPayload["source_type"]>("sop");
  const [docTitle, setDocTitle] = useState("Uploaded maintenance guidance");
  const [docSection, setDocSection] = useState("Field note");
  const [docText, setDocText] = useState("Inspect coupling alignment, bearing lubrication, and abnormal vibration before restart.");
  const [logTitle, setLogTitle] = useState("Equipment delay log");
  const [logSummary, setLogSummary] = useState("Operator observed abnormal noise and rising temperature during the last campaign.");
  const [rootCause, setRootCause] = useState("Pending confirmation");
  const [actionTaken, setActionTaken] = useState("Logged for maintenance review");
  const [downtime, setDowntime] = useState(15);
  const [metricsJson, setMetricsJson] = useState("{\n  \"temperature_c\": 94,\n  \"vibration_mm_s\": 7.8,\n  \"delay_minutes\": 18\n}");
  const [faultCode, setFaultCode] = useState("DRV-THERM-92");
  const [faultSystem, setFaultSystem] = useState("PLC");
  const [faultSeverity, setFaultSeverity] = useState<RiskLevel>("high");
  const [faultMessage, setFaultMessage] = useState("Drive thermal warning with vibration rise during load ramp.");
  const [faultSignal, setFaultSignal] = useState("temperature_c");
  const [faultValue, setFaultValue] = useState(92);
  const [faultAction, setFaultAction] = useState("Reduce load, inspect bearing lubrication, and verify coupling alignment.");
  const [alertSeverity, setAlertSeverity] = useState<RiskLevel>("high");
  const [alertMessage, setAlertMessage] = useState("Manual abnormality alert: vibration crossed warning band.");
  const [alertSignal, setAlertSignal] = useState("vibration_mm_s");
  const [alertValue, setAlertValue] = useState(7.6);
  const [spareId, setSpareId] = useState("spare-ui-bearing-kit");
  const [spareName, setSpareName] = useState("Drive-end bearing kit");
  const [spareStock, setSpareStock] = useState(1);
  const [spareLeadTime, setSpareLeadTime] = useState(14);
  const [spareSupplier, setSpareSupplier] = useState("Approved vendor");
  const [spareCritical, setSpareCritical] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedId) setEquipmentId(selectedId);
  }, [selectedId]);

  const selectedEquipment = useMemo(
    () => equipment.find((item) => item.id === equipmentId) ?? equipment[0],
    [equipment, equipmentId]
  );
  const currentMode = modeItems.find((item) => item.id === mode) ?? modeItems[0];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedEquipment) return;
    setError(null);
    setLastUpdate(null);

    // ── Validate required fields before sending to backend ──
    if (mode === "document" && !docText.trim()) {
      setError("Document text is required. Add the content you want to ingest.");
      return;
    }
    if (mode === "log" && !logSummary.trim()) {
      setError("Log summary is required. Describe the maintenance event.");
      return;
    }
    if (mode === "fault" && !faultMessage.trim()) {
      setError("Fault message is required. Describe the fault event.");
      return;
    }
    if (mode === "alert" && !alertMessage.trim()) {
      setError("Alert message is required. Describe the abnormality.");
      return;
    }
    if (mode === "sensor") {
      try {
        const parsed = JSON.parse(metricsJson);
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
          setError("Metrics must be a JSON object, e.g. {\"temperature_c\": 94}.");
          return;
        }
        const badKeys = Object.entries(parsed).filter(([, v]) => typeof v !== "number");
        if (badKeys.length > 0) {
          setError(`All metric values must be numbers. Non-numeric keys: ${badKeys.map(([k]) => k).join(", ")}`);
          return;
        }
      } catch {
        setError("Invalid JSON in Metrics field. Check for missing commas, brackets, or trailing commas.");
        return;
      }
    }
    if (mode === "spare" && !spareName.trim()) {
      setError("Spare part name is required.");
      return;
    }

    try {
      if (mode === "document") {
        await onIngest("document", {
          equipment_id: selectedEquipment.id,
          source_type: sourceType,
          title: docTitle.trim() || "Uploaded maintenance note",
          section: docSection.trim() || "Uploaded",
          text: docText.trim()
        });
      } else if (mode === "log") {
        await onIngest("log", {
          logs: [
            {
              id: `log-ui-${Date.now()}`,
              equipment_id: selectedEquipment.id,
              timestamp: new Date().toISOString(),
              title: logTitle.trim() || "Uploaded maintenance log",
              summary: logSummary.trim(),
              downtime_minutes: Math.max(0, Number(downtime) || 0),
              root_cause: rootCause.trim() || "Pending confirmation",
              action_taken: actionTaken.trim() || "Logged for review"
            }
          ]
        });
      } else if (mode === "sensor") {
        const metrics = JSON.parse(metricsJson) as Record<string, number>;
        await onIngest("sensor", {
          readings: [
            {
              equipment_id: selectedEquipment.id,
              timestamp: new Date().toISOString(),
              metrics
            }
          ]
        });
      } else if (mode === "fault") {
        await onIngest("fault", {
          events: [
            {
              id: `fault-ui-${Date.now()}`,
              equipment_id: selectedEquipment.id,
              timestamp: new Date().toISOString(),
              source_system: faultSystem.trim() || "control_system",
              code: faultCode.trim() || undefined,
              severity: faultSeverity,
              message: faultMessage.trim(),
              signal: faultSignal.trim() || undefined,
              value: Number(faultValue) || 0,
              recommended_action: faultAction.trim() || undefined
            }
          ]
        });
      } else if (mode === "alert") {
        await onIngest("alert", {
          alerts: [
            {
              id: `alert-ui-${Date.now()}`,
              equipment_id: selectedEquipment.id,
              timestamp: new Date().toISOString(),
              severity: alertSeverity,
              message: alertMessage.trim(),
              signal: alertSignal.trim() || "manual_alert",
              value: Number(alertValue) || 0,
              acknowledged: false
            }
          ]
        });
      } else {
        await onIngest("spare", {
          spares: [
            {
              id: spareId.trim() || `spare-ui-${Date.now()}`,
              equipment_id: selectedEquipment.id,
              name: spareName.trim(),
              stock: Math.max(0, Number(spareStock) || 0),
              lead_time_days: Math.max(0, Number(spareLeadTime) || 0),
              supplier: spareSupplier.trim() || "Unknown supplier",
              critical: spareCritical
            }
          ]
        });
      }
      setLastUpdate(`${currentMode.label} saved for ${selectedEquipment.name}. Check ${currentMode.target} after refresh.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to ingest payload.");
    }
  }

  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-white/[0.06] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="kicker">Ingestion</p>
            <h2 className="mt-1 flex items-center gap-2 text-base font-bold text-white">
              <UploadCloud size={18} className="text-coolant-400" />
              Add plant context
            </h2>
          </div>
          <select
            aria-label="Ingestion equipment"
            value={selectedEquipment?.id ?? ""}
            onChange={(event) => setEquipmentId(event.target.value)}
            className="field-control min-w-0 text-sm font-semibold"
          >
            {equipment.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {modeItems.map((item) => {
            const Icon = item.icon;
            const active = mode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id)}
                className={`focus-ring inline-flex h-9 items-center justify-center gap-1.5 rounded-md border text-xs font-bold transition-all duration-300 ${
                  active
                    ? "border-coolant-500/30 bg-coolant-500/10 text-coolant-400 shadow-[0_0_12px_rgba(20,184,166,0.1)]"
                    : "border-white/[0.08] bg-white/[0.04] text-slate-400 hover:border-coolant-500/20 hover:bg-coolant-500/5 hover:text-coolant-400"
                }`}
              >
                <Icon size={14} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={submit} className="space-y-3 p-5">
        <p className="rounded-md border border-coolant-500/20 bg-coolant-500/[0.08] px-3 py-2 text-xs font-semibold leading-5 text-coolant-300">
          Saves into {currentMode.target}. After submit, the selected asset, recommendation, alerts, and evidence refresh.
        </p>

        {mode === "document" && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                Source
                <select
                  value={sourceType}
                  onChange={(event) => setSourceType(event.target.value as IngestDocumentPayload["source_type"])}
                  className="field-control w-full text-sm font-semibold normal-case tracking-normal"
                >
                  <option value="sop">SOP</option>
                  <option value="manual">Manual</option>
                  <option value="failure_report">Failure report</option>
                  <option value="incident_record">Incident record</option>
                  <option value="breakdown_summary">Breakdown summary</option>
                </select>
              </label>
              <Field label="Section" value={docSection} onChange={setDocSection} />
            </div>
            <Field label="Title" value={docTitle} onChange={setDocTitle} />
            <TextArea label="Text" value={docText} onChange={setDocText} rows={5} />
          </>
        )}

        {mode === "log" && (
          <>
            <Field label="Title" value={logTitle} onChange={setLogTitle} />
            <TextArea label="Summary" value={logSummary} onChange={setLogSummary} rows={3} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Root cause" value={rootCause} onChange={setRootCause} />
              <NumberField label="Downtime min" value={downtime} onChange={setDowntime} />
            </div>
            <Field label="Action taken" value={actionTaken} onChange={setActionTaken} />
          </>
        )}

        {mode === "sensor" && (
          <TextArea label="Metrics JSON" value={metricsJson} onChange={setMetricsJson} rows={7} monospace />
        )}

        {mode === "fault" && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Fault code" value={faultCode} onChange={setFaultCode} />
              <Field label="Source system" value={faultSystem} onChange={setFaultSystem} />
            </div>
            <SeveritySelect value={faultSeverity} onChange={setFaultSeverity} />
            <TextArea label="Fault message" value={faultMessage} onChange={setFaultMessage} rows={3} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Signal" value={faultSignal} onChange={setFaultSignal} />
              <NumberField label="Value" value={faultValue} onChange={setFaultValue} />
            </div>
            <Field label="Recommended action" value={faultAction} onChange={setFaultAction} />
          </>
        )}

        {mode === "alert" && (
          <>
            <SeveritySelect value={alertSeverity} onChange={setAlertSeverity} />
            <TextArea label="Alert message" value={alertMessage} onChange={setAlertMessage} rows={3} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Signal" value={alertSignal} onChange={setAlertSignal} />
              <NumberField label="Value" value={alertValue} onChange={setAlertValue} />
            </div>
          </>
        )}

        {mode === "spare" && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Spare id" value={spareId} onChange={setSpareId} />
              <Field label="Name" value={spareName} onChange={setSpareName} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <NumberField label="Stock" value={spareStock} onChange={setSpareStock} />
              <NumberField label="Lead time days" value={spareLeadTime} onChange={setSpareLeadTime} />
            </div>
            <Field label="Supplier" value={spareSupplier} onChange={setSpareSupplier} />
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <input
                type="checkbox"
                checked={spareCritical}
                onChange={(event) => setSpareCritical(event.target.checked)}
                className="h-4 w-4 rounded border-white/[0.15] bg-white/[0.05] text-coolant-500 focus:ring-coolant-500"
              />
              Critical spare
            </label>
          </>
        )}

        {lastUpdate && <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-400">{lastUpdate}</p>}
        {error && <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={busy || !selectedEquipment}
          className="focus-ring inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-white text-sm font-bold text-slate-900 shadow-sm transition-all duration-300 hover:bg-slate-100 hover:shadow-lg disabled:opacity-60"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
          Ingest {currentMode.label}
        </button>
      </form>
    </section>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="space-y-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field-control w-full text-sm font-semibold normal-case tracking-normal"
      />
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="space-y-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
      {label}
      <input
        type="number"
        min={0}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="field-control w-full text-sm font-semibold normal-case tracking-normal"
      />
    </label>
  );
}

function SeveritySelect({ value, onChange }: { value: RiskLevel; onChange: (value: RiskLevel) => void }) {
  return (
    <label className="space-y-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
      Severity
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as RiskLevel)}
        className="field-control w-full text-sm font-semibold normal-case tracking-normal"
      >
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="critical">Critical</option>
        <option value="low">Low</option>
      </select>
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows,
  monospace
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
  monospace?: boolean;
}) {
  return (
    <label className="space-y-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
      {label}
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className={`field-control w-full text-sm normal-case tracking-normal ${monospace ? "font-mono" : "font-semibold"}`}
      />
    </label>
  );
}
