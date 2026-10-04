"use client";

import { create } from "zustand";
import {
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Connection,
  addEdge,
} from "reactflow";
import type {
  FlowNode,
  FlowEdge,
  Workflow,
  NodeRunResult,
  NodeRunStatus,
  RunRecord,
  LogEntry,
} from "@/lib/types";
import { makeNode } from "@/lib/templates";
import { autoLayoutNodes } from "@/lib/layout";
import { nanoid } from "nanoid";

type RFNode = FlowNode & { selected?: boolean };

/** In-memory clipboard for copy/cut/paste of a single node (survives across
 *  editor instances within the same tab session). */
let nodeClipboard: FlowNode | null = null;

interface HistoryState {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

interface EditorState {
  // workflow meta
  workflowId: string;
  name: string;
  description: string;
  tags: string[];
  dirty: boolean;
  savedAt: string | null;

  // graph
  nodes: RFNode[];
  edges: FlowEdge[];
  selectedNodeId: string | null;

  // execution
  running: boolean;
  nodeStatus: Record<string, NodeRunStatus>;
  lastRun: RunRecord | null;
  liveLogs: LogEntry[];

  // history
  past: HistoryState[];
  future: HistoryState[];

  // actions
  loadWorkflow: (wf: Workflow) => void;
  newWorkflow: () => void;
  setName: (name: string) => void;
  setDescription: (d: string) => void;

  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (c: Connection) => void;

  addNodeOfType: (type: string, position: { x: number; y: number }) => void;
  updateNodeConfig: (id: string, config: Record<string, unknown>) => void;
  updateNodeLabel: (id: string, label: string) => void;
  deleteNode: (id: string) => void;
  duplicateNode: (id: string) => void;
  selectNode: (id: string | null) => void;

  // bulk / layout / clipboard
  applyLayout: () => void;
  copyNode: (id: string) => boolean;
  cutNode: (id: string) => boolean;
  pasteClipboard: () => void;
  hasClipboard: () => boolean;
  restoreGraph: (nodes: FlowNode[], edges: FlowEdge[]) => void;

  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  markSaved: () => void;

  // execution setters
  setRunning: (b: boolean) => void;
  setNodeStatus: (id: string, status: NodeRunStatus) => void;
  resetStatuses: () => void;
  applyRunResult: (r: NodeRunResult) => void;
  appendLog: (l: LogEntry) => void;
  clearLogs: () => void;
  setLastRun: (r: RunRecord) => void;

  getWorkflow: () => Workflow;
}

const MAX_HISTORY = 50;

export const useEditorStore = create<EditorState>((set, get) => ({
  workflowId: "",
  name: "Untitled workflow",
  description: "",
  tags: [],
  dirty: false,
  savedAt: null,

  nodes: [],
  edges: [],
  selectedNodeId: null,

  running: false,
  nodeStatus: {},
  lastRun: null,
  liveLogs: [],

  past: [],
  future: [],

  loadWorkflow: (wf) =>
    set({
      workflowId: wf.id,
      name: wf.name,
      description: wf.description || "",
      tags: wf.tags || [],
      nodes: wf.nodes as RFNode[],
      edges: wf.edges,
      selectedNodeId: null,
      dirty: false,
      savedAt: wf.updatedAt,
      past: [],
      future: [],
      nodeStatus: {},
      lastRun: null,
      liveLogs: [],
    }),

  newWorkflow: () => {
    const trigger = makeNode("trigger.manual", { x: 160, y: 220 });
    set({
      workflowId: `wf_${nanoid(8)}`,
      name: "Untitled workflow",
      description: "",
      tags: [],
      nodes: [trigger as RFNode],
      edges: [],
      selectedNodeId: null,
      dirty: true,
      savedAt: null,
      past: [],
      future: [],
      nodeStatus: {},
      lastRun: null,
      liveLogs: [],
    });
  },

  setName: (name) => set({ name, dirty: true }),
  setDescription: (description) => set({ description, dirty: true }),

  onNodesChange: (changes) => {
    const structural = changes.some(
      (c) => c.type === "remove" || c.type === "add"
    );
    if (structural) get().pushHistory();
    set({
      nodes: applyNodeChanges(changes, get().nodes as any) as RFNode[],
      dirty: true,
    });
  },

  onEdgesChange: (changes) => {
    const structural = changes.some((c) => c.type === "remove");
    if (structural) get().pushHistory();
    set({
      edges: applyEdgeChanges(changes, get().edges as any) as FlowEdge[],
      dirty: true,
    });
  },

  onConnect: (c) => {
    get().pushHistory();
    set({
      edges: addEdge(
        { ...c, id: `e_${nanoid(6)}`, animated: true },
        get().edges as any
      ) as FlowEdge[],
      dirty: true,
    });
  },

  addNodeOfType: (type, position) => {
    get().pushHistory();
    const node = makeNode(type, position) as RFNode;
    set({
      nodes: [...get().nodes, node],
      selectedNodeId: node.id,
      dirty: true,
    });
  },

  updateNodeConfig: (id, config) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id
          ? { ...n, data: { ...n.data, config: { ...n.data.config, ...config } } }
          : n
      ),
      dirty: true,
    });
  },

  updateNodeLabel: (id, label) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, label } } : n
      ),
      dirty: true,
    });
  },

  deleteNode: (id) => {
    get().pushHistory();
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
      dirty: true,
    });
  },

  duplicateNode: (id) => {
    const node = get().nodes.find((n) => n.id === id);
    if (!node) return;
    get().pushHistory();
    const copy: RFNode = {
      ...node,
      id: `n_${nanoid(6)}`,
      position: { x: node.position.x + 40, y: node.position.y + 40 },
      selected: false,
      data: { ...node.data, config: { ...node.data.config } },
    };
    set({ nodes: [...get().nodes, copy], selectedNodeId: copy.id, dirty: true });
  },

  selectNode: (id) => set({ selectedNodeId: id }),

  applyLayout: () => {
    get().pushHistory();
    const laid = autoLayoutNodes(
      get().nodes as FlowNode[],
      get().edges as FlowEdge[]
    );
    // preserve selection flag
    const selFlags = new Map(get().nodes.map((n) => [n.id, n.selected]));
    set({
      nodes: laid.map((n) => ({
        ...(n as RFNode),
        selected: selFlags.get(n.id),
      })),
      dirty: true,
    });
  },

  copyNode: (id) => {
    const node = get().nodes.find((n) => n.id === id);
    if (!node) return false;
    nodeClipboard = JSON.parse(
      JSON.stringify({
        id: node.id,
        type: "flowNode",
        position: node.position,
        data: node.data,
      })
    );
    return true;
  },

  cutNode: (id) => {
    const ok = get().copyNode(id);
    if (ok) get().deleteNode(id);
    return ok;
  },

  hasClipboard: () => nodeClipboard !== null,

  pasteClipboard: () => {
    if (!nodeClipboard) return;
    get().pushHistory();
    const copy: RFNode = {
      ...(JSON.parse(JSON.stringify(nodeClipboard)) as FlowNode),
      id: `n_${nanoid(6)}`,
      position: {
        x: nodeClipboard.position.x + 48,
        y: nodeClipboard.position.y + 48,
      },
      selected: false,
    };
    set({
      nodes: [...get().nodes, copy],
      selectedNodeId: copy.id,
      dirty: true,
    });
  },

  restoreGraph: (nodes, edges) => {
    get().pushHistory();
    set({
      nodes: JSON.parse(JSON.stringify(nodes)) as RFNode[],
      edges: JSON.parse(JSON.stringify(edges)) as FlowEdge[],
      selectedNodeId: null,
      dirty: true,
      nodeStatus: {},
    });
  },

  pushHistory: () => {
    const { nodes, edges, past } = get();
    const snapshot: HistoryState = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };
    set({
      past: [...past.slice(-MAX_HISTORY + 1), snapshot],
      future: [],
    });
  },

  undo: () => {
    const { past, future, nodes, edges } = get();
    if (!past.length) return;
    const prev = past[past.length - 1];
    set({
      nodes: prev.nodes as RFNode[],
      edges: prev.edges,
      past: past.slice(0, -1),
      future: [{ nodes, edges } as HistoryState, ...future].slice(0, MAX_HISTORY),
      dirty: true,
    });
  },

  redo: () => {
    const { past, future, nodes, edges } = get();
    if (!future.length) return;
    const next = future[0];
    set({
      nodes: next.nodes as RFNode[],
      edges: next.edges,
      past: [...past, { nodes, edges } as HistoryState],
      future: future.slice(1),
      dirty: true,
    });
  },

  markSaved: () => set({ dirty: false, savedAt: new Date().toISOString() }),

  setRunning: (b) => set({ running: b }),
  setNodeStatus: (id, status) =>
    set({ nodeStatus: { ...get().nodeStatus, [id]: status } }),
  resetStatuses: () => set({ nodeStatus: {}, liveLogs: [] }),
  applyRunResult: (r) =>
    set({ nodeStatus: { ...get().nodeStatus, [r.nodeId]: r.status } }),
  appendLog: (l) => set({ liveLogs: [...get().liveLogs, l].slice(-500) }),
  clearLogs: () => set({ liveLogs: [] }),
  setLastRun: (r) => set({ lastRun: r }),

  getWorkflow: () => {
    const s = get();
    const now = new Date().toISOString();
    return {
      id: s.workflowId || `wf_${nanoid(8)}`,
      name: s.name,
      description: s.description,
      tags: s.tags,
      nodes: s.nodes.map((n) => ({
        id: n.id,
        type: "flowNode",
        position: n.position,
        data: n.data,
      })) as FlowNode[],
      edges: s.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        animated: e.animated,
      })),
      createdAt: s.savedAt || now,
      updatedAt: now,
    };
  },
}));
