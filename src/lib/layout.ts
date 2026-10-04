import type { FlowNode, FlowEdge } from "./types";
import { analyzeGraph } from "./graph";

export interface LayoutOptions {
  /** horizontal gap between layers (left→right flow) */
  layerGap?: number;
  /** vertical gap between sibling nodes in the same layer */
  nodeGap?: number;
  /** canvas origin */
  originX?: number;
  originY?: number;
}

/**
 * Deterministic layered ("Sugiyama-lite") auto-layout for the workflow DAG.
 *
 * Strategy:
 *  1. Assign each node a layer = its longest-path depth from any root.
 *  2. Order nodes within a layer by the average layer-position of their
 *     parents (barycenter heuristic) to reduce edge crossings.
 *  3. Lay layers out left→right, centering each column vertically.
 *
 * Returns a new array of nodes with updated `position`; edges are untouched.
 * Falls back to a tidy grid when the graph has cycles (no valid topo order).
 */
export function autoLayoutNodes(
  nodes: FlowNode[],
  edges: FlowEdge[],
  opts: LayoutOptions = {}
): FlowNode[] {
  const {
    layerGap = 300,
    nodeGap = 120,
    originX = 80,
    originY = 80,
  } = opts;

  if (nodes.length === 0) return nodes;

  const { adjacency, incoming, order, hasCycle } = analyzeGraph(nodes, edges);
  const byId = new Map(nodes.map((n) => [n.id, n]));

  // ---- cycle fallback: simple balanced grid ----
  if (hasCycle || order.length !== nodes.length) {
    const cols = Math.ceil(Math.sqrt(nodes.length));
    return nodes.map((n, i) => ({
      ...n,
      position: {
        x: originX + (i % cols) * layerGap,
        y: originY + Math.floor(i / cols) * nodeGap,
      },
    }));
  }

  // ---- 1. longest-path layering over the topological order ----
  const layer: Record<string, number> = {};
  for (const id of order) layer[id] = 0;
  for (const id of order) {
    for (const e of adjacency[id] || []) {
      layer[e.target] = Math.max(layer[e.target], layer[id] + 1);
    }
  }

  // group node ids by layer
  const layers: string[][] = [];
  for (const id of order) {
    const l = layer[id];
    (layers[l] ??= []).push(id);
  }

  // ---- 2. barycenter ordering within each layer ----
  // seed: keep roots in their topo order, then reorder deeper layers by the
  // mean index of their parents in the previous layer.
  for (let l = 1; l < layers.length; l++) {
    const prev = layers[l - 1];
    const prevIndex = new Map(prev.map((id, i) => [id, i]));
    const score = (id: string) => {
      const parents = (incoming[id] || [])
        .map((e) => prevIndex.get(e.source))
        .filter((v): v is number => v !== undefined);
      if (!parents.length) return Number.MAX_SAFE_INTEGER; // dangle at the end
      return parents.reduce((a, b) => a + b, 0) / parents.length;
    };
    layers[l] = [...layers[l]].sort((a, b) => score(a) - score(b));
  }

  // ---- 3. assign coordinates, vertically centering the tallest column ----
  const maxCount = Math.max(...layers.map((l) => l.length));
  const totalHeight = (maxCount - 1) * nodeGap;

  const result: FlowNode[] = [];
  layers.forEach((ids, l) => {
    const colHeight = (ids.length - 1) * nodeGap;
    const colTop = originY + (totalHeight - colHeight) / 2;
    ids.forEach((id, i) => {
      const node = byId.get(id);
      if (!node) return;
      result.push({
        ...node,
        position: {
          x: originX + l * layerGap,
          y: colTop + i * nodeGap,
        },
      });
    });
  });

  // keep any nodes the layout somehow missed (defensive)
  for (const n of nodes) {
    if (!result.find((r) => r.id === n.id)) result.push(n);
  }
  return result;
}
