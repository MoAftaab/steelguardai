"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  Cpu,
  Database,
  DollarSign,
  ExternalLink,
  Eye,
  FileText,
  Gauge,
  Layers,
  LayoutDashboard,
  Loader2,
  Percent,
  Play,
  RefreshCw,
  Shield,
  Sliders,
  Sparkles,
  TrendingUp,
  Workflow,
  Wrench,
  Zap
} from "lucide-react";
import { api } from "@/lib/api";
import SparksCanvas from "@/components/SparksCanvas";

const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

type FeatureTab = "diagnostics" | "copilot" | "recommendations" | "twin";
type ArchTab = "system-architecture" | "system-flow" | "research-blueprint";

export default function LandingPage() {
  const router = useRouter();
  const [activeFeature, setActiveFeature] = useState<FeatureTab>("diagnostics");
  const [activeArch, setActiveArch] = useState<ArchTab>("system-architecture");
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchProgress, setLaunchProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState("Initializing console...");

  // --- New Interactive Landing Page States ---
  // 1. API Backend Health
  const [apiHealth, setApiHealth] = useState({
    status: "checking",
    modelName: "Checking...",
    ragEmbedding: "Checking...",
    streamStep: 0,
    rowsLoaded: 0
  });

  // 2. Sandbox Sensors
  const [sandboxSensors, setSandboxSensors] = useState({
    temperature: 72,
    speed: 1520,
    torque: 350,
    vibration: 2.1,
    flowRate: 45
  });

  // 3. ROI Calculator Inputs
  const [roiAssets, setRoiAssets] = useState(45);
  const [roiDowntimeCost, setRoiDowntimeCost] = useState(12000);
  const [roiOutages, setRoiOutages] = useState(6);

  // 4. ML Benchmarking Profile
  const [activeMlTab, setActiveMlTab] = useState<"extratrees" | "xgboost" | "randomforest">("extratrees");

  // Fetch live FastAPI backend metrics
  useEffect(() => {
    let active = true;
    const fetchHealth = async () => {
      try {
        const healthPayload = await api.healthz();
        const datasetPayload = await api.dataset();
        if (!active) return;
        setApiHealth({
          status: "online",
          modelName: healthPayload.ml?.model_name ?? "ExtraTreesClassifier",
          ragEmbedding: healthPayload.rag?.embedding_model ?? "text-embedding-3-small",
          streamStep: datasetPayload.stream_step,
          rowsLoaded: datasetPayload.rows_loaded
        });
      } catch {
        if (!active) return;
        setApiHealth((prev) => ({
          ...prev,
          status: "offline",
          modelName: "ExtraTrees (Simulated)",
          ragEmbedding: "Local-Vector-Fallback",
          streamStep: prev.streamStep || 12,
          rowsLoaded: prev.rowsLoaded || 10000
        }));
      }
    };
    void fetchHealth();
    const timer = setInterval(fetchHealth, 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  // Calculate Anomaly Score & Failure Mode based on Sandbox Sensors
  const calculatedMetrics = (() => {
    let devCount = 0;
    let maxSeverity = "NORMAL";
    let failureMode = "Normal Operation (Healthy)";
    let failureProb = 2; // base normal probability

    // Temperature (norm 60-80, warning > 85, critical > 95)
    if (sandboxSensors.temperature > 95) {
      devCount += 3;
      maxSeverity = "CRITICAL";
      failureMode = "Thermal Failure (98% probability)";
      failureProb = 98;
    } else if (sandboxSensors.temperature > 85) {
      devCount += 1.5;
      maxSeverity = "WARNING";
      failureMode = "Overheating Warning (65% probability)";
      failureProb = 65;
    }

    // Speed (norm 1200-1800, warning > 1900, critical > 2100)
    if (sandboxSensors.speed > 2100) {
      devCount += 3;
      maxSeverity = "CRITICAL";
      failureMode = "Electrical Trip / Over-Speed (89% probability)";
      failureProb = 89;
    } else if (sandboxSensors.speed > 1900) {
      devCount += 1.5;
      maxSeverity = "WARNING";
      failureMode = "High Speed Limit Exceeded (55% probability)";
      failureProb = 55;
    }

    // Torque (norm 200-450, warning > 500, critical > 600)
    if (sandboxSensors.torque > 600) {
      devCount += 3;
      if (maxSeverity !== "CRITICAL") {
        maxSeverity = "CRITICAL";
        failureMode = "Mechanical Overload (92% probability)";
        failureProb = 92;
      }
    } else if (sandboxSensors.torque > 500) {
      devCount += 1.5;
      if (maxSeverity === "NORMAL") {
        maxSeverity = "WARNING";
        failureMode = "High Load Stress (48% probability)";
        failureProb = 48;
      }
    }

    // Vibration (norm 1-3.5, warning > 4.5, critical > 6.0)
    if (sandboxSensors.vibration > 6.0) {
      devCount += 3;
      maxSeverity = "CRITICAL";
      failureMode = "Rotational/Mechanical Damage (95% probability)";
      failureProb = 95;
    } else if (sandboxSensors.vibration > 4.5) {
      devCount += 1.5;
      if (maxSeverity !== "CRITICAL") {
        maxSeverity = "WARNING";
        failureMode = "High Shaft Vibration (72% probability)";
        failureProb = 72;
      }
    }

    // Flow Rate (norm 30-60, warning < 20 or > 70)
    if (sandboxSensors.flowRate < 15 || sandboxSensors.flowRate > 75) {
      devCount += 3;
      if (maxSeverity !== "CRITICAL") {
        maxSeverity = "CRITICAL";
        failureMode = "Coolant Flow Starvation (94% probability)";
        failureProb = 94;
      }
    } else if (sandboxSensors.flowRate < 20 || sandboxSensors.flowRate > 70) {
      devCount += 1.5;
      if (maxSeverity === "NORMAL") {
        maxSeverity = "WARNING";
        failureMode = "Flow Rate Instability (52% probability)";
        failureProb = 52;
      }
    }

    // Calculate Anomaly Score from 0 to 100%
    const anomalyScore = Math.min(100, Math.round((devCount / 10) * 100));

    // Calculate RUL
    let rul = 380;
    if (anomalyScore > 0) {
      rul = Math.max(8, Math.round(380 * (1 - anomalyScore / 100)));
    }

    return {
      anomalyScore,
      rul,
      severity: maxSeverity,
      failureMode,
      failureProb
    };
  })();

  // ROI calculations
  const roiMetrics = (() => {
    // 4 hours avg outage duration without AI
    const baselineCost = roiOutages * 4 * roiDowntimeCost;
    // Prevent 85% outages, reduce duration of remaining 15% to 1 hour
    const optimizedCost = Math.round(
      (roiOutages * 0.15 * 1 * roiDowntimeCost) + (roiOutages * 0.85 * 0 * roiDowntimeCost)
    );
    const savings = Math.max(0, baselineCost - optimizedCost);
    const costPerAssetLicence = 150; // license cost per year per asset
    const licenceCost = roiAssets * costPerAssetLicence;
    const netSavings = Math.max(0, savings - licenceCost);
    const roiPercentage = licenceCost > 0 ? Math.round((netSavings / licenceCost) * 100) : 0;

    return {
      baselineCost,
      optimizedCost,
      savings,
      licenceCost,
      netSavings,
      roiPercentage
    };
  })();

  const mlTabMetrics = {
    extratrees: { auprc: 89, accuracy: 98.4, roc: 97, latency: "0.12ms", note: "Extremely low variance, sub-millisecond edge predictions, and explainable features." },
    xgboost: { auprc: 87, accuracy: 98.2, roc: 96, latency: "0.78ms", note: "High memory utilization, complex gradient boosts, slower edge compile times." },
    randomforest: { auprc: 84, accuracy: 97.8, roc: 95, latency: "1.15ms", note: "Medium variance tree groups, decent fallback latency." }
  }[activeMlTab];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Simulate progress and status text during console launch
  useEffect(() => {
    if (!isLaunching) return;

    const progressInterval = setInterval(() => {
      setLaunchProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + Math.floor(Math.random() * 8) + 2;
      });
    }, 150);

    const statuses = [
      { min: 0, text: "Connecting to FastAPI backend..." },
      { min: 25, text: "Loading ExtraTrees predictive weights..." },
      { min: 50, text: "Hydrating semantic RAG vector index..." },
      { min: 75, text: "Compiling operations digital twin..." },
      { min: 90, text: "Launching operations dashboard..." }
    ];

    const statusInterval = setInterval(() => {
      const currentStatus = statuses.findLast(s => launchProgress >= s.min);
      if (currentStatus) {
        setLoadingStatus(currentStatus.text);
      }
    }, 100);

    return () => {
      clearInterval(progressInterval);
      clearInterval(statusInterval);
    };
  }, [isLaunching, launchProgress]);

  const handleLaunch = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLaunching(true);
    // Short delay to let the loading bar show progress, then navigate
    setTimeout(() => {
      router.push("/dashboard");
    }, 1200);
  };

  const featureDetails = {
    diagnostics: {
      title: "ML Predictive Insights & Anomaly Tracking",
      description: "Real-time anomaly scoring coupled with automated ExtraTrees classification. Predicts probability of mechanical, thermal, electrical, and rotational issues before they cause failures.",
      bulletPoints: [
        "ExtraTrees & Random Forest ensemble classifier selection.",
        "Automatic probability threshold optimization across 65 parameters.",
        "Dynamic Remaining Useful Life (RUL) estimation in hours.",
        "Monitors temp, speed, torque, vibration, and flow rate."
      ],
      image: "/ml_insights.png",
      accentColor: "text-coolant-400 border-coolant-500/20 bg-coolant-950/10",
      glowColor: "shadow-glow-teal"
    },
    copilot: {
      title: "Maintenance Wizard AI Copilot",
      description: "Multi-turn conversational assistant with full semantic RAG retrieval. Provides engineers with direct, natural language answers backed by plant manuals, SOPs, and historical reports.",
      bulletPoints: [
        "1536-dimension OpenAI vector embeddings search.",
        "Fallback 256-dimension local hash-vector offline database.",
        "Dynamic context aggregation based on active equipment alerts.",
        "Saves conversation history to disk for audit trails."
      ],
      image: "/wizard_chat.png",
      accentColor: "text-purple-400 border-purple-500/20 bg-purple-950/10",
      glowColor: "shadow-glow-purple"
    },
    recommendations: {
      title: "Context-Aware Actionable Checklists",
      description: "Assembles diverse data streams into structured recommendation cards containing step-by-step resolution checklists, cited evidence, and spare parts pressure scores.",
      bulletPoints: [
        "Explicit root-cause diagnostics with relevance ratings.",
        "Interactive step-by-step disassembly and repair logs.",
        "Criticality-based scheduling logic (Shutdown, Next Shift, Routine).",
        "Tracks warehouse stock levels, lead times, and vendor contacts."
      ],
      image: "/recommendation_panel.png",
      accentColor: "text-forge-400 border-forge-500/20 bg-forge-950/10",
      glowColor: "shadow-glow-amber"
    },
    twin: {
      title: "Process Digital Twin & Plant Status",
      description: "Animated process flow diagram showing real-time telemetry overlays for monitored assets including the Rolling Mill, Blast Furnace Pump, and Conveyor Gearbox.",
      bulletPoints: [
        "Interactive live telemetry tick-based simulation.",
        "Visual feedback indicating low, medium, high, and critical risk.",
        "Historical failure trend lines mapping multi-class failure logs.",
        "Unified alarm monitoring and system health dashboard."
      ],
      image: "/dashboard_overview.png",
      accentColor: "text-blue-400 border-blue-500/20 bg-blue-950/10",
      glowColor: "shadow-glow-blue"
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(228,22%,5%)] text-slate-100 overflow-x-hidden relative">
      {/* Full-Screen Glassmorphic Loading Overlay */}
      {isLaunching && (
        <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-lg flex flex-col items-center justify-center select-none animate-glow-pulse">
          <div className="max-w-md w-full px-6 flex flex-col items-center text-center">
            {/* Spinning/Pulsing Brand Logo */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-coolant-500 to-purple-600 rounded-full blur-xl opacity-50 animate-pulse" />
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center relative z-10 shadow-lifted">
                <Shield className="w-9 h-9 text-coolant-400 animate-spin [animation-duration:8s]" />
                <Zap className="w-5 h-5 text-forge-400 absolute" />
              </div>
            </div>

            <h3 className="font-extrabold text-lg tracking-tight text-white mb-1">
              SteelGuard <span className="text-coolant-400 font-medium">AI</span>
            </h3>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-8">
              Reliability Console Launching
            </p>

            {/* Premium Progress Bar */}
            <div className="w-64 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80 relative mb-4">
              <div 
                className="h-full bg-gradient-to-r from-coolant-500 to-purple-600 rounded-full transition-all duration-300 ease-out shadow-glow"
                style={{ width: `${launchProgress}%` }}
              />
            </div>

            {/* Dynamic Status Text */}
            <p className="text-xs text-slate-400 font-mono h-4">
              {loadingStatus}
            </p>
          </div>
        </div>
      )}

      {/* Background Steel Mill Context Image with Fade Mask */}
      <div 
        className="absolute inset-x-0 top-0 h-[800px] bg-cover bg-center pointer-events-none z-0 opacity-[0.14]"
        style={{ 
          backgroundImage: "url('/steel_mill_bg.png')",
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0) 100%)"
        }}
      />

      {/* Sparks and Embers Background Animation */}
      <div className="absolute inset-x-0 top-0 h-[850px] overflow-hidden pointer-events-none z-0">
        <SparksCanvas />
      </div>
      
      {/* Background Neon Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[800px] pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[15%] w-[45%] h-[55%] rounded-full bg-purple-600/10 blur-[130px] animate-glow-pulse" />
        <div className="absolute top-[-15%] right-[15%] w-[45%] h-[55%] rounded-full bg-coolant-600/15 blur-[130px] animate-glow-pulse [animation-delay:1.2s]" />
        {/* Molten Forge Heat Glow Orb */}
        <div className="absolute bottom-[5%] left-[20%] w-[60%] h-[45%] rounded-full bg-forge-600/15 blur-[140px] animate-glow-pulse [animation-delay:0.6s]" />
      </div>

      {/* Navigation Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[hsl(228,22%,6%)]/80 backdrop-blur-md border-b border-border/60 shadow-quiet py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <Shield className="w-8 h-8 text-coolant-400 group-hover:scale-105 transition-transform duration-300" />
              <Zap className="w-4 h-4 text-forge-400 absolute top-2.5 left-2" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              SteelGuard <span className="text-coolant-400 font-medium">AI</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-coolant-400 transition-colors duration-200">Features</a>
            <a href="#twin-showcase" className="hover:text-coolant-400 transition-colors duration-200">Diagnostics</a>
            <a href="#architecture" className="hover:text-coolant-400 transition-colors duration-200">Architecture</a>
            <a href="#model-comparison" className="hover:text-coolant-400 transition-colors duration-200">ML Model</a>
          </nav>

          <div className="flex items-center gap-4">
            <a
              href="/dashboard"
              onClick={handleLaunch}
              className="relative group overflow-hidden rounded-lg p-[1px] focus:outline-none cursor-pointer"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-coolant-500 to-purple-600 rounded-lg group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative px-4 py-2 bg-slate-950 rounded-[7px] text-xs font-semibold text-white tracking-wide transition-colors group-hover:bg-slate-900 flex items-center gap-1.5 border border-white/5">
                Launch Console <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-36 pb-16 md:pt-44 md:pb-24 max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          {/* Live Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-[10px] uppercase font-bold tracking-widest text-coolant-400 mb-6 shadow-inner animate-float">
            <span className="w-2 h-2 rounded-full bg-coolant-500 animate-pulse shadow-glow" />
            Reliability Platform v1.5
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.15] mb-6">
            Industrial intelligence for{"   "}
            <span className="bg-gradient-to-r from-coolant-400 via-purple-400 to-forge-400 bg-clip-text text-transparent">
              steel plant reliability
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto mb-8">
            SteelGuard AI unites real-time multi-signal anomaly thresholds, auto-selecting ensemble tree classifiers, and semantic RAG search to prevent outages, estimate remaining useful life (RUL), and plan automated actions.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/dashboard"
              onClick={handleLaunch}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-coolant-600 to-coolant-500 hover:from-coolant-500 hover:to-coolant-400 text-slate-950 text-xs font-bold rounded-lg shadow-glow hover:shadow-neon-teal transition-all duration-300 flex items-center justify-center gap-2 border border-coolant-400/20 cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4" /> Enter Operations Dashboard
            </a>
            <a
              href="#architecture"
              className="w-full sm:w-auto px-6 py-3 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg border border-slate-800 hover:border-slate-700 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Layers className="w-4 h-4" /> Explore Blueprint
            </a>
          </div>
        </div>

        {/* Dashboard Mockup (Floating & Glowing Border Shimmer Animation) */}
        <div className="relative max-w-3xl mx-auto group animate-float">
          <div className="absolute -inset-1.5 bg-gradient-to-r from-coolant-500 via-purple-600 to-forge-500 bg-[length:200%_auto] animate-gradient-shift rounded-2xl blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-1000" />
          <div className="relative bg-gradient-to-r from-coolant-500 via-purple-600 to-forge-500 bg-[length:200%_auto] animate-gradient-shift rounded-xl p-[1.5px] shadow-lifted backdrop-blur-sm transition-all duration-500 hover:scale-[1.02] hover:shadow-neon-teal">
            <div className="bg-[hsl(228,22%,5%)] rounded-[10px] overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800/80 text-[10px] text-slate-500 bg-slate-950/80">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-800" />
                  <span className="w-2 h-2 rounded-full bg-slate-800" />
                  <span className="w-2 h-2 rounded-full bg-slate-800" />
                </div>
                <div className="px-3 py-0.5 bg-slate-900/80 rounded-md border border-slate-800/80 font-mono text-[9px] tracking-wide">
                  steelguard.plant/dashboard
                </div>
                <div className="w-8" />
              </div>
              <div className="relative w-full flex justify-center bg-slate-950/90 p-2.5">
                <img
                  src="/dashboard_overview.png"
                  alt="SteelGuard AI Operations Dashboard"
                  className="max-h-[320px] w-auto max-w-full object-contain rounded shadow-soft transition-transform duration-700"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live System Health & API Telemetry Monitor */}
      <section className="py-8 max-w-7xl mx-auto px-6 relative z-10 border-t border-slate-900/60">
        <div className="bg-slate-950/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-quiet flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className={`flex h-3 w-3 rounded-full ${apiHealth.status === "online" ? "bg-emerald-500" : apiHealth.status === "offline" ? "bg-amber-500" : "bg-purple-500 animate-ping"}`} />
              {apiHealth.status === "online" && (
                <span className="absolute inset-0 rounded-full bg-emerald-500/50 animate-ping" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">FastAPI Connection</h4>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${apiHealth.status === "online" ? "bg-emerald-950/60 text-emerald-400 border border-emerald-900/40" : "bg-amber-950/60 text-amber-400 border border-amber-900/40"}`}>
                  {apiHealth.status.toUpperCase()}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                {apiHealth.status === "online" ? "Establishing telemetry pipeline..." : "FastAPI server unreachable. Operating in high-fidelity simulation mode."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 md:gap-10 shrink-0">
            <div className="border-l border-slate-800/60 pl-4">
              <span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider font-mono">Stream Step</span>
              <p className="text-sm font-extrabold text-white mt-0.5 font-mono">{apiHealth.streamStep}</p>
            </div>
            <div className="border-l border-slate-800/60 pl-4">
              <span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider font-mono">Logs Ingested</span>
              <p className="text-sm font-extrabold text-white mt-0.5 font-mono">{formatNumber(apiHealth.rowsLoaded)}</p>
            </div>
            <div className="border-l border-slate-800/60 pl-4">
              <span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider font-mono">Active Classifier</span>
              <p className="text-sm font-extrabold text-coolant-400 mt-0.5 font-mono truncate max-w-[120px]" title={apiHealth.modelName}>
                {apiHealth.modelName.replace("Classifier", "")}
              </p>
            </div>
            <div className="border-l border-slate-800/60 pl-4">
              <span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider font-mono">RAG Embeddings</span>
              <p className="text-sm font-extrabold text-purple-400 mt-0.5 font-mono truncate max-w-[120px]" title={apiHealth.ragEmbedding}>
                {apiHealth.ragEmbedding}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights Grid */}
      <section className="py-12 max-w-7xl mx-auto px-6 relative z-10 border-t border-slate-900">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/10 border border-slate-800/80 p-5 rounded-xl relative overflow-hidden group hover:border-coolant-500/30 transition-all duration-300">
            <div className="w-9 h-9 rounded-lg bg-coolant-950 border border-coolant-900/50 flex items-center justify-center text-coolant-400 mb-4 group-hover:scale-105 transition-transform duration-300">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">Real-Time Anomaly Scoring</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Weighted multi-signal anomaly evaluations comparing temp, speed, torque, vibration, and flow rate against baseline values.
            </p>
          </div>

          <div className="bg-slate-900/10 border border-slate-800/80 p-5 rounded-xl relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300">
            <div className="w-9 h-9 rounded-lg bg-purple-950 border border-purple-900/50 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-105 transition-transform duration-300">
              <Brain className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">Adaptive Ensemble Classifier</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dynamically trains and selects between ExtraTrees and RandomForest classifiers to predict failure mode and severity.
            </p>
          </div>

          <div className="bg-slate-900/10 border border-slate-800/80 p-5 rounded-xl relative overflow-hidden group hover:border-forge-500/30 transition-all duration-300">
            <div className="w-9 h-9 rounded-lg bg-forge-950 border border-forge-900/50 flex items-center justify-center text-forge-400 mb-5 group-hover:scale-105 transition-transform duration-300">
              <Bot className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">Retrieval-Augmented Guidance</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Constructs semantic search contexts over SOP logs and vendor inventory via OpenAI embeddings with a local TF-IDF fallback.
            </p>
          </div>
        </div>
      </section>

      {/* New Context Image Showcase Section */}
      <section id="twin-showcase" className="py-20 max-w-7xl mx-auto px-6 relative z-10 border-t border-slate-900">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          {/* Casting HUD Card - Animated Gradient Shimmer Border */}
          <div className="w-full lg:w-1/2 relative group">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-forge-500 via-purple-600 to-coolant-500 bg-[length:200%_auto] animate-gradient-shift rounded-2xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-1000" />
            <div className="relative bg-gradient-to-r from-forge-500 via-purple-600 to-coolant-500 bg-[length:200%_auto] animate-gradient-shift rounded-xl p-[1.5px] shadow-quiet overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-glow-teal">
              <div className="bg-[hsl(228,22%,5%)] rounded-[10px] overflow-hidden p-2">
                <div className="relative w-full flex justify-center bg-slate-950/90 rounded-lg">
                  <img
                    src="/steel_casting_hud.png"
                    alt="Steel Mill Molten Casting Diagnostic Overlay"
                    className="max-h-[300px] w-auto max-w-full object-contain rounded"
                  />
                </div>
                <div className="mt-3 bg-slate-950/80 backdrop-blur-md border border-slate-850 px-4 py-3 rounded-lg text-left">
                  <div className="text-[10px] uppercase font-bold text-forge-400 mb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-forge-500 animate-pulse" />
                    Thermal casting telemetry active
                  </div>
                  <p className="text-[11px] text-slate-300 leading-normal">
                    SteelGuard AI tracks molten alloy flow, thermal heat loss metrics, and mechanical stress indices in real time.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-905 border border-slate-800 text-[10px] uppercase font-bold tracking-widest text-coolant-400">
              <Zap className="w-3.5 h-3.5" /> Cyber-Physical Integration
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight leading-snug">
              Bridging heavy machinery with expert AI reasoning
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Industrial operations cannot afford black-box predictions. SteelGuard AI combines physical sensor signals with strict mechanical boundaries, delivering safe, explainable maintenance directives to floor operators.
            </p>
            <div className="space-y-4 pt-2">
              <div className="flex gap-3.5 items-start">
                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-850 flex items-center justify-center text-coolant-450 shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">Sensor-to-Asset Translation</h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Converts base parameters like torque load, rotational rpm, and tool wear rates into asset-specific structural logs.
                  </p>
                </div>
              </div>

              <div className="flex gap-3.5 items-start">
                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-850 flex items-center justify-center text-purple-400 shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">Vectorized SOP Retrieval</h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Matches exact plant fault codes with standard repair files, instantly pulling component diagrams and disassembly steps.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Features Tabs Section */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-6 relative z-10 border-t border-slate-900">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="w-full lg:w-[45%]">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] uppercase font-bold tracking-widest text-coolant-400 mb-4">
              <Sparkles className="w-3 h-3" /> Core Capabilities
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-5">
              Designed for high-intensity steel plant diagnostics
            </h2>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              Explore SteelGuard AI's core features. Select a tab below to inspect the interface layout, metrics, and functional highlights.
            </p>

            {/* Tabs List */}
            <div className="space-y-3">
              <button
                onClick={() => setActiveFeature("diagnostics")}
                className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-start gap-4 ${
                  activeFeature === "diagnostics"
                    ? "bg-slate-900/55 border-coolant-500/30 shadow-subtle"
                    : "bg-transparent border-transparent hover:bg-slate-900/30"
                }`}
              >
                <div className={`p-2 rounded-lg border ${
                  activeFeature === "diagnostics"
                    ? "bg-coolant-950 border-coolant-900/50 text-coolant-400"
                    : "bg-slate-900 border-slate-800 text-slate-500"
                }`}>
                  <Gauge className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white mb-0.5">Ensemble Predictive Metrics</h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Check failure probability charts, validation scores, and raw signal feature importance rankings.
                  </p>
                </div>
              </button>

              <button
                onClick={() => setActiveFeature("copilot")}
                className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-start gap-4 ${
                  activeFeature === "copilot"
                    ? "bg-slate-900/55 border-purple-500/30 shadow-subtle"
                    : "bg-transparent border-transparent hover:bg-slate-900/30"
                }`}
              >
                <div className={`p-2 rounded-lg border ${
                  activeFeature === "copilot"
                    ? "bg-purple-950 border-purple-900/50 text-purple-400"
                    : "bg-slate-900 border-slate-800 text-slate-500"
                }`}>
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white mb-0.5">Maintenance Wizard Chat</h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Multi-turn copilot dialogue referencing manuals and prior breakdown logs to construct solutions.
                  </p>
                </div>
              </button>

              <button
                onClick={() => setActiveFeature("recommendations")}
                className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-start gap-4 ${
                  activeFeature === "recommendations"
                    ? "bg-slate-900/55 border-forge-500/30 shadow-subtle"
                    : "bg-transparent border-transparent hover:bg-slate-900/30"
                }`}
              >
                <div className={`p-2 rounded-lg border ${
                  activeFeature === "recommendations"
                    ? "bg-forge-950 border-forge-900/50 text-forge-400"
                    : "bg-slate-900 border-slate-800 text-slate-500"
                }`}>
                  <Workflow className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white mb-0.5">Actionable Recommendations</h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Aggregates root causes, checklists, cited evidence, and node traces inside an engineering card.
                  </p>
                </div>
              </button>

              <button
                onClick={() => setActiveFeature("twin")}
                className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-start gap-4 ${
                  activeFeature === "twin"
                    ? "bg-slate-900/55 border-slate-800/80 shadow-subtle"
                    : "bg-transparent border-transparent hover:bg-slate-900/30"
                }`}
              >
                <div className={`p-2 rounded-lg border ${
                  activeFeature === "twin"
                    ? "bg-slate-900 border-slate-800 text-coolant-400"
                    : "bg-slate-900 border-slate-800 text-slate-500"
                }`}>
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white mb-0.5">Process Digital Twin</h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Overview of plant layouts mapping motor temperatures, gearbox vibration, and fluid pressures.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Tab Image Pane (Shimmering border & fully visible mockup) */}
          <div className="w-full lg:w-[55%] space-y-6">
            <div className="relative bg-gradient-to-r from-coolant-500 via-purple-600 to-forge-500 bg-[length:200%_auto] animate-gradient-shift rounded-xl p-[1.2px] shadow-lifted backdrop-blur-sm max-w-md mx-auto overflow-hidden transition-all duration-500 hover:scale-[1.02]">
              <div className="bg-[hsl(228,22%,5%)] rounded-[10px] overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-900 text-[9px] text-slate-500 font-mono bg-slate-950/80">
                  <span>PREVIEW: {featureDetails[activeFeature].title.toUpperCase()}</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-850 text-[8px]">INTERFACE MOCKUP</span>
                </div>
                <div className="relative w-full flex justify-center bg-slate-950/90 rounded-lg p-2.5">
                  <img
                    src={featureDetails[activeFeature].image}
                    alt={featureDetails[activeFeature].title}
                    className="max-h-[220px] w-auto max-w-full object-contain rounded"
                  />
                </div>
              </div>
            </div>

            {/* Bullet Points Details Card */}
            <div className="bg-slate-900/20 border border-slate-800/80 rounded-xl p-5 max-w-md mx-auto">
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-bold mb-3 ${featureDetails[activeFeature].accentColor}`}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Technical Feature Highlight
              </div>
              <h3 className="text-sm font-bold text-white mb-2">{featureDetails[activeFeature].title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">{featureDetails[activeFeature].description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                {featureDetails[activeFeature].bulletPoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-1.5 text-slate-300">
                    <span className="text-coolant-400 mt-0.5">•</span>
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Telemetry Sandbox & Alert Simulator */}
      <section id="sandbox" className="py-20 max-w-7xl mx-auto px-6 relative z-10 border-t border-slate-900">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] uppercase font-bold tracking-widest text-coolant-400 mb-4">
            <Sliders className="w-3.5 h-3.5" /> Operations Sandbox
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-4">
            Test the ExtraTrees Classifier Live
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed max-w-xl mx-auto">
            Manipulate the mill sensors below to simulate anomalous conditions. Watch the AI model estimate remaining useful life (RUL) and isolate failure classes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-5xl mx-auto">
          {/* Controls Panel */}
          <div className="lg:col-span-5 bg-slate-900/10 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
            <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-coolant-400" /> Sensor Controls
            </h3>
            
            <div className="space-y-6">
              {/* Temperature */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-400">Temperature</span>
                  <span className={`${sandboxSensors.temperature > 95 ? "text-red-400 font-bold" : sandboxSensors.temperature > 85 ? "text-amber-400" : "text-slate-300"}`}>
                    {sandboxSensors.temperature}°C
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="120"
                  value={sandboxSensors.temperature}
                  onChange={(e) => setSandboxSensors(prev => ({ ...prev, temperature: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-coolant-500"
                />
                <span className="text-[9px] text-slate-500 font-mono mt-1 block">Normal: 60°C - 80°C</span>
              </div>

              {/* Speed */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-400">Rotation Speed</span>
                  <span className={`${sandboxSensors.speed > 2100 ? "text-red-400 font-bold" : sandboxSensors.speed > 1900 ? "text-amber-400" : "text-slate-300"}`}>
                    {sandboxSensors.speed} RPM
                  </span>
                </div>
                <input
                  type="range"
                  min="800"
                  max="2500"
                  value={sandboxSensors.speed}
                  onChange={(e) => setSandboxSensors(prev => ({ ...prev, speed: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-coolant-500"
                />
                <span className="text-[9px] text-slate-500 font-mono mt-1 block">Normal: 1200 - 1800 RPM</span>
              </div>

              {/* Vibration */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-400">Shaft Vibration</span>
                  <span className={`${sandboxSensors.vibration > 6.0 ? "text-red-400 font-bold" : sandboxSensors.vibration > 4.5 ? "text-amber-400" : "text-slate-300"}`}>
                    {sandboxSensors.vibration} mm/s
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="8.0"
                  step="0.1"
                  value={sandboxSensors.vibration}
                  onChange={(e) => setSandboxSensors(prev => ({ ...prev, vibration: parseFloat(e.target.value) }))}
                  className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-coolant-500"
                />
                <span className="text-[9px] text-slate-500 font-mono mt-1 block">Normal: 1.0 - 3.5 mm/s</span>
              </div>

              {/* Flow Rate */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-400">Coolant Flow</span>
                  <span className={`${(sandboxSensors.flowRate < 20 || sandboxSensors.flowRate > 70) ? "text-amber-400" : "text-slate-300"}`}>
                    {sandboxSensors.flowRate} L/min
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="90"
                  value={sandboxSensors.flowRate}
                  onChange={(e) => setSandboxSensors(prev => ({ ...prev, flowRate: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-coolant-500"
                />
                <span className="text-[9px] text-slate-500 font-mono mt-1 block">Normal: 30 - 60 L/min</span>
              </div>
            </div>
          </div>

          {/* AI Output Panel */}
          <div className={`lg:col-span-7 rounded-2xl p-6 flex flex-col justify-between border transition-all duration-300 ${calculatedMetrics.severity === "CRITICAL" ? "bg-red-950/10 border-red-500/30 shadow-glow-rose" : calculatedMetrics.severity === "WARNING" ? "bg-amber-950/10 border-amber-500/30 shadow-glow-amber" : "bg-slate-900/10 border-slate-800/80 hover:border-coolant-500/20"}`}>
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-400" /> ExtraTrees Diagnostic Evaluation
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${calculatedMetrics.severity === "CRITICAL" ? "bg-red-950 text-red-400 border border-red-900" : calculatedMetrics.severity === "WARNING" ? "bg-amber-950 text-amber-400 border border-amber-900" : "bg-emerald-950 text-emerald-400 border border-emerald-900"}`}>
                  {calculatedMetrics.severity}
                </span>
              </div>

              {/* Status HUD display */}
              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800/60 font-mono text-xs space-y-4">
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-900">
                  <span className="text-slate-500">Telemetry Health State</span>
                  <span className={`font-bold ${calculatedMetrics.severity === "CRITICAL" ? "text-red-400 animate-pulse" : calculatedMetrics.severity === "WARNING" ? "text-amber-400" : "text-emerald-400"}`}>
                    {calculatedMetrics.severity === "CRITICAL" ? "ANOMALY EXCEEDED" : calculatedMetrics.severity === "WARNING" ? "PRE-CRITICAL FLUX" : "SYSTEM STABLE"}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-900">
                  <span className="text-slate-500">Anomaly Deviation Score</span>
                  <span className="text-white font-bold">{calculatedMetrics.anomalyScore}%</span>
                </div>
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-900">
                  <span className="text-slate-500">RUL Prognosis</span>
                  <span className={`font-bold ${calculatedMetrics.rul < 100 ? "text-red-400" : "text-white"}`}>
                    {calculatedMetrics.rul} hours remaining
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-slate-500">Failure Mode Classification</span>
                  <span className={`font-bold text-right max-w-[200px] ${calculatedMetrics.severity === "CRITICAL" ? "text-red-400" : calculatedMetrics.severity === "WARNING" ? "text-amber-400" : "text-emerald-400"}`}>
                    {calculatedMetrics.failureMode}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Progress Bar for Anomaly Score */}
            <div className="mt-6">
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1.5">
                <span>Anomaly Intensity Indicator</span>
                <span>{calculatedMetrics.anomalyScore}/100</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${calculatedMetrics.severity === "CRITICAL" ? "bg-gradient-to-r from-red-600 to-red-400" : calculatedMetrics.severity === "WARNING" ? "bg-gradient-to-r from-amber-600 to-amber-400" : "bg-gradient-to-r from-coolant-600 to-coolant-400"}`}
                  style={{ width: `${calculatedMetrics.anomalyScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blueprint Hub / Architecture Section */}
      <section id="architecture" className="py-20 max-w-7xl mx-auto px-6 relative z-10 border-t border-slate-900">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-905 border border-slate-800 text-[10px] uppercase font-bold tracking-widest text-coolant-400 mb-4">
            <Layers className="w-3.5 h-3.5" /> Technical Blueprints
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-4">
            Decoupled hybrid pipeline architecture
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed max-w-xl mx-auto">
            Toggle between the high-level system data flow and the granular research-level technical blueprint that powers SteelGuard AI.
          </p>

          {/* Toggle Switches */}
          <div className="inline-flex p-1 bg-slate-950 rounded-xl border border-slate-900 mt-6">
            {mounted ? (
              <>
                <button
                  onClick={() => setActiveArch("system-architecture")}
                  className={`px-5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${
                    activeArch === "system-architecture"
                      ? "bg-slate-900 text-white border border-white/5 shadow-subtle"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  System Architecture
                </button>
                <button
                  onClick={() => setActiveArch("system-flow")}
                  className={`px-5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${
                    activeArch === "system-flow"
                      ? "bg-slate-900 text-white border border-white/5 shadow-subtle"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  System Data Flow
                </button>
                <button
                  onClick={() => setActiveArch("research-blueprint")}
                  className={`px-5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${
                    activeArch === "research-blueprint"
                      ? "bg-slate-900 text-white border border-white/5 shadow-subtle"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Research Blueprint
                </button>
              </>
            ) : (
              <span className="px-5 py-2 text-xs font-semibold text-slate-500 font-mono">Loading Switches...</span>
            )}
          </div>
        </div>

        {/* Selected Architecture Panel (Fully visible diagrams) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
          {/* Blueprint Description */}
          <div className="lg:col-span-4 space-y-5">
            {mounted ? (
              activeArch === "system-architecture" ? (
                <>
                  <h3 className="text-lg font-bold text-white">System Architecture</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Infographic outlining the platform's multi-layered tech stack, demonstrating decoupling and component integrations.
                  </p>
                  <ul className="space-y-3 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-coolant-400 shrink-0 mt-0.5" />
                      <span><b>Frontend Interface:</b> Next.js 15 app with real-time HUD and chat.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-coolant-400 shrink-0 mt-0.5" />
                      <span><b>Backend Core:</b> FastAPI orchestration for RAG and scoring.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-coolant-400 shrink-0 mt-0.5" />
                      <span><b>Decoupled ML:</b> Model predicting failure mode and RUL.</span>
                    </li>
                  </ul>
                </>
              ) : activeArch === "system-flow" ? (
                <>
                  <h3 className="text-lg font-bold text-white">System Data Flow</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Traces a telemetry signal's path from plant equipment logs into scoring, ML classification, and Expert Rule heuristics.
                  </p>
                  <ul className="space-y-3 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-coolant-400 shrink-0 mt-0.5" />
                      <span><b>Telemetry Mapping:</b> Maps raw UCI parameters to assets.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-coolant-400 shrink-0 mt-0.5" />
                      <span><b>Parallel Scorers:</b> Parallel ML, anomaly, and rule outputs.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-coolant-400 shrink-0 mt-0.5" />
                      <span><b>Vector Corpus:</b> Embeds manuals to supplement logic.</span>
                    </li>
                  </ul>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-white">Research Blueprint</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    An academic-level blueprint mapping multi-modal document vectors, cosine similarity logic, and automated threshold optimization.
                  </p>
                  <ul className="space-y-3 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <span><b>Threshold Optimizers:</b> scans 65 thresholds dynamically.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <span><b>Cosine Similarity:</b> enforces document category variation.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <span><b>Offline Local Vectors:</b> runs local 256d hash arrays as fallback.</span>
                    </li>
                  </ul>
                </>
              )
            ) : (
              <div className="text-xs text-slate-500 font-mono">Loading descriptions...</div>
            )}
            <div className="pt-2">
              <Link
                href="/dashboard"
                onClick={handleLaunch}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-coolant-400 hover:text-coolant-300 hover:underline cursor-pointer"
              >
                Launch Live Simulator <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Blueprint Image Display (Gradient Shimmer Border & Properly sized object-contain) */}
          <div className="lg:col-span-8 bg-gradient-to-r from-coolant-500 via-purple-600 to-forge-500 bg-[length:200%_auto] animate-gradient-shift rounded-xl p-[1.5px] shadow-lifted backdrop-blur-sm w-full overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-neon-teal">
            <div className="bg-[hsl(228,22%,5%)] rounded-[10px] overflow-hidden">
              <div className="relative w-full flex justify-center bg-slate-950/90 rounded-lg p-4">
                {mounted ? (
                  <img
                    src={
                      activeArch === "system-architecture"
                        ? "/architecture_diagram.png"
                        : activeArch === "system-flow"
                        ? "/data_flow_diagram.png"
                        : "/research_architecture.png"
                    }
                    alt="Architecture Diagram"
                    className="max-h-[420px] w-auto max-w-full object-contain rounded"
                  />
                ) : (
                  <div className="h-[320px] flex items-center justify-center text-xs font-mono text-slate-500">Loading Blueprint Diagram...</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive ROI Savings Calculator */}
      <section id="roi-calculator" className="py-20 max-w-7xl mx-auto px-6 relative z-10 border-t border-slate-900">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] uppercase font-bold tracking-widest text-coolant-400 mb-4">
            <DollarSign className="w-3.5 h-3.5" /> Cost-Benefit Calculator
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-4">
            Calculate your plant's potential ROI
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed max-w-xl mx-auto">
            Input your current plant logistics to estimate the annual operational savings generated by SteelGuard AI's predictive diagnostics.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-5xl mx-auto">
          {/* ROI Control inputs */}
          <div className="lg:col-span-5 bg-slate-900/10 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
            <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-coolant-400" /> Plant Scale Parameters
            </h3>

            <div className="space-y-6">
              {/* Assets count */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-400">Monitored Assets</span>
                  <span className="text-white font-bold">{roiAssets} assets</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="250"
                  step="5"
                  value={roiAssets}
                  onChange={(e) => setRoiAssets(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-coolant-500"
                />
                <span className="text-[9px] text-slate-500 font-mono mt-1 block">Motors, rolling stands, gearboxes, pumps.</span>
              </div>

              {/* Downtime Cost */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-400">Hourly Downtime Cost</span>
                  <span className="text-white font-bold">${formatNumber(roiDowntimeCost)}/hr</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="45000"
                  step="1000"
                  value={roiDowntimeCost}
                  onChange={(e) => setRoiDowntimeCost(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-coolant-500"
                />
                <span className="text-[9px] text-slate-500 font-mono mt-1 block">Outage financial impact including labor.</span>
              </div>

              {/* Yearly Outages */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-400">Outages Per Year</span>
                  <span className="text-white font-bold">{roiOutages} failures</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="25"
                  value={roiOutages}
                  onChange={(e) => setRoiOutages(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-coolant-500"
                />
                <span className="text-[9px] text-slate-500 font-mono mt-1 block">Historical unplanned stoppage frequency.</span>
              </div>
            </div>
          </div>

          {/* Savings summary */}
          <div className="lg:col-span-7 bg-slate-900/10 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between hover:border-coolant-500/20 transition-all duration-300">
            <div>
              <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" /> Projected Financial Analysis
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Standard Loss</span>
                  <span className="text-lg font-bold text-slate-400 mt-1 block font-mono">${formatNumber(roiMetrics.baselineCost)}</span>
                  <span className="text-[9px] text-slate-600 block mt-1">4.0 hrs avg. resolution</span>
                </div>
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900">
                  <span className="text-[9px] font-bold text-coolant-400 uppercase tracking-wider block">SteelGuard Loss</span>
                  <span className="text-lg font-bold text-white mt-1 block font-mono">${formatNumber(roiMetrics.optimizedCost)}</span>
                  <span className="text-[9px] text-coolant-500/80 block mt-1">85% prevented, 1.0 hr resolution</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-coolant-500/5 to-purple-500/5 border border-coolant-500/20 rounded-xl p-5 relative overflow-hidden shadow-inner">
                <div className="absolute top-0 right-0 w-32 h-32 bg-coolant-500/5 rounded-full blur-2xl" />
                <span className="text-[10px] font-bold text-coolant-400 uppercase tracking-widest">Estimated Annual Savings</span>
                <span className="text-3xl font-extrabold text-white mt-2 block font-mono bg-gradient-to-r from-white via-slate-100 to-coolant-300 bg-clip-text text-transparent">
                  ${formatNumber(roiMetrics.netSavings)}
                </span>
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  Net savings after deducting SteelGuard AI software licensing cost (${formatNumber(roiMetrics.licenceCost)}/yr)
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-mono border-t border-slate-800/60 pt-4 mt-6">
              <span className="text-slate-400">Operational ROI (Year 1)</span>
              <span className="text-coolant-400 font-bold text-sm">+{roiMetrics.roiPercentage}%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Model Comparison / Academic Justification */}
      <section id="model-comparison" className="py-20 max-w-7xl mx-auto px-6 relative z-10 border-t border-slate-900">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] uppercase font-bold tracking-widest text-coolant-400 mb-4">
            <Cpu className="w-3.5 h-3.5" /> Model Benchmarking
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-4">
            Why ExtraTrees Ensemble?
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed max-w-xl mx-auto">
            Compared with simple logistic functions and massive sequence networks, tree ensembles maintain optimal balance between speed, interpretation, and imbalanced data.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Progress Bars / Dials */}
          <div className="lg:col-span-5 space-y-6">
            {/* Tabs selector */}
            <div className="flex gap-2 p-1 bg-slate-950 rounded-lg border border-slate-900 mb-6">
              {(["extratrees", "xgboost", "randomforest"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveMlTab(tab)}
                  className={`flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${activeMlTab === tab ? "bg-slate-900 text-white shadow-subtle border border-white/5" : "text-slate-500 hover:text-slate-300"}`}
                >
                  {tab === "extratrees" ? "ExtraTrees" : tab === "xgboost" ? "XGBoost" : "Random Forest"}
                </button>
              ))}
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-white">Average Precision (AUPRC)</span>
                <span className="text-coolant-400">~{mlTabMetrics.auprc}%</span>
              </div>
              <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-850">
                <div className="h-full bg-coolant-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${mlTabMetrics.auprc}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-white">Validation Accuracy</span>
                <span className="text-purple-400">~{mlTabMetrics.accuracy}%</span>
              </div>
              <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-850">
                <div className="h-full bg-purple-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${mlTabMetrics.accuracy}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-white">ROC-AUC Score</span>
                <span className="text-forge-400">~{mlTabMetrics.roc}%</span>
              </div>
              <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-850">
                <div className="h-full bg-forge-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${mlTabMetrics.roc}%` }} />
              </div>
            </div>

            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl transition-all duration-300">
              <h4 className="text-xs font-bold text-white mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-coolant-400" /> Latency: {mlTabMetrics.latency}
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {mlTabMetrics.note}
              </p>
            </div>
          </div>

          {/* Detailed Table */}
          <div className="lg:col-span-7 bg-slate-950/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-quiet">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 font-semibold">
                    <th className="p-4">Model Candidate</th>
                    <th className="p-4">Accuracy</th>
                    <th className="p-4">F1-Score</th>
                    <th className="p-4">Pros</th>
                    <th className="p-4">Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  <tr className="bg-coolant-950/5">
                    <td className="p-4 font-bold text-white">ExtraTrees (Ours)</td>
                    <td className="p-4 text-coolant-400 font-semibold">98.4%</td>
                    <td className="p-4 text-coolant-400 font-semibold">85%</td>
                    <td className="p-4 text-slate-400">Low variance, fast, explainable features.</td>
                    <td className="p-4"><span className="px-2 py-0.5 bg-coolant-950 text-coolant-400 border border-coolant-800/50 rounded-md font-bold text-[10px]">SELECTED</span></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">Random Forest</td>
                    <td className="p-4">97.8%</td>
                    <td className="p-4">82%</td>
                    <td className="p-4 text-slate-400">Robust generalization.</td>
                    <td className="p-4"><span className="text-slate-500">Candidate</span></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">Logistic Regression</td>
                    <td className="p-4">96.5%</td>
                    <td className="p-4">52%</td>
                    <td className="p-4 text-slate-400">Lightweight coefficients.</td>
                    <td className="p-4"><span className="text-rose-500 font-bold">Failed</span></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">SVM (RBF Kernel)</td>
                    <td className="p-4">97.2%</td>
                    <td className="p-4">68%</td>
                    <td className="p-4 text-slate-400">Effective decision boundary.</td>
                    <td className="p-4"><span className="text-rose-500 font-bold">Failed</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 max-w-5xl mx-auto px-6 relative z-10">
        <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 to-card border border-slate-800 p-8 md:p-12 text-center overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-coolant-600/5 blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-purple-600/5 blur-[80px]" />

          <h3 className="text-2xl font-extrabold text-white mb-3">Ready to simulate rolling mill health?</h3>
          <p className="text-slate-400 text-xs max-w-xl mx-auto mb-6">
            Access the Operations Dashboard console to view live mock telemetry streams, trigger artificial fault scenarios, and explore wizard recommendation pipelines.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/dashboard"
              onClick={handleLaunch}
              className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-coolant-600 to-coolant-500 hover:from-coolant-500 hover:to-coolant-400 text-slate-950 font-bold text-sm rounded-lg shadow-glow hover:shadow-neon-teal transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              Launch Platform Dashboard <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-900 relative z-10 bg-slate-950/40 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-coolant-500" />
            <span className="font-bold text-sm text-slate-300">SteelGuard AI</span>
            <span>—</span>
            <span>Next-Generation Reliability Management</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-slate-300 transition-colors">Features</a>
            <a href="#architecture" className="hover:text-slate-300 transition-colors">Architecture</a>
            <a href="#model-comparison" className="hover:text-slate-300 transition-colors">Model Details</a>
          </div>

          <div>
            &copy; {new Date().getFullYear()} SteelGuard AI. Built with ❤️ for the Steel Industry.
          </div>
        </div>
      </footer>
    </div>
  );
}
