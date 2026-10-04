"use client";

import { motion } from "framer-motion";
import {
  Boxes,
  Workflow as WorkflowIcon,
  Activity,
  CheckCircle2,
  Cpu,
  Layers,
  Share2,
} from "lucide-react";
import { Counter, Reveal, StaggerGroup, staggerItem } from "./primitives";
import { SectionIntro } from "./Sections";

/* -------------------------------- Metrics ------------------------------ */
export function Metrics({
  nodeCount,
  workflowCount,
  runCount,
  successRate,
}: {
  nodeCount: number;
  workflowCount: number;
  runCount: number;
  successRate: number;
}) {
  const stats = [
    { icon: Boxes, label: "Node types", value: nodeCount, suffix: "+", color: "#7c5cff" },
    { icon: WorkflowIcon, label: "Workflows", value: workflowCount, suffix: "", color: "#22c55e" },
    { icon: Activity, label: "Executions", value: runCount, suffix: "", color: "#06b6d4" },
    { icon: CheckCircle2, label: "Success rate", value: successRate, suffix: "%", color: "#ec4899" },
  ];
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-20">
      <div className="rounded-3xl border border-line bg-gradient-to-b from-bg-panel/60 to-bg-soft/20 p-8 sm:p-12">
        <StaggerGroup className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                variants={staggerItem}
                className="text-center"
              >
                <div
                  className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ background: `${s.color}1f`, color: s.color }}
                >
                  <Icon size={22} />
                </div>
                <div className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
                  <Counter to={s.value} suffix={s.suffix} />
                </div>
                <div className="mt-1 text-sm text-ink-dim">{s.label}</div>
              </motion.div>
            );
          })}
        </StaggerGroup>
      </div>
    </section>
  );
}

/* ----------------------------- Architecture ---------------------------- */
const STEPS = [
  {
    icon: Layers,
    title: "Single node registry",
    desc: "One typed source of truth drives both the editor UI and the execution engine. Add a node once, it works everywhere.",
    color: "#7c5cff",
  },
  {
    icon: Cpu,
    title: "Topological DAG engine",
    desc: "Kahn's algorithm orders the graph, detects cycles, and routes edges by branch activation — if/switch/filter/loop semantics included.",
    color: "#06b6d4",
  },
  {
    icon: Share2,
    title: "Live event stream",
    desc: "Every node emits start / finish / log events. The console and canvas subscribe and render execution in real time.",
    color: "#22c55e",
  },
];

export function Architecture() {
  return (
    <section
      id="architecture"
      className="relative overflow-hidden border-y border-line/50 bg-bg-soft/30 py-28"
    >
      <div className="relative mx-auto max-w-7xl px-6">
        <SectionIntro
          eyebrow="Under the hood"
          title="Engineered like a product, not a prototype"
          subtitle="FlowForge isn't a mock. A real execution core turns your visual graph into deterministic, observable runs."
          center={false}
        />

        <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <StaggerGroup className="space-y-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.title}
                  variants={staggerItem}
                  className="group flex gap-4 rounded-2xl border border-line bg-bg-panel/40 p-5 transition-colors hover:border-line-bright"
                >
                  <div className="flex flex-col items-center">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{ background: `${s.color}1f`, color: s.color }}
                    >
                      <Icon size={20} />
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="mt-2 w-px flex-1 bg-line" />
                    )}
                  </div>
                  <div className="pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-ink-faint">
                        0{i + 1}
                      </span>
                      <h3 className="text-lg font-semibold text-ink">
                        {s.title}
                      </h3>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                      {s.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </StaggerGroup>

          {/* code preview */}
          <Reveal delay={0.2}>
            <div className="overflow-hidden rounded-2xl border border-line bg-[#06070d] shadow-node-lg">
              <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-err/80" />
                  <span className="h-3 w-3 rounded-full bg-warn/80" />
                  <span className="h-3 w-3 rounded-full bg-ok/80" />
                </div>
                <span className="font-mono text-[11px] text-ink-dim">
                  engine.ts
                </span>
              </div>
              <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed scrollbar-thin">
                <code>
                  <Line>
                    <K>export async function</K> <F>executeWorkflow</F>(
                  </Line>
                  <Line indent={1}>
                    nodes, edges, meta, opts, events
                  </Line>
                  <Line>) {"{"}</Line>
                  <Line indent={1}>
                    <K>const</K> order = <F>topoSort</F>(nodes, edges);
                  </Line>
                  <Line indent={1}>
                    <C>// Kahn&apos;s algorithm · cycle-safe</C>
                  </Line>
                  <Line indent={1}>
                    <K>for</K> (<K>const</K> id <K>of</K> order) {"{"}
                  </Line>
                  <Line indent={2}>
                    events.<F>onNodeStart</F>(id);
                  </Line>
                  <Line indent={2}>
                    <K>const</K> out = <K>await</K> <F>runNode</F>(node, input);
                  </Line>
                  <Line indent={2}>
                    <F>route</F>(edges, out.activeHandles);
                  </Line>
                  <Line indent={2}>
                    events.<F>onNodeFinish</F>(id, out);
                  </Line>
                  <Line indent={1}>{"}"}</Line>
                  <Line indent={1}>
                    <K>return</K> <F>summarize</F>(trace);
                  </Line>
                  <Line>{"}"}</Line>
                </code>
              </pre>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Line({
  children,
  indent = 0,
}: {
  children: React.ReactNode;
  indent?: number;
}) {
  return (
    <div style={{ paddingLeft: indent * 18 }} className="text-ink-soft">
      {children}
    </div>
  );
}
function K({ children }: { children: React.ReactNode }) {
  return <span className="text-brand-soft">{children}</span>;
}
function F({ children }: { children: React.ReactNode }) {
  return <span className="text-iris">{children}</span>;
}
function C({ children }: { children: React.ReactNode }) {
  return <span className="text-ink-faint italic">{children}</span>;
}
