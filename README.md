# FlowForge

> One-line pitch: **A drag-and-drop canvas that lets anyone build, run, and watch real automations — no code required.**

🧑‍💻 **Built for:** ALGOTHON'26 (AlgoXilla) · 04 Oct 2026
🏷️ **Challenge:** `ALG-AUTO-01` — Visual Workflow Automation
⚡ **Runs 100% offline** — zero paid API keys, zero external services required.

---

## 🎯 The Problem

Automation is everywhere, but building it is still gatekept by code. Tools like Zapier
or n8n are powerful yet either closed, cloud-locked, or intimidating for newcomers. The
`ALG-AUTO-01` challenge asks for a **visual workflow automation builder**: a way to wire
triggers → conditions → actions → transforms on a canvas and actually execute them.

The people who feel this pain — ops teams, founders, students, analysts — understand their
process perfectly but can't translate "when X happens, check Y, then do Z" into working
software without a developer.

## 💡 Our Solution

**FlowForge** is a node-based automation studio built in Next.js. You drag nodes onto an
infinite canvas, connect them, configure each with simple forms, and press **Run**. A custom
**topological execution engine** walks the graph node-by-node and lights each one up live with
its *real* input and output — so you watch your logic think.

The standout insight: a **single node registry** is the source of truth for *both* the visual
editor *and* the execution engine. Add a node definition once and it instantly appears in the
palette, renders a config form, validates, and runs. That's what lets FlowForge ship **21 node
types across 5 categories** with real branching, looping, merging, templating, custom JS, and
AI — all in one coherent system.

## ✨ Key Features

- **Visual node canvas** — drag, connect, pan, zoom, minimap, snap-to-grid. Powered by React Flow with fully custom node rendering per category.
- **Live execution engine** — a Kahn's-algorithm topological DAG runner with cycle detection, per-node status (idle → running → success/error/skipped), and real input/output capture streamed to a run console.
- **Real control flow** — `If/Else`, `Switch`, `Filter`, `Loop`, and `Merge` with true edge-activation branch routing (not just linear pipelines).
- **Template expression engine** — `{{dot.path}}` interpolation everywhere, plus a sandboxed `Code` node and a safe `Math` node.
- **AI nodes, offline-safe** — summarize, classify sentiment, extract keywords. Uses the OpenAI API *if* a key is present, otherwise falls back to a built-in deterministic mock so demos never break.
- **5 one-click templates + seedable demos** — welcome-email, API enrichment, AI sentiment router, order pipeline, scheduled health check.
- **Undo/redo, autosave, run history** — full editor history stack and persisted run records.
- **Webhook triggers** — every workflow gets a live `POST /api/webhook/[id]` endpoint that executes it with the request body.
- **Cinematic 3D landing** — an animated, scroll-driven marketing experience with a WebGL node-constellation hero (Three.js), aurora backgrounds, scroll reveals, count-up metrics, and an auto-playing live-engine demo. Degrades gracefully to a CSS fallback with no WebGL.
- **Command palette (⌘K)** — fuzzy search to navigate, create workflows, jump to analytics, or deep-link any of the node types straight onto a fresh canvas.
- **Analytics dashboard** — `/analytics` surfaces run success rate, average duration, node-category distribution (SVG donut), most-used nodes, a runs-over-time chart, and recent run history — all computed client-side from the local run store.
- **Workflow export / import** — one-click download of any workflow as portable `*.flowforge.json`, and drag-free re-import with schema validation.
- **Keyboard-first editing** — `Ctrl+S` save, `Ctrl+Enter` run, `Ctrl+Z/Ctrl+Shift+Z` undo/redo, `Ctrl+D` duplicate, `Del` delete, and a `?` shortcut-reference overlay.
- **Tactile motion system** — global Material-style click ripples + press feedback on every button, and an animated 3D loader (orbiting node-constellation) on every route transition. Both respect `prefers-reduced-motion` and fall back to pure CSS without WebGL.

## 🏗️ Architecture

```
             ┌──────────────── Browser (React) ───────────────┐
  Palette →  │  Zustand editor store  ↔  React Flow canvas     │
             │        ↕                        ↕               │
             │   Inspector forms          Run console (live)   │
             └──────────────────────┬──────────────────────────┘
                                     │  fetch
                     ┌───────────────▼────────────────┐
                     │       Next.js API routes        │
                     │  /api/run  /api/workflows  ...  │
                     └───────────────┬────────────────┘
                                     │
          ┌──────────────────────────▼──────────────────────────┐
          │  Execution engine (topological walk + branch sets)   │
          │  Node registry → executors → expression resolver     │
          └──────────────────────────┬──────────────────────────┘
                                     │
                         File-based JSON store (data/)
```

- **Node registry** (`src/lib/nodeRegistry.ts`) — declarative definitions driving editor + engine.
- **Engine** (`src/lib/engine.ts`) — topological order, edge activation, branch/filter/merge/loop handling, event callbacks for live UI.
- **Executors** (`src/lib/executors.ts`) — one pure function per node type.
- **Store** (`src/lib/server/store.ts`) — zero-dependency JSON persistence under `data/`.

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router), TypeScript
- **UI:** Tailwind CSS, custom dark theme, lucide-react icons
- **Motion & 3D:** Framer Motion, Three.js via @react-three/fiber, Lenis smooth-scroll
- **Canvas:** React Flow (reactflow v11)
- **State:** Zustand (with undo/redo history)
- **Persistence:** file-based JSON (no database needed)
- **AI:** OpenAI (optional) with a fully offline fallback

## 🚀 Setup & Usage

```bash
cd flowforge

# install
npm install

# (optional) seed demo workflows onto the dashboard
npm run seed

# run
npm run dev   # http://localhost:3000
```

Open http://localhost:3000, pick a template or hit **New workflow**, drag nodes from the
palette, connect them, then press **Run** and watch the graph execute.

### Environment variables

Everything is optional — FlowForge runs offline out of the box. Copy `.env.example` to
`.env.local` only if you want live AI.

| Key | Purpose |
|-----|---------|
| `OPENAI_API_KEY` | Enables live AI node completions. Omit to use the offline mock. |
| `OPENAI_MODEL` | Override the model (default `gpt-4o-mini`). |

## ☁️ Deploy to Vercel

FlowForge deploys to Vercel with zero config (`vercel.json` is included):

1. Push this repo to GitHub.
2. In Vercel, **Add New → Project → Import** your repo and set the **Root Directory** to `flowforge`.
3. Deploy. No environment variables are required (add `OPENAI_API_KEY` only for live AI).

> **Storage note:** Vercel's serverless filesystem is read-only except the OS temp dir.
> The storage layer detects serverless (`process.env.VERCEL`) and transparently persists to
> `<tmp>/flowforge-data`, seeded once from the bundled `seed_*` workflows. Create/save/run/delete
> all work for the live session; durable multi-user persistence would swap this layer for a DB.

## 🧪 How to test the core flow

1. On the dashboard, click **"AI Sentiment → Smart Routing"** template.
2. In the editor, press **Run** (top toolbar).
3. Watch nodes light up in order; the `If` node branches on sentiment and only the matching
   downstream path executes. Open the run console to inspect each node's input/output.
4. Edit the manual trigger's payload message to something negative and run again — the branch flips.

## 🔍 Disclosure (AI tools, APIs, datasets, third-party assets)

See [`DISCLOSURE.md`](./DISCLOSURE.md). Summary:
- **AI tools used:** an AI coding assistant was used to help scaffold and write code; all code was reviewed and is our responsibility.
- **External APIs:** OpenAI API — optional, only if a key is supplied. The demo templates use the public `jsonplaceholder.typicode.com` test API for HTTP examples.
- **Datasets:** none.
- **Notable libraries:** Next.js (MIT), React Flow (MIT), Zustand (MIT), Tailwind (MIT), lucide-react (ISC), nanoid (MIT), clsx (MIT), Framer Motion (MIT), Three.js (MIT), @react-three/fiber (MIT), Lenis (MIT).

## 🧭 What's next

- Real scheduler daemon for `schedule`/`interval` triggers.
- More integrations (Slack, databases, Google Sheets) as node packs.
- Collaborative multiplayer editing and workflow versioning.

## 📄 License

MIT
