import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SteelGuard AI Maintenance Wizard",
  description: "Agentic maintenance decision support for steel plant equipment."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

