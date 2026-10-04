"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Workflow as WorkflowIcon,
  ArrowRight,
  Sparkles,
  Github,
  Heart,
} from "lucide-react";
import { Magnetic, Reveal } from "./primitives";

export function CTA() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-28">
      <div className="relative overflow-hidden rounded-[2rem] border border-line bg-bg-soft/60 px-8 py-20 text-center sm:px-16">
        {/* aurora */}
        <div className="aurora-bg">
          <div
            className="aurora-blob left-1/2 top-[-30%] h-[400px] w-[700px] -translate-x-1/2 animate-aurora-drift"
            style={{ background: "rgba(124,92,255,0.4)" }}
          />
          <div
            className="aurora-blob right-[10%] bottom-[-20%] h-[300px] w-[400px] animate-glow-pulse"
            style={{ background: "rgba(6,182,212,0.25)" }}
          />
        </div>
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle, #2e3350 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />

        <div className="relative">
          <Reveal>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-bg-panel/60 px-4 py-1.5 text-xs text-ink-soft backdrop-blur">
              <Sparkles size={13} className="text-brand-soft" />
              Ready in seconds
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-balance text-4xl font-extrabold tracking-tight text-ink sm:text-5xl md:text-6xl">
              Start forging your{" "}
              <span className="text-gradient-animated">first workflow</span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mx-auto mt-5 max-w-lg text-pretty text-base text-ink-soft">
              Open the canvas, drag a trigger, connect a few nodes, and press
              Run. Watch your automation come to life.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Magnetic strength={0.3}>
                <Link
                  href="/editor"
                  className="group flex items-center gap-2 rounded-xl bg-brand px-7 py-4 text-base font-semibold text-white shadow-glow-lg transition-all hover:bg-brand-soft"
                >
                  Open the editor
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </Magnetic>
              <Link
                href="/analytics"
                className="rounded-xl border border-line bg-bg-panel/50 px-7 py-4 text-base font-medium text-ink-soft backdrop-blur transition-colors hover:text-ink"
              >
                View analytics
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  const cols = [
    {
      title: "Product",
      links: [
        { label: "Editor", href: "/editor" },
        { label: "Analytics", href: "/analytics" },
        { label: "Templates", href: "#workspace" },
        { label: "Node library", href: "#nodes" },
      ],
    },
    {
      title: "Platform",
      links: [
        { label: "Features", href: "#features" },
        { label: "Live demo", href: "#demo" },
        { label: "Engine", href: "#architecture" },
      ],
    },
  ];
  return (
    <footer className="relative border-t border-line bg-bg-soft/30">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient shadow-glow">
                <WorkflowIcon size={19} className="text-white" />
              </div>
              <div className="leading-none">
                <div className="text-[15px] font-bold text-ink">FlowForge</div>
                <div className="mt-0.5 text-[10px] text-ink-dim">
                  Visual Workflow Automation
                </div>
              </div>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-dim">
              A production-grade, offline-first visual automation platform built
              for ALGOTHON&apos;26 · ALG-AUTO-01.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <div className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                {c.title}
              </div>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-ink-soft transition-colors hover:text-ink"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-line pt-8 text-xs text-ink-dim sm:flex-row">
          <span className="flex items-center gap-1.5">
            Built with <Heart size={12} className="text-magenta" /> for
            ALGOTHON&apos;26
          </span>
          <span className="flex items-center gap-4">
            <span>Next.js · React Flow · Three.js · Framer Motion</span>
            <a
              href="https://github.com"
              className="flex items-center gap-1.5 transition-colors hover:text-ink-soft"
            >
              <Github size={13} /> Source
            </a>
          </span>
        </div>
      </div>

      {/* giant watermark */}
      <div className="pointer-events-none select-none overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-b from-line/40 to-transparent bg-clip-text text-center text-[18vw] font-extrabold leading-none tracking-tighter text-transparent"
        >
          FlowForge
        </motion.div>
      </div>
    </footer>
  );
}
