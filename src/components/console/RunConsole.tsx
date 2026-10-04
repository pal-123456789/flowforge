"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useEditorStore } from "@/store/editorStore";
import { fmtDuration, fmtTime, cn } from "@/lib/utils";
import { JsonView } from "@/components/ui/JsonView";
import {
  Terminal,
  ListTree,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Loader2,
  Trash2,
} from "lucide-react";
import type { LogEntry, NodeRunResult } from "@/lib/types";

type Tab = "logs" | "timeline" | "data";

const LOG_COLOR: Record<LogEntry["level"], string> = {
  info: "text-ink-soft",
  warn: "text-warn",
  error: "text-err",
  debug: "text-ink-dim",
};

export function RunConsole({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const [tab, setTab] = useState<Tab>("timeline");
  const logs = useEditorStore((s) => s.liveLogs);
  const lastRun = useEditorStore((s) => s.lastRun);
  const running = useEditorStore((s) => s.running);
  const clearLogs = useEditorStore((s) => s.clearLogs);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tab === "logs") logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, tab]);

  const results = lastRun?.results || [];
  const selectedResult = results.find((r) => r.nodeId === selectedNode) || results[0];

  return (
    <div
      className={cn(
        "border-t border-line bg-bg-soft flex flex-col transition-all duration-200",
        open ? "h-72" : "h-10"
      )}
    >
      {/* header / tabs */}
      <div className="flex items-center h-10 px-3 shrink-0 border-b border-line/60">
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 text-ink-dim hover:text-ink mr-3"
        >
          {open ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>

        <div className="flex items-center gap-1">
          <TabButton
            active={tab === "timeline"}
            onClick={() => setTab("timeline")}
            icon={<ListTree size={13} />}
            label="Timeline"
          />
          <TabButton
            active={tab === "logs"}
            onClick={() => setTab("logs")}
            icon={<Terminal size={13} />}
            label="Logs"
            badge={logs.length}
          />
          <TabButton
            active={tab === "data"}
            onClick={() => setTab("data")}
            icon={<ListTree size={13} />}
            label="Data"
          />
        </div>

        <div className="ml-auto flex items-center gap-3 text-xs">
          {running && (
            <span className="flex items-center gap-1.5 text-brand-soft">
              <Loader2 size={13} className="animate-spin" /> Running…
            </span>
          )}
          {lastRun && !running && (
            <span className="flex items-center gap-2 text-ink-dim">
              <span
                className={cn(
                  "flex items-center gap-1",
                  lastRun.status === "success" ? "text-ok" : "text-err"
                )}
              >
                {lastRun.status === "success" ? (
                  <CheckCircle2 size={13} />
                ) : (
                  <XCircle size={13} />
                )}
                {lastRun.successCount} ok · {lastRun.errorCount} err
              </span>
              <span>{fmtDuration(lastRun.durationMs)}</span>
              {lastRun.workflowId && lastRun.workflowId !== "inline" && (
                <Link
                  href={`/runs/${lastRun.id}`}
                  className="flex items-center gap-1 rounded border border-line px-1.5 py-0.5 text-[11px] text-ink-soft transition-colors hover:border-brand/50 hover:text-ink"
                  title="Open full run detail"
                >
                  <ListTree size={11} /> Detail
                </Link>
              )}
            </span>
          )}
          <button
            onClick={clearLogs}
            className="text-ink-dim hover:text-ink"
            title="Clear logs"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* body */}
      {open && (
        <div className="flex-1 overflow-hidden">
          {tab === "logs" && (
            <div className="h-full overflow-y-auto scrollbar-thin p-3 font-mono text-[12px] space-y-0.5">
              {logs.length === 0 && (
                <div className="text-ink-dim italic">
                  No logs yet. Run the workflow to see live output.
                </div>
              )}
              {logs.map((l, i) => (
                <div key={i} className="flex gap-3 hover:bg-bg-panel/40 px-1 rounded">
                  <span className="text-ink-dim/60 shrink-0">{fmtTime(l.ts)}</span>
                  <span
                    className={cn(
                      "shrink-0 uppercase text-[10px] w-10 pt-0.5",
                      LOG_COLOR[l.level]
                    )}
                  >
                    {l.level}
                  </span>
                  <span className={cn("break-all", LOG_COLOR[l.level])}>
                    {l.message}
                  </span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          )}

          {tab === "timeline" && (
            <div className="h-full overflow-y-auto scrollbar-thin p-3">
              {results.length === 0 ? (
                <div className="text-ink-dim italic text-sm">
                  No run yet. Press Run to execute the workflow.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {results.map((r) => (
                    <TimelineRow
                      key={r.nodeId}
                      result={r}
                      selected={selectedResult?.nodeId === r.nodeId}
                      onClick={() => {
                        setSelectedNode(r.nodeId);
                        setTab("data");
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "data" && (
            <div className="h-full overflow-hidden flex">
              <div className="w-56 shrink-0 border-r border-line overflow-y-auto scrollbar-thin p-2 space-y-1">
                {results.map((r) => (
                  <button
                    key={r.nodeId}
                    onClick={() => setSelectedNode(r.nodeId)}
                    className={cn(
                      "w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center gap-2 transition-colors",
                      selectedResult?.nodeId === r.nodeId
                        ? "bg-bg-elevated text-ink"
                        : "text-ink-soft hover:bg-bg-panel/60"
                    )}
                  >
                    <StatusDot status={r.status} />
                    <span className="truncate flex-1">{r.label}</span>
                    <span className="text-ink-dim">{fmtDuration(r.durationMs)}</span>
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
                {selectedResult ? (
                  <>
                    {selectedResult.error && (
                      <div className="text-xs text-err bg-err/10 border border-err/30 rounded-lg p-2.5 font-mono">
                        {selectedResult.error}
                      </div>
                    )}
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-dim mb-1.5">
                        Input
                      </div>
                      <JsonView data={selectedResult.input ?? null} />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-dim mb-1.5">
                        Output
                        {selectedResult.takenBranch && (
                          <span className="ml-2 text-brand-soft normal-case">
                            → branch: {selectedResult.takenBranch}
                          </span>
                        )}
                      </div>
                      <JsonView data={selectedResult.output ?? null} />
                    </div>
                  </>
                ) : (
                  <div className="text-ink-dim italic text-sm">
                    Select a node to inspect its data.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
        active
          ? "bg-bg-elevated text-ink"
          : "text-ink-dim hover:text-ink-soft"
      )}
    >
      {icon}
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="text-[10px] bg-bg-panel px-1.5 rounded-full text-ink-dim">
          {badge}
        </span>
      )}
    </button>
  );
}

function StatusDot({ status }: { status: NodeRunResult["status"] }) {
  const map: Record<string, string> = {
    success: "bg-ok",
    error: "bg-err",
    running: "bg-brand animate-pulse",
    skipped: "bg-ink-dim",
    idle: "bg-line",
    waiting: "bg-warn",
  };
  return <span className={cn("w-2 h-2 rounded-full shrink-0", map[status])} />;
}

function TimelineRow({
  result,
  selected,
  onClick,
}: {
  result: NodeRunResult;
  selected: boolean;
  onClick: () => void;
}) {
  const StatusIcon =
    result.status === "success"
      ? CheckCircle2
      : result.status === "error"
      ? XCircle
      : result.status === "skipped"
      ? MinusCircle
      : Loader2;
  const color =
    result.status === "success"
      ? "text-ok"
      : result.status === "error"
      ? "text-err"
      : result.status === "skipped"
      ? "text-ink-dim"
      : "text-brand";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors text-left",
        selected
          ? "bg-bg-elevated border-line"
          : "border-transparent hover:bg-bg-panel/50"
      )}
    >
      <StatusIcon size={15} className={color} />
      <span className="text-sm text-ink font-medium flex-1 truncate">
        {result.label}
      </span>
      <span className="text-[11px] text-ink-dim font-mono">{result.nodeType}</span>
      {result.takenBranch && (
        <span className="text-[11px] text-brand-soft">→ {result.takenBranch}</span>
      )}
      <span className="text-xs text-ink-soft tabular-nums w-16 text-right">
        {fmtDuration(result.durationMs)}
      </span>
    </button>
  );
}
