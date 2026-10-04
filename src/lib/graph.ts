import type { FlowNode, FlowEdge, Workflow } from "./types";
import { getNodeDef } from "./nodeRegistry";

export interface GraphIssue {
  level: "error" | "warning";
  message: string;
  nodeId?: string;
}

export interface GraphAnalysis {
  issues: GraphIssue[];
  triggers: string[];
  hasCycle: boolean;
  order: string[]; // topological order (best-effort)
  adjacency: Record<string, FlowEdge[]>; // outgoing edges per node
  incoming: Record<string, FlowEdge[]>; // incoming edges per node
  isValid: boolean;
}

/**
 * Analyse a workflow graph: find triggers, detect cycles, build adjacency,
 * compute a topological order, and surface validation issues.
 */
export function analyzeGraph(nodes: FlowNode[], edges: FlowEdge[]): GraphAnalysis {
  const issues: GraphIssue[] = [];
  const adjacency: Record<string, FlowEdge[]> = {};
  const incoming: Record<string, FlowEdge[]> = {};
  const nodeIds = new Set(nodes.map((n) => n.id));

  for (const n of nodes) {
    adjacency[n.id] = [];
    incoming[n.id] = [];
  }
  for (const e of edges) {
    if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) continue;
    adjacency[e.source].push(e);
    incoming[e.target].push(e);
  }

  const triggers = nodes
    .filter((n) => getNodeDef(n.data.type)?.category === "trigger")
    .map((n) => n.id);

  if (nodes.length === 0) {
    issues.push({ level: "error", message: "Workflow is empty. Add a trigger to begin." });
  }
  if (triggers.length === 0 && nodes.length > 0) {
    issues.push({
      level: "error",
      message: "No trigger node. Every workflow needs a trigger to start.",
    });
  }

  // orphan nodes (non-trigger with no incoming)
  for (const n of nodes) {
    const def = getNodeDef(n.data.type);
    if (!def) {
      issues.push({ level: "error", message: `Unknown node type: ${n.data.type}`, nodeId: n.id });
      continue;
    }
    if (def.category !== "trigger" && incoming[n.id].length === 0) {
      issues.push({
        level: "warning",
        message: `"${n.data.label}" has no input connection and will never run.`,
        nodeId: n.id,
      });
    }
  }

  // cycle detection + topological order (Kahn's algorithm)
  const indeg: Record<string, number> = {};
  for (const n of nodes) indeg[n.id] = incoming[n.id].length;
  const queue = nodes.filter((n) => indeg[n.id] === 0).map((n) => n.id);
  const order: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    for (const e of adjacency[id]) {
      indeg[e.target]--;
      if (indeg[e.target] === 0) queue.push(e.target);
    }
  }
  const hasCycle = order.length !== nodes.length;
  if (hasCycle) {
    issues.push({
      level: "error",
      message: "Workflow contains a cycle. Automation graphs must be acyclic (DAG).",
    });
  }

  const isValid = !issues.some((i) => i.level === "error");

  return { issues, triggers, hasCycle, order, adjacency, incoming, isValid };
}

export function validateWorkflow(wf: Workflow): GraphAnalysis {
  return analyzeGraph(wf.nodes, wf.edges);
}
