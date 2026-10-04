# Changelog

All notable changes to FlowForge. This project targets ALGOTHON'26 (`ALG-AUTO-01`).

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
