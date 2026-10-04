# FlowForge — Architecture

This document explains how FlowForge works under the hood: the single-registry design, the
execution engine, branch routing, the expression VM, the state model, and persistence.

---

## 1. The single source of truth

Everything orbits one file: [`src/lib/nodeRegistry.ts`](./src/lib/nodeRegistry.ts). It exports
an array of `NodeTypeDef` objects — one per node type. Each definition is fully declarative:

```ts
interface NodeTypeDef {
  type: string;              // engine dispatch key, e.g. "logic.if"
  category: NodeCategory;    // trigger | action | logic | data | ai
  label: string;
  description: string;
  icon: string;              // lucide icon name
  inputs: number;            // input handle count (triggers = 0)
  outputs: { id: string; label: string }[];  // output handles
  fields: FieldSchema[];     // the Inspector form
  defaults: Record<string, unknown>;
}
```

From this one array we derive:

| Consumer | What it reads |
| --- | --- |
| **NodePalette** | label, description, icon, category → searchable/draggable list |
| **Inspector** | `fields` → a typed config form (text, number, select, boolean, textarea, json, code, keyvalue) with conditional `showIf` |
| **Canvas / FlowNode** | icon, category color, output handles |
| **graph.ts** | `inputs`/triggers → validation |
| **CommandPalette** | label/description → deep-linkable node insertion |
| **engine/executors** | `type` → execution dispatch |

Adding a node = append one object here + add one executor. No other file needs editing for the
UI, validation, palette, or command palette to pick it up.

---

## 2. Data model

```ts
FlowNode  = { id, type: "flowNode", position, data: { type, label, config } }
FlowEdge  = { id, source, target, sourceHandle?, targetHandle? }
Workflow  = { id, name, nodes, edges, createdAt?, updatedAt? }
```

`data.type` is the registry key (e.g. `logic.if`). `sourceHandle` identifies which output a
branch node fired from (`"true"`, `"false"`, `"case1"`, `"each"`, or the default `"out"`).

---

## 3. Graph analysis (`graph.ts`)

`analyzeGraph(nodes, edges)` returns a `GraphAnalysis`:

- **adjacency / incoming** maps,
- **triggers** (nodes with `inputs === 0`),
- **hasCycle** — detected with **Kahn's algorithm**: repeatedly remove zero-in-degree nodes; if
  any remain, there's a cycle,
- **order** — a topological ordering,
- **issues** — error/warning list (empty graph, no trigger, orphan nodes, cycle, …),
- **isValid** — true when there are no error-level issues.

The editor's **ValidationPanel** renders these issues live and lets you click one to select the
offending node. The engine refuses to run an invalid graph.

---

## 4. The execution engine (`engine.ts`)

`executeWorkflow(nodes, edges, meta, opts, events)` is a from-scratch DAG runner.

### Edge-value & edge-active model

Two structures drive the walk:

- `edgeValue: Map<edgeId, unknown>` — the data delivered along each edge.
- `edgeActive: Set<edgeId>` — which edges are "live".

### The walk

1. **Triggers** run first (when `startSet` is empty or includes them), emitting their payload
   onto all outgoing edges and marking those edges active.
2. Nodes are visited in topological order. A node runs when its incoming active edges have all
   delivered values. Its input is:
   - the single active input (passed through), or
   - a shallow merge of multiple active object inputs, or
   - for `logic.merge`, the **array** of active inputs.
3. The node's executor returns an `ExecResult { output, branch?, pass?, items? }`.

### Branch routing

- **`branch`** (If/Else, Switch): only the edge whose `sourceHandle` matches `branch` is
  activated. Edges on other handles stay inactive, so their entire downstream subtree is marked
  **skipped**.
- **`pass`** (Filter): when `false`, no downstream edge is activated → downstream skipped.
- **`items`** (Loop): emits each array element along the `each` edge.

### Error containment

If an executor throws, the node is marked `error`, the error is logged, and its downstream edges
are **not** activated. The rest of the graph continues where it can; the run ends with
`status: "error"` but never crashes.

### Events

The engine emits:

```ts
onNodeStart(nodeId)
onNodeFinish(NodeRunResult)   // includes input, output, branch, logs, timing
onLog(LogEntry)
onDone(RunRecord)
```

- In the browser, `runLive` wires these to the Zustand store so nodes animate and the console
  streams in real time.
- On the server (`/api/run`, `/api/webhook/[id]`), the same events are aggregated into a
  persisted `RunRecord`.

**One engine, two hosts** — identical semantics whether a run is live-previewed in the browser
or executed headless via the API.

---

## 5. The executors (`executors.ts`)

A map `executors: Record<string, Executor>` keyed by node `type`. Each executor receives an
`ExecContext { input, node, log, signal? }` and returns an `ExecResult`. Highlights:

- `action.http` performs a **real** `fetch` with templated URL/method/headers/body and parses
  the response.
- `action.writeFile` writes under `/data/outputs` server-side (safe no-op preview in browser).
- `data.code` runs user JavaScript in a constrained function scope with only `input` available.
- `ai.generate` calls OpenAI when `OPENAI_API_KEY` is present, else a deterministic offline
  implementation (word-frequency keywords, sentiment lexicon, extractive summary).

---

## 6. The expression VM (`expression.ts`)

`{{ ... }}` tokens are resolved against the node's incoming data:

- dot-paths and array indexes: `{{data.user.email}}`, `{{items.0.id}}`,
- `{{json}}` → the whole payload,
- a comparison layer for conditions: `eq`, `neq`, `gt`, `lt`, `gte`, `lte`, `contains`,
  `truthy`, `empty`.

Resolution is pure and side-effect-free; unknown paths resolve to empty rather than throwing.

---

## 7. Editor state (`store/editorStore.ts`)

A Zustand store holds `nodes`, `edges`, selection, run status, live logs, and last run. Key
design points:

- **History stack** — structural edits push onto a bounded (50-entry) undo/redo stack.
- **Serialization** — `getWorkflow()` emits React Flow nodes as `{ type: "flowNode", … }`.
- **Live run plumbing** — `setNodeStatus`, `applyRunResult`, `appendLog` (bounded to 500),
  `setLastRun`, `clearLogs`.
- **Deep-linking** — `addNodeOfType(type, pos)` powers both the palette and `/editor?add=<type>`.
- **Clipboard & bulk ops** — `copyNode` / `cutNode` / `pasteClipboard` use an in-session clipboard
  (pasted nodes get fresh ids + offset); `applyLayout` and `restoreGraph` are history-aware so
  every bulk change is undoable.

---

## 7a. Auto-layout (`lib/layout.ts`)

`autoLayoutNodes(nodes, edges)` is a from-scratch layered ("Sugiyama-lite") DAG layout:

1. **Layering** — each node's layer is its longest-path depth from any root (computed in one pass
   over the topological order).
2. **Ordering** — within each layer, nodes are sorted by the **barycenter** (mean index) of their
   parents in the previous layer to reduce edge crossings.
3. **Placement** — layers flow left → right; each column is vertically centered.

Cyclic graphs (no valid topo order) fall back to a balanced grid. The result is a new node array
with updated `position`; edges are untouched. Triggered by `Ctrl+L`, the toolbar, or the palette.

---

## 7b. Version snapshots (`lib/snapshots.ts`)

Local, offline version history stored per-workflow in `localStorage` (`flowforge:snapshots:<id>`,
max 25). `saveSnapshot` captures a deep copy of the current `Workflow`; `restoreGraph` loads one
back into the store (undoable). The `SnapshotPanel` drawer lists, restores, and deletes them, and
listens for a `flowforge:snapshots-updated` event to stay in sync. Complements — doesn't replace —
the server-side file save.

---

## 7c. Partial execution ("Run from here")

`executeWorkflow` accepts `opts.fromNodeId`. When set, it computes the **downstream-reachable
set** via DFS from that node, seeds the chosen node directly with `initialInput` (as if it were a
trigger), and marks every node outside the reachable set `skipped`. Status counting is unaffected,
so partial runs report accurately. Invoked from the Inspector's "Run from here" action.

---

## 8. Persistence (`lib/server/store.ts`)

File-based JSON under `data/workflows` and `data/runs`.

- **Locally / `next start`:** writes to `<project>/data` so your work survives restarts.
- **Serverless (Vercel):** the project dir is read-only, so the store transparently falls back
  to `<os.tmpdir()>/flowforge-data` and **seeds it once** from the bundled demo data. Create /
  save / run / delete all work for the session (persistence is per-session there).

This fallback is why the deployed demo is fully functional with zero infrastructure.

---

## 9. Rendering & performance notes

- **No barrel imports** of `lucide-react`; an explicit `Icon` registry keeps the bundle and dev
  compile small. `next.config.mjs` also uses `optimizePackageImports`.
- **3D is isolated** — all Three.js lives inside a single `dynamic(async () => …, { ssr: false })`
  import, wrapped in a React error boundary with a CSS fallback, so WebGL issues never break the
  page or SSR.
- **Smooth scroll** via Lenis on `window.__lenis`, disabled under `prefers-reduced-motion`.
- **Theming** — neutral design tokens (`bg`/`line`/`ink`) resolve through CSS variables set on
  `<html data-theme>`. `lib/theme.ts` persists the choice in `localStorage` and a pre-paint boot
  script (`THEME_BOOT_SCRIPT`, injected in `layout.tsx`) applies it before first render to avoid
  any flash. The React Flow canvas, controls, minimap, and dot grid all read the same variables.
