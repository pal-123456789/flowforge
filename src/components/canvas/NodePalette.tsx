"use client";

import { useEffect, useMemo, useState } from "react";
import { nodesByCategory, CATEGORY_META, CATEGORY_HEX, NODE_MAP } from "@/lib/nodeRegistry";
import type { NodeCategory, NodeTypeDef } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { Search, ChevronDown, Star, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onAdd: (type: string) => void;
}

const ORDER: NodeCategory[] = ["trigger", "action", "logic", "data", "ai"];
const FAV_KEY = "flowforge:favNodes";
const RECENT_KEY = "flowforge:recentNodes";

function loadSet(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

/** Record a node as recently used (shared with Canvas drops). */
export function recordRecentNode(type: string) {
  if (typeof window === "undefined") return;
  try {
    const prev = loadSet(RECENT_KEY).filter((t) => t !== type);
    const next = [type, ...prev].slice(0, 6);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("flowforge:recent-updated"));
  } catch {
    /* ignore */
  }
}

export function NodePalette({ onAdd }: Props) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [favs, setFavs] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const grouped = nodesByCategory();

  useEffect(() => {
    setFavs(loadSet(FAV_KEY));
    setRecent(loadSet(RECENT_KEY));
    const onRecent = () => setRecent(loadSet(RECENT_KEY));
    window.addEventListener("flowforge:recent-updated", onRecent);
    return () =>
      window.removeEventListener("flowforge:recent-updated", onRecent);
  }, []);

  const toggleFav = (type: string) => {
    setFavs((prev) => {
      const next = prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type];
      try {
        localStorage.setItem(FAV_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const matches = (n: NodeTypeDef) =>
    !query ||
    n.label.toLowerCase().includes(query.toLowerCase()) ||
    n.description.toLowerCase().includes(query.toLowerCase()) ||
    n.type.toLowerCase().includes(query.toLowerCase());

  const onDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData("application/flowforge-node", type);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleAdd = (type: string) => {
    recordRecentNode(type);
    onAdd(type);
  };

  const favDefs = useMemo(
    () => favs.map((t) => NODE_MAP[t]).filter(Boolean).filter(matches),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [favs, query]
  );
  const recentDefs = useMemo(
    () =>
      recent
        .map((t) => NODE_MAP[t])
        .filter(Boolean)
        .filter((n) => !favs.includes(n.type))
        .filter(matches),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recent, favs, query]
  );

  const totalMatches = ORDER.reduce(
    (a, c) => a + grouped[c].filter(matches).length,
    0
  );

  return (
    <div className="flex h-full w-64 shrink-0 flex-col border-r border-line bg-bg-soft">
      <div className="border-b border-line p-3">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-dim"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search nodes…"
            className="w-full rounded-lg border border-line bg-bg-panel py-2 pl-8 pr-8 text-sm text-ink placeholder:text-ink-dim focus:border-brand focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-dim hover:text-ink"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="scrollbar-thin flex-1 space-y-1 overflow-y-auto p-2">
        {query && totalMatches === 0 && favDefs.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-ink-dim">
            No nodes match “{query}”.
          </p>
        )}

        {/* favorites */}
        {favDefs.length > 0 && (
          <PaletteGroup
            label="Favorites"
            icon={<Star size={11} className="fill-warn text-warn" />}
            count={favDefs.length}
          >
            {favDefs.map((n) => (
              <NodeItem
                key={`fav-${n.type}`}
                n={n}
                fav
                onFav={toggleFav}
                onAdd={handleAdd}
                onDragStart={onDragStart}
              />
            ))}
          </PaletteGroup>
        )}

        {/* recent */}
        {!query && recentDefs.length > 0 && (
          <PaletteGroup
            label="Recent"
            icon={<Clock size={11} className="text-ink-dim" />}
            count={recentDefs.length}
          >
            {recentDefs.map((n) => (
              <NodeItem
                key={`recent-${n.type}`}
                n={n}
                fav={favs.includes(n.type)}
                onFav={toggleFav}
                onAdd={handleAdd}
                onDragStart={onDragStart}
              />
            ))}
          </PaletteGroup>
        )}

        {/* categories */}
        {ORDER.map((cat) => {
          const items = grouped[cat].filter(matches);
          if (!items.length) return null;
          const meta = CATEGORY_META[cat];
          const isCollapsed = collapsed[cat];
          return (
            <div key={cat} className="mb-1">
              <button
                onClick={() => setCollapsed((c) => ({ ...c, [cat]: !c[cat] }))}
                className="flex w-full items-center gap-2 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-dim hover:text-ink-soft"
              >
                <ChevronDown
                  size={13}
                  className={cn(
                    "transition-transform",
                    isCollapsed && "-rotate-90"
                  )}
                />
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: CATEGORY_HEX[cat] }}
                />
                {meta.label}
                <span className="ml-auto text-ink-dim/60">{items.length}</span>
              </button>
              {!isCollapsed && (
                <div className="mt-1 space-y-1">
                  {items.map((n) => (
                    <NodeItem
                      key={n.type}
                      n={n}
                      fav={favs.includes(n.type)}
                      onFav={toggleFav}
                      onAdd={handleAdd}
                      onDragStart={onDragStart}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-line p-3 text-[10.5px] leading-relaxed text-ink-dim">
        Drag onto the canvas or click to add. Hover a node and tap the star to
        pin it to Favorites.
      </div>
    </div>
  );
}

function PaletteGroup({
  label,
  icon,
  count,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1">
      <div className="flex w-full items-center gap-2 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-dim">
        {icon}
        {label}
        <span className="ml-auto text-ink-dim/60">{count}</span>
      </div>
      <div className="mt-1 space-y-1">{children}</div>
    </div>
  );
}

function NodeItem({
  n,
  fav,
  onFav,
  onAdd,
  onDragStart,
}: {
  n: NodeTypeDef;
  fav: boolean;
  onFav: (type: string) => void;
  onAdd: (type: string) => void;
  onDragStart: (e: React.DragEvent, type: string) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, n.type)}
      onClick={() => onAdd(n.type)}
      className="group flex w-full cursor-grab items-start gap-2.5 rounded-lg border border-transparent px-2.5 py-2 text-left transition-all hover:border-line hover:bg-bg-elevated active:cursor-grabbing"
      title={n.description}
    >
      <div
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
        style={{
          background: `${CATEGORY_HEX[n.category]}1f`,
          color: CATEGORY_HEX[n.category],
        }}
      >
        <Icon name={n.icon} size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-medium leading-tight text-ink">
          {n.label}
        </div>
        <div className="mt-0.5 line-clamp-2 text-[10.5px] leading-snug text-ink-dim">
          {n.description}
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onFav(n.type);
        }}
        className={cn(
          "mt-0.5 shrink-0 rounded p-0.5 transition-all",
          fav
            ? "text-warn opacity-100"
            : "text-ink-dim opacity-0 hover:text-warn group-hover:opacity-100"
        )}
        title={fav ? "Remove from favorites" : "Add to favorites"}
      >
        <Star size={13} className={fav ? "fill-warn" : ""} />
      </button>
    </div>
  );
}
