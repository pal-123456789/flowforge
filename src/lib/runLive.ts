"use client";

import { executeWorkflow } from "@/lib/engine";
import type { FlowNode, FlowEdge, RunRecord, NodeRunResult, LogEntry } from "@/lib/types";

export interface LiveRunHandlers {
  onNodeStart: (id: string) => void;
  onNodeFinish: (r: NodeRunResult) => void;
  onLog: (l: LogEntry) => void;
  onDone: (r: RunRecord) => void;
}

/**
 * Run a workflow directly in the browser so the canvas lights up live.
 * (Note: nodes that need the server — e.g. file writes — degrade gracefully.)
 */
export async function runLive(
  nodes: FlowNode[],
  edges: FlowEdge[],
  meta: { workflowId: string; workflowName: string },
  handlers: LiveRunHandlers
): Promise<RunRecord> {
  // small delay helper so the UI can animate node transitions
  const originalFetch = globalThis.fetch;
  void originalFetch;

  return executeWorkflow(nodes, edges, meta, { trigger: "manual" }, {
    onNodeStart: handlers.onNodeStart,
    onNodeFinish: handlers.onNodeFinish,
    onLog: handlers.onLog,
    onDone: handlers.onDone,
  });
}
