"use client";

import React, { useEffect, useState } from "react";
import { Shield, Zap } from "lucide-react";

export default function DashboardLoading() {
  const [dots, setDots] = useState("");

  // Animated dots for the loading text
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[hsl(228,22%,5%)] text-slate-100 flex flex-col items-center justify-center relative overflow-hidden select-none">
      {/* Background Neon Orbs for Premium Aesthetics */}
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

        {/* Brand Name */}
        <h3 className="font-extrabold text-xl tracking-tight text-white mb-1">
          SteelGuard <span className="text-coolant-400 font-medium">AI</span>
        </h3>
        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-8">
          Establishing Secure Console Link
        </p>

        {/* Indeterminate Shimmering Progress Bar */}
        <div className="w-64 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/40 relative mb-4">
          <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-coolant-500 via-purple-500 to-coolant-500 rounded-full animate-shimmer" 
               style={{ backgroundSize: "200% 100%" }} />
        </div>

        {/* Status Text */}
        <p className="text-xs text-slate-400 font-mono h-5">
          Initializing command center{dots}
        </p>
      </div>
    </div>
  );
}
