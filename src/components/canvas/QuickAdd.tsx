"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NODE_TYPES, CATEGORY_HEX, CATEGORY_META } from "@/lib/nodeRegistry";
import type { NodeTypeDef } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { Search, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuickAddState {
  /** screen coordinates for the popover anchor */
  screen: { x: number; y: number };
  /** flow coordinates where the node will be created */
  flow: { x: number; y: number };
}

/**
 * A fuzzy quick-add menu that appears on canvas double-click. Type to filter
 * every node type, arrow-key to navigate, Enter to drop at the cursor.
 */
export function QuickAdd({
  state,
  onPick,
  onClose,
}: {
  state: QuickAddState | null;
  onPick: (type: string, flow: { x: number; y: number }) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state) {
      setQuery("");
      setCursor(0);
      // focus after mount
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [state]);

  const results = useMemo<NodeTypeDef[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return NODE_TYPES;
    return NODE_TYPES.filter(
      (n) =>
        n.label.toLowerCase().includes(q) ||
        n.type.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q) ||
        n.category.toLowerCase().includes(q)
    );
  }, [query]);

  useEffect(() => {
    setCursor((c) => Math.min(c, Math.max(0, results.length - 1)));
  }, [results.length]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-idx="${cursor}"]`
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  if (!state) return null;

  const pick = (n?: NodeTypeDef) => {
    const chosen = n || results[cursor];
    if (!chosen) return;
    onPick(chosen.type, state.flow);
    onClose();
  };

  // keep the popover on-screen
  const POP_W = 320;
  const POP_H = 360;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const left = Math.min(state.screen.x, vw - POP_W - 16);
  const top = Math.min(state.screen.y, vh - POP_H - 16);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 6 }}
          transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
          style={{ left, top, width: POP_W }}
          className="absolute overflow-hidden rounded-xl border border-line bg-bg-panel/95 shadow-glow-lg backdrop-blur-xl"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
            <Search size={15} className="shrink-0 text-ink-dim" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCursor(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setCursor((c) => Math.min(c + 1, results.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setCursor((c) => Math.max(c - 1, 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  pick();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  onClose();
                }
              }}
              placeholder="Add a node…"
              className="w-full bg-transparent text-sm text-ink placeholder:text-ink-dim focus:outline-none"
            />
          </div>

          <div
            ref={listRef}
            className="max-h-[300px] overflow-y-auto scrollbar-thin p-1.5"
          >
            {results.length === 0 ? (
              <div className="px-3 py-8 text-center text-xs text-ink-dim">
                No nodes match “{query}”
              </div>
            ) : (
              results.map((n, i) => {
                const color = CATEGORY_HEX[n.category];
                const active = i === cursor;
                return (
                  <button
                    key={n.type}
                    data-idx={i}
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => pick(n)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                      active ? "bg-bg-elevated" : "hover:bg-bg-elevated/60"
                    )}
                  >
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                      style={{ background: `${color}22`, color }}
                    >
                      <Icon name={n.icon} size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-ink">
                        {n.label}
                      </div>
                      <div className="truncate text-[10.5px] text-ink-dim">
                        {CATEGORY_META[n.category].label}
                      </div>
                    </div>
                    {active && (
                      <CornerDownLeft
                        size={13}
                        className="shrink-0 text-ink-dim"
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between border-t border-line px-3 py-2 text-[10.5px] text-ink-dim">
            <span>{results.length} nodes</span>
            <span className="flex items-center gap-1">
              <CornerDownLeft size={11} /> to add
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
