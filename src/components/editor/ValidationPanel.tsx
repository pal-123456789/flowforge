"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useEditorStore } from "@/store/editorStore";
import { analyzeGraph } from "@/lib/graph";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";

/**
 * Live validation panel. Reads the current graph from the store and surfaces
 * errors/warnings from the engine's analyzer. Clicking an issue selects the
 * offending node so the user can jump straight to the problem.
 */
export function ValidationPanel() {
  const nodes = useEditorStore((s) => s.nodes);
  const edges = useEditorStore((s) => s.edges);
  const selectNode = useEditorStore((s) => s.selectNode);
  const [open, setOpen] = useState(false);

  const analysis = useMemo(
    () => analyzeGraph(nodes as never, edges),
    [nodes, edges]
  );
  const errors = analysis.issues.filter((i) => i.level === "error");
  const warnings = analysis.issues.filter((i) => i.level === "warning");
  const clean = errors.length === 0 && warnings.length === 0;

  const tone = errors.length
    ? "error"
    : warnings.length
      ? "warn"
      : "ok";

  return (
    <div className="absolute left-4 top-4 z-10 w-64">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm shadow-node backdrop-blur transition-colors",
          tone === "error" &&
            "border-err/40 bg-err/10 text-err hover:bg-err/15",
          tone === "warn" &&
            "border-warn/40 bg-warn/10 text-warn hover:bg-warn/15",
          tone === "ok" &&
            "border-ok/40 bg-ok/10 text-ok hover:bg-ok/15"
        )}
      >
        {tone === "error" ? (
          <XCircle size={15} />
        ) : tone === "warn" ? (
          <AlertTriangle size={15} />
        ) : (
          <ShieldCheck size={15} />
        )}
        <span className="flex-1 font-medium">
          {tone === "error"
            ? `${errors.length} error${errors.length > 1 ? "s" : ""}`
            : tone === "warn"
              ? `${warnings.length} warning${warnings.length > 1 ? "s" : ""}`
              : "Graph is valid"}
        </span>
        {!clean && (
          <ChevronDown
            size={14}
            className={cn("transition-transform", open && "rotate-180")}
          />
        )}
      </button>

      <AnimatePresence>
        {open && !clean && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-2 overflow-hidden rounded-xl border border-line bg-bg-panel/95 shadow-node backdrop-blur"
          >
            <div className="max-h-72 space-y-1 overflow-y-auto p-2 scrollbar-thin">
              {[...errors, ...warnings].map((issue, i) => (
                <button
                  key={i}
                  onClick={() => issue.nodeId && selectNode(issue.nodeId)}
                  disabled={!issue.nodeId}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors",
                    issue.nodeId
                      ? "hover:bg-bg-elevated"
                      : "cursor-default opacity-80"
                  )}
                >
                  {issue.level === "error" ? (
                    <XCircle size={13} className="mt-0.5 shrink-0 text-err" />
                  ) : (
                    <AlertTriangle
                      size={13}
                      className="mt-0.5 shrink-0 text-warn"
                    />
                  )}
                  <span className="text-ink-soft">{issue.message}</span>
                </button>
              ))}
            </div>
            <div className="border-t border-line px-3 py-2 text-[10.5px] text-ink-dim">
              {errors.length > 0
                ? "Fix all errors before running."
                : "Warnings won't block a run, but may indicate dead ends."}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
