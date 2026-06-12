import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        steel: {
          50: "#e8ecef",
          100: "#cfd6db",
          200: "#9fadb7",
          300: "#6f8593",
          400: "#4a6170",
          500: "#3a4f5c",
          600: "#2d3e49",
          700: "#1f2e37",
          800: "#141f26",
          900: "#0c151a",
          950: "#070d11"
        },
        coolant: {
          50: "#ecfdf5",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
          DEFAULT: "#14b8a6"
        },
        forge: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          DEFAULT: "#f59e0b"
        },
        signal: {
          50: "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
          700: "#be123c",
          DEFAULT: "#f43f5e"
        },
        purple: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7e22ce",
          DEFAULT: "#a855f7"
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        quiet: "0 12px 32px rgba(0, 0, 0, 0.3)",
        card: "0 14px 34px rgba(0, 0, 0, 0.3)",
        command: "0 22px 54px rgba(0, 0, 0, 0.4)",
        lifted: "0 18px 44px rgba(0, 0, 0, 0.35)",
        insetline: "inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        subtle: "0 1px 3px rgba(0, 0, 0, 0.2)",
        soft: "0 4px 20px rgba(0, 0, 0, 0.25)",
        glow: "0 4px 24px rgba(20, 184, 166, 0.2)",
        "glow-teal": "0 0 30px rgba(20, 184, 166, 0.15)",
        "glow-amber": "0 4px 24px rgba(245, 158, 11, 0.2)",
        "glow-rose": "0 4px 24px rgba(244, 63, 94, 0.2)",
        "glow-purple": "0 4px 24px rgba(168, 85, 247, 0.2)",
        "neon-teal": "0 0 40px rgba(20, 184, 166, 0.25), 0 0 80px rgba(20, 184, 166, 0.1)",
        "neon-red": "0 0 40px rgba(244, 63, 94, 0.25), 0 0 80px rgba(244, 63, 94, 0.1)",
      },
      backgroundImage: {
        "app-grid":
          "linear-gradient(90deg, rgba(255, 255, 255, 0.02) 0 1px, transparent 1px 100%), linear-gradient(0deg, rgba(255, 255, 255, 0.015) 0 1px, transparent 1px 100%)",
        sidebar: "linear-gradient(180deg, hsl(222 28% 5%) 0%, hsl(222 25% 8%) 50%, hsl(222 22% 10%) 100%)",
        "sidebar-solid": "linear-gradient(180deg, hsl(222 28% 5%) 0%, hsl(222 22% 10%) 100%)",
        "glass-card": "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
        "gradient-teal": "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
        "gradient-hero": "linear-gradient(90deg, #14b8a6, #a855f7, #f59e0b, #14b8a6)",
      },
      animation: {
        shimmer: "shimmer 2s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        "gradient-shift": "gradient-shift 4s ease infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-4px)" },
        },
        "gradient-shift": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
    }
  },
  plugins: [forms]
};

export default config;
