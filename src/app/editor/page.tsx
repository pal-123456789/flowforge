import { Suspense } from "react";
import { EditorShell } from "@/components/editor/EditorShell";
import { FullscreenLoader } from "@/components/ui/Loader3D";

export default function NewEditorPage() {
  return (
    <Suspense fallback={<FullscreenLoader label="Preparing the canvas" />}>
      <EditorShell />
    </Suspense>
  );
}
