import type { Metadata } from "next";
import "./globals.css";
import "reactflow/dist/style.css";
import { ToastProvider } from "@/components/ui/Toast";
import { CommandPaletteProvider } from "@/components/CommandPalette";
import { ClickFX } from "@/components/ui/ClickFX";

export const metadata: Metadata = {
  title: "FlowForge — Visual Workflow Automation",
  description:
    "Design, connect, and run automation workflows on an infinite canvas. Triggers, actions, conditions, and transforms — executed live, fully offline. Built for ALGOTHON'26.",
  keywords: ["workflow", "automation", "no-code", "FlowForge", "ALGOTHON"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ClickFX />
        <ToastProvider>
          <CommandPaletteProvider>
            <main>{children}</main>
          </CommandPaletteProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
