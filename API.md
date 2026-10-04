# FlowForge — HTTP API reference

Every endpoint is a Next.js App Router route handler under `src/app/api`. All responses are
JSON. Routes that touch the store are marked `force-dynamic` so they always read fresh data.

Base URL (local): `http://localhost:3000`
Base URL (deployed): `https://flowforge-lac-eight.vercel.app`

---

## Workflows

### `GET /api/workflows`
List every saved workflow, newest first.

**Response**
```json
{ "workflows": [ { "id": "...", "name": "...", "nodes": [...], "edges": [...], "createdAt": "...", "updatedAt": "..." } ] }
```

### `POST /api/workflows`
Create or update a workflow (upsert by `id`).

**Body:** a full `Workflow` object (`id` and `name` required).

**Response:** `{ "workflow": <saved workflow with updatedAt> }`
**Errors:** `400` if `id` or `name` is missing.

```bash
curl -X POST http://localhost:3000/api/workflows \
  -H 'Content-Type: application/json' \
  -d '{"id":"wf_demo","name":"My Flow","nodes":[],"edges":[]}'
```

### `GET /api/workflows/[id]`
Fetch a single workflow.

**Response:** `{ "workflow": <Workflow> }` · **Errors:** `404` if not found.

### `DELETE /api/workflows/[id]`
Delete a workflow. **Response:** `{ "ok": true }`.

### `POST /api/workflows/from-template`
Instantiate a built-in template as a new saved workflow.

**Body:** `{ "templateId": "welcome-email" }`
**Response:** `{ "workflow": <new Workflow> }` · **Errors:** `400` if `templateId` missing/unknown.

---

## Templates

### `GET /api/templates`
List built-in starter templates (metadata only).

**Response**
```json
{ "templates": [ { "id": "...", "name": "...", "description": "...", "tags": ["..."] } ] }
```

---

## Execution

### `POST /api/run`
Execute a workflow **server-side** and return the full run record.

**Body (one of):**
- Inline graph: `{ "nodes": [...], "edges": [...], "trigger": "api", "input": {...}, "startNodeId": "..." }`
- By id: `{ "workflowId": "wf_demo", "trigger": "api", "input": {...} }`

Inline runs (or `workflowId: "inline"`) are **not** persisted; runs by a real `workflowId` are
saved to run history.

**Response:** `{ "run": <RunRecord> }`
**Errors:** `400` if no nodes, `404` if `workflowId` not found.

```bash
curl -X POST http://localhost:3000/api/run \
  -H 'Content-Type: application/json' \
  -d '{"workflowId":"wf_demo"}'
```

---

## Runs

### `GET /api/runs`
List run records, newest first (capped at 100). Optional `?workflowId=` filter.

**Response:** `{ "runs": [ <RunRecord>, ... ] }`

### `POST /api/runs`
Persist a run record produced by the **in-browser** live engine, so it appears in run history
and analytics. Inline/unsaved workflows are skipped.

**Body:** `{ "run": <RunRecord> }`
**Response:** `{ "ok": true, "persisted": true | false }` · **Errors:** `400` if `run` missing.

### `GET /api/runs/[id]`
Fetch a single run record (used by the `/runs/[id]` drill-down page).

**Response:** `{ "run": <RunRecord> }` · **Errors:** `404` if not found.

---

## Webhooks

### `POST /api/webhook/[id]` · `GET /api/webhook/[id]`
Public trigger endpoint for a saved workflow. On `POST`, the JSON body becomes the trigger
input; on `GET`, the query string is used. The workflow runs server-side and the run is
persisted.

**Response**
```json
{ "ok": true, "runId": "run_...", "status": "success", "durationMs": 42, "output": { } }
```
**Errors:** `404` if the workflow does not exist.

```bash
curl -X POST http://localhost:3000/api/webhook/wf_demo \
  -H 'Content-Type: application/json' \
  -d '{"email":"a@b.com","name":"Ada"}'
```

---

## Core types (abridged)

```ts
interface Workflow {
  id: string;
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  createdAt?: string;
  updatedAt?: string;
}

interface RunRecord {
  id: string;
  workflowId: string;
  workflowName: string;
  status: "success" | "error" | "running";
  startedAt: number;        // epoch ms
  finishedAt?: number;
  durationMs: number;
  trigger: string;          // "manual" | "api" | "webhook" | "rerun" | ...
  results: NodeRunResult[];
  logs: LogEntry[];
  nodeCount: number;
  successCount: number;
  errorCount: number;
}

interface NodeRunResult {
  nodeId: string;
  nodeType: string;
  label: string;
  status: "idle" | "waiting" | "running" | "success" | "error" | "skipped";
  input?: unknown;
  output?: unknown;
  takenBranch?: string;
  error?: string;
  startedAt: number;
  durationMs: number;
  logs: LogEntry[];
}

interface LogEntry {
  ts: number;
  level: "info" | "warn" | "error" | "debug";
  message: string;
}
```

See [`src/lib/types.ts`](./src/lib/types.ts) for the authoritative definitions.
