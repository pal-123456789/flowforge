"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { getNodeDef, CATEGORY_HEX } from "@/lib/nodeRegistry";
import type { FlowNodeData, NodeRunStatus } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { useEditorStore } from "@/store/editorStore";
import { cn } from "@/lib/utils";
import { Loader2, Check, X, Minus } from "lucide-react";

const STATUS_RING: Record<NodeRunStatus, string> = {
  idle: "",
  waiting: "ring-2 ring-ink-dim/40",
  running: "ring-2 ring-brand animate-pulse-ring",
  success: "ring-2 ring-ok",
  error: "ring-2 ring-err",
  skipped: "ring-1 ring-line opacity-50",
};

function StatusBadge({ status }: { status: NodeRunStatus }) {
  if (status === "idle") return null;
  const base =
    "absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center border-2 border-bg";
  if (status === "running")
    return (
      <div className={cn(base, "bg-brand")}>
        <Loader2 size={11} className="text-white animate-spin" />
      </div>
    );
  if (status === "success")
    return (
      <div className={cn(base, "bg-ok")}>
        <Check size={12} className="text-white" strokeWidth={3} />
      </div>
    );
  if (status === "error")
    return (
      <div className={cn(base, "bg-err")}>
        <X size={12} className="text-white" strokeWidth={3} />
      </div>
    );
  if (status === "skipped")
    return (
      <div className={cn(base, "bg-ink-dim")}>
        <Minus size={12} className="text-white" strokeWidth={3} />
      </div>
    );
  return null;
}

function FlowNodeComponent({ id, data, selected }: NodeProps<FlowNodeData>) {
  const def = getNodeDef(data.type);
  const status = useEditorStore((s) => s.nodeStatus[id] || "idle");

  if (!def) {
    return (
      <div className="px-4 py-3 rounded-xl bg-err/10 border border-err text-err text-xs">
        Unknown node: {data.type}
      </div>
    );
  }

  const color = CATEGORY_HEX[def.category];
  const hasInput = def.inputs > 0;
  const outputs = def.outputs;
  const multiOut = outputs.length > 1;

  return (
    <div
      className={cn(
        "relative rounded-xl bg-bg-panel border transition-all duration-150 shadow-node min-w-[200px] max-w-[260px]",
        selected ? "border-brand shadow-glow" : "border-line hover:border-ink-dim",
        STATUS_RING[status]
      )}
    >
      <StatusBadge status={status} />

      {/* input handle */}
      {hasInput && (
        <Handle
          type="target"
          position={Position.Left}
          className="!left-[-6px]"
          style={{ top: 28 }}
        />
      )}

      {/* header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-line/60">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${color}22`, color }}
        >
          <Icon name={def.icon} size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-ink truncate leading-tight">
            {data.label}
          </div>
          <div
            className="text-[10px] uppercase tracking-wider font-medium"
            style={{ color }}
          >
            {def.category}
          </div>
        </div>
      </div>

      {/* body — a tiny config preview */}
      <div className="px-3 py-2">
        <ConfigPreview type={data.type} config={data.config} />
      </div>

      {/* output handles */}
      {!multiOut && outputs.length === 1 && (
        <Handle
          type="source"
          position={Position.Right}
          id={outputs[0].id}
          className="!right-[-6px]"
          style={{ top: 28 }}
        />
      )}

      {multiOut && (
        <div className="border-t border-line/60 py-1">
          {outputs.map((o, i) => (
            <div
              key={o.id}
              className="relative flex items-center justify-end px-3 py-1 text-[11px] text-ink-soft"
            >
              <span className="font-medium">{o.label}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={o.id}
                className="!right-[-6px]"
                style={{
                  top: "50%",
                  background:
                    o.id === "true"
                      ? "#22c55e"
                      : o.id === "false"
                      ? "#ef4444"
                      : color,
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ConfigPreview({
  type,
  config,
}: {
  type: string;
  config: Record<string, unknown>;
}) {
  let text = "";
  switch (type) {
    case "action.http":
      text = `${config.method} ${config.url}`;
      break;
    case "action.email":
      text = `→ ${config.to || "(recipient)"}`;
      break;
    case "logic.if":
    case "logic.filter":
      text = `${config.left} ${config.operator} ${config.right ?? ""}`;
      break;
    case "logic.switch":
      text = `switch ${config.value}`;
      break;
    case "data.math":
      text = String(config.expression);
      break;
    case "ai.generate":
      text = String(config.prompt);
      break;
    case "trigger.schedule":
      text = `cron ${config.cron}`;
      break;
    case "action.delay":
      text = `${config.ms}ms`;
      break;
    case "data.code":
      text = "JavaScript";
      break;
    default:
      text = "";
  }
  if (!text) return <div className="text-[11px] text-ink-dim italic">configured</div>;
  return (
    <div className="text-[11px] text-ink-soft font-mono truncate bg-bg-soft rounded px-2 py-1 border border-line/50">
      {text}
    </div>
  );
}

export default memo(FlowNodeComponent);
