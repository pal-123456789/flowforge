import { Suspense } from "react";
import { EditorShell } from "@/components/editor/EditorShell";
import { FullscreenLoader } from "@/components/ui/Loader3D";

export default function EditorPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<FullscreenLoader label="Loading workflow" />}>
      <EditorShell workflowId={params.id} />
    </Suspense>
  );
}
