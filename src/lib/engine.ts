import type {
  FlowNode,
  FlowEdge,
  NodeRunResult,
  RunRecord,
  LogEntry,
} from "./types";
import { analyzeGraph } from "./graph";
import { runNode, type ExecResult } from "./executors";
import { getNodeDef } from "./nodeRegistry";
import { nanoid } from "nanoid";

export interface EngineEvents {
  onNodeStart?: (nodeId: string) => void;
  onNodeFinish?: (result: NodeRunResult) => void;
  onLog?: (entry: LogEntry) => void;
  onDone?: (record: RunRecord) => void;
}

export interface RunOptions {
  trigger?: string;
  initialInput?: unknown;
  /** only run from this trigger id (if multiple triggers exist) */
  startNodeId?: string;
  signal?: AbortSignal;
}

/**
 * The FlowForge execution engine.
 *
 * Strategy: topologically process nodes. Each node receives the merged output
 * of its *active* incoming edges. Branch nodes (if/switch) mark only one output
 * handle active; filters can deactivate their output; loop nodes fan out items.
 * Nodes whose inputs are all inactive are skipped.
 */
export async function executeWorkflow(
  nodes: FlowNode[],
  edges: FlowEdge[],
  meta: { workflowId: string; workflowName: string },
  opts: RunOptions = {},
  events: EngineEvents = {}
): Promise<RunRecord> {
  const analysis = analyzeGraph(nodes, edges);
  const startedAt = Date.now();
  const results: NodeRunResult[] = [];
  const globalLogs: LogEntry[] = [];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const pushLog = (entry: LogEntry) => {
    globalLogs.push(entry);
    events.onLog?.(entry);
  };

  const record: RunRecord = {
    id: nanoid(10),
    workflowId: meta.workflowId,
    workflowName: meta.workflowName,
    status: "running",
    startedAt,
    trigger: opts.trigger || "manual",
    results,
    logs: globalLogs,
    nodeCount: nodes.length,
    successCount: 0,
    errorCount: 0,
  };

  if (!analysis.isValid) {
    const msg = analysis.issues
      .filter((i) => i.level === "error")
      .map((i) => i.message)
      .join("; ");
    pushLog({ ts: Date.now(), level: "error", message: `Validation failed: ${msg}` });
    record.status = "error";
    record.finishedAt = Date.now();
    record.durationMs = record.finishedAt - startedAt;
    record.errorCount = 1;
    events.onDone?.(record);
    return record;
  }

  // Per-edge "active" output values. Key: edgeId -> value passed along it.
  const edgeValue = new Map<string, unknown>();
  const edgeActive = new Set<string>();

  // outgoing / incoming maps
  const outEdges = analysis.adjacency;
  const inEdges = analysis.incoming;

  // process in topological order
  const triggers = analysis.triggers;
  const startSet = new Set(
    opts.startNodeId ? [opts.startNodeId] : triggers
  );

  for (const nodeId of analysis.order) {
    const node = nodeMap.get(nodeId);
    if (!node) continue;
    const def = getNodeDef(node.data.type);
    if (!def) continue;

    const incoming = inEdges[nodeId] || [];
    const isTrigger = def.category === "trigger";

    // determine if this node should run
    let shouldRun = false;
    let input: unknown;

    if (isTrigger) {
      shouldRun = startSet.size === 0 || startSet.has(nodeId);
      input = opts.initialInput;
    } else {
      const activeIncoming = incoming.filter((e) => edgeActive.has(e.id));
      shouldRun = activeIncoming.length > 0;
      if (shouldRun) {
        if (def.type === "logic.merge") {
          input = activeIncoming.map((e) => edgeValue.get(e.id));
        } else if (activeIncoming.length === 1) {
          input = edgeValue.get(activeIncoming[0].id);
        } else {
          // multiple active inputs on a normal node: shallow-merge objects
          const merged: Record<string, unknown> = {};
          let nonObj: unknown;
          for (const e of activeIncoming) {
            const v = edgeValue.get(e.id);
            if (v && typeof v === "object" && !Array.isArray(v)) Object.assign(merged, v);
            else nonObj = v;
          }
          input = Object.keys(merged).length ? merged : nonObj;
        }
      }
    }

    if (!shouldRun) {
      const skipped: NodeRunResult = {
        nodeId,
        nodeType: node.data.type,
        label: node.data.label,
        status: "skipped",
        startedAt: Date.now(),
        finishedAt: Date.now(),
        durationMs: 0,
        logs: [],
      };
      results.push(skipped);
      events.onNodeFinish?.(skipped);
      continue;
    }

    // run the node
    events.onNodeStart?.(nodeId);
    const nodeLogs: LogEntry[] = [];
    const log = (level: LogEntry["level"], message: string) => {
      const entry = { ts: Date.now(), level, message, nodeId };
      nodeLogs.push(entry);
      pushLog(entry);
    };
    const nStart = Date.now();
    let result: NodeRunResult;

    try {
      const exec: ExecResult = await runNode({
        input,
        node,
        log,
        signal: opts.signal,
      });
      const finishedAt = Date.now();
      result = {
        nodeId,
        nodeType: node.data.type,
        label: node.data.label,
        status: "success",
        startedAt: nStart,
        finishedAt,
        durationMs: finishedAt - nStart,
        input,
        output: exec.output,
        takenBranch: exec.branch,
        logs: nodeLogs,
      };
      record.successCount++;

      // activate outgoing edges according to branch / pass semantics
      const outs = outEdges[nodeId] || [];
      const passed = exec.pass !== false;
      if (passed) {
        for (const e of outs) {
          const handle = e.sourceHandle || "out";
          const matchesBranch = exec.branch ? handle === exec.branch : true;
          if (matchesBranch) {
            edgeActive.add(e.id);
            edgeValue.set(e.id, exec.output);
          }
        }
      }
    } catch (err) {
      const finishedAt = Date.now();
      const message = (err as Error).message || String(err);
      log("error", message);
      result = {
        nodeId,
        nodeType: node.data.type,
        label: node.data.label,
        status: "error",
        startedAt: nStart,
        finishedAt,
        durationMs: finishedAt - nStart,
        input,
        logs: nodeLogs,
        error: message,
      };
      record.errorCount++;
      // do not activate downstream edges on error
    }

    results.push(result);
    events.onNodeFinish?.(result);
  }

  record.finishedAt = Date.now();
  record.durationMs = record.finishedAt - startedAt;
  record.status = record.errorCount > 0 ? "error" : "success";
  pushLog({
    ts: Date.now(),
    level: record.errorCount > 0 ? "warn" : "info",
    message: `Run finished · ${record.successCount} ok · ${record.errorCount} error · ${record.durationMs}ms`,
  });
  events.onDone?.(record);
  return record;
}
