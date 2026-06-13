"use client";

import React, { useEffect, useRef } from "react";

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
  color: string;
  type: "ember" | "streak";
}

export default function SparksCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = 0;
    let height = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      width = parent ? parent.clientWidth : window.innerWidth;
      height = parent ? parent.clientHeight : window.innerHeight;
      
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    const particles: Spark[] = [];
    const maxParticles = 50; // Performance optimized cap

    // Color palette matching forge-500, forge-600, forge-400, signal-500, orange-500
    const colors = [
      "rgba(245, 158, 11, ",  // forge-500 (#f59e0b)
      "rgba(217, 119, 6, ",   // forge-600 (#d97706)
      "rgba(251, 191, 36, ",  // forge-400 (#fbbf24)
      "rgba(244, 63, 94, ",   // signal-500 (#f43f5e)
      "rgba(249, 115, 22, "   // orange-500 (#f97316)
    ];

    const createParticle = (yOffset = 0): Spark => {
      const isStreak = Math.random() < 0.2; // 20% fast flying streak sparks, 80% embers
      const baseColor = colors[Math.floor(Math.random() * colors.length)];
      
      if (isStreak) {
        return {
          x: Math.random() * width,
          y: height + yOffset + 20,
          vx: (Math.random() - 0.5) * 5, // speed range
          vy: -(Math.random() * 5 + 4),  // fast upward
          size: Math.random() * 1.5 + 1.2,
          alpha: Math.random() * 0.5 + 0.4,
          decay: Math.random() * 0.007 + 0.003,
          color: baseColor,
          type: "streak"
        };
      } else {
        return {
          x: Math.random() * width,
          y: height + yOffset + 20,
          vx: (Math.random() - 0.5) * 1.2,
          vy: -(Math.random() * 1.8 + 0.8), // slow float
          size: Math.random() * 2.5 + 0.8,
          alpha: Math.random() * 0.6 + 0.2,
          decay: Math.random() * 0.003 + 0.001,
          color: baseColor,
          type: "ember"
        };
      }
    };

    // Pre-populate particles so it is active immediately
    for (let i = 0; i < maxParticles; i++) {
      particles.push(createParticle(-Math.random() * height));
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        p.y += p.vy;
        p.x += p.vx;

        if (p.type === "ember") {
          // Sway drift
          p.vx += Math.sin(Date.now() * 0.0015 + p.y * 0.008) * 0.02;
        } else {
          // Acceleration/Gravity decay
          p.vy += 0.012;
        }

        p.alpha -= p.decay;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        
        // Add subtle shadow glow
        ctx.shadowBlur = p.type === "streak" ? 8 : 4;
        ctx.shadowColor = p.color.replace(", ", "1)");

        if (p.type === "streak") {
          ctx.beginPath();
          ctx.strokeStyle = `${p.color}${p.alpha})`;
          ctx.lineWidth = p.size;
          ctx.lineCap = "round";
          
          // Draw trail segment
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 1.8, p.y - p.vy * 1.8);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${p.alpha})`;
          ctx.fill();
        }
        ctx.restore();

        // Recycle finished particles
        if (p.alpha <= 0 || p.y < -50 || p.x < -50 || p.x > width + 50) {
          particles[i] = createParticle(Math.random() * 20);
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.8 }}
    />
  );
}
