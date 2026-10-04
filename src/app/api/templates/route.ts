import { NextResponse } from "next/server";
import { TEMPLATES } from "@/lib/templates";

export async function GET() {
  return NextResponse.json({
    templates: TEMPLATES.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      tags: t.tags,
    })),
  });
}
