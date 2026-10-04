# FlowForge — Full feature inventory

An honest, exhaustive list of what's actually built. Nothing here is aspirational — every item
ships in the codebase and runs offline.

## 1. Visual editor

- Infinite, pannable, zoomable canvas (React Flow 11) with a dotted grid background.
- Fit-view, zoom controls, and a live **minimap** color-coded by node category.
- Custom node rendering per category (color, icon, labelled input/output handles).
- Animated smoothstep edges with arrowheads.
- Drag to connect nodes; invalid connections are rejected.
- Multi-handle branch nodes (If/Else True+False, Switch 3 cases + default, Loop "each item").

## 2. Node palette

- Live fuzzy search across label, description, and type.
- Collapsible category groups in a fixed order (trigger → action → logic → data → ai) with counts.
- **Drag-or-click** to add a node.
- **★ Favorites** — pin any node; persisted in `localStorage`; shown in a dedicated group.
- **Recent** — tracks the last 6 node types you added (from palette or canvas drop); persisted.
- Per-node star toggle on hover.

## 3. Inspector (config forms)

- Typed form fields generated from the node registry: `text`, `number`, `select`, `boolean`,
  `textarea`, `json`, `code`, `keyvalue`.
- Conditional fields via `showIf` (e.g. the "compare to" field only shows for certain operators).
- Inline help text and placeholders.
- Live two-way binding to the editor store.

## 4. Live validation

- Floating validation badge on the canvas: green when valid, amber for warnings, red for errors.
- Expands into a panel listing every issue (empty graph, missing trigger, orphan nodes, cycles).
- Click an issue to select & focus the offending node.
- The Run action is blocked while error-level issues exist, with a toast explaining why.

## 5. Editing & history

- Undo / redo with a 50-step bounded history stack.
- Duplicate selected node (`Ctrl+D`).
- Delete selected node (`Delete` / `Backspace`).
- Dirty-state indicator; save with `Ctrl+S`.
- Import a `*.flowforge.json` file (schema-validated); export the current workflow to one.

## 6. Execution engine

- From-scratch topological DAG runner (Kahn's algorithm) — no third-party workflow runtime.
- Cycle detection; refuses to run invalid graphs.
- True **edge-activation** branch routing: untaken branches are skipped, not merely ignored.
- Filter short-circuiting; Loop iteration; multi-input Merge (object-merge or array).
- Error containment — one failing node won't crash the run; downstream is skipped.
- Identical engine runs both **in-browser (live preview)** and **server-side (API/webhook)**.

## 7. Run console

- Dockable panel with three tabs:
  - **Timeline** — every node with live status and per-node timing.
  - **Logs** — streamed, color-coded by level (info/warn/error/debug), timestamped.
  - **Data** — inspect any node's captured input/output as collapsible, syntax-colored JSON.
- Clear-logs button; running indicator; last-run summary (ok/err counts + duration).
- "Detail" shortcut to the full run drill-down page.

## 8. Run history (`/runs`)

- Searchable, filterable list of every execution.
- Filter by status (all / success / error) and by workflow.
- Per-row success bar, duration, trigger, relative time.
- Summary counts (successes / errors) in the header.

## 9. Run drill-down (`/runs/[id]`)

- Stat strip: status, duration, nodes-ok ratio, trigger.
- **Gantt-style execution timeline** — each node drawn as a bar positioned by start time and
  sized by duration, color-coded by status; skipped nodes marked.
- **Per-node inspector** — click any node to see its exact input, output, branch taken, error,
  and node-level logs.
- Full run **log stream**.
- One-click **Re-run** (server-side) that navigates to the fresh run.
- "Open editor" shortcut.

## 10. Analytics (`/analytics`)

- Total runs, success rate, average duration, total nodes executed (animated count-ups).
- SVG **donut** of node-category distribution.
- Most-used-nodes bar chart (top 10).
- Recent-runs list.
- Everything computed client-side from the run store — no analytics service.

## 11. Templates

- Built-in starter workflows, instantiable with one click from the workspace or
  `POST /api/workflows/from-template`.
- Each ships as seedable JSON (`npm run seed`).

## 12. Webhooks

- Every saved workflow exposes `POST/GET /api/webhook/[id]`.
- The request body (POST) or query string (GET) becomes the trigger input.
- Runs server-side and persists the run; returns runId, status, duration, and final output.
- "Copy webhook URL" action in the editor toolbar.

## 13. Command palette (⌘K / Ctrl+K)

- Fuzzy subsequence search with keyboard navigation and grouped results.
- Navigate home, open analytics, open **run history**, browse templates, explore the node library.
- Create a new workflow.
- Insert **any** node type — deep-links to `/editor?add=<type>` on a fresh canvas.
- Escape to close.

## 14. Landing experience

- Scroll-driven 3D hero: a WebGL node-constellation (Three.js via @react-three/fiber).
- Aurora/gradient backgrounds, scroll-reveal sections, count-up metrics.
- Auto-playing live-engine demo embedded in the page.
- Feature, node-library, architecture, and workspace sections with anchor nav.
- Tilt-on-hover cards.

## 15. Polish & accessibility

- Global click feedback (ripple + press-scale) via one delegated listener.
- Bespoke 3D loading animations on every route transition.
- Graceful 3D degradation: SSR-off dynamic import + error boundary + CSS fallback.
- `prefers-reduced-motion` honored (smooth-scroll and heavy motion disabled).
- Dark, token-based design system consistent across every surface.
- Toast notifications for all key actions.

## 16. Offline-first guarantees

- No database, no required API keys, no external services.
- AI nodes fall back to a deterministic offline implementation.
- Serverless-safe persistence (temp-dir fallback + seed) so the hosted demo works out of the box.

---

### Node library at a glance (20 nodes · 5 categories)

- **Triggers (4):** Manual, Webhook, Schedule, Interval.
- **Actions (5):** HTTP Request, Send Email, Log, Delay, Write File.
- **Logic (5):** If/Else, Switch, Filter, Merge, Loop/Iterator.
- **Data (5):** Set Fields, JSON Transform, Code (JS), Template, Math.
- **AI (1):** AI Generate (smart / sentiment / keywords).

Full per-node details are in the [README node table](./README.md#-the-complete-node-library-20-nodes--5-categories).
