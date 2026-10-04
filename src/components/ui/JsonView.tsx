"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** A collapsible, syntax-colored JSON viewer. */
export function JsonView({ data, className }: { data: unknown; className?: string }) {
  const [copied, setCopied] = useState(false);
  const text = (() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  })();

  const copy = () => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  };

  return (
    <div className={cn("relative group", className)}>
      <button
        onClick={copy}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-md bg-bg-elevated border border-line text-ink-dim hover:text-ink opacity-0 group-hover:opacity-100 transition-opacity"
        title="Copy JSON"
      >
        {copied ? <Check size={13} className="text-ok" /> : <Copy size={13} />}
      </button>
      <div className="font-mono text-[12px] leading-relaxed overflow-auto max-h-[400px] p-3 rounded-lg bg-bg-soft border border-line">
        <Node value={data} name={null} depth={0} />
      </div>
    </div>
  );
}

function Node({
  value,
  name,
  depth,
}: {
  value: unknown;
  name: string | null;
  depth: number;
}) {
  const [open, setOpen] = useState(depth < 2);
  const isArray = Array.isArray(value);
  const isObj = value !== null && typeof value === "object";

  if (!isObj) {
    return (
      <div className="whitespace-pre-wrap break-all">
        {name !== null && <span className="text-data">&quot;{name}&quot;</span>}
        {name !== null && <span className="text-ink-dim">: </span>}
        <Primitive value={value} />
      </div>
    );
  }

  const entries = isArray
    ? (value as unknown[]).map((v, i) => [String(i), v] as const)
    : Object.entries(value as Record<string, unknown>);

  return (
    <div>
      <div
        className="flex items-center gap-1 cursor-pointer hover:bg-bg-elevated rounded px-0.5 -mx-0.5"
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <ChevronDown size={12} className="text-ink-dim shrink-0" />
        ) : (
          <ChevronRight size={12} className="text-ink-dim shrink-0" />
        )}
        {name !== null && <span className="text-data">&quot;{name}&quot;</span>}
        {name !== null && <span className="text-ink-dim">: </span>}
        <span className="text-ink-dim">
          {isArray ? "[" : "{"}
          {!open && (
            <span className="text-ink-dim/60">
              {entries.length} {isArray ? "items" : "keys"}
              {isArray ? "]" : "}"}
            </span>
          )}
        </span>
      </div>
      {open && (
        <div className="pl-4 border-l border-line/50 ml-1.5">
          {entries.map(([k, v]) => (
            <Node key={k} value={v} name={isArray ? null : k} depth={depth + 1} />
          ))}
          <div className="text-ink-dim">{isArray ? "]" : "}"}</div>
        </div>
      )}
    </div>
  );
}

function Primitive({ value }: { value: unknown }) {
  if (value === null) return <span className="text-ink-dim">null</span>;
  if (value === undefined) return <span className="text-ink-dim">undefined</span>;
  if (typeof value === "string")
    return <span className="text-ok">&quot;{value}&quot;</span>;
  if (typeof value === "number")
    return <span className="text-brand-soft">{value}</span>;
  if (typeof value === "boolean")
    return <span className="text-logic">{String(value)}</span>;
  return <span>{String(value)}</span>;
}
