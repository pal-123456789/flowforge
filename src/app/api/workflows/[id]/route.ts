import { NextRequest, NextResponse } from "next/server";
import { getWorkflow, saveWorkflow, deleteWorkflow } from "@/lib/server/store";
import type { Workflow } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const wf = await getWorkflow(params.id);
  if (!wf) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ workflow: wf });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = (await req.json()) as Workflow;
  body.id = params.id;
  const saved = await saveWorkflow(body);
  return NextResponse.json({ workflow: saved });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await deleteWorkflow(params.id);
  return NextResponse.json({ ok: true });
}
