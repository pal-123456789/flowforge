import { NextRequest, NextResponse } from "next/server";
import { instantiateTemplate } from "@/lib/templates";
import { saveWorkflow } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { templateId } = (await req.json()) as { templateId?: string };
  if (!templateId) {
    return NextResponse.json({ error: "templateId is required" }, { status: 400 });
  }
  try {
    const wf = instantiateTemplate(templateId);
    const saved = await saveWorkflow(wf);
    return NextResponse.json({ workflow: saved });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "failed to instantiate" },
      { status: 400 }
    );
  }
}
