import { NextRequest, NextResponse } from "next/server";
import { executeWorkflow } from "@/lib/engine";
import { saveRun, getWorkflow } from "@/lib/server/store";

export const dynamic = "force-dynamic";

/**
 * Public webhook endpoint for a workflow.
 * POST /api/webhook/<workflowId>  — the JSON body becomes the trigger input.
 * The workflow runs server-side and the run is persisted.
 */
async function handle(req: NextRequest, id: string) {
  const wf = await getWorkflow(id);
  if (!wf) return NextResponse.json({ error: "workflow not found" }, { status: 404 });

  let input: unknown = {};
  try {
    if (req.method !== "GET") input = await req.json();
    else input = Object.fromEntries(req.nextUrl.searchParams.entries());
  } catch {
    input = {};
  }

  const record = await executeWorkflow(
    wf.nodes,
    wf.edges,
    { workflowId: wf.id, workflowName: wf.name },
    { trigger: "webhook", initialInput: input }
  );
  await saveRun(record).catch(() => {});

  return NextResponse.json({
    ok: record.status === "success",
    runId: record.id,
    status: record.status,
    durationMs: record.durationMs,
    output: record.results[record.results.length - 1]?.output ?? null,
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(req, params.id);
}
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(req, params.id);
}
