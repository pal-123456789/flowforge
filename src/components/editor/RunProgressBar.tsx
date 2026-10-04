"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEditorStore } from "@/store/editorStore";

/**
 * A thin progress bar across the top of the canvas that fills as nodes finish
 * during a live run. Purely derived from the store's run state — no new state.
 */
export function RunProgressBar() {
  const running = useEditorStore((s) => s.running);
  const nodes = useEditorStore((s) => s.nodes);
  const nodeStatus = useEditorStore((s) => s.nodeStatus);

  const total = nodes.length || 1;
  const done = nodes.filter((n) => {
    const st = nodeStatus[n.id];
    return st === "success" || st === "error" || st === "skipped";
  }).length;
  const pct = Math.round((done / total) * 100);
  const anyError = nodes.some((n) => nodeStatus[n.id] === "error");

  return (
    <AnimatePresence>
      {running && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="pointer-events-none absolute inset-x-0 top-0 z-20"
        >
          <div className="h-0.5 w-full bg-line/40">
            <motion.div
              className={anyError ? "h-full bg-err" : "h-full bg-brand"}
              animate={{ width: `${pct}%` }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
            />
          </div>
          <div className="flex justify-center">
            <div className="mt-2 flex items-center gap-2 rounded-full border border-line bg-bg-panel/90 px-3 py-1 text-[11px] font-medium text-ink-soft shadow-node backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
              </span>
              Running · {done}/{total} nodes
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
