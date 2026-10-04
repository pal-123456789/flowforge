"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------- primitives ------------------------------ */

export function TextInput({
  value,
  onChange,
  placeholder,
  mono,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full bg-bg-soft border border-line rounded-lg px-3 py-2 text-sm text-ink placeholder:text-ink-dim focus:outline-none focus:border-brand transition-colors",
        mono && "font-mono text-[12.5px]"
      )}
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
  mono,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  mono?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      spellCheck={false}
      className={cn(
        "w-full bg-bg-soft border border-line rounded-lg px-3 py-2 text-sm text-ink placeholder:text-ink-dim focus:outline-none focus:border-brand resize-y transition-colors",
        mono && "font-mono text-[12.5px] leading-relaxed"
      )}
    />
  );
}

export function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-bg-soft border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand transition-colors appearance-none cursor-pointer"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center gap-2.5 group"
    >
      <div
        className={cn(
          "w-9 h-5 rounded-full p-0.5 transition-colors",
          value ? "bg-brand" : "bg-line"
        )}
      >
        <div
          className={cn(
            "w-4 h-4 rounded-full bg-white transition-transform",
            value && "translate-x-4"
          )}
        />
      </div>
      {label && <span className="text-sm text-ink-soft">{label}</span>}
    </button>
  );
}

/** Editable key/value pair list. */
export function KeyValueEditor({
  value,
  onChange,
}: {
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}) {
  const entries = Object.entries(value || {});
  const [draftKey, setDraftKey] = useState("");
  const [draftVal, setDraftVal] = useState("");

  const update = (oldKey: string, newKey: string, newVal: string) => {
    const next: Record<string, string> = {};
    for (const [k, v] of entries) {
      if (k === oldKey) next[newKey] = newVal;
      else next[k] = v;
    }
    onChange(next);
  };

  const remove = (key: string) => {
    const next = { ...value };
    delete next[key];
    onChange(next);
  };

  const add = () => {
    if (!draftKey.trim()) return;
    onChange({ ...value, [draftKey.trim()]: draftVal });
    setDraftKey("");
    setDraftVal("");
  };

  return (
    <div className="space-y-1.5">
      {entries.map(([k, v]) => (
        <div key={k} className="flex gap-1.5 items-center">
          <input
            value={k}
            onChange={(e) => update(k, e.target.value, v)}
            className="w-[38%] bg-bg-soft border border-line rounded-md px-2 py-1.5 text-[12.5px] font-mono text-ink focus:outline-none focus:border-brand"
          />
          <span className="text-ink-dim text-xs">:</span>
          <input
            value={v}
            onChange={(e) => update(k, k, e.target.value)}
            className="flex-1 bg-bg-soft border border-line rounded-md px-2 py-1.5 text-[12.5px] font-mono text-ink focus:outline-none focus:border-brand"
          />
          <button
            onClick={() => remove(k)}
            className="p-1.5 text-ink-dim hover:text-err transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      <div className="flex gap-1.5 items-center pt-1">
        <input
          value={draftKey}
          onChange={(e) => setDraftKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="key"
          className="w-[38%] bg-bg-panel border border-dashed border-line rounded-md px-2 py-1.5 text-[12.5px] font-mono text-ink placeholder:text-ink-dim focus:outline-none focus:border-brand"
        />
        <span className="text-ink-dim text-xs">:</span>
        <input
          value={draftVal}
          onChange={(e) => setDraftVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="value"
          className="flex-1 bg-bg-panel border border-dashed border-line rounded-md px-2 py-1.5 text-[12.5px] font-mono text-ink placeholder:text-ink-dim focus:outline-none focus:border-brand"
        />
        <button
          onClick={add}
          className="p-1.5 text-ink-dim hover:text-brand transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
