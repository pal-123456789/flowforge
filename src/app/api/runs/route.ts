import { NextRequest, NextResponse } from "next/server";
import { listRuns, saveRun } from "@/lib/server/store";
import type { RunRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const workflowId = req.nextUrl.searchParams.get("workflowId") || undefined;
  const runs = await listRuns(workflowId);
  return NextResponse.json({ runs });
}

/**
 * Persist a run record produced by the in-browser live engine, so it shows up
 * in run history and analytics. Skips inline/unsaved workflows.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as { run?: RunRecord };
  const run = body.run;
  if (!run || !run.id) {
    return NextResponse.json({ error: "run is required" }, { status: 400 });
  }
  if (!run.workflowId || run.workflowId === "inline") {
    return NextResponse.json({ ok: true, persisted: false });
  }
  await saveRun(run).catch(() => {});
  return NextResponse.json({ ok: true, persisted: true });
}
