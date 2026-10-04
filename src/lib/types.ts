/**
 * FlowForge core type system.
 * These types are shared across the editor, the execution engine, and the API.
 */

export type NodeCategory = "trigger" | "action" | "logic" | "data" | "ai";

/** A field in a node's configuration form. */
export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "boolean"
  | "code"
  | "json"
  | "keyvalue";

export interface SelectOption {
  label: string;
  value: string;
}

export interface FieldSchema {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  help?: string;
  default?: unknown;
  options?: SelectOption[];
  /** language hint for code fields */
  language?: "javascript" | "json";
  /** show this field only when another field has a given value */
  showIf?: { key: string; equals: unknown };
  rows?: number;
}

/** Definition of a node *type* (the blueprint, not an instance). */
export interface NodeTypeDef {
  type: string;
  category: NodeCategory;
  label: string;
  description: string;
  /** lucide-react icon name */
  icon: string;
  /** number of input handles (triggers = 0) */
  inputs: number;
  /** labelled output handles. Most nodes have one "out"; branch nodes have multiple. */
  outputs: { id: string; label: string }[];
  fields: FieldSchema[];
  /** default config applied on drop */
  defaults: Record<string, unknown>;
}

/** A node instance on the canvas (persisted). */
export interface FlowNodeData {
  type: string;
  label: string;
  config: Record<string, unknown>;
}

export interface FlowNode {
  id: string;
  type: "flowNode";
  position: { x: number; y: number };
  data: FlowNodeData;
}

export interface FlowEdge {
  id: string;
  source: string;
  sourceHandle?: string | null;
  target: string;
  targetHandle?: string | null;
  animated?: boolean;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

/* ----------------------------- Execution types ---------------------------- */

export type NodeRunStatus =
  | "idle"
  | "waiting"
  | "running"
  | "success"
  | "error"
  | "skipped";

export interface NodeRunResult {
  nodeId: string;
  nodeType: string;
  label: string;
  status: NodeRunStatus;
  startedAt: number;
  finishedAt?: number;
  durationMs?: number;
  input?: unknown;
  output?: unknown;
  /** for branch nodes: which output handle was taken */
  takenBranch?: string;
  logs: LogEntry[];
  error?: string;
}

export interface LogEntry {
  ts: number;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  nodeId?: string;
}

export type RunStatus = "running" | "success" | "error" | "idle";

export interface RunRecord {
  id: string;
  workflowId: string;
  workflowName: string;
  status: RunStatus;
  startedAt: number;
  finishedAt?: number;
  durationMs?: number;
  trigger: string;
  results: NodeRunResult[];
  logs: LogEntry[];
  nodeCount: number;
  successCount: number;
  errorCount: number;
}
