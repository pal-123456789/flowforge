"use client";

import { useState } from "react";
import { nodesByCategory, CATEGORY_META, CATEGORY_HEX } from "@/lib/nodeRegistry";
import type { NodeCategory, NodeTypeDef } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onAdd: (type: string) => void;
}

const ORDER: NodeCategory[] = ["trigger", "action", "logic", "data", "ai"];

export function NodePalette({ onAdd }: Props) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const grouped = nodesByCategory();

  const matches = (n: NodeTypeDef) =>
    !query ||
    n.label.toLowerCase().includes(query.toLowerCase()) ||
    n.description.toLowerCase().includes(query.toLowerCase());

  const onDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData("application/flowforge-node", type);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="w-64 shrink-0 border-r border-line bg-bg-soft flex flex-col h-full">
      <div className="p-3 border-b border-line">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-dim"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search nodes…"
            className="w-full bg-bg-panel border border-line rounded-lg pl-8 pr-3 py-2 text-sm text-ink placeholder:text-ink-dim focus:outline-none focus:border-brand"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
        {ORDER.map((cat) => {
          const items = grouped[cat].filter(matches);
          if (!items.length) return null;
          const meta = CATEGORY_META[cat];
          const isCollapsed = collapsed[cat];
          return (
            <div key={cat} className="mb-1">
              <button
                onClick={() =>
                  setCollapsed((c) => ({ ...c, [cat]: !c[cat] }))
                }
                className="w-full flex items-center gap-2 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-dim hover:text-ink-soft"
              >
                <ChevronDown
                  size={13}
                  className={cn(
                    "transition-transform",
                    isCollapsed && "-rotate-90"
                  )}
                />
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: CATEGORY_HEX[cat] }}
                />
                {meta.label}
                <span className="ml-auto text-ink-dim/60">{items.length}</span>
              </button>
              {!isCollapsed && (
                <div className="space-y-1 mt-1">
                  {items.map((n) => (
                    <button
                      key={n.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, n.type)}
                      onClick={() => onAdd(n.type)}
                      className="group w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg hover:bg-bg-elevated border border-transparent hover:border-line transition-all text-left cursor-grab active:cursor-grabbing"
                      title={n.description}
                    >
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                        style={{
                          background: `${CATEGORY_HEX[cat]}1f`,
                          color: CATEGORY_HEX[cat],
                        }}
                      >
                        <Icon name={n.icon} size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[12.5px] font-medium text-ink leading-tight">
                          {n.label}
                        </div>
                        <div className="text-[10.5px] text-ink-dim leading-snug line-clamp-2 mt-0.5">
                          {n.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-line text-[10.5px] text-ink-dim leading-relaxed">
        Drag onto the canvas or click to add. Connect nodes by dragging between
        the dots.
      </div>
    </div>
  );
}
