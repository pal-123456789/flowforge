"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Plus,
  Workflow as WorkflowIcon,
  LayoutTemplate,
  BarChart3,
  Home,
  History,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Boxes,
  Sun,
  Moon,
} from "lucide-react";
import { NODE_TYPES, CATEGORY_HEX } from "@/lib/nodeRegistry";
import { Icon } from "@/components/ui/Icon";
import { useTheme } from "@/lib/theme";

interface Command {
  id: string;
  title: string;
  subtitle?: string;
  group: string;
  icon: React.ReactNode;
  keywords?: string;
  run: () => void;
}

interface CmdCtx {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: boolean;
}
const Ctx = createContext<CmdCtx>({
  open: () => {},
  close: () => {},
  toggle: () => {},
  isOpen: false,
});

export function useCommandPalette() {
  return useContext(Ctx);
}

export function CommandPaletteProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { theme, toggle: toggleTheme } = useTheme();
  const [isOpen, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  const commands = useMemo<Command[]>(() => {
    const base: Command[] = [
      {
        id: "nav-home",
        title: "Go to Home",
        group: "Navigation",
        icon: <Home size={16} />,
        run: () => router.push("/"),
      },
      {
        id: "new-wf",
        title: "Create new workflow",
        subtitle: "Open a blank canvas",
        group: "Actions",
        icon: <Plus size={16} />,
        keywords: "blank create build",
        run: () => router.push("/editor"),
      },
      {
        id: "toggle-theme",
        title: theme === "light" ? "Switch to dark theme" : "Switch to light theme",
        subtitle: "Toggle the interface color scheme",
        group: "Actions",
        icon: theme === "light" ? <Moon size={16} /> : <Sun size={16} />,
        keywords: "theme dark light mode appearance color scheme toggle",
        run: () => toggleTheme(),
      },
      {
        id: "nav-analytics",
        title: "Open Analytics",
        subtitle: "Run stats & node usage",
        group: "Navigation",
        icon: <BarChart3 size={16} />,
        keywords: "charts stats metrics runs",
        run: () => router.push("/analytics"),
      },
      {
        id: "nav-runs",
        title: "Open Run History",
        subtitle: "Browse & inspect every execution",
        group: "Navigation",
        icon: <History size={16} />,
        keywords: "runs history executions logs timeline",
        run: () => router.push("/runs"),
      },
      {
        id: "nav-templates",
        title: "Browse templates",
        group: "Navigation",
        icon: <LayoutTemplate size={16} />,
        run: () => {
          router.push("/");
          setTimeout(
            () =>
              document
                .getElementById("workspace")
                ?.scrollIntoView({ behavior: "smooth" }),
            120
          );
        },
      },
      {
        id: "nav-nodes",
        title: "Explore node library",
        group: "Navigation",
        icon: <Boxes size={16} />,
        run: () => {
          router.push("/");
          setTimeout(
            () =>
              document
                .getElementById("nodes")
                ?.scrollIntoView({ behavior: "smooth" }),
            120
          );
        },
      },
    ];
    const nodeCmds: Command[] = NODE_TYPES.map((n) => ({
      id: `node-${n.type}`,
      title: n.label,
      subtitle: n.description,
      group: "Insert node",
      keywords: `${n.category} ${n.type}`,
      icon: (
        <span style={{ color: CATEGORY_HEX[n.category] }}>
          <Icon name={n.icon} size={16} />
        </span>
      ),
      run: () => router.push(`/editor?add=${encodeURIComponent(n.type)}`),
    }));
    return [...base, ...nodeCmds];
  }, [router, theme, toggleTheme]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    const score = (c: Command) => {
      const hay = `${c.title} ${c.subtitle ?? ""} ${c.keywords ?? ""} ${
        c.group
      }`.toLowerCase();
      if (hay.includes(q)) return hay.indexOf(q);
      // simple subsequence fuzzy
      let qi = 0;
      for (let i = 0; i < hay.length && qi < q.length; i++) {
        if (hay[i] === q[qi]) qi++;
      }
      return qi === q.length ? 500 : -1;
    };
    return commands
      .map((c) => ({ c, s: score(c) }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => a.s - b.s)
      .map((x) => x.c);
  }, [commands, query]);

  const grouped = useMemo(() => {
    const g: Record<string, Command[]> = {};
    for (const c of filtered) (g[c.group] ??= []).push(c);
    return g;
  }, [filtered]);

  const flat = filtered;

  // global shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, close]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 30);
      // pause Lenis smooth-scroll + lock the page behind the modal
      const lenis = (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis;
      lenis?.stop();
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        lenis?.start();
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  useEffect(() => setCursor(0), [query]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = flat[cursor];
      if (cmd) {
        cmd.run();
        close();
      }
    }
  };

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${cursor}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  let runningIdx = -1;

  return (
    <Ctx.Provider value={{ open, close, toggle, isOpen }}>
      {children}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-start justify-center p-4 pt-[12vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={close}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-bg-panel/95 shadow-glow-lg backdrop-blur-xl"
            >
              <div className="flex items-center gap-3 border-b border-line px-4">
                <Search size={18} className="text-ink-dim" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Search commands, nodes, pages…"
                  className="w-full bg-transparent py-4 text-sm text-ink outline-none placeholder:text-ink-dim"
                />
                <kbd className="rounded border border-line bg-bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-ink-dim">
                  ESC
                </kbd>
              </div>

              <div
                ref={listRef}
                data-lenis-prevent
                onWheel={(e) => e.stopPropagation()}
                className="max-h-[52vh] overflow-y-auto overscroll-contain p-2 scrollbar-thin"
              >
                {flat.length === 0 && (
                  <div className="py-10 text-center text-sm text-ink-dim">
                    No results for “{query}”
                  </div>
                )}
                {Object.entries(grouped).map(([group, cmds]) => (
                  <div key={group} className="mb-1">
                    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                      {group}
                    </div>
                    {cmds.map((c) => {
                      runningIdx++;
                      const idx = runningIdx;
                      const active = idx === cursor;
                      return (
                        <button
                          key={c.id}
                          data-idx={idx}
                          onMouseEnter={() => setCursor(idx)}
                          onClick={() => {
                            c.run();
                            close();
                          }}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                            active ? "bg-brand/20" : "hover:bg-bg-elevated/60"
                          }`}
                        >
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                              active
                                ? "bg-brand/30 text-brand-soft"
                                : "bg-bg-elevated text-ink-soft"
                            }`}
                          >
                            {c.icon}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-ink">
                              {c.title}
                            </span>
                            {c.subtitle && (
                              <span className="block truncate text-xs text-ink-dim">
                                {c.subtitle}
                              </span>
                            )}
                          </span>
                          {active && (
                            <CornerDownLeft
                              size={14}
                              className="shrink-0 text-ink-dim"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-line px-4 py-2.5 text-[11px] text-ink-dim">
                <span className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <ArrowUp size={11} />
                    <ArrowDown size={11} /> navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <CornerDownLeft size={11} /> select
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <WorkflowIcon size={12} /> FlowForge
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}
