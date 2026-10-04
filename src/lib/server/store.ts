import { promises as fs } from "fs";
import path from "path";
import os from "os";
import type { Workflow, RunRecord } from "../types";

/*
 * Storage location.
 *
 * Locally (and in `next start`) we persist to <project>/data so your work
 * survives restarts. On a read-only serverless host (Vercel), the project
 * directory is not writable — only the OS temp dir is — so we transparently
 * fall back to <tmp>/flowforge-data and seed it once from any workflows/runs
 * that shipped in the read-only bundle. This keeps the deployed demo fully
 * functional (create / save / run / delete all work for the session).
 */
const IS_SERVERLESS = !!process.env.VERCEL || !!process.env.AWS_REGION;
const BUNDLED_DIR = path.join(process.cwd(), "data");
const DATA_DIR = IS_SERVERLESS
  ? path.join(os.tmpdir(), "flowforge-data")
  : BUNDLED_DIR;
const WF_DIR = path.join(DATA_DIR, "workflows");
const RUN_DIR = path.join(DATA_DIR, "runs");

let seeded = false;

async function copySeed(subdir: string, targetDir: string) {
  const src = path.join(BUNDLED_DIR, subdir);
  try {
    const files = await fs.readdir(src);
    for (const f of files) {
      if (!f.endsWith(".json")) continue;
      try {
        const raw = await fs.readFile(path.join(src, f), "utf8");
        await fs.writeFile(path.join(targetDir, f), raw, "utf8");
      } catch {
        /* skip unreadable seed file */
      }
    }
  } catch {
    /* no bundled seed data — fine */
  }
}

async function ensureDirs() {
  await fs.mkdir(WF_DIR, { recursive: true });
  await fs.mkdir(RUN_DIR, { recursive: true });
  // one-time seed of the writable temp dir from the read-only bundle
  if (IS_SERVERLESS && !seeded) {
    seeded = true;
    await copySeed("workflows", WF_DIR);
    await copySeed("runs", RUN_DIR);
  }
}

/* ------------------------------- workflows ------------------------------- */

export async function listWorkflows(): Promise<Workflow[]> {
  await ensureDirs();
  const files = await fs.readdir(WF_DIR);
  const out: Workflow[] = [];
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    try {
      const raw = await fs.readFile(path.join(WF_DIR, f), "utf8");
      out.push(JSON.parse(raw) as Workflow);
    } catch {
      /* skip corrupt */
    }
  }
  out.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  return out;
}

export async function getWorkflow(id: string): Promise<Workflow | null> {
  await ensureDirs();
  try {
    const raw = await fs.readFile(path.join(WF_DIR, `${id}.json`), "utf8");
    return JSON.parse(raw) as Workflow;
  } catch {
    return null;
  }
}

export async function saveWorkflow(wf: Workflow): Promise<Workflow> {
  await ensureDirs();
  wf.updatedAt = new Date().toISOString();
  if (!wf.createdAt) wf.createdAt = wf.updatedAt;
  await fs.writeFile(
    path.join(WF_DIR, `${wf.id}.json`),
    JSON.stringify(wf, null, 2),
    "utf8"
  );
  return wf;
}

export async function deleteWorkflow(id: string): Promise<void> {
  await ensureDirs();
  try {
    await fs.unlink(path.join(WF_DIR, `${id}.json`));
  } catch {
    /* already gone */
  }
}

/* --------------------------------- runs ---------------------------------- */

export async function saveRun(run: RunRecord): Promise<void> {
  await ensureDirs();
  await fs.writeFile(
    path.join(RUN_DIR, `${run.id}.json`),
    JSON.stringify(run, null, 2),
    "utf8"
  );
}

export async function listRuns(workflowId?: string): Promise<RunRecord[]> {
  await ensureDirs();
  const files = await fs.readdir(RUN_DIR);
  const out: RunRecord[] = [];
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    try {
      const raw = await fs.readFile(path.join(RUN_DIR, f), "utf8");
      const rec = JSON.parse(raw) as RunRecord;
      if (!workflowId || rec.workflowId === workflowId) out.push(rec);
    } catch {
      /* skip */
    }
  }
  out.sort((a, b) => b.startedAt - a.startedAt);
  return out.slice(0, 100);
}

export async function getRun(id: string): Promise<RunRecord | null> {
  await ensureDirs();
  try {
    const raw = await fs.readFile(path.join(RUN_DIR, `${id}.json`), "utf8");
    return JSON.parse(raw) as RunRecord;
  } catch {
    return null;
  }
}
