"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { RunRecord, Workflow } from "@/lib/types";
import { fmtDuration, fmtRelative, cn } from "@/lib/utils";
import { FullscreenLoader } from "@/components/ui/Loader3D";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  Search,
  ChevronRight,
  History,
} from "lucide-react";

type StatusFilter = "all" | "success" | "error";

export function RunHistory() {
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [wfFilter, setWfFilter] = useState<string>("all");

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

  const filtered = useMemo(() => {
    return runs.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (wfFilter !== "all" && r.workflowId !== wfFilter) return false;
      if (query && !r.workflowName.toLowerCase().includes(query.toLowerCase()))
        return false;
      return true;
    });
  }, [runs, status, wfFilter, query]);

  const summary = useMemo(() => {
    const ok = runs.filter((r) => r.status === "success").length;
    const err = runs.filter((r) => r.status === "error").length;
    return { ok, err, total: runs.length };
  }, [runs]);

  if (loading) return <FullscreenLoader label="Loading run history" />;

  return (
    <div className="min-h-screen bg-bg text-ink">
      <div className="sticky top-0 z-20 border-b border-line bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-ink-dim transition-colors hover:bg-bg-panel hover:text-ink"
          >
            <ArrowLeft size={16} /> Home
          </Link>
          <div className="h-5 w-px bg-line" />
          <div className="flex items-center gap-2">
            <History size={16} className="text-brand-soft" />
            <h1 className="text-sm font-semibold">Run history</h1>
          </div>
          <div className="ml-auto flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-ok">
              <CheckCircle2 size={13} /> {summary.ok}
            </span>
            <span className="flex items-center gap-1 text-err">
              <XCircle size={13} /> {summary.err}
            </span>
            <Link
              href="/analytics"
              className="rounded-lg border border-line px-2.5 py-1 text-ink-soft hover:border-brand/50 hover:text-ink"
            >
              Analytics
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by workflow name…"
              className="w-full rounded-lg border border-line bg-bg-soft py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-dim focus:border-brand focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-line bg-bg-soft p-1">
            {(["all", "success", "error"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                  status === s
                    ? "bg-brand text-white"
                    : "text-ink-dim hover:text-ink"
                )}
              >
                {s}
              </button>
            ))}
          </div>
          {workflows.length > 0 && (
            <select
              value={wfFilter}
              onChange={(e) => setWfFilter(e.target.value)}
              className="rounded-lg border border-line bg-bg-soft px-3 py-2 text-sm text-ink-soft focus:border-brand focus:outline-none"
            >
              <option value="all">All workflows</option>
              {workflows.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line py-20 text-ink-dim">
            <Activity size={32} className="opacity-40" />
            <p className="text-sm">
              {runs.length === 0
                ? "No runs yet. Build a workflow and press Run."
                : "No runs match your filters."}
            </p>
            <Link
              href="/editor"
              className="mt-1 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-soft"
            >
              Open the editor →
            </Link>
          </div>
        ) : (
          <motion.div
            className="space-y-2"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.03 } } }}
          >
            {filtered.map((r) => (
              <motion.div
                key={r.id}
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  show: { opacity: 1, y: 0 },
                }}
              >
                <RunRow run={r} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function RunRow({ run }: { run: RunRecord }) {
  const ok = run.status === "success";
  const rate =
    run.nodeCount > 0 ? Math.round((run.successCount / run.nodeCount) * 100) : 0;
  return (
    <Link
      href={`/runs/${run.id}`}
      className="group flex items-center gap-4 rounded-xl border border-line bg-bg-soft/60 px-4 py-3 transition-all hover:border-brand/50 hover:bg-bg-panel/60"
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          ok ? "bg-ok/15 text-ok" : "bg-err/15 text-err"
        )}
      >
        {ok ? <CheckCircle2 size={17} /> : <XCircle size={17} />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-ink">
          {run.workflowName}
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-ink-dim">
          <span>{run.id}</span>
          <span>·</span>
          <span className="capitalize">{run.trigger}</span>
        </div>
      </div>
      {/* mini success bar */}
      <div className="hidden w-24 sm:block">
        <div className="h-1.5 overflow-hidden rounded-full bg-bg-panel">
          <div
            className={cn("h-full rounded-full", ok ? "bg-ok" : "bg-err")}
            style={{ width: `${rate}%` }}
          />
        </div>
        <div className="mt-1 text-right text-[10px] text-ink-faint">
          {run.successCount}/{run.nodeCount} nodes
        </div>
      </div>
      <div className="flex w-16 shrink-0 items-center gap-1 text-xs text-ink-dim">
        <Clock size={12} /> {fmtDuration(run.durationMs)}
      </div>
      <div className="hidden w-20 shrink-0 text-right text-xs text-ink-faint sm:block">
        {fmtRelative(new Date(run.startedAt).toISOString())}
      </div>
      <ChevronRight
        size={16}
        className="shrink-0 text-ink-dim transition-transform group-hover:translate-x-0.5 group-hover:text-ink"
      />
    </Link>
  );
}
