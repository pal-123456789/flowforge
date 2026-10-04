"use client";

import { motion } from "framer-motion";
import {
  GitBranch,
  Play,
  Sparkles,
  Boxes,
  Shield,
  Code2,
  Repeat,
  Clock,
  Share2,
  Gauge,
} from "lucide-react";
import { Reveal, StaggerGroup, staggerItem, Marquee, TiltCard } from "./primitives";

/* ----------------------------- Marquee strip --------------------------- */
export function CapabilityMarquee() {
  const items = [
    "Drag & drop canvas",
    "Branch & loop logic",
    "Live execution",
    "AI steps",
    "Webhooks",
    "Undo / redo history",
    "Templates",
    "Offline-first",
    "Topological engine",
    "Expression language",
    "Code sandbox",
    "Run analytics",
  ];
  return (
    <section className="relative border-y border-line/60 bg-bg-soft/40 py-5">
      <Marquee speed={34} className="[mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-8 pr-8">
            <span className="whitespace-nowrap text-sm font-medium text-ink-dim">
              {it}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-brand/60" />
          </div>
        ))}
      </Marquee>
    </section>
  );
}

/* ------------------------------- Features ------------------------------ */
const FEATURES = [
  {
    icon: GitBranch,
    color: "#f59e0b",
    title: "Branch & loop logic",
    desc: "If/else, switch, filters, merge and iterators. Model real decisions and fan-out, not just linear steps.",
    span: "lg:col-span-2",
  },
  {
    icon: Play,
    color: "#22c55e",
    title: "Live execution engine",
    desc: "A topological DAG engine runs your graph and lights each node with its real input & output.",
    span: "",
  },
  {
    icon: Sparkles,
    color: "#06b6d4",
    title: "AI steps, offline-safe",
    desc: "Summarize, classify sentiment, extract keywords. OpenAI when a key exists — a built-in mock when it doesn't.",
    span: "",
  },
  {
    icon: Code2,
    color: "#ec4899",
    title: "Sandboxed code nodes",
    desc: "Drop into JavaScript when the UI isn't enough. Receives input, returns output — safely evaluated.",
    span: "",
  },
  {
    icon: Shield,
    color: "#7c5cff",
    title: "No backend to configure",
    desc: "File-based persistence, zero external services. Clone, seed, run. Perfect for a reliable demo.",
    span: "lg:col-span-2",
  },
];

export function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-7xl px-6 py-28">
      <SectionIntro
        eyebrow="Capabilities"
        title="Everything a serious automation needs"
        subtitle="Not a toy. A real visual programming surface backed by a deterministic execution engine."
      />
      <StaggerGroup className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <motion.div key={f.title} variants={staggerItem} className={f.span}>
              <TiltCard
                max={6}
                className="group h-full rounded-2xl border border-line bg-bg-soft/70 p-6 transition-colors hover:border-line-bright"
              >
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ background: `${f.color}1f`, color: f.color }}
                >
                  <Icon size={22} />
                </div>
                <h3 className="text-lg font-semibold text-ink">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {f.desc}
                </p>
                <div
                  className="mt-5 h-px w-full origin-left scale-x-0 bg-gradient-to-r from-transparent via-current to-transparent opacity-40 transition-transform duration-500 group-hover:scale-x-100"
                  style={{ color: f.color }}
                />
              </TiltCard>
            </motion.div>
          );
        })}
      </StaggerGroup>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Repeat, label: "Undo / redo history", v: "∞" },
          { icon: Clock, label: "Scheduling triggers", v: "cron" },
          { icon: Share2, label: "Webhook endpoints", v: "live" },
          { icon: Gauge, label: "Run analytics", v: "built-in" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <Reveal key={s.label} delay={i * 0.08}>
              <div className="flex items-center gap-3 rounded-xl border border-line bg-bg-panel/40 px-4 py-3.5">
                <Icon size={18} className="text-brand-soft" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-ink">{s.label}</div>
                </div>
                <span className="font-mono text-xs text-ink-dim">{s.v}</span>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* --------------------------- shared section intro ---------------------- */
export function SectionIntro({
  eyebrow,
  title,
  subtitle,
  center = true,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <Reveal>
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-bg-panel/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-soft">
          <Boxes size={12} /> {eyebrow}
        </span>
      </Reveal>
      <Reveal delay={0.1}>
        <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-ink sm:text-4xl md:text-5xl">
          {title}
        </h2>
      </Reveal>
      {subtitle && (
        <Reveal delay={0.2}>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-ink-soft">
            {subtitle}
          </p>
        </Reveal>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
