"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, useScroll, useTransform } from "framer-motion";
import { Workflow as WorkflowIcon, Plus, Command, Sparkles, ArrowRight, Play, Github } from "lucide-react";
import { Magnetic, Reveal, WordReveal } from "./primitives";
import { HeroSceneFallback } from "./HeroScene";

const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => <HeroSceneFallback />,
});

/* ----------------------------- Navigation ------------------------------ */
export function LandingNav({ onCommand }: { onCommand: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const links = [
    { href: "#features", label: "Features" },
    { href: "#nodes", label: "Nodes" },
    { href: "#demo", label: "Live demo" },
    { href: "#architecture", label: "Engine" },
    { href: "#workspace", label: "Workspace" },
  ];

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "glass-strong border-b border-line/70 py-2.5"
          : "border-b border-transparent py-4"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient shadow-glow">
            <WorkflowIcon size={19} className="text-white" />
            <span className="absolute inset-0 rounded-xl bg-brand/40 blur-md transition-opacity group-hover:opacity-80" />
          </div>
          <div className="leading-none">
            <div className="text-[15px] font-bold tracking-tight text-ink">
              FlowForge
            </div>
            <div className="mt-0.5 text-[10px] text-ink-dim">
              Visual Workflow Automation
            </div>
          </div>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-[13px] font-medium text-ink-soft transition-colors hover:bg-bg-panel/60 hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://github.com/pal-123456789/flowforge"
            target="_blank"
            rel="noreferrer"
            aria-label="View source on GitHub"
            className="hidden h-9 w-9 items-center justify-center rounded-lg border border-line bg-bg-panel/60 text-ink-dim transition-colors hover:border-line-bright hover:text-ink sm:flex"
          >
            <Github size={16} />
          </a>
          <button
            onClick={onCommand}
            className="hidden items-center gap-2 rounded-lg border border-line bg-bg-panel/60 px-3 py-2 text-xs text-ink-dim transition-colors hover:border-line-bright hover:text-ink-soft sm:flex"
          >
            <Command size={13} />
            <span>Search</span>
            <kbd className="rounded border border-line bg-bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-ink-dim">
              ⌘K
            </kbd>
          </button>
          <Magnetic strength={0.4}>
            <Link
              href="/editor"
              className="sheen flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-brand-soft"
            >
              <Plus size={16} /> New workflow
            </Link>
          </Magnetic>
        </div>
      </div>
    </motion.nav>
  );
}

/* -------------------------------- Hero --------------------------------- */
export function Hero({ nodeCount }: { nodeCount: number }) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 160]);
  const opacity = useTransform(scrollY, [0, 420], [1, 0]);
  const scale = useTransform(scrollY, [0, 600], [1, 0.94]);

  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden pt-24">
      {/* aurora */}
      <div className="aurora-bg">
        <div
          className="aurora-blob left-1/2 top-[-10%] h-[520px] w-[760px] -translate-x-1/2 animate-aurora-drift"
          style={{ background: "rgba(124,92,255,0.45)" }}
        />
        <div
          className="aurora-blob right-[6%] top-[30%] h-[360px] w-[420px] animate-glow-pulse"
          style={{ background: "rgba(6,182,212,0.25)" }}
        />
        <div
          className="aurora-blob left-[4%] top-[46%] h-[300px] w-[380px] animate-float-slow"
          style={{ background: "rgba(236,72,153,0.18)" }}
        />
      </div>

      {/* 3D constellation */}
      <motion.div style={{ opacity }} className="absolute inset-0 z-0">
        <HeroScene />
      </motion.div>

      {/* dot grid */}
      <div
        className="pointer-events-none absolute inset-0 grid-fade opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle, #2e3350 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />

      <motion.div
        style={{ y, opacity, scale }}
        className="relative z-10 mx-auto max-w-4xl px-6 text-center"
      >
        <Reveal>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-bg-panel/60 px-4 py-1.5 text-xs text-ink-soft backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald" />
            </span>
            Runs 100% offline · No API keys required
          </div>
        </Reveal>

        <h1 className="text-balance text-5xl font-extrabold leading-[1.02] tracking-tightest text-ink sm:text-6xl md:text-7xl">
          <WordReveal text="Automate anything on an" />{" "}
          <span className="text-gradient-animated">
            <WordReveal text="infinite canvas" delay={0.3} />
          </span>
        </h1>

        <Reveal delay={0.4}>
          <p className="mx-auto mt-7 max-w-xl text-pretty text-base leading-relaxed text-ink-soft sm:text-lg">
            Drag, connect, and run automation workflows in real time. Triggers,
            branching logic, data transforms and AI steps — executed live, node
            by node, with zero backend to configure.
          </p>
        </Reveal>

        <Reveal delay={0.55}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Magnetic strength={0.3}>
              <Link
                href="/editor"
                className="sheen group flex items-center gap-2 rounded-xl bg-brand px-6 py-3.5 font-semibold text-white shadow-glow-lg transition-all hover:bg-brand-soft"
              >
                <Sparkles size={18} />
                Start building
                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </Magnetic>
            <a
              href="#demo"
              className="flex items-center gap-2 rounded-xl border border-line bg-bg-panel/50 px-6 py-3.5 font-medium text-ink-soft backdrop-blur transition-colors hover:border-line-bright hover:text-ink"
            >
              <Play size={16} /> Watch it run
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.7}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-ink-dim">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" /> {nodeCount}+
              node types
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-iris" /> Topological
              DAG engine
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-magenta" /> Live
              node-by-node execution
            </span>
            <a
              href="https://github.com/pal-123456789/flowforge"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 transition-colors hover:text-ink-soft"
            >
              <Github size={13} /> ALGOTHON&apos;26 · ALG-AUTO-01
            </a>
          </div>
        </Reveal>
      </motion.div>

      {/* scroll cue */}
      <motion.div
        style={{ opacity }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
      >
        <div className="flex h-9 w-5 items-start justify-center rounded-full border border-line p-1">
          <motion.span
            className="h-2 w-1 rounded-full bg-ink-dim"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </section>
  );
}
