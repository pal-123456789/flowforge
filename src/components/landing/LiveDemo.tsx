"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { CheckCircle2, Loader2, Terminal } from "lucide-react";
import { Reveal } from "./primitives";
import { SectionIntro } from "./Sections";

type DemoNode = {
  id: string;
  label: string;
  icon: string;
  color: string;
  log: string;
};

const PIPELINE: DemoNode[] = [
  { id: "trigger", label: "Webhook", icon: "Webhook", color: "#22c55e", log: 'Received { "event": "signup", "email": "ada@flow.dev" }' },
  { id: "set", label: "Set Fields", icon: "PencilRuler", color: "#ec4899", log: "Set status = processed · name = Ada" },
  { id: "if", label: "If / Else", icon: "GitBranch", color: "#f59e0b", log: "status == processed → TRUE branch" },
  { id: "ai", label: "AI Generate", icon: "Sparkles", color: "#06b6d4", log: "Generated: “Welcome aboard, Ada! 🎉”" },
  { id: "email", label: "Send Email", icon: "Mail", color: "#3b82f6", log: "Email queued → ada@flow.dev" },
];

export function LiveDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-20% 0px" });
  const [step, setStep] = useState(-1);
  const [logs, setLogs] = useState<{ color: string; text: string }[]>([]);

  useEffect(() => {
    if (!inView) return;
    setStep(-1);
    setLogs([]);
    let i = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const run = () => {
      if (i >= PIPELINE.length) {
        timers.push(setTimeout(() => {
          i = 0;
          setStep(-1);
          setLogs([]);
          timers.push(setTimeout(run, 700));
        }, 2200));
        return;
      }
      const n = PIPELINE[i];
      setStep(i);
      setLogs((l) => [...l, { color: n.color, text: `${n.label} · ${n.log}` }]);
      i++;
      timers.push(setTimeout(run, 1050));
    };
    timers.push(setTimeout(run, 500));
    return () => timers.forEach(clearTimeout);
  }, [inView]);

  return (
    <section id="demo" className="relative mx-auto max-w-7xl px-6 py-28">
      <SectionIntro
        eyebrow="Live engine"
        title="Watch your logic light up"
        subtitle="The real execution engine walks the graph in topological order and streams each node's state as it runs."
      />

      <div
        ref={ref}
        className="mt-14 grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-stretch"
      >
        {/* pipeline canvas */}
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-line bg-bg-soft/60 p-6 sm:p-10">
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle, #2e3350 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }}
            />
            <div className="relative flex flex-col items-stretch gap-3">
              {PIPELINE.map((n, i) => {
                const state =
                  i < step ? "done" : i === step ? "running" : "idle";
                return (
                  <div key={n.id} className="flex flex-col items-center">
                    <motion.div
                      initial={false}
                      animate={{
                        scale: state === "running" ? 1.03 : 1,
                        opacity: state === "idle" ? 0.5 : 1,
                      }}
                      transition={{ duration: 0.3 }}
                      className="relative flex w-full max-w-md items-center gap-3 rounded-xl border bg-bg-panel/80 px-4 py-3"
                      style={{
                        borderColor:
                          state === "idle" ? "#20243a" : `${n.color}88`,
                        boxShadow:
                          state === "running"
                            ? `0 0 0 1px ${n.color}, 0 10px 40px -12px ${n.color}`
                            : "none",
                      }}
                    >
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{ background: `${n.color}22`, color: n.color }}
                      >
                        <Icon name={n.icon} size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-ink">
                          {n.label}
                        </div>
                        <div className="truncate text-[11px] text-ink-dim">
                          {n.log}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {state === "done" && (
                          <CheckCircle2 size={18} className="text-ok" />
                        )}
                        {state === "running" && (
                          <Loader2
                            size={18}
                            className="animate-spin"
                            style={{ color: n.color }}
                          />
                        )}
                      </div>
                      {state === "running" && (
                        <span
                          className="absolute inset-0 rounded-xl"
                          style={{
                            boxShadow: `0 0 0 0 ${n.color}`,
                            animation: "pulse-ring 1.4s ease-out infinite",
                          }}
                        />
                      )}
                    </motion.div>
                    {i < PIPELINE.length - 1 && (
                      <div className="relative h-6 w-px">
                        <div className="absolute inset-0 bg-line" />
                        <motion.div
                          className="absolute inset-0 origin-top"
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: i < step ? 1 : 0 }}
                          transition={{ duration: 0.3 }}
                          style={{ background: n.color }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>

        {/* console */}
        <Reveal delay={0.15}>
          <div className="flex h-full min-h-[300px] flex-col overflow-hidden rounded-2xl border border-line bg-[#06070d]">
            <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
              <span className="h-3 w-3 rounded-full bg-err/80" />
              <span className="h-3 w-3 rounded-full bg-warn/80" />
              <span className="h-3 w-3 rounded-full bg-ok/80" />
              <span className="ml-2 flex items-center gap-1.5 font-mono text-xs text-ink-dim">
                <Terminal size={12} /> run console
              </span>
            </div>
            <div className="flex-1 space-y-1.5 overflow-y-auto p-4 font-mono text-xs scrollbar-thin">
              {logs.length === 0 && (
                <div className="text-ink-faint">› waiting for trigger…</div>
              )}
              {logs.map((l, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-2"
                >
                  <span style={{ color: l.color }}>›</span>
                  <span className="text-ink-soft">{l.text}</span>
                </motion.div>
              ))}
              {step >= 0 && step < PIPELINE.length && (
                <span className="inline-block h-3.5 w-1.5 animate-blink bg-brand-soft align-middle" />
              )}
              {step >= PIPELINE.length - 1 && logs.length === PIPELINE.length && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 flex items-center gap-1.5 text-ok"
                >
                  <CheckCircle2 size={13} /> workflow completed · 5/5 nodes
                </motion.div>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
