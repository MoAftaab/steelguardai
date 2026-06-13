"use client";

import type { ComponentType, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Shield,
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
import { SensorMetricsPanel } from "@/components/SensorMetricsPanel";
import { ProcessTwin } from "@/components/ProcessTwin";
import { PredictiveInsights } from "@/components/PredictiveInsights";
import { MaintenanceTimeline } from "@/components/MaintenanceTimeline";
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
  if (risk === "critical") return "text-red-400";
  if (risk === "high") return "text-orange-400";
  if (risk === "medium") return "text-amber-400";
  return "text-emerald-400";
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
  const [theme, setTheme] = useState<"violet" | "amber" | "cyan">("violet");
  const [openaiEnabled, setOpenaiEnabled] = useState(false);
  const [ragProvider, setRagProvider] = useState("checking");
  const [mlModelLabel, setMlModelLabel] = useState("checking");
  const [mlValidationMetrics, setMlValidationMetrics] = useState<MlValidationMetrics | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [selectedRole, setSelectedRole] = useState<UserRole>("maintenance_engineer");
  const [notifications, setNotifications] = useState<RoleNotification[]>([]);
  const [notificationsUpdatedAt, setNotificationsUpdatedAt] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hydrationProgress, setHydrationProgress] = useState(0);
  const [hydrationStatus, setHydrationStatus] = useState("Initializing database handshake...");
  /** True while the user is interacting with Accept / Correct / Reject. Pauses the live stream. */
  const feedbackLockedRef = useRef(false);
  const lockFeedback = useCallback(() => { feedbackLockedRef.current = true; }, []);
  const unlockFeedback = useCallback(() => { feedbackLockedRef.current = false; }, []);

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
      // Skip auto-tick while user is submitting feedback or filling the correction/rejection form
      if (feedbackLockedRef.current) return;
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
    setHydrationProgress(5);
    setHydrationStatus("Pinging FastAPI backend server...");
    try {
      const healthPayload = await api.healthz();
      setHydrationProgress(25);
      setHydrationStatus("Retrieving plant summary & equipment status...");
      const [summaryPayload, equipmentPayload, alertPayload, datasetPayload] = await Promise.all([
        api.summary(),
        api.equipment(),
        api.alerts(),
        api.dataset()
      ]);
      setHydrationProgress(55);
      setHydrationStatus("Loading user roles & notifications archive...");
      const [rolesPayload, notificationPayload] = await Promise.all([
        api.roles(),
        api.notifications(selectedRole)
      ]);
      setHydrationProgress(75);
      setHydrationStatus(`Evaluating individual health indicators for ${equipmentPayload.length} assets...`);
      const healthEntries = await Promise.all(
        equipmentPayload.map(async (item) => [item.id, await api.health(item.id)] as const)
      );
      setHydrationProgress(95);
      setHydrationStatus("Assembling interactive digital twin and telemetry charts...");

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
      setHydrationProgress(100);
      setHydrationStatus("Console connection established.");
    } catch (caught) {
      setApiStatus("offline");
      setError(caught instanceof Error ? caught.message : "Unable to load SteelGuard AI.");
    } finally {
      setBusy(false);
      setTimeout(() => {
        setInitialLoading(false);
      }, 400);
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
      // Only regenerate the recommendation if the user is NOT in the middle of feedback
      if (selectedId && !feedbackLockedRef.current) {
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

  if (initialLoading) {
    return (
      <main className="relative min-h-screen text-slate-100 bg-[hsl(228,22%,5%)] flex flex-col items-center justify-center select-none overflow-hidden">
        {/* Background Neon Orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-[400px] pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-coolant-600/10 blur-[120px] animate-glow-pulse" />
          <div className="absolute bottom-[20%] right-[20%] w-[60%] h-[60%] rounded-full bg-purple-600/10 blur-[120px] animate-glow-pulse [animation-delay:1s]" />
        </div>

        <div className="max-w-md w-full px-6 flex flex-col items-center text-center relative z-10">
          {/* Animated Brand Logo Container */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-coolant-500 to-purple-600 rounded-full blur-xl opacity-40 animate-pulse" />
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800/80 flex items-center justify-center relative z-10 shadow-lifted">
              <Shield className="w-9 h-9 text-coolant-400 animate-spin [animation-duration:12s]" />
              <Zap className="w-5 h-5 text-forge-400 absolute" />
            </div>
          </div>

          <h3 className="font-extrabold text-xl tracking-tight text-white mb-1">
            SteelGuard <span className="text-coolant-400 font-medium">AI</span>
          </h3>
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-8">
            Operations Database Hydration
          </p>

          {error ? (
            <div className="space-y-4 w-full">
              <div className="p-4 rounded-lg bg-red-950/20 border border-red-500/20 text-xs text-red-400 font-mono">
                Error: {error}
              </div>
              <button
                type="button"
                onClick={() => void loadDashboard()}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-semibold rounded-lg text-white transition duration-200"
              >
                Retry Connection
              </button>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              {/* Premium Progress Bar */}
              <div className="w-64 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/40 relative mb-4">
                <div 
                  className="h-full bg-gradient-to-r from-coolant-500 to-purple-600 rounded-full transition-all duration-300 ease-out shadow-glow"
                  style={{ width: `${hydrationProgress}%` }}
                />
              </div>

              {/* Status Text */}
              <p className="text-xs text-slate-400 font-mono h-5">
                {hydrationStatus}
              </p>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className={`relative min-h-screen text-slate-100 theme-${theme}`}>
      <div className="flex min-h-screen">
        {/* ── Sidebar ── */}
        <aside className="hidden w-[264px] shrink-0 flex-col border-r border-white/[0.06] bg-sidebar text-white shadow-command lg:flex">
          <div className="flex h-20 items-center gap-3 border-b border-white/[0.06] px-5">
            <span className="relative flex h-11 w-11 items-center justify-center rounded-lg bg-theme-gradient-br text-white shadow-theme-glow">
              <Factory size={22} />
              <span className="absolute inset-0 rounded-lg bg-theme-accent-glow animate-glow-pulse" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-bold tracking-normal">SteelGuard AI</p>
              <p className="text-xs font-semibold text-slate-400">Maintenance Ops</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
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
            <section className="rounded-lg border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Backend</p>
                <ConnectionPill status={apiStatus} compact />
              </div>
              <div className="mt-4 space-y-3 text-xs">
                <MiniDataRow label="Stream step" value={String(currentStep)} />
                <MiniDataRow label="Rows" value={formatNumber(dataset?.rows_loaded ?? summary.dataset_rows_loaded)} />
                <MiniDataRow label="Mapped assets" value={String(dataset?.equipment_mappings ?? equipment.length)} />
              </div>
              <button
                type="button"
                onClick={() => void advanceStream()}
                className="focus-ring mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-theme-gradient text-xs font-bold text-white shadow-sm transition hover:shadow-theme-glow disabled:opacity-50"
                disabled={busy || apiStatus === "offline"}
              >
                <Zap size={14} />
                Tick Stream
              </button>
            </section>
          </div>
        </aside>

        {/* ── Mobile Nav Overlay ── */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileNavOpen(false)}
            />
            <aside className="relative flex h-full w-[280px] flex-col bg-sidebar text-white shadow-command">
              <div className="flex h-20 items-center gap-3 border-b border-white/[0.06] px-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-theme-gradient-br text-white shadow-theme-glow">
                  <Factory size={22} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base font-bold tracking-normal">SteelGuard AI</p>
                  <p className="text-xs font-semibold text-slate-400">Maintenance Ops</p>
                </div>
              </div>
              <nav className="flex-1 space-y-1 px-3 py-4">
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

        {/* ── Main Content ── */}
        <section className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-20 flex min-h-[76px] flex-col gap-3 border-b border-white/[0.06] bg-[hsl(222,25%,7%)]/80 px-4 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.3)] backdrop-blur-2xl sm:px-5 xl:flex-row xl:items-center xl:justify-between">
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
                  <h1 className="text-xl font-bold tracking-normal text-white">SteelGuard Command Center</h1>
                  <ConnectionPill status={apiStatus} compact />
                </div>
                <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
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
                {/* Mill Room Theme Selector Dots */}
                <div className="flex items-center gap-1.5 border-r border-white/[0.08] pr-3 mr-1">
                  <button
                    type="button"
                    onClick={() => setTheme("violet")}
                    title="Forge Black Theme (Purple)"
                    className={`h-5 w-5 rounded-full border transition-all duration-300 ${
                      theme === "violet"
                        ? "border-violet-400 bg-purple-500 shadow-[0_0_10px_#a855f7] scale-110"
                        : "border-transparent bg-purple-950/40 opacity-50 hover:opacity-100 hover:scale-105"
                    }`}
                    aria-label="Forge Black Theme"
                  />
                  <button
                    type="button"
                    onClick={() => setTheme("amber")}
                    title="Control Room Amber Theme (Amber)"
                    className={`h-5 w-5 rounded-full border transition-all duration-300 ${
                      theme === "amber"
                        ? "border-amber-400 bg-amber-500 shadow-[0_0_10px_#fbbf24] scale-110"
                        : "border-transparent bg-amber-950/40 opacity-50 hover:opacity-100 hover:scale-105"
                    }`}
                    aria-label="Control Room Amber Theme"
                  />
                  <button
                    type="button"
                    onClick={() => setTheme("cyan")}
                    title="Coolant Blue Theme (Cyan)"
                    className={`h-5 w-5 rounded-full border transition-all duration-300 ${
                      theme === "cyan"
                        ? "border-cyan-400 bg-teal-400 shadow-[0_0_10px_#2dd4bf] scale-110"
                        : "border-transparent bg-teal-950/40 opacity-50 hover:opacity-100 hover:scale-105"
                    }`}
                    aria-label="Coolant Blue Theme"
                  />
                </div>
                <button
                  type="button"
                  title={live ? "Pause live stream" : "Resume live stream"}
                  onClick={() => setLive((value) => !value)}
                  className={`focus-ring inline-flex h-10 w-10 items-center justify-center rounded-md border transition-all duration-300 ${
                    live ? "border-theme-accent bg-theme-accent-glow text-theme-accent shadow-theme-glow hover:bg-theme-accent-glow/80" : "border-white/[0.08] bg-white/[0.04] text-slate-400 hover:border-theme-accent/50 hover:text-theme-accent"
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
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-neon-red">
                    {notifications.length}
                  </span>
                </button>
                <div className="hidden items-center gap-3 border-l border-white/[0.08] pl-3 sm:flex">
                  <span className="icon-tile h-10 w-10">
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
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {notifications.length} live notifications
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* ── Dashboard Content ── */}
          <div className="relative space-y-6 p-4 sm:p-5 xl:p-6">
            {/* Hero Section */}
            <section id="dashboard" className="scroll-mt-24 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] shadow-command backdrop-blur-xl">
              <div className="grid xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="relative overflow-hidden p-5 sm:p-6">
                  <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-cyan-400 via-violet-500 via-50% via-fuchsia-500 to-amber-400 animate-aurora bg-[length:300%_auto]" />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="kicker">Selected asset</span>
                    <RiskBadge risk={selectedRisk} />
                    {live && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-400">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                        Live
                      </span>
                    )}
                  </div>
                  <h2 className="mt-3 text-3xl font-bold tracking-normal text-white">{selectedEquipmentName}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                    {selectedEquipment?.description ?? "Backend data will appear here once an equipment asset is selected."}
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
                    <SignalTile icon={<Gauge size={17} />} label="Priority" value={`${selectedPriority || 0}/100`} tone={riskTextColor(selectedRisk)} />
                    <SignalTile icon={<Activity size={17} />} label="RUL" value={`${selectedRul || 0}h`} tone="text-coolant-400" />
                    <SignalTile icon={<TrendingUp size={17} />} label="Anomaly" value={`${selectedAnomaly}%`} tone={selectedAnomaly > 50 ? "text-red-400" : "text-white"} />
                    <SignalTile icon={<Brain size={17} />} label="ML Failure" value={`${selectedMlProbability}%`} tone={selectedMlProbability > 50 ? "text-red-400" : "text-coolant-400"} />
                    <SignalTile icon={<CalendarDays size={17} />} label="Latest sample" value={compactTime(selectedHealth?.latest_reading.timestamp)} tone="text-white" />
                  </div>
                  <FleetRiskStrip overview={healthOverview} />
                </div>

                {/* Data Source Panel */}
                <div id="settings" className="scroll-mt-24 border-t border-white/[0.06] bg-sidebar-solid p-5 text-white xl:border-l xl:border-t-0">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Data source</p>
                      <h3 className="mt-1 text-base font-bold">AI4I live stream</h3>
                    </div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-md border border-coolant-500/20 bg-coolant-500/10 text-coolant-400">
                      <Database size={20} />
                    </span>
                  </div>
                  <div className="mt-5 space-y-3 text-sm">
                    <MiniDataRow label="Rows loaded" value={formatNumber(dataset?.rows_loaded ?? summary.dataset_rows_loaded)} />
                    <MiniDataRow label="Failure rows" value={formatNumber(dataset?.failure_rows_loaded ?? 0)} />
                    <MiniDataRow label="Open alerts" value={String(summary.open_alert_count || alerts.length)} />
                    <MiniDataRow label="Avg RUL" value={`${summary.average_rul_hours || 0}h`} />
                    <MiniDataRow label="OpenAI copilot" value={openaiEnabled ? "Enabled" : "Fallback"} />
                    <MiniDataRow label="RAG vectors" value={ragProvider} />
                    <MiniDataRow label="ML model" value={mlModelLabel} />
                    <MiniDataRow label="ML accuracy" value={formatPercent(mlValidationMetrics?.accuracy, { digits: 0, floor: true })} />
                    <MiniDataRow label="Precision" value={formatPercent(mlValidationMetrics?.precision)} />
                    <MiniDataRow label="Recall" value={formatPercent(mlValidationMetrics?.recall)} />
                    <MiniDataRow label="F1" value={formatPercent(mlValidationMetrics?.f1)} />
                  </div>
                  <div className="mt-5 rounded-md border border-white/[0.08] bg-white/[0.04] p-3">
                    <p className="text-xs font-semibold leading-5 text-slate-400">
                      Step {currentStep} is mapped into steel equipment metrics, then scored by the backend before the AI recommendation is generated.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* KPI Cards */}
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
                tone="theme"
              />
            </section>

            {/* Decision Flow */}
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

            <div id="maintenance" className="scroll-mt-24 animate-slide-up">
              <MaintenanceTimeline
                equipment={equipment}
                healthMap={healthMap}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </div>

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
                      <div className="mt-3">
                        {selectedHealth ? (
                          <SensorMetricsPanel metrics={selectedHealth.metrics} />
                        ) : (
                          <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {[0, 1, 2].map((item) => <MetricSkeleton key={item} />)}
                          </div>
                        )}
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
                    onLock={lockFeedback}
                    onUnlock={unlockFeedback}
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
                    className={`rounded-lg border p-3 text-sm ${
                      error ? "border-red-500/30 bg-red-500/10 text-red-400" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
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

/* ══════════════════════════════════════════════════════════════
   Inline Sub-Components — Dark Glassmorphic Theme
   ══════════════════════════════════════════════════════════════ */

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
      className={`focus-ring relative flex h-10 w-full items-center justify-between rounded-md border px-3 text-left text-sm font-semibold transition-all duration-300 ${
        active ? "border-white/[0.1] bg-white/[0.08] text-white shadow-insetline" : "border-transparent text-slate-400 hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-white"
      }`}
    >
      {active && <span className="absolute inset-y-2 left-0 w-1 rounded-r-full theme-active-indicator" />}
      <span className="flex min-w-0 items-center gap-3">
        <Icon size={17} className={active ? "text-theme-accent" : undefined} />
        <span className="truncate">{label}</span>
      </span>
      {badge && <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">{badge}</span>}
    </button>
  );
}

function ConnectionPill({ status, compact }: { status: ApiStatus; compact?: boolean }) {
  const label = status === "online" ? "Online" : status === "offline" ? "Offline" : "Checking";
  const color =
    status === "online"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
      : status === "offline"
        ? "border-red-500/30 bg-red-500/10 text-red-400"
        : "border-amber-500/30 bg-amber-500/10 text-amber-400";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-bold uppercase tracking-wide ${compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"} ${color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === "online" ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" : status === "offline" ? "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]" : "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]"} animate-pulse`} />
      {label}
    </span>
  );
}

function MiniDataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-slate-400">
      <span className="truncate text-xs font-semibold">{label}</span>
      <span className="truncate text-right text-xs font-bold text-slate-200">{value}</span>
    </div>
  );
}

function HeaderMetric({ label, value, tone }: { label: string; value: string; tone: "coolant" | "red" | "amber" }) {
  const toneStyles = {
    coolant: "border-coolant-500/25 bg-coolant-500/10 text-coolant-400",
    red: "border-red-500/25 bg-red-500/10 text-red-400",
    amber: "border-amber-500/25 bg-amber-500/10 text-amber-400"
  };

  return (
    <div className={`min-w-[88px] rounded-md border px-3 py-2 ${toneStyles[tone]}`}>
      <p className="text-[10px] font-bold uppercase tracking-wide opacity-75">{label}</p>
      <p className="mt-0.5 text-sm font-bold tabular-nums">{value}</p>
    </div>
  );
}

function SignalTile({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: string }) {
  return (
    <div className="rounded-md border border-white/[0.08] bg-white/[0.04] p-3 backdrop-blur-sm transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.06]">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
        <span className="text-slate-500">{icon}</span>
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
    { label: "Unknown", value: overview.unknown, className: "bg-slate-600" }
  ];

  return (
    <div className="mt-5">
      <div className="flex h-2 overflow-hidden rounded-full bg-white/[0.1]">
        {segments.map((segment) => (
          <span
            key={segment.label}
            className={`${segment.className} transition-all duration-500`}
            style={{ width: `${Math.max(segment.value ? 8 : 0, (segment.value / total) * 100)}%` }}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
        {segments.map((segment) => (
          <span key={segment.label}>
            {segment.label}: <span className="text-slate-300">{segment.value}</span>
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
  tone: "coolant" | "red" | "amber" | "blue" | "violet" | "theme";
}) {
  const toneStyles = {
    coolant: {
      bar: "bg-gradient-to-r from-cyan-400 to-teal-400",
      icon: "border-cyan-400/25 bg-cyan-500/10 text-cyan-400"
    },
    red: {
      bar: "bg-gradient-to-r from-rose-500 to-pink-500",
      icon: "border-rose-400/25 bg-rose-500/10 text-rose-400"
    },
    amber: {
      bar: "bg-gradient-to-r from-amber-400 to-orange-400",
      icon: "border-amber-400/25 bg-amber-500/10 text-amber-400"
    },
    blue: {
      bar: "bg-gradient-to-r from-sky-400 to-blue-500",
      icon: "border-sky-400/25 bg-sky-500/10 text-sky-400"
    },
    violet: {
      bar: "bg-gradient-to-r from-violet-500 to-purple-500",
      icon: "border-violet-400/25 bg-violet-500/10 text-violet-400"
    },
    theme: {
      bar: "bg-theme-gradient",
      icon: "border-theme-accent bg-theme-accent-glow text-theme-accent"
    }
  };

  return (
    <section className="panel relative min-h-[126px] overflow-hidden p-4">
      <span className={`absolute inset-x-0 top-0 h-1 ${toneStyles[tone].bar}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-2 truncate text-2xl font-bold tracking-normal text-white">
            {value}
            {suffix && <span className="ml-1 text-sm font-semibold text-slate-500">{suffix}</span>}
          </p>
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md border ${toneStyles[tone].icon}`}>{icon}</span>
      </div>
      <p className="mt-3 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{detail}</p>
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
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${state === "complete" ? "border-theme-accent bg-theme-accent-glow text-theme-accent" : "border-white/[0.08] bg-white/[0.04] text-slate-500"}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
        <p className="mt-1 truncate text-sm font-bold text-white">{value}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{detail}</p>
      </div>
    </article>
  );
}

function SectionHeading({ kicker, title, detail }: { kicker: string; title: string; detail?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div>
        <p className="kicker">{kicker}</p>
        <h2 className="mt-1 text-base font-bold text-white">{title}</h2>
      </div>
      {detail && <p className="text-xs font-semibold text-slate-500">{detail}</p>}
    </div>
  );
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <section className="panel flex h-72 items-center justify-center p-4 text-sm font-semibold text-slate-500">
      <span className="inline-flex items-center gap-2">
        <Loader2 size={17} className="animate-spin text-coolant-500" />
        Loading {label}
      </span>
    </section>
  );
}

function MetricSkeleton() {
  return (
    <div className="panel min-h-[112px] p-4">
      <div className="h-3 w-24 rounded bg-white/[0.06] animate-shimmer" />
      <div className="mt-4 h-6 w-20 rounded bg-white/[0.06] animate-shimmer" />
      <div className="mt-5 h-2 rounded bg-white/[0.06] animate-shimmer" />
    </div>
  );
}

function MlPredictionCard({ prediction }: { prediction?: MlPrediction | null }) {
  if (!prediction) {
    return (
      <section className="panel p-4">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
          <Loader2 size={17} className="animate-spin text-coolant-500" />
          Training or loading ML classifier
        </div>
      </section>
    );
  }

  const probability = Math.round(prediction.failure_probability * 100);
  const mode = prediction.predicted_failure_mode.replaceAll("_", " ");
  const likelyTone = prediction.failure_likely ? "text-red-400" : "text-coolant-400";
  const barColor = prediction.failure_likely ? "bg-red-500" : "bg-coolant";

  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="kicker">ML prediction</p>
          <h2 className="mt-1 flex items-center gap-2 text-base font-bold text-white">
            <Brain size={18} className="text-coolant-400" />
            Failure classifier
          </h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {prediction.model_name} - threshold {Math.round(prediction.threshold * 100)}%
          </p>
        </div>
        <div className="rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-right">
          <p className={`text-2xl font-bold tabular-nums ${likelyTone}`}>{probability}%</p>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">failure probability</p>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.1]">
        <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${Math.max(6, probability)}%` }} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MlFact label="Predicted mode" value={mode} strong />
        <MlFact label="Mode confidence" value={`${Math.round(prediction.failure_mode_confidence * 100)}%`} />
        <MlFact label="Validation F1" value={`${Math.round(prediction.validation_f1 * 100)}%`} />
        <MlFact label="Validation recall" value={`${Math.round(prediction.validation_recall * 100)}%`} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {prediction.top_signals.map((signal) => (
          <span key={signal} className="rounded-md border border-sky-500/25 bg-sky-500/10 px-2.5 py-1 text-xs font-bold capitalize text-sky-400">
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
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 truncate text-sm font-bold capitalize ${strong ? "text-white" : "text-slate-300"}`}>{value}</p>
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
          <h2 className="mt-1 truncate text-base font-bold text-white">{equipment?.asset_type ?? "Loading asset"}</h2>
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
          <AlertTriangle size={16} className={alert ? "text-red-400" : "text-emerald-400"} />
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Current alert</p>
        </div>
        <p className="mt-2 text-sm font-semibold leading-5 text-slate-200">
          {alert?.message ?? "No open alert on selected asset."}
        </p>
        {alert && (
          <p className="mt-2 text-xs font-semibold text-slate-500">
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
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-bold capitalize text-slate-200">{value}</p>
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
          <h2 className="mt-1 text-base font-bold text-white">Inventory pressure</h2>
        </div>
        <span className="icon-tile h-9 w-9">
          <Package size={18} />
        </span>
      </div>
      <div className="mt-4 divide-y divide-white/[0.06]">
        {spares.slice(0, 4).map((part) => (
          <div key={part.id} className="flex items-center justify-between gap-3 py-3 text-sm">
            <div className="min-w-0">
              <p className="truncate font-bold text-slate-200">{part.name}</p>
              <p className="text-xs font-semibold text-slate-500">{part.supplier}</p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold ${part.stock <= 1 && part.critical ? "text-red-400" : "text-slate-200"}`}>
                {part.stock} in stock
              </p>
              <p className="text-xs font-semibold text-slate-500">{part.lead_time_days}d lead</p>
            </div>
          </div>
        ))}
        {!spares.length && <p className="py-6 text-sm text-slate-500">Waiting for spare strategy.</p>}
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
          <h2 className="mt-1 text-base font-bold text-white">Steel rule layer</h2>
        </div>
        <span className="icon-tile h-9 w-9">
          <ShieldCheck size={18} />
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {defects.slice(0, 3).map((defect) => (
          <article key={defect.id} className="card-muted p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-bold capitalize text-slate-200">{defect.defect_type.replaceAll("_", " ")}</p>
              <RiskBadge risk={defect.severity} />
            </div>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{defect.explanation}</p>
            <p className="mt-2 text-xs font-bold text-coolant-400">{Math.round(defect.confidence * 100)}% confidence</p>
          </article>
        ))}
        {!defects.length && <p className="py-5 text-sm font-semibold text-slate-500">No specific process defect rule fired.</p>}
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
          <h2 className="mt-1 text-base font-bold text-white">Next 7 days</h2>
        </div>
        <span className="icon-tile h-9 w-9">
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
                <p className="truncate font-bold text-slate-200">{item.name}</p>
                <span className="text-xs font-bold text-slate-400">{probability}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.1]">
                  <span className={`block h-full rounded-full ${riskBarColor(item.risk)} transition-all duration-500`} style={{ width: `${probability}%` }} />
                </span>
                <span className="w-12 text-right text-xs font-semibold text-slate-500">{Math.max(1, Math.ceil(item.rul / 24))}d</span>
              </div>
            </div>
          );
        })}
        {!equipment.length && <p className="py-6 text-sm text-slate-500">Failure model loading.</p>}
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
          <h2 className="mt-1 text-base font-bold text-white">Role-routed queue</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {sourceLabel} - {lastUpdated ? `Updated ${compactTime(lastUpdated)}` : "Waiting"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-bold text-red-400">{notifications.length}</span>
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
            className="focus-ring grid w-full grid-cols-[auto_1fr] gap-3 rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-left transition-all duration-300 hover:border-coolant-500/25 hover:bg-coolant-500/5"
          >
            <span className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-md ${
              item.severity === "critical"
                ? "bg-red-500/15 text-red-400"
                : item.severity === "high"
                  ? "bg-orange-500/15 text-orange-400"
                  : "bg-amber-500/15 text-amber-400"
            }`}>
              <Bell size={16} />
            </span>
            <span className="min-w-0">
              <span className="flex flex-wrap items-start justify-between gap-2">
                <span className="min-w-0 flex-1 text-sm font-bold leading-5 text-slate-200">{item.title}</span>
                <span className="shrink-0 text-[11px] font-bold text-slate-600">{compactTime(item.timestamp)}</span>
              </span>
              <span className="mt-1 inline-flex"><RiskBadge risk={item.severity} /></span>
              <span className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{item.message}</span>
              <span className="mt-2 block text-xs font-semibold text-coolant-400">{item.action}</span>
            </span>
          </button>
        ))}
        {!notifications.length && <p className="py-6 text-sm font-semibold text-slate-500">No routed notifications for this role.</p>}
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
          <h2 className="mt-1 text-base font-bold text-white">Live incident feed</h2>
        </div>
        <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-bold text-red-400">{alerts.length}</span>
      </div>
      <div className="mt-4 divide-y divide-white/[0.06]">
        {alerts.slice(0, 5).map((alert) => (
          <button
            key={alert.id}
            type="button"
            onClick={() => onSelect(alert.equipment_id)}
            className={`focus-ring grid w-full grid-cols-[auto_1fr] gap-3 rounded-md border px-3 py-3 text-left transition-all duration-300 hover:border-coolant-500/25 hover:bg-white/[0.03] ${
              selectedId === alert.equipment_id ? "border-coolant-500/30 bg-coolant-500/5" : "border-transparent"
            }`}
          >
            <span className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-md ${
              alert.severity === "critical"
                ? "bg-red-500/15 text-red-400"
                : alert.severity === "high"
                  ? "bg-orange-500/15 text-orange-400"
                  : "bg-amber-500/15 text-amber-400"
            }`}>
              <AlertTriangle size={16} />
            </span>
            <span className="min-w-0">
              <span className="line-clamp-2 text-sm font-bold leading-5 text-slate-200">{alert.message}</span>
              <span className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                <span>{compactTime(alert.timestamp)}</span>
                <span>{alert.signal}</span>
                <RiskBadge risk={alert.severity} />
              </span>
            </span>
          </button>
        ))}
        {!alerts.length && (
          <div className="flex items-center gap-2 py-7 text-sm font-semibold text-emerald-400">
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
          <h2 className="mt-1 text-base font-bold text-white">Decision checkpoints</h2>
        </div>
        <span className="icon-tile h-9 w-9 border-purple-500/25 bg-purple-500/10 text-purple-400">
          <Sparkles size={18} />
        </span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {trace.map((node, index) => {
          const status = String((node as Record<string, unknown>).status ?? "complete");
          const isLlm = String(node.node) === "llm_reasoning";
          const labelColor = isLlm
            ? status === "complete" ? "text-emerald-400" : "text-amber-400"
            : "text-coolant-400";
          return (
            <article key={`${String(node.node)}-${index}`} className="card-muted p-3">
              <div className="flex items-center gap-2">
                <p className={`text-xs font-bold uppercase tracking-wide ${labelColor}`}>{String(node.node).replaceAll("_", " ")}</p>
                {isLlm && (
                  <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    status === "complete" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                  }`}>
                    {status === "complete" ? "LLM" : "Template"}
                  </span>
                )}
              </div>
              <p className="mt-2 line-clamp-4 text-xs leading-5 text-slate-400">{String(node.summary)}</p>
            </article>
          );
        })}
        {!trace.length && <p className="text-sm text-slate-500">Waiting for agent reasoning.</p>}
      </div>
    </section>
  );
}
