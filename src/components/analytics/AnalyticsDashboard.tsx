"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { RunRecord, Workflow } from "@/lib/types";
import { NODE_MAP, CATEGORY_HEX } from "@/lib/nodeRegistry";
import type { NodeCategory } from "@/lib/types";
import { fmtDuration, fmtRelative } from "@/lib/utils";
import { Counter, Reveal, StaggerGroup, staggerItem } from "@/components/landing/primitives";
import {
  ArrowLeft,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Workflow as WorkflowIcon,
  TrendingUp,
  Boxes,
  Gauge,
  Zap,
} from "lucide-react";

export function AnalyticsDashboard() {
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [r, w] = await Promise.all([
          fetch("/api/runs").then((x) => x.json()),
          fetch("/api/workflows").then((x) => x.json()),
        ]);
        setRuns(r.runs || []);
        setWorkflows(w.workflows || []);
      } catch {
        /* offline-safe */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const total = runs.length;
    const ok = runs.filter((r) => r.status === "success").length;
    const err = runs.filter((r) => r.status === "error").length;
    const avg =
      total > 0
        ? runs.reduce((a, r) => a + (r.durationMs || 0), 0) / total
        : 0;
    const nodesRun = runs.reduce((a, r) => a + r.nodeCount, 0);
    return { total, ok, err, avg, nodesRun, rate: total ? Math.round((ok / total) * 100) : 100 };
  }, [runs]);

  // node-type usage across saved workflows
  const nodeUsage = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const wf of workflows)
      for (const n of wf.nodes)
        counts[n.data.type] = (counts[n.data.type] || 0) + 1;
    const arr = Object.entries(counts)
      .map(([type, count]) => ({
        type,
        count,
        def: NODE_MAP[type],
      }))
      .filter((x) => x.def)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    return arr;
  }, [workflows]);

  // category distribution
  const catDist = useMemo(() => {
    const counts: Record<NodeCategory, number> = {
      trigger: 0,
      action: 0,
      logic: 0,
      data: 0,
      ai: 0,
    };
    for (const wf of workflows)
      for (const n of wf.nodes) {
        const def = NODE_MAP[n.data.type];
        if (def) counts[def.category]++;
      }
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return (Object.keys(counts) as NodeCategory[]).map((c) => ({
      cat: c,
      count: counts[c],
      pct: Math.round((counts[c] / total) * 100),
    }));
  }, [workflows]);

  // runs over time (last 14 buckets)
  const timeline = useMemo(() => {
    if (runs.length === 0) return [];
    const sorted = [...runs].sort((a, b) => a.startedAt - b.startedAt);
    const buckets = 14;
    const min = sorted[0].startedAt;
    const max = sorted[sorted.length - 1].startedAt || min + 1;
    const span = Math.max(max - min, 1);
    const data = Array.from({ length: buckets }, () => ({ ok: 0, err: 0 }));
    for (const r of sorted) {
      const idx = Math.min(
        buckets - 1,
        Math.floor(((r.startedAt - min) / span) * (buckets - 1))
      );
      if (r.status === "success") data[idx].ok++;
      else data[idx].err++;
    }
    return data;
  }, [runs]);

  const maxBar = Math.max(1, ...timeline.map((t) => t.ok + t.err));

  return (
    <div className="min-h-screen pb-24">
      {/* nav */}
      <nav className="glass-strong sticky top-0 z-40 border-b border-line">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-ink"
            >
              <ArrowLeft size={16} /> Back
            </Link>
            <span className="h-5 w-px bg-line" />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/15">
                <TrendingUp size={16} className="text-brand-soft" />
              </div>
              <div>
                <div className="text-sm font-bold text-ink">Analytics</div>
                <div className="text-[10px] text-ink-dim">
                  Execution insights
                </div>
              </div>
            </div>
          </div>
          <Link
            href="/editor"
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-soft"
          >
            New workflow
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 pt-10">
        <Reveal>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Execution analytics
          </h1>
          <p className="mt-2 text-ink-soft">
            Insights across {workflows.length} workflows and {stats.total} runs.
          </p>
        </Reveal>

        {/* stat cards */}
        <StaggerGroup className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { icon: Activity, label: "Total runs", value: stats.total, suffix: "", color: "#7c5cff" },
            { icon: Gauge, label: "Success rate", value: stats.rate, suffix: "%", color: "#22c55e" },
            { icon: Zap, label: "Nodes executed", value: stats.nodesRun, suffix: "", color: "#06b6d4" },
            { icon: Clock, label: "Avg duration", value: Math.round(stats.avg), suffix: "ms", color: "#ec4899" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                variants={staggerItem}
                className="rounded-2xl border border-line bg-bg-soft/60 p-5"
              >
                <div
                  className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: `${s.color}1f`, color: s.color }}
                >
                  <Icon size={20} />
                </div>
                <div className="text-3xl font-extrabold tracking-tight text-ink">
                  <Counter to={s.value} suffix={s.suffix} />
                </div>
                <div className="mt-0.5 text-sm text-ink-dim">{s.label}</div>
              </motion.div>
            );
          })}
        </StaggerGroup>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* timeline chart */}
          <Reveal>
            <div className="rounded-2xl border border-line bg-bg-soft/60 p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-ink">Runs over time</h3>
                  <p className="text-xs text-ink-dim">
                    Success vs error distribution
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-ink-soft">
                    <span className="h-2.5 w-2.5 rounded-sm bg-ok" /> Success
                  </span>
                  <span className="flex items-center gap-1.5 text-ink-soft">
                    <span className="h-2.5 w-2.5 rounded-sm bg-err" /> Error
                  </span>
                </div>
              </div>
              {timeline.length === 0 ? (
                <EmptyChart />
              ) : (
                <div className="flex h-48 items-end gap-1.5">
                  {timeline.map((t, i) => {
                    const h = ((t.ok + t.err) / maxBar) * 100;
                    const okH = t.ok + t.err > 0 ? (t.ok / (t.ok + t.err)) * 100 : 0;
                    return (
                      <div
                        key={i}
                        className="group relative flex flex-1 flex-col justify-end"
                        style={{ height: "100%" }}
                      >
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(h, 2)}%` }}
                          transition={{ delay: i * 0.03, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                          className="relative w-full overflow-hidden rounded-md bg-err/70"
                        >
                          <div
                            className="absolute inset-x-0 bottom-0 bg-ok/80"
                            style={{ height: `${okH}%` }}
                          />
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Reveal>

          {/* category donut */}
          <Reveal delay={0.1}>
            <div className="rounded-2xl border border-line bg-bg-soft/60 p-6">
              <h3 className="font-semibold text-ink">Node categories</h3>
              <p className="text-xs text-ink-dim">Across all workflows</p>
              <div className="mt-5 flex items-center gap-6">
                <Donut data={catDist} />
                <div className="flex-1 space-y-2">
                  {catDist.map((c) => (
                    <div key={c.cat} className="flex items-center gap-2 text-sm">
                      <span
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{ background: CATEGORY_HEX[c.cat] }}
                      />
                      <span className="flex-1 capitalize text-ink-soft">
                        {c.cat}
                      </span>
                      <span className="tabular-nums text-ink-dim">
                        {c.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* node usage + recent runs */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="rounded-2xl border border-line bg-bg-soft/60 p-6">
              <h3 className="mb-5 flex items-center gap-2 font-semibold text-ink">
                <Boxes size={16} className="text-brand-soft" /> Most used nodes
              </h3>
              {nodeUsage.length === 0 ? (
                <EmptyChart label="No nodes yet" />
              ) : (
                <div className="space-y-3">
                  {nodeUsage.map((n, i) => {
                    const max = nodeUsage[0].count;
                    const hex = CATEGORY_HEX[n.def.category];
                    return (
                      <div key={n.type} className="flex items-center gap-3">
                        <span className="w-28 shrink-0 truncate text-xs text-ink-soft">
                          {n.def.label}
                        </span>
                        <div className="h-5 flex-1 overflow-hidden rounded-md bg-bg-panel">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(n.count / max) * 100}%` }}
                            transition={{ delay: i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className="h-full rounded-md"
                            style={{ background: hex }}
                          />
                        </div>
                        <span className="w-6 text-right text-xs tabular-nums text-ink-dim">
                          {n.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rounded-2xl border border-line bg-bg-soft/60 p-6">
              <h3 className="mb-5 flex items-center gap-2 font-semibold text-ink">
                <Activity size={16} className="text-brand-soft" /> Recent runs
              </h3>
              {runs.length === 0 ? (
                <EmptyChart label="No runs yet" />
              ) : (
                <div className="space-y-1">
                  {runs.slice(0, 9).map((r) => (
                    <Link
                      key={r.id}
                      href={`/runs/${r.id}`}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-bg-panel/60"
                    >
                      {r.status === "success" ? (
                        <CheckCircle2 size={15} className="shrink-0 text-ok" />
                      ) : (
                        <XCircle size={15} className="shrink-0 text-err" />
                      )}
                      <span className="flex-1 truncate text-ink">
                        {r.workflowName}
                      </span>
                      <span className="text-xs text-ink-dim">
                        {r.successCount}/{r.nodeCount}
                      </span>
                      <span className="w-14 text-right text-xs tabular-nums text-ink-dim">
                        {fmtDuration(r.durationMs)}
                      </span>
                      <span className="w-16 text-right text-xs tabular-nums text-ink-faint">
                        {fmtRelative(new Date(r.startedAt).toISOString())}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </Reveal>
        </div>

        {loading && (
          <div className="mt-6 text-center text-sm text-ink-dim">
            Loading insights…
          </div>
        )}
      </div>
    </div>
  );
}

function Donut({
  data,
}: {
  data: { cat: NodeCategory; count: number; pct: number }[];
}) {
  const total = data.reduce((a, d) => a + d.count, 0);
  const r = 42;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" className="shrink-0">
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke="#20243a"
        strokeWidth="14"
      />
      {total > 0 &&
        data.map((d) => {
          if (d.count === 0) return null;
          const len = (d.count / total) * c;
          const el = (
            <circle
              key={d.cat}
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke={CATEGORY_HEX[d.cat]}
              strokeWidth="14"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 60 60)"
              strokeLinecap="butt"
            />
          );
          offset += len;
          return el;
        })}
      <text
        x="60"
        y="56"
        textAnchor="middle"
        className="fill-ink text-xl font-bold"
        style={{ fontSize: 22 }}
      >
        {total}
      </text>
      <text
        x="60"
        y="74"
        textAnchor="middle"
        className="fill-ink-dim"
        style={{ fontSize: 10 }}
      >
        nodes
      </text>
    </svg>
  );
}

function EmptyChart({ label = "No data yet" }: { label?: string }) {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-2 text-ink-dim">
      <WorkflowIcon size={28} className="opacity-40" />
      <span className="text-sm">{label}</span>
      <Link
        href="/editor"
        className="mt-1 text-xs font-medium text-brand-soft hover:text-brand"
      >
        Build & run a workflow →
      </Link>
    </div>
  );
}
