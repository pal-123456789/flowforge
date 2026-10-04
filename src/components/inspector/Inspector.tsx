"use client";

import { useEditorStore } from "@/store/editorStore";
import { getNodeDef, CATEGORY_HEX } from "@/lib/nodeRegistry";
import type { FieldSchema } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import {
  TextInput,
  TextArea,
  Select,
  Toggle,
  KeyValueEditor,
} from "./fields";
import { Copy, Trash2, Settings2, Info } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function Inspector() {
  const selectedId = useEditorStore((s) => s.selectedNodeId);
  const node = useEditorStore((s) =>
    s.nodes.find((n) => n.id === s.selectedNodeId)
  );
  const updateConfig = useEditorStore((s) => s.updateNodeConfig);
  const updateLabel = useEditorStore((s) => s.updateNodeLabel);
  const deleteNode = useEditorStore((s) => s.deleteNode);
  const duplicateNode = useEditorStore((s) => s.duplicateNode);
  const lastRun = useEditorStore((s) => s.lastRun);
  const { toast } = useToast();

  if (!node) {
    return (
      <div className="w-80 shrink-0 border-l border-line bg-bg-soft flex flex-col items-center justify-center text-center p-8 h-full">
        <div className="w-12 h-12 rounded-xl bg-bg-panel border border-line flex items-center justify-center mb-3">
          <Settings2 size={22} className="text-ink-dim" />
        </div>
        <div className="text-sm font-medium text-ink-soft">No node selected</div>
        <div className="text-xs text-ink-dim mt-1 max-w-[200px]">
          Click a node on the canvas to configure its behaviour.
        </div>
      </div>
    );
  }

  const def = getNodeDef(node.data.type);
  if (!def) return null;
  const color = CATEGORY_HEX[def.category];
  const config = node.data.config;

  const nodeResult = lastRun?.results.find((r) => r.nodeId === node.id);

  const shouldShow = (f: FieldSchema) => {
    if (!f.showIf) return true;
    return config[f.showIf.key] === f.showIf.equals;
  };

  return (
    <div className="w-80 shrink-0 border-l border-line bg-bg-soft flex flex-col h-full">
      {/* header */}
      <div className="p-4 border-b border-line">
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${color}22`, color }}
          >
            <Icon name={def.icon} size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <input
              value={node.data.label}
              onChange={(e) => updateLabel(node.id, e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-ink focus:outline-none focus:bg-bg-panel rounded px-1 -mx-1 py-0.5"
            />
            <div
              className="text-[10px] uppercase tracking-wider font-medium mt-0.5"
              style={{ color }}
            >
              {def.category} · {def.type}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => {
              duplicateNode(node.id);
              toast("info", "Node duplicated");
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-bg-panel border border-line text-xs text-ink-soft hover:text-ink hover:border-ink-dim transition-colors"
          >
            <Copy size={13} /> Duplicate
          </button>
          <button
            onClick={() => {
              deleteNode(node.id);
              toast("info", "Node deleted");
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-bg-panel border border-line text-xs text-ink-soft hover:text-err hover:border-err/50 transition-colors"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>

      {/* description */}
      <div className="px-4 py-3 border-b border-line bg-bg-panel/40">
        <div className="flex gap-2 text-[11.5px] text-ink-soft leading-relaxed">
          <Info size={13} className="shrink-0 mt-0.5 text-ink-dim" />
          {def.description}
        </div>
      </div>

      {/* fields */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        {def.fields.filter(shouldShow).map((field) => (
          <div key={field.key}>
            <label className="block text-[12px] font-medium text-ink-soft mb-1.5">
              {field.label}
            </label>
            <FieldInput
              field={field}
              value={config[field.key]}
              onChange={(v) => updateConfig(node.id, { [field.key]: v })}
            />
            {field.help && (
              <div className="text-[10.5px] text-ink-dim mt-1 leading-snug">
                {field.help}
              </div>
            )}
          </div>
        ))}

        {/* last run output for this node */}
        {nodeResult && (
          <div className="pt-2 border-t border-line">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-dim mb-2">
              Last run · {nodeResult.status}
            </div>
            {nodeResult.error && (
              <div className="text-xs text-err bg-err/10 border border-err/30 rounded-lg p-2 mb-2 font-mono">
                {nodeResult.error}
              </div>
            )}
            {nodeResult.output !== undefined && (
              <OutputPreview output={nodeResult.output} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function OutputPreview({ output }: { output: unknown }) {
  const text = (() => {
    try {
      return JSON.stringify(output, null, 2);
    } catch {
      return String(output);
    }
  })();
  return (
    <pre className="text-[11px] font-mono text-ink-soft bg-bg-soft border border-line rounded-lg p-2.5 overflow-auto max-h-48 whitespace-pre-wrap break-all">
      {text}
    </pre>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldSchema;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  switch (field.type) {
    case "text":
      return (
        <TextInput
          value={String(value ?? "")}
          onChange={onChange}
          placeholder={field.placeholder}
        />
      );
    case "number":
      return (
        <TextInput
          value={String(value ?? "")}
          onChange={(v) => onChange(v === "" ? "" : Number(v))}
          placeholder={field.placeholder}
        />
      );
    case "textarea":
      return (
        <TextArea
          value={String(value ?? "")}
          onChange={onChange}
          rows={field.rows}
          placeholder={field.placeholder}
        />
      );
    case "code":
      return (
        <TextArea
          value={String(value ?? "")}
          onChange={onChange}
          rows={field.rows || 8}
          mono
        />
      );
    case "json":
      return (
        <TextArea
          value={String(value ?? "")}
          onChange={onChange}
          rows={field.rows || 5}
          mono
          placeholder={field.placeholder}
        />
      );
    case "select":
      return (
        <Select
          value={String(value ?? "")}
          onChange={onChange}
          options={field.options || []}
        />
      );
    case "boolean":
      return <Toggle value={Boolean(value)} onChange={onChange} />;
    case "keyvalue":
      return (
        <KeyValueEditor
          value={(value as Record<string, string>) || {}}
          onChange={onChange}
        />
      );
    default:
      return null;
  }
}
