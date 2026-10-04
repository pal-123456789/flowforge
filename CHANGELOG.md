# Changelog

All notable changes to FlowForge. This project targets ALGOTHON'26 (`ALG-AUTO-01`).

## [1.5.0] — Landing polish & correct links

### Added
- A subtle sweeping **sheen** animation on primary call-to-action buttons (hero, nav, CTA).
- A **GitHub** icon-link in the landing navigation and a **Source** button in the final CTA.

### Fixed
- All landing GitHub links now point to the real repository
  (`github.com/pal-123456789/flowforge`) and open in a new tab, instead of the generic
  `github.com` homepage.

## [1.4.0] — More ready-to-run templates

### Added
- Three new one-click starter templates (now **9** total), chosen to showcase nodes the earlier
  templates didn't exercise:
  - **Batch Processor (Loop)** — iterate an array with the Loop node, enrich each item in custom
    JS, and log every processed row.
  - **Parallel Fetch → Merge** — fan out to two public APIs in parallel and recombine both
    responses into one object with the Merge node.
  - **AI Summary Digest** — fetch content, summarize it with the AI node, format a digest via a
    Template, and email it.

## [1.3.0] — Pro editor: layout, clipboard & versioning

### Added
- **Auto-layout ("Tidy graph")** — a from-scratch layered DAG layout (longest-path layering +
  barycenter crossing reduction) arranges the whole graph left → right in one click (`Ctrl+L`,
  toolbar button, or command palette). Falls back to a balanced grid for cyclic graphs.
- **Copy / cut / paste nodes** — `Ctrl+C` / `Ctrl+X` / `Ctrl+V` with an in-session clipboard;
  pasted nodes get fresh ids and a slight offset.
- **Version snapshots** — a slide-in drawer to capture named, local checkpoints of a workflow and
  restore any of them instantly (with one-click undo). Stored per-workflow in `localStorage`
  (max 25), fully offline. Open from the toolbar or command palette.

### Changed
- Editor store gained `applyLayout`, `copyNode`, `cutNode`, `pasteClipboard`, `hasClipboard`, and
  `restoreGraph` actions — all history-aware so every bulk change is undoable.
- Shortcuts overlay and docs updated with the new hotkeys.

## [1.2.0] — Flow ergonomics & themeable UI

### Added
- **Run from here** — execute a single node and everything downstream of it, straight from the
  inspector. The engine computes the downstream reachable set, seeds the chosen node directly,
  and reports every upstream node as skipped. Great for iterating on the tail of a long graph.
- **Canvas quick-add** — double-click any empty spot on the canvas for a fuzzy, keyboard-driven
  node picker (type to filter all 20 nodes, ↑/↓ to navigate, Enter to drop at the cursor).
- **Light & dark themes** — a token-based theme system (CSS variables on `<html data-theme>`)
  with a toggle in both the editor toolbar and the command palette. The choice persists in
  `localStorage` and is applied before first paint to avoid any flash.
- **Workflow duplicate & rename** — hover any workspace card to duplicate it (deep-copies nodes,
  edges, and config into a new workflow) or rename it inline.
- **First-run onboarding tour** — a five-step guided walkthrough shown once per browser
  (`localStorage`-gated), re-openable via the `flowforge:tour` event.

### Changed
- Neutral design tokens (`bg`/`line`/`ink`) now resolve through CSS variables so every surface —
  including the React Flow canvas, controls, and minimap — adapts to the active theme.
- The editor **Run** button and `Ctrl+Enter` now route through a single run path that also powers
  partial "Run from here" executions.

## [1.1.0] — Run observability & deeper editor

### Added
- **Run history** page (`/runs`) — searchable, status/workflow-filterable list of every execution.
- **Run drill-down** page (`/runs/[id]`) — Gantt-style execution timeline, per-node input/output
  inspector, branch-taken display, full log stream, and one-click server-side re-run.
- `GET /api/runs/[id]` single-run endpoint and `POST /api/runs` to persist in-browser runs so
  live editor runs now appear in history and analytics.
- **Live validation panel** in the editor — surfaces graph errors/warnings and jumps to the
  offending node on click.
- **Node palette favorites** (★, persisted in `localStorage`) and a **Recent** nodes section.
- Command-palette entry for **Run History**.
- Deep documentation suite: `FEATURES.md`, `ARCHITECTURE.md`, `API.md`, this `CHANGELOG.md`,
  and a fully rewritten `README.md`.

### Changed
- Workspace "recent runs" rows and the run console now link straight to the run drill-down.
- Canvas drops and palette adds both record recently-used nodes.

## [1.0.0] — Hackathon baseline

### Added
- Visual node editor on an infinite React Flow canvas with custom per-category rendering.
- From-scratch topological DAG execution engine with cycle detection, edge-activation branch
  routing, filter/merge/loop, and error containment.
- Single node registry (20 node types across trigger / action / logic / data / ai) driving the
  palette, Inspector forms, validation, command palette, and engine.
- `{{expression}}` template language with comparison operators; sandboxed Code node.
- Offline-safe AI node (OpenAI when keyed, deterministic mock otherwise).
- Run console (timeline / logs / data), analytics dashboard, templates, import/export.
- Webhook trigger endpoint per workflow.
- Cinematic 3D landing page with graceful WebGL degradation, 3D loaders, command palette,
  global click feedback, and a dark token-based design system.
- File-based persistence with serverless temp-dir fallback + seeding.
