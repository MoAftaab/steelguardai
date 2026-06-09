import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        steel: {
          50: "#f5f7f8",
          100: "#e7ecef",
          200: "#cfd9de",
          300: "#afbdc5",
          400: "#7f96a3",
          500: "#637985",
          600: "#4b6572",
          700: "#384e59",
          800: "#24343d",
          900: "#172126",
          950: "#0e171b"
        },
        forge: {
          50: "#fff6ed",
          100: "#fbe7cf",
          500: "#c46a2b",
          600: "#9b4f1d",
          DEFAULT: "#c46a2b"
        },
        coolant: {
          50: "#effbf8",
          100: "#d6f5ed",
          200: "#9ee5d5",
          300: "#63d4c2",
          400: "#2ab8a6",
          500: "#0f9b8e",
          600: "#087e75",
          700: "#07645f",
          800: "#07514d",
          900: "#073f3c",
          DEFAULT: "#0f9b8e"
        },
        signal: {
          50: "#fff1f2",
          100: "#ffdfe2",
          500: "#d33f49",
          600: "#b82331",
          700: "#971d2a",
          DEFAULT: "#d33f49"
        }
      },
      boxShadow: {
        quiet: "0 12px 32px rgba(23, 33, 38, 0.08)",
        card: "0 14px 34px rgba(14, 23, 27, 0.07)",
        command: "0 22px 54px rgba(14, 23, 27, 0.14)",
        lifted: "0 18px 44px rgba(14, 23, 27, 0.12)",
        insetline: "inset 0 1px 0 rgba(255, 255, 255, 0.75)"
      },
      backgroundImage: {
        "app-grid":
          "linear-gradient(90deg, rgba(75, 101, 114, 0.08) 0 1px, transparent 1px 100%), linear-gradient(0deg, rgba(75, 101, 114, 0.07) 0 1px, transparent 1px 100%)"
      }
    }
  },
  plugins: [forms]
};

export default config;
