"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Keyboard, X } from "lucide-react";

interface ShortcutRow {
  keys: string[];
  label: string;
}

const GROUPS: { title: string; rows: ShortcutRow[] }[] = [
  {
    title: "General",
    rows: [
      { keys: ["Ctrl", "K"], label: "Open command palette" },
      { keys: ["?"], label: "Show / hide this help" },
      { keys: ["Esc"], label: "Close dialogs" },
    ],
  },
  {
    title: "Editing",
    rows: [
      { keys: ["Ctrl", "Z"], label: "Undo" },
      { keys: ["Ctrl", "Shift", "Z"], label: "Redo" },
      { keys: ["Ctrl", "D"], label: "Duplicate selected node" },
      { keys: ["Del"], label: "Delete selected node" },
    ],
  },
  {
    title: "Workflow",
    rows: [
      { keys: ["Ctrl", "S"], label: "Save workflow" },
      { keys: ["Ctrl", "Enter"], label: "Run workflow" },
    ],
  },
];

export function ShortcutsHelp({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[95] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-bg-panel/95 shadow-glow-lg backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Keyboard size={16} className="text-brand-soft" />
                Keyboard shortcuts
              </span>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-dim transition-colors hover:bg-bg-elevated hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid gap-5 p-5 sm:grid-cols-2">
              {GROUPS.map((g) => (
                <div key={g.title}>
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                    {g.title}
                  </div>
                  <div className="space-y-1.5">
                    {g.rows.map((r) => (
                      <div
                        key={r.label}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="text-xs text-ink-soft">{r.label}</span>
                        <span className="flex shrink-0 items-center gap-1">
                          {r.keys.map((k) => (
                            <kbd
                              key={k}
                              className="rounded border border-line bg-bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-ink-dim"
                            >
                              {k}
                            </kbd>
                          ))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-line px-5 py-3 text-center text-[11px] text-ink-dim">
              Press{" "}
              <kbd className="rounded border border-line bg-bg-elevated px-1.5 py-0.5 font-mono text-[10px]">
                ?
              </kbd>{" "}
              anytime to toggle this panel
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
