"use client";

import type { ComponentType, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Bell,
  Bot,
  Boxes,
  Brain,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Database,
  Factory,
  FileText,
  Gauge,
  Home as HomeIcon,
  Loader2,
  Menu,
  MessageSquare,
  Package,
  Pause,
  Play,
  RefreshCw,
  Server,
  ShieldCheck,
  Siren,
  Sparkles,
  TrendingUp,
  UserCircle,
  Wrench,
  Zap
} from "lucide-react";
import { EquipmentList } from "@/components/EquipmentList";
import { HealthChart } from "@/components/HealthChart";
import { IngestionPanel } from "@/components/IngestionPanel";
import { MetricTile } from "@/components/MetricTile";
import { ProcessTwin } from "@/components/ProcessTwin";
import { PredictiveInsights } from "@/components/PredictiveInsights";
import { RecommendationPanel } from "@/components/RecommendationPanel";
import { ReportPanel } from "@/components/ReportPanel";
import { RiskBadge } from "@/components/RiskBadge";
import { WizardChat } from "@/components/WizardChat";
import { api } from "@/lib/api";
import type {
  Alert,
  ChatResponse,
  DatasetStatus,
  Equipment,
  EquipmentHealth,
  FeedbackPayload,
  FeedbackRating,
  IngestAlertsPayload,
  IngestDocumentPayload,
  IngestFaultEventsPayload,
  IngestLogsPayload,
  IngestSparesPayload,
  MlPrediction,
  PlantSummary,
  ProcessDefect,
  Recommendation,
  ReportResponse,
  RiskLevel,
  RoleNotification,
  RoleOption,
  SensorBatchPayload,
  UserRole
} from "@/lib/types";

type ApiStatus = "checking" | "online" | "offline";
type MlValidationMetrics = {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1?: number;
};

const emptySummary: PlantSummary = {
  equipment_count: 0,
  open_alert_count: 0,
  critical_alert_count: 0,
  average_rul_hours: 0,
  highest_priority: 0,
  dataset_rows_loaded: 0,
  stream_step: 0
};

const navigationItems = [
  { label: "Dashboard", icon: HomeIcon, target: "dashboard" },
  { label: "Health", icon: Gauge, target: "predictive-health" },
  { label: "Assets", icon: Factory, target: "equipment" },
  { label: "Alerts", icon: Siren, target: "alerts" },
  { label: "Copilot", icon: MessageSquare, target: "ai-copilot" },
  { label: "Ingest", icon: Database, target: "ingestion" },
  { label: "Maintenance", icon: Wrench, target: "maintenance" },
  { label: "Reports", icon: FileText, target: "reports" }
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value?: number, options?: { digits?: number; floor?: boolean }) {
  if (typeof value !== "number") return "Training";
  const digits = options?.digits ?? 2;
  const percent = options?.floor ? Math.floor(value * 100) : value * 100;
  return `${new Intl.NumberFormat("en", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(percent)}%`;
}

function compactTime(value?: string) {
  if (!value) return "Waiting";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function compactDate(value?: string) {
  if (!value) return "Waiting";
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function riskBarColor(risk: RiskLevel) {
  if (risk === "critical") return "bg-red-500";
  if (risk === "high") return "bg-orange-500";
  if (risk === "medium") return "bg-amber-500";
  return "bg-emerald-500";
}

function riskTextColor(risk: RiskLevel) {
  if (risk === "critical") return "text-red-600";
  if (risk === "high") return "text-orange-600";
  if (risk === "medium") return "text-amber-600";
  return "text-emerald-600";
}

export default function Home() {
  const [summary, setSummary] = useState<PlantSummary>(emptySummary);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dataset, setDataset] = useState<DatasetStatus | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [healthMap, setHealthMap] = useState<Record<string, EquipmentHealth>>({});
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [live, setLive] = useState(true);
  const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [openaiEnabled, setOpenaiEnabled] = useState(false);
  const [ragProvider, setRagProvider] = useState("checking");
  const [mlModelLabel, setMlModelLabel] = useState("checking");
  const [mlValidationMetrics, setMlValidationMetrics] = useState<MlValidationMetrics | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [selectedRole, setSelectedRole] = useState<UserRole>("maintenance_engineer");
  const [notifications, setNotifications] = useState<RoleNotification[]>([]);
  const [notificationsUpdatedAt, setNotificationsUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    void loadDashboard();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    void loadSelected(selectedId);
  }, [selectedId]);

  useEffect(() => {
    if (!live) return;
    const timer = window.setInterval(() => {
      void advanceStream();
    }, 6000);
    return () => window.clearInterval(timer);
  }, [live, selectedId, equipment, healthMap]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    void loadNotifications(selectedRole);
  }, [selectedRole]);

  const selectedHealth = selectedId ? healthMap[selectedId] : null;
  const selectedEquipment = selectedHealth?.equipment ?? equipment.find((item) => item.id === selectedId) ?? null;
  const selectedAlert = useMemo(
    () => alerts.find((alert) => alert.equipment_id === selectedId),
    [alerts, selectedId]
  );

  const equipmentWithHealth = useMemo(() => {
    return equipment.map((item) => {
      const health = healthMap[item.id];
      return {
        ...item,
        risk: health?.risk_level ?? item.status,
        priority: health?.priority_score ?? Math.round(item.criticality * 100),
        rul: health?.rul_estimate.hours ?? Math.max(1, Math.round((1 - item.criticality) * 72)),
        anomaly: health?.anomaly_score ?? 0,
        mlProbability: health?.ml_prediction?.failure_probability ?? 0
      };
    });
  }, [equipment, healthMap]);

  const riskRankedEquipment = useMemo(
    () => [...equipmentWithHealth].sort((a, b) => b.priority - a.priority),
    [equipmentWithHealth]
  );
  const topCriticalEquipment = useMemo(
    () => riskRankedEquipment.slice(0, 5),
    [riskRankedEquipment]
  );

  const healthOverview = useMemo(() => {
    const counts = equipmentWithHealth.reduce(
      (items, item) => {
        if (item.risk === "low") items.healthy += 1;
        if (item.risk === "medium" || item.risk === "high") items.warning += 1;
        if (item.risk === "critical") items.critical += 1;
        return items;
      },
      { healthy: 0, warning: 0, critical: 0 }
    );
    const total = equipment.length || summary.equipment_count || 0;
    return { ...counts, unknown: Math.max(0, total - counts.healthy - counts.warning - counts.critical), total };
  }, [equipment.length, equipmentWithHealth, summary.equipment_count]);

  const healthScore = useMemo(() => {
    const entries = Object.values(healthMap);
    if (!entries.length) return 0;
    const averageAnomaly = entries.reduce((total, item) => total + item.anomaly_score, 0) / entries.length;
    return Math.max(1, Math.min(100, Math.round(100 - averageAnomaly * 100)));
  }, [healthMap]);

  const selectedEquipmentName = selectedEquipment?.name ?? topCriticalEquipment[0]?.name ?? "Select equipment";
  const selectedPriority = selectedHealth?.priority_score ?? topCriticalEquipment[0]?.priority ?? summary.highest_priority;
  const selectedRisk = selectedHealth?.risk_level ?? topCriticalEquipment[0]?.risk ?? "medium";
  const selectedRul = selectedHealth?.rul_estimate.hours ?? summary.average_rul_hours;
  const selectedAnomaly = selectedHealth ? Math.round(selectedHealth.anomaly_score * 100) : 0;
  const selectedMlProbability = selectedHealth?.ml_prediction ? Math.round(selectedHealth.ml_prediction.failure_probability * 100) : 0;
  const currentStep = dataset?.stream_step ?? summary.stream_step;
  const selectedRoleLabel = roles.find((role) => role.id === selectedRole)?.label ?? "Maintenance Engineer";

  async function loadDashboard() {
    setBusy(true);
    setError(null);
    setApiStatus("checking");
    try {
      const healthPayload = await api.healthz();
      const [summaryPayload, equipmentPayload, alertPayload, datasetPayload] = await Promise.all([
        api.summary(),
        api.equipment(),
        api.alerts(),
        api.dataset()
      ]);
      const [rolesPayload, notificationPayload] = await Promise.all([
        api.roles(),
        api.notifications(selectedRole)
      ]);
      const healthEntries = await Promise.all(
        equipmentPayload.map(async (item) => [item.id, await api.health(item.id)] as const)
      );
      setSummary(summaryPayload);
      setEquipment(equipmentPayload);
      setAlerts(alertPayload);
      setDataset(datasetPayload);
      setRoles(rolesPayload);
      setNotifications(notificationPayload);
      setNotificationsUpdatedAt(new Date().toISOString());
      setHealthMap(Object.fromEntries(healthEntries));
      setOpenaiEnabled(Boolean(healthPayload.openai));
      setRagProvider(healthPayload.rag?.provider?.replaceAll("_", " ") ?? "unknown");
      setMlModelLabel(healthPayload.ml?.available ? healthPayload.ml.model_name ?? "trained model" : "unavailable");
      setMlValidationMetrics(
        healthPayload.ml?.available
          ? {
              accuracy: healthPayload.ml.validation_accuracy,
              precision: healthPayload.ml.validation_precision,
              recall: healthPayload.ml.validation_recall,
              f1: healthPayload.ml.validation_f1
            }
          : null
      );
      setSelectedId((current) => {
        if (current && equipmentPayload.some((item) => item.id === current)) return current;
        return alertPayload[0]?.equipment_id ?? equipmentPayload[0]?.id ?? null;
      });
      setApiStatus("online");
    } catch (caught) {
      setApiStatus("offline");
      setError(caught instanceof Error ? caught.message : "Unable to load SteelGuard AI.");
    } finally {
      setBusy(false);
    }
  }

  async function loadSelected(equipmentId: string) {
    setBusy(true);
    setError(null);
    try {
      const alertPayload = await api.alerts();
      const selectedAlertForRecommendation = alertPayload.find((item) => item.equipment_id === equipmentId);
      const [healthPayload, recommendationPayload] = await Promise.all([
        api.health(equipmentId),
        api.recommendation(equipmentId, selectedAlertForRecommendation?.id)
      ]);
      setAlerts(alertPayload);
      setHealthMap((items) => ({ ...items, [equipmentId]: healthPayload }));
      setRecommendation(recommendationPayload);
      setReport(null);
      setApiStatus("online");
    } catch (caught) {
      setApiStatus("offline");
      setError(caught instanceof Error ? caught.message : "Unable to analyze equipment.");
    } finally {
      setBusy(false);
    }
  }

  async function loadNotifications(role: UserRole) {
    try {
      const payload = await api.notifications(role);
      setNotifications(payload);
      setNotificationsUpdatedAt(new Date().toISOString());
    } catch {
      setNotifications([]);
      setNotificationsUpdatedAt(new Date().toISOString());
    }
  }

  async function advanceStream() {
    setError(null);
    try {
      const datasetPayload = await api.tick(1);
      const [summaryPayload, alertPayload, notificationPayload] = await Promise.all([
        api.summary(),
        api.alerts(),
        api.notifications(selectedRole)
      ]);
      const equipmentIds = equipment.length ? equipment.map((item) => item.id) : Object.keys(healthMap);
      const healthEntries = await Promise.all(
        equipmentIds.map(async (item) => [item, await api.health(item)] as const)
      );
      setDataset(datasetPayload);
      setSummary(summaryPayload);
      setAlerts(alertPayload);
      setNotifications(notificationPayload);
      setNotificationsUpdatedAt(new Date().toISOString());
      setHealthMap((items) => ({ ...items, ...Object.fromEntries(healthEntries) }));
      if (selectedId) {
        const selectedAlertAfterTick = alertPayload.find((item) => item.equipment_id === selectedId);
        const nextRecommendation = await api.recommendation(selectedId, selectedAlertAfterTick?.id);
        setRecommendation(nextRecommendation);
      }
      setApiStatus("online");
    } catch (caught) {
      setLive(false);
      setApiStatus("offline");
      setError(caught instanceof Error ? caught.message : "Unable to advance live stream.");
    }
  }

  async function sendChat(message: string): Promise<ChatResponse> {
    const response = await api.chat(message, selectedId ?? undefined, selectedAlert?.id, conversationId);
    setConversationId(response.conversation_id);
    setApiStatus("online");
    return response;
  }

  function startNewChat() {
    setConversationId(undefined);
    setNotice("Started a new copilot chat.");
  }

  function onChatResponse(response: ChatResponse) {
    setRecommendation(response.recommendation);
    setReport(null);
  }

  async function generateReport() {
    if (!selectedId) return;
    setBusy(true);
    setError(null);
    try {
      const payload = await api.report(selectedId, recommendation?.id);
      setReport(payload);
      setNotice("Report generated from the selected recommendation.");
      setApiStatus("online");
    } catch (caught) {
      setApiStatus("offline");
      setError(caught instanceof Error ? caught.message : "Unable to generate report.");
    } finally {
      setBusy(false);
    }
  }

  async function recordFeedback(payload: FeedbackPayload) {
    if (!recommendation || !selectedId) return;
    setBusy(true);
    setError(null);
    try {
      await api.feedback(payload);
      const label: Record<FeedbackRating, string> = {
        accepted: "accepted",
        corrected: "correction saved",
        rejected: "rejection saved"
      };
      setNotice(`Feedback recorded: ${label[payload.rating]}. Future recommendations can use this outcome.`);
      setApiStatus("online");
    } catch (caught) {
      setApiStatus("offline");
      setError(caught instanceof Error ? caught.message : "Unable to record feedback.");
      throw caught;
    } finally {
      setBusy(false);
    }
  }

  async function ingestPlantContext(
    mode: "document" | "log" | "sensor" | "fault" | "alert" | "spare",
    payload: IngestDocumentPayload | IngestLogsPayload | SensorBatchPayload | IngestFaultEventsPayload | IngestAlertsPayload | IngestSparesPayload
  ) {
    setBusy(true);
    setError(null);
    try {
      let equipmentId: string | undefined;
      let detail = "";
      if (mode === "document") {
        const response = await api.ingestDocument(payload as IngestDocumentPayload);
        equipmentId = (payload as IngestDocumentPayload).equipment_id;
        detail = `${response.ingested_chunks} document chunks`;
      } else if (mode === "log") {
        const response = await api.ingestLogs(payload as IngestLogsPayload);
        equipmentId = (payload as IngestLogsPayload).logs[0]?.equipment_id;
        detail = `${response.ingested_logs} log entries`;
      } else if (mode === "sensor") {
        const response = await api.ingestSensorBatch(payload as SensorBatchPayload);
        equipmentId = (payload as SensorBatchPayload).readings[0]?.equipment_id;
        detail = `${response.ingested_readings} sensor readings`;
      } else if (mode === "fault") {
        const response = await api.ingestFaultEvents(payload as IngestFaultEventsPayload);
        equipmentId = (payload as IngestFaultEventsPayload).events[0]?.equipment_id;
        detail = `${response.ingested_events} fault events`;
      } else if (mode === "alert") {
        const response = await api.ingestAlerts(payload as IngestAlertsPayload);
        equipmentId = (payload as IngestAlertsPayload).alerts[0]?.equipment_id;
        detail = `${response.ingested_alerts} abnormality alerts`;
      } else {
        const response = await api.ingestSpares(payload as IngestSparesPayload);
        equipmentId = (payload as IngestSparesPayload).spares[0]?.equipment_id;
        detail = `${response.ingested_spares} spare records`;
      }
      if (equipmentId) {
        setSelectedId(equipmentId);
        await loadSelected(equipmentId);
      }
      await loadDashboard();
      setNotice(`Ingested ${detail} and refreshed the dashboard.`);
      setApiStatus("online");
    } catch (caught) {
      setApiStatus("offline");
      setError(caught instanceof Error ? caught.message : "Unable to ingest plant context.");
      throw caught;
    } finally {
      setBusy(false);
    }
  }

  function navigateToSection(target: string) {
    setActiveSection(target);
    setMobileNavOpen(false);
    const section = document.getElementById(target);
    if (!section) return;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="min-h-screen bg-transparent text-steel-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-[264px] shrink-0 flex-col border-r border-white/10 bg-[linear-gradient(180deg,#061723_0%,#0a2230_50%,#0f2a35_100%)] text-white shadow-command lg:flex">
          <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-coolant-200/30 bg-coolant-500/15 text-coolant-100 shadow-insetline">
              <Factory size={22} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-bold tracking-normal">SteelGuard AI</p>
              <p className="text-xs font-semibold text-slate-300">Maintenance Ops</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1.5 px-3 py-4">
            {navigationItems.map((item) => (
              <SidebarLink
                key={item.label}
                {...item}
                active={activeSection === item.target}
                onNavigate={navigateToSection}
              />
            ))}
          </nav>

          <div className="p-4">
            <section className="rounded-lg border border-white/10 bg-white/[0.075] p-4 shadow-insetline">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-300">Backend</p>
                <ConnectionPill status={apiStatus} compact dark />
              </div>
              <div className="mt-4 space-y-3 text-xs">
                <MiniDataRow label="Stream step" value={String(currentStep)} dark />
                <MiniDataRow label="Rows" value={formatNumber(dataset?.rows_loaded ?? summary.dataset_rows_loaded)} dark />
                <MiniDataRow label="Mapped assets" value={String(dataset?.equipment_mappings ?? equipment.length)} dark />
              </div>
              <button
                type="button"
                onClick={() => void advanceStream()}
                className="focus-ring mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-coolant-500 text-xs font-bold text-white shadow-sm transition hover:bg-coolant-600 disabled:opacity-60"
                disabled={busy || apiStatus === "offline"}
              >
                <Zap size={14} />
                Tick Stream
              </button>
            </section>
          </div>
        </aside>

        {mobileNavOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-steel-950/45"
              onClick={() => setMobileNavOpen(false)}
            />
            <aside className="relative flex h-full w-[280px] flex-col bg-[linear-gradient(180deg,#061723_0%,#0a2230_50%,#0f2a35_100%)] text-white shadow-command">
              <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-coolant-200/30 bg-coolant-500/15 text-coolant-100 shadow-insetline">
                  <Factory size={22} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base font-bold tracking-normal">SteelGuard AI</p>
                  <p className="text-xs font-semibold text-slate-300">Maintenance Ops</p>
                </div>
              </div>
              <nav className="flex-1 space-y-1.5 px-3 py-4">
                {navigationItems.map((item) => (
                  <SidebarLink
                    key={item.label}
                    {...item}
                    active={activeSection === item.target}
                    onNavigate={navigateToSection}
                  />
                ))}
              </nav>
            </aside>
          </div>
        )}

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex min-h-[76px] flex-col gap-3 border-b border-steel-200/80 bg-white/90 px-4 py-3 shadow-[0_10px_30px_rgba(14,23,27,0.06)] backdrop-blur-xl sm:px-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                title="Open navigation"
                onClick={() => setMobileNavOpen(true)}
                className="control-button h-10 w-10 lg:hidden"
              >
                <Menu size={20} />
              </button>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold tracking-normal text-steel-950">SteelGuard Command Center</h1>
                  <ConnectionPill status={apiStatus} compact />
                </div>
                <p className="mt-1 text-xs font-medium text-steel-500 sm:text-sm">
                  Live plant health, recommendations, evidence, and reporting in one workspace.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="hidden items-center gap-2 xl:flex">
                <HeaderMetric label="Critical" value={String(summary.critical_alert_count)} tone="red" />
                <HeaderMetric label="Priority" value={String(summary.highest_priority || selectedPriority || 0)} tone="amber" />
                <HeaderMetric label="Step" value={String(currentStep)} tone="coolant" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  title={live ? "Pause live stream" : "Resume live stream"}
                  onClick={() => setLive((value) => !value)}
                  className={`focus-ring inline-flex h-10 w-10 items-center justify-center rounded-md border shadow-sm transition ${
                    live ? "border-coolant-200 bg-coolant-50 text-coolant-700 hover:bg-coolant-100" : "border-steel-200 bg-white text-steel-700 hover:border-coolant-200 hover:text-coolant-800"
                  }`}
                >
                  {live ? <Pause size={17} /> : <Play size={17} />}
                </button>
                <button
                  type="button"
                  title="Refresh dashboard"
                  onClick={() => void loadDashboard()}
                  className="control-button h-10 w-10"
                >
                  <RefreshCw size={17} className={busy ? "animate-spin" : ""} />
                </button>
                <button
                  type="button"
                  title="Notifications"
                  onClick={() => navigateToSection("alerts")}
                  className="control-button relative h-10 w-10"
                >
                  <Bell size={17} />
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {notifications.length}
                  </span>
                </button>
                <div className="hidden items-center gap-3 border-l border-steel-200 pl-3 sm:flex">
                  <span className="icon-tile h-10 w-10 bg-steel-50">
                    <UserCircle size={22} />
                  </span>
                  <div>
                    <select
                      aria-label="Notification role"
                      value={selectedRole}
                      onChange={(event) => setSelectedRole(event.target.value as UserRole)}
                      className="field-control max-w-[190px] py-1.5 text-sm font-bold"
                    >
                      {(roles.length ? roles : [{ id: "maintenance_engineer" as UserRole, label: selectedRoleLabel }]).map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs font-medium text-steel-500">
                      {notifications.length} live notifications
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="space-y-6 p-4 sm:p-5 xl:p-6">
            <section id="dashboard" className="scroll-mt-24 overflow-hidden rounded-lg border border-steel-200/90 bg-white shadow-command shadow-insetline">
              <div className="grid xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="relative overflow-hidden p-5 sm:p-6">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-coolant via-blue-500 to-forge" />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="kicker">Selected asset</span>
                    <RiskBadge risk={selectedRisk} />
                    {live && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                        Live
                      </span>
                    )}
                  </div>
                  <h2 className="mt-3 text-3xl font-bold tracking-normal text-steel-950">{selectedEquipmentName}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-steel-600">
                    {selectedEquipment?.description ?? "Backend data will appear here once an equipment asset is selected."}
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
                    <SignalTile icon={<Gauge size={17} />} label="Priority" value={`${selectedPriority || 0}/100`} tone={riskTextColor(selectedRisk)} />
                    <SignalTile icon={<Activity size={17} />} label="RUL" value={`${selectedRul || 0}h`} tone="text-coolant-700" />
                    <SignalTile icon={<TrendingUp size={17} />} label="Anomaly" value={`${selectedAnomaly}%`} tone={selectedAnomaly > 50 ? "text-red-600" : "text-steel-900"} />
                    <SignalTile icon={<Brain size={17} />} label="ML Failure" value={`${selectedMlProbability}%`} tone={selectedMlProbability > 50 ? "text-red-600" : "text-coolant-700"} />
                    <SignalTile icon={<CalendarDays size={17} />} label="Latest sample" value={compactTime(selectedHealth?.latest_reading.timestamp)} tone="text-steel-900" />
                  </div>
                  <FleetRiskStrip overview={healthOverview} />
                </div>

                <div id="settings" className="scroll-mt-24 border-t border-steel-200 bg-[linear-gradient(180deg,#0b1820_0%,#102a35_100%)] p-5 text-white xl:border-l xl:border-t-0">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-300">Data source</p>
                      <h3 className="mt-1 text-base font-bold">AI4I live stream</h3>
                    </div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-md border border-coolant-200/20 bg-coolant-500/15 text-coolant-100 shadow-insetline">
                      <Database size={20} />
                    </span>
                  </div>
                  <div className="mt-5 space-y-3 text-sm">
                    <MiniDataRow label="Rows loaded" value={formatNumber(dataset?.rows_loaded ?? summary.dataset_rows_loaded)} dark />
                    <MiniDataRow label="Failure rows" value={formatNumber(dataset?.failure_rows_loaded ?? 0)} dark />
                    <MiniDataRow label="Open alerts" value={String(summary.open_alert_count || alerts.length)} dark />
                    <MiniDataRow label="Avg RUL" value={`${summary.average_rul_hours || 0}h`} dark />
                    <MiniDataRow label="OpenAI copilot" value={openaiEnabled ? "Enabled" : "Fallback"} dark />
                    <MiniDataRow label="RAG vectors" value={ragProvider} dark />
                    <MiniDataRow label="ML model" value={mlModelLabel} dark />
                    <MiniDataRow label="ML accuracy" value={formatPercent(mlValidationMetrics?.accuracy, { digits: 0, floor: true })} dark />
                    <MiniDataRow label="Precision" value={formatPercent(mlValidationMetrics?.precision)} dark />
                    <MiniDataRow label="Recall" value={formatPercent(mlValidationMetrics?.recall)} dark />
                    <MiniDataRow label="F1" value={formatPercent(mlValidationMetrics?.f1)} dark />
                  </div>
                  <div className="mt-5 rounded-md border border-white/10 bg-white/[0.07] p-3 shadow-insetline">
                    <p className="text-xs font-semibold leading-5 text-slate-300">
                      Step {currentStep} is mapped into steel equipment metrics, then scored by the backend before the AI recommendation is generated.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
              <KpiCard
                title="Assets Online"
                value={String(summary.equipment_count || equipment.length)}
                detail={`${healthOverview.healthy} healthy, ${healthOverview.warning} watchlisted`}
                icon={<Boxes size={20} />}
                tone="coolant"
              />
              <KpiCard
                title="Critical Alerts"
                value={String(summary.critical_alert_count)}
                detail={`${summary.open_alert_count || alerts.length} total open alerts`}
                icon={<AlertOctagon size={20} />}
                tone="red"
              />
              <KpiCard
                title="Fleet Health"
                value={healthScore ? String(healthScore) : "Loading"}
                suffix={healthScore ? "/100" : undefined}
                detail={healthScore ? `${selectedAnomaly}% anomaly on selected asset` : "Waiting for health scores"}
                icon={<ShieldCheck size={20} />}
                tone="blue"
              />
              <KpiCard
                title="Highest Priority"
                value={String(summary.highest_priority || selectedPriority || 0)}
                suffix="/100"
                detail={`${topCriticalEquipment[0]?.name ?? "No asset"} leads the queue`}
                icon={<Gauge size={20} />}
                tone="amber"
              />
              <KpiCard
                title="Dataset Rows"
                value={formatNumber(dataset?.rows_loaded ?? summary.dataset_rows_loaded)}
                detail={`Stream step ${currentStep}`}
                icon={<Database size={20} />}
                tone="violet"
              />
            </section>

            <DecisionFlow
              dataset={dataset}
              selectedHealth={selectedHealth}
              recommendation={recommendation}
              report={report}
            />

            <PredictiveInsights
              equipment={equipment}
              healthMap={healthMap}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />

            <ProcessTwin
              equipment={equipment}
              healthMap={healthMap}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />

            <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_410px]">
              <div className="min-w-0 space-y-6">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                  <div className="min-w-0 space-y-6">
                    <div id="predictive-health" className="scroll-mt-24">
                      {selectedHealth ? (
                        <HealthChart health={selectedHealth} />
                      ) : (
                        <LoadingPanel label="Telemetry trend" />
                      )}
                    </div>
                    <MlPredictionCard prediction={selectedHealth?.ml_prediction} />
                    <ProcessDefectSummary defects={selectedHealth?.process_defects ?? []} />

                    <section>
                      <SectionHeading
                        kicker="Sensor metrics"
                        title="Current readings"
                        detail={selectedHealth ? `${selectedHealth.metrics.length} backend-scored signals` : "Waiting for metrics"}
                      />
                      <div className="mt-3 grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {selectedHealth?.metrics.map((metric) => (
                          <MetricTile key={metric.name} metric={metric} />
                        ))}
                        {!selectedHealth && [0, 1, 2].map((item) => <MetricSkeleton key={item} />)}
                      </div>
                    </section>
                  </div>

                  <div className="space-y-6">
                    <SelectedAssetCard equipment={selectedEquipment} health={selectedHealth} alert={selectedAlert} />
                    <div id="spares" className="scroll-mt-24">
                      <SparesCard health={selectedHealth} />
                    </div>
                    <FailureForecast equipment={topCriticalEquipment} />
                  </div>
                </div>

                <div id="maintenance" className="scroll-mt-24">
                  <RecommendationPanel
                    recommendation={recommendation}
                    onReport={generateReport}
                    onFeedback={recordFeedback}
                    busy={busy}
                  />
                </div>
                <div id="knowledge-base" className="scroll-mt-24">
                  <AgentTrace recommendation={recommendation} />
                </div>
                <div id="reports" className="scroll-mt-24">
                  <ReportPanel report={report} onClose={() => setReport(null)} />
                </div>
              </div>

              <aside className="min-w-0 space-y-6">
                <section id="equipment" className="scroll-mt-24">
                  <SectionHeading
                    kicker="Equipment queue"
                    title="Risk-ranked assets"
                    detail={`${equipment.length || 0} mapped assets`}
                  />
                  <div className="mt-3 max-h-[560px] overflow-y-auto pr-1">
                    <EquipmentList
                      equipment={riskRankedEquipment}
                      selectedId={selectedId}
                      healthMap={healthMap}
                      onSelect={setSelectedId}
                    />
                  </div>
                </section>

                <div id="alerts" className="scroll-mt-24">
                  <RoleNotificationsCard
                    roles={roles}
                    selectedRole={selectedRole}
                    notifications={notifications}
                    lastUpdated={notificationsUpdatedAt}
                    apiStatus={apiStatus}
                    busy={busy}
                    onRoleChange={setSelectedRole}
                    onRefresh={() => void loadNotifications(selectedRole)}
                    onSelect={setSelectedId}
                  />
                </div>

                <div className="scroll-mt-24">
                  <ActiveAlertsCard alerts={alerts} selectedId={selectedId} onSelect={setSelectedId} />
                </div>

                <div id="ai-copilot" className="scroll-mt-24">
                  <WizardChat
                    equipmentId={selectedId ?? undefined}
                    equipmentName={selectedEquipmentName}
                    alertId={selectedAlert?.id}
                    sendMessage={sendChat}
                    onResponse={onChatResponse}
                    onNewChat={startNewChat}
                  />
                </div>

                <div id="ingestion" className="scroll-mt-24">
                  <IngestionPanel
                    equipment={equipment}
                    selectedId={selectedId}
                    busy={busy}
                    onSelectEquipment={setSelectedId}
                    onIngest={ingestPlantContext}
                  />
                </div>

                {(error || notice) && (
                  <div
                    className={`rounded-lg border p-3 text-sm shadow-sm ${
                      error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {error ?? notice}
                  </div>
                )}
              </aside>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function SidebarLink({
  icon: Icon,
  label,
  target,
  active,
  badge,
  onNavigate
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  target: string;
  active?: boolean;
  badge?: string;
  onNavigate: (target: string) => void;
}) {
  return (
    <button
      type="button"
      title={`Go to ${label}`}
      onClick={() => onNavigate(target)}
      className={`focus-ring relative flex h-10 w-full items-center justify-between rounded-md border px-3 text-left text-sm font-semibold transition ${
        active ? "border-white/10 bg-white/[0.13] text-white shadow-insetline" : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.08] hover:text-white"
      }`}
    >
      {active && <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-coolant-300" />}
      <span className="flex min-w-0 items-center gap-3">
        <Icon size={17} className={active ? "text-coolant-200" : undefined} />
        <span className="truncate">{label}</span>
      </span>
      {badge && <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">{badge}</span>}
    </button>
  );
}

function ConnectionPill({ status, compact, dark }: { status: ApiStatus; compact?: boolean; dark?: boolean }) {
  const label = status === "online" ? "Online" : status === "offline" ? "Offline" : "Checking";
  const color =
    status === "online"
      ? dark
        ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-200"
        : "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "offline"
        ? dark
          ? "border-red-300/25 bg-red-400/10 text-red-200"
          : "border-red-200 bg-red-50 text-red-700"
        : dark
          ? "border-amber-300/25 bg-amber-400/10 text-amber-200"
          : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-bold uppercase tracking-wide ${compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"} ${color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === "online" ? "bg-emerald-500" : status === "offline" ? "bg-red-500" : "bg-amber-500"}`} />
      {label}
    </span>
  );
}

function MiniDataRow({ label, value, dark }: { label: string; value: string; dark?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${dark ? "text-slate-300" : "text-steel-600"}`}>
      <span className="truncate text-xs font-semibold">{label}</span>
      <span className={`truncate text-right text-xs font-bold ${dark ? "text-white" : "text-steel-900"}`}>{value}</span>
    </div>
  );
}

function HeaderMetric({ label, value, tone }: { label: string; value: string; tone: "coolant" | "red" | "amber" }) {
  const toneStyles = {
    coolant: "border-coolant-100 bg-coolant-50 text-coolant-800",
    red: "border-red-100 bg-red-50 text-red-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700"
  };

  return (
    <div className={`min-w-[88px] rounded-md border px-3 py-2 shadow-sm shadow-insetline ${toneStyles[tone]}`}>
      <p className="text-[10px] font-bold uppercase tracking-wide opacity-75">{label}</p>
      <p className="mt-0.5 text-sm font-bold tabular-nums">{value}</p>
    </div>
  );
}

function SignalTile({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: string }) {
  return (
    <div className="rounded-md border border-steel-200/80 bg-steel-50/80 p-3 shadow-insetline">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-steel-500">
        <span className="text-steel-400">{icon}</span>
        {label}
      </div>
      <p className={`mt-2 truncate text-xl font-bold tracking-normal ${tone}`}>{value}</p>
    </div>
  );
}

function FleetRiskStrip({ overview }: { overview: { healthy: number; warning: number; critical: number; unknown: number; total: number } }) {
  const total = Math.max(overview.total, 1);
  const segments = [
    { label: "Healthy", value: overview.healthy, className: "bg-emerald-500" },
    { label: "Warning", value: overview.warning, className: "bg-amber-500" },
    { label: "Critical", value: overview.critical, className: "bg-red-500" },
    { label: "Unknown", value: overview.unknown, className: "bg-steel-300" }
  ];

  return (
    <div className="mt-5">
      <div className="flex h-2 overflow-hidden rounded-full bg-steel-100">
        {segments.map((segment) => (
          <span
            key={segment.label}
            className={segment.className}
            style={{ width: `${Math.max(segment.value ? 8 : 0, (segment.value / total) * 100)}%` }}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-steel-500">
        {segments.map((segment) => (
          <span key={segment.label}>
            {segment.label}: <span className="text-steel-800">{segment.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  suffix,
  detail,
  icon,
  tone
}: {
  title: string;
  value: string;
  suffix?: string;
  detail: string;
  icon: ReactNode;
  tone: "coolant" | "red" | "amber" | "blue" | "violet";
}) {
  const toneStyles = {
    coolant: {
      bar: "bg-coolant",
      icon: "border-coolant-100 bg-coolant-50 text-coolant-700"
    },
    red: {
      bar: "bg-red-500",
      icon: "border-red-100 bg-red-50 text-red-600"
    },
    amber: {
      bar: "bg-amber-500",
      icon: "border-amber-100 bg-amber-50 text-amber-600"
    },
    blue: {
      bar: "bg-blue-500",
      icon: "border-blue-100 bg-blue-50 text-blue-600"
    },
    violet: {
      bar: "bg-violet-500",
      icon: "border-violet-100 bg-violet-50 text-violet-600"
    }
  };

  return (
    <section className="panel relative min-h-[126px] overflow-hidden p-4">
      <span className={`absolute inset-x-0 top-0 h-1 ${toneStyles[tone].bar}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-steel-500">{title}</p>
          <p className="mt-2 truncate text-2xl font-bold tracking-normal text-steel-950">
            {value}
            {suffix && <span className="ml-1 text-sm font-semibold text-steel-500">{suffix}</span>}
          </p>
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md border shadow-sm shadow-insetline ${toneStyles[tone].icon}`}>{icon}</span>
      </div>
      <p className="mt-3 line-clamp-2 text-xs font-semibold leading-5 text-steel-600">{detail}</p>
    </section>
  );
}

function DecisionFlow({
  dataset,
  selectedHealth,
  recommendation,
  report
}: {
  dataset: DatasetStatus | null;
  selectedHealth: EquipmentHealth | null;
  recommendation: Recommendation | null;
  report: ReportResponse | null;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <FlowStep
        icon={<Database size={18} />}
        title="Telemetry"
        value={`Step ${dataset?.stream_step ?? 0}`}
        detail={`${formatNumber(dataset?.rows_loaded ?? 0)} rows loaded`}
        state="complete"
      />
      <FlowStep
        icon={<Gauge size={18} />}
        title="Risk scoring"
        value={selectedHealth ? `${selectedHealth.priority_score}/100` : "Waiting"}
        detail={selectedHealth ? `${selectedHealth.metrics.length} metrics scored` : "Select asset"}
        state={selectedHealth ? "complete" : "pending"}
      />
      <FlowStep
        icon={<Bot size={18} />}
        title="AI plan"
        value={recommendation ? `${Math.round(recommendation.confidence * 100)}% confidence` : "Pending"}
        detail={recommendation ? recommendation.urgency.replaceAll("_", " ") : "Recommendation loading"}
        state={recommendation ? "complete" : "pending"}
      />
      <FlowStep
        icon={<FileText size={18} />}
        title="Report"
        value={report ? "Ready" : "Draft"}
        detail={report ? compactDate(report.generated_at) : "Generate from action plan"}
        state={report ? "complete" : "pending"}
      />
    </section>
  );
}

function FlowStep({
  icon,
  title,
  value,
  detail,
  state
}: {
  icon: ReactNode;
  title: string;
  value: string;
  detail: string;
  state: "complete" | "pending";
}) {
  return (
    <article className="panel flex min-h-[108px] items-start gap-3 p-4">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border shadow-sm shadow-insetline ${state === "complete" ? "border-coolant-100 bg-coolant-50 text-coolant-700" : "border-steel-200 bg-steel-50 text-steel-500"}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-steel-500">{title}</p>
        <p className="mt-1 truncate text-sm font-bold text-steel-950">{value}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-steel-600">{detail}</p>
      </div>
    </article>
  );
}

function SectionHeading({ kicker, title, detail }: { kicker: string; title: string; detail?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div>
        <p className="kicker">{kicker}</p>
        <h2 className="mt-1 text-base font-bold text-steel-950">{title}</h2>
      </div>
      {detail && <p className="text-xs font-semibold text-steel-500">{detail}</p>}
    </div>
  );
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <section className="panel flex h-72 items-center justify-center p-4 text-sm font-semibold text-steel-500">
      <span className="inline-flex items-center gap-2">
        <Loader2 size={17} className="animate-spin" />
        Loading {label}
      </span>
    </section>
  );
}

function MetricSkeleton() {
  return (
    <div className="panel min-h-[112px] animate-pulse p-4">
      <div className="h-3 w-24 rounded bg-steel-100" />
      <div className="mt-4 h-6 w-20 rounded bg-steel-100" />
      <div className="mt-5 h-2 rounded bg-steel-100" />
    </div>
  );
}

function MlPredictionCard({ prediction }: { prediction?: MlPrediction | null }) {
  if (!prediction) {
    return (
      <section className="panel p-4">
        <div className="flex items-center gap-3 text-sm font-semibold text-steel-500">
          <Loader2 size={17} className="animate-spin" />
          Training or loading ML classifier
        </div>
      </section>
    );
  }

  const probability = Math.round(prediction.failure_probability * 100);
  const mode = prediction.predicted_failure_mode.replaceAll("_", " ");
  const likelyTone = prediction.failure_likely ? "text-red-600" : "text-coolant-700";
  const barColor = prediction.failure_likely ? "bg-red-500" : "bg-coolant";

  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="kicker">ML prediction</p>
          <h2 className="mt-1 flex items-center gap-2 text-base font-bold text-steel-950">
            <Brain size={18} className="text-blue-600" />
            Failure classifier
          </h2>
          <p className="mt-1 text-xs font-semibold text-steel-500">
            {prediction.model_name} - threshold {Math.round(prediction.threshold * 100)}%
          </p>
        </div>
        <div className="rounded-md border border-steel-200/80 bg-steel-50/80 px-3 py-2 text-right shadow-insetline">
          <p className={`text-2xl font-bold tabular-nums ${likelyTone}`}>{probability}%</p>
          <p className="text-xs font-bold uppercase tracking-wide text-steel-500">failure probability</p>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-steel-100">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.max(6, probability)}%` }} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MlFact label="Predicted mode" value={mode} strong />
        <MlFact label="Mode confidence" value={`${Math.round(prediction.failure_mode_confidence * 100)}%`} />
        <MlFact label="Validation F1" value={`${Math.round(prediction.validation_f1 * 100)}%`} />
        <MlFact label="Validation recall" value={`${Math.round(prediction.validation_recall * 100)}%`} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {prediction.top_signals.map((signal) => (
          <span key={signal} className="rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-bold capitalize text-blue-700">
            {signal.replaceAll("_", " ")}
          </span>
        ))}
      </div>
    </section>
  );
}

function MlFact({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="card-muted px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-wide text-steel-500">{label}</p>
      <p className={`mt-1 truncate text-sm font-bold capitalize ${strong ? "text-steel-950" : "text-steel-800"}`}>{value}</p>
    </div>
  );
}

function SelectedAssetCard({
  equipment,
  health,
  alert
}: {
  equipment: Equipment | null;
  health: EquipmentHealth | null;
  alert?: Alert;
}) {
  return (
    <section className="panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="kicker">Asset dossier</p>
          <h2 className="mt-1 truncate text-base font-bold text-steel-950">{equipment?.asset_type ?? "Loading asset"}</h2>
        </div>
        {health && <RiskBadge risk={health.risk_level} />}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <AssetFact label="Area" value={equipment?.area ?? "Waiting"} />
        <AssetFact label="Criticality" value={equipment ? `${Math.round(equipment.criticality * 100)}%` : "Waiting"} />
        <AssetFact label="Urgency" value={health?.urgency.replaceAll("_", " ") ?? "Waiting"} />
        <AssetFact label="Confidence" value={health ? `${Math.round(health.rul_estimate.confidence * 100)}%` : "Waiting"} />
      </div>
      <div className="card-muted mt-4 p-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className={alert ? "text-red-500" : "text-emerald-600"} />
          <p className="text-xs font-bold uppercase tracking-wide text-steel-500">Current alert</p>
        </div>
        <p className="mt-2 text-sm font-semibold leading-5 text-steel-900">
          {alert?.message ?? "No open alert on selected asset."}
        </p>
        {alert && (
          <p className="mt-2 text-xs font-semibold text-steel-500">
            {alert.signal} = {alert.value} at {compactDate(alert.timestamp)}
          </p>
        )}
      </div>
    </section>
  );
}

function AssetFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-muted px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-wide text-steel-500">{label}</p>
      <p className="mt-1 truncate text-sm font-bold capitalize text-steel-900">{value}</p>
    </div>
  );
}

function SparesCard({ health }: { health: EquipmentHealth | null }) {
  const spares = health?.spares ?? [];

  return (
    <section className="panel p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="kicker">Spares</p>
          <h2 className="mt-1 text-base font-bold text-steel-950">Inventory pressure</h2>
        </div>
        <span className="icon-tile h-9 w-9 bg-steel-50">
          <Package size={18} />
        </span>
      </div>
      <div className="mt-4 divide-y divide-steel-100">
        {spares.slice(0, 4).map((part) => (
          <div key={part.id} className="flex items-center justify-between gap-3 py-3 text-sm">
            <div className="min-w-0">
              <p className="truncate font-bold text-steel-900">{part.name}</p>
              <p className="text-xs font-semibold text-steel-500">{part.supplier}</p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold ${part.stock <= 1 && part.critical ? "text-red-600" : "text-steel-900"}`}>
                {part.stock} in stock
              </p>
              <p className="text-xs font-semibold text-steel-500">{part.lead_time_days}d lead</p>
            </div>
          </div>
        ))}
        {!spares.length && <p className="py-6 text-sm text-steel-500">Waiting for spare strategy.</p>}
      </div>
    </section>
  );
}

function ProcessDefectSummary({ defects }: { defects: ProcessDefect[] }) {
  return (
    <section className="panel p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="kicker">Process defects</p>
          <h2 className="mt-1 text-base font-bold text-steel-950">Steel rule layer</h2>
        </div>
        <span className="icon-tile h-9 w-9 bg-steel-50">
          <ShieldCheck size={18} />
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {defects.slice(0, 3).map((defect) => (
          <article key={defect.id} className="card-muted p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-bold capitalize text-steel-900">{defect.defect_type.replaceAll("_", " ")}</p>
              <RiskBadge risk={defect.severity} />
            </div>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-steel-600">{defect.explanation}</p>
            <p className="mt-2 text-xs font-bold text-coolant-700">{Math.round(defect.confidence * 100)}% confidence</p>
          </article>
        ))}
        {!defects.length && <p className="py-5 text-sm font-semibold text-steel-500">No specific process defect rule fired.</p>}
      </div>
    </section>
  );
}

function FailureForecast({
  equipment
}: {
  equipment: Array<Equipment & { risk: RiskLevel; priority: number; rul: number; anomaly: number; mlProbability: number }>;
}) {
  return (
    <section className="panel p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="kicker">Failure forecast</p>
          <h2 className="mt-1 text-base font-bold text-steel-950">Next 7 days</h2>
        </div>
        <span className="icon-tile h-9 w-9 bg-steel-50">
          <Activity size={18} />
        </span>
      </div>
      <div className="mt-4 space-y-4">
        {equipment.map((item) => {
          const probability = item.mlProbability > 0
            ? Math.min(99, Math.max(1, Math.round(item.mlProbability * 100)))
            : Math.min(95, Math.max(8, item.priority));
          return (
            <div key={item.id} className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <p className="truncate font-bold text-steel-900">{item.name}</p>
                <span className="text-xs font-bold text-steel-600">{probability}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-steel-100">
                  <span className={`block h-full rounded-full ${riskBarColor(item.risk)}`} style={{ width: `${probability}%` }} />
                </span>
                <span className="w-12 text-right text-xs font-semibold text-steel-500">{Math.max(1, Math.ceil(item.rul / 24))}d</span>
              </div>
            </div>
          );
        })}
        {!equipment.length && <p className="py-6 text-sm text-steel-500">Failure model loading.</p>}
      </div>
    </section>
  );
}

function RoleNotificationsCard({
  roles,
  selectedRole,
  notifications,
  lastUpdated,
  apiStatus,
  busy,
  onRoleChange,
  onRefresh,
  onSelect
}: {
  roles: RoleOption[];
  selectedRole: UserRole;
  notifications: RoleNotification[];
  lastUpdated: string | null;
  apiStatus: ApiStatus;
  busy: boolean;
  onRoleChange: (role: UserRole) => void;
  onRefresh: () => void;
  onSelect: (equipmentId: string) => void;
}) {
  const fallbackRoles: RoleOption[] = roles.length
    ? roles
    : [{ id: "maintenance_engineer", label: "Maintenance Engineer" }];
  const sourceLabel = apiStatus === "online" ? "Live backend queue" : apiStatus === "offline" ? "Backend offline" : "Checking backend";

  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="kicker">Notifications</p>
          <h2 className="mt-1 text-base font-bold text-steel-950">Role-routed queue</h2>
          <p className="mt-1 text-xs font-semibold text-steel-500">
            {sourceLabel} - {lastUpdated ? `Updated ${compactTime(lastUpdated)}` : "Waiting"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">{notifications.length}</span>
          <button
            type="button"
            title="Refresh notifications"
            onClick={onRefresh}
            disabled={busy || apiStatus === "offline"}
            className="control-button h-9 w-9"
          >
            <RefreshCw size={15} className={busy ? "animate-spin" : ""} />
          </button>
        </div>
      </div>
      <div className="mt-3">
        <select
          aria-label="Notification role"
          value={selectedRole}
          onChange={(event) => onRoleChange(event.target.value as UserRole)}
          className="field-control w-full text-sm font-bold"
        >
          {fallbackRoles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.label}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-4 space-y-3">
        {notifications.slice(0, 5).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.equipment_id)}
            className="focus-ring grid w-full grid-cols-[auto_1fr] gap-3 rounded-md border border-steel-200/70 bg-white px-3 py-3 text-left shadow-sm transition hover:border-coolant-200 hover:bg-coolant-50/50"
          >
            <span className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-md ${
              item.severity === "critical"
                ? "bg-red-50 text-red-500"
                : item.severity === "high"
                  ? "bg-orange-50 text-orange-500"
                  : "bg-amber-50 text-amber-500"
            }`}>
              <Bell size={16} />
            </span>
            <span className="min-w-0">
              <span className="flex flex-wrap items-start justify-between gap-2">
                <span className="min-w-0 flex-1 text-sm font-bold leading-5 text-steel-900">{item.title}</span>
                <span className="shrink-0 text-[11px] font-bold text-steel-400">{compactTime(item.timestamp)}</span>
              </span>
              <span className="mt-1 inline-flex"><RiskBadge risk={item.severity} /></span>
              <span className="mt-1 line-clamp-2 text-xs leading-5 text-steel-600">{item.message}</span>
              <span className="mt-2 block text-xs font-semibold text-coolant-700">{item.action}</span>
            </span>
          </button>
        ))}
        {!notifications.length && <p className="py-6 text-sm font-semibold text-steel-500">No routed notifications for this role.</p>}
      </div>
    </section>
  );
}

function ActiveAlertsCard({ alerts, selectedId, onSelect }: { alerts: Alert[]; selectedId: string | null; onSelect: (id: string) => void }) {
  return (
    <section className="panel p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="kicker">Alerts</p>
          <h2 className="mt-1 text-base font-bold text-steel-950">Live incident feed</h2>
        </div>
        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">{alerts.length}</span>
      </div>
      <div className="mt-4 divide-y divide-steel-100">
        {alerts.slice(0, 5).map((alert) => (
          <button
            key={alert.id}
            type="button"
            onClick={() => onSelect(alert.equipment_id)}
            className={`focus-ring grid w-full grid-cols-[auto_1fr] gap-3 rounded-md border px-3 py-3 text-left transition hover:border-coolant-200 hover:bg-steel-50 ${
              selectedId === alert.equipment_id ? "border-coolant-200 bg-coolant-50/70 shadow-sm" : "border-transparent"
            }`}
          >
            <span className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-md ${
              alert.severity === "critical"
                ? "bg-red-50 text-red-500"
                : alert.severity === "high"
                  ? "bg-orange-50 text-orange-500"
                  : "bg-amber-50 text-amber-500"
            }`}>
              <AlertTriangle size={16} />
            </span>
            <span className="min-w-0">
              <span className="line-clamp-2 text-sm font-bold leading-5 text-steel-900">{alert.message}</span>
              <span className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-steel-500">
                <span>{compactTime(alert.timestamp)}</span>
                <span>{alert.signal}</span>
                <RiskBadge risk={alert.severity} />
              </span>
            </span>
          </button>
        ))}
        {!alerts.length && (
          <div className="flex items-center gap-2 py-7 text-sm font-semibold text-emerald-700">
            <CheckCircle2 size={17} />
            No active alerts.
          </div>
        )}
      </div>
    </section>
  );
}

function AgentTrace({ recommendation }: { recommendation: Recommendation | null }) {
  const trace = recommendation?.node_trace ?? [];

  return (
    <section className="panel p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="kicker">Agent trace</p>
          <h2 className="mt-1 text-base font-bold text-steel-950">Decision checkpoints</h2>
        </div>
        <span className="icon-tile h-9 w-9 border-blue-100 bg-blue-50 text-blue-600">
          <Sparkles size={18} />
        </span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {trace.slice(0, 4).map((node, index) => (
          <article key={`${String(node.node)}-${index}`} className="card-muted p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-600">{String(node.node).replaceAll("_", " ")}</p>
            <p className="mt-2 line-clamp-4 text-xs leading-5 text-steel-700">{String(node.summary)}</p>
          </article>
        ))}
        {!trace.length && <p className="text-sm text-steel-500">Waiting for agent reasoning.</p>}
      </div>
    </section>
  );
}
