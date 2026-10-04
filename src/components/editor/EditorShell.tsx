"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useEditorStore } from "@/store/editorStore";
import { Toolbar } from "@/components/editor/Toolbar";
import { Canvas } from "@/components/canvas/Canvas";
import { NodePalette } from "@/components/canvas/NodePalette";
import { Inspector } from "@/components/inspector/Inspector";
import { RunConsole } from "@/components/console/RunConsole";
import { ShortcutsHelp } from "@/components/editor/ShortcutsHelp";
import { FullscreenLoader } from "@/components/ui/Loader3D";
import { emptyWorkflow } from "@/lib/templates";
import type { Workflow } from "@/lib/types";

export function EditorShell({ workflowId }: { workflowId?: string }) {
  const loadWorkflow = useEditorStore((s) => s.loadWorkflow);
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      if (workflowId) {
        try {
          const res = await fetch(`/api/workflows/${workflowId}`);
          if (res.ok) {
            const { workflow } = (await res.json()) as { workflow: Workflow };
            if (!cancelled) {
              loadWorkflow(workflow);
              setLoaded(true);
              return;
            }
          }
        } catch {
          /* fall through to empty */
        }
      }
      if (!cancelled) {
        loadWorkflow(emptyWorkflow());
        setLoaded(true);
      }
    }
    boot();
    return () => {
      cancelled = true;
    };
  }, [workflowId, loadWorkflow]);

  // keyboard shortcuts
  const onKey = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const typing =
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.isContentEditable;

    // "?" toggles the shortcut help (even useful while not typing)
    if (!typing && e.key === "?") {
      e.preventDefault();
      setHelpOpen((o) => !o);
      return;
    }

    // Ctrl/Cmd+S → save (works everywhere, prevents browser save dialog)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("flowforge:save"));
      return;
    }

    // Ctrl/Cmd+Enter → run
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("flowforge:run"));
      return;
    }

    if (typing) return;

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
      e.preventDefault();
      useEditorStore.getState().undo();
    } else if (
      (e.ctrlKey || e.metaKey) &&
      (e.key.toLowerCase() === "y" ||
        (e.key.toLowerCase() === "z" && e.shiftKey))
    ) {
      e.preventDefault();
      useEditorStore.getState().redo();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
      // duplicate selected node
      e.preventDefault();
      const sel = useEditorStore.getState().selectedNodeId;
      if (sel) useEditorStore.getState().duplicateNode(sel);
    } else if (e.key === "Delete" || e.key === "Backspace") {
      // delete selected node
      const sel = useEditorStore.getState().selectedNodeId;
      if (sel) {
        e.preventDefault();
        useEditorStore.getState().deleteNode(sel);
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  // handle ?add=<type> deep-link from the command palette
  useEffect(() => {
    if (!loaded) return;
    const add = searchParams.get("add");
    if (add) {
      const x = 300 + Math.random() * 200;
      const y = 160 + Math.random() * 160;
      useEditorStore.getState().addNodeOfType(add, { x, y });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const addNode = (type: string) => {
    // place roughly in the center-ish area with a little scatter
    const x = 300 + Math.random() * 200;
    const y = 160 + Math.random() * 160;
    useEditorStore.getState().addNodeOfType(type, { x, y });
  };

  if (!loaded) {
    return <FullscreenLoader label="Preparing the canvas" />;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Toolbar />
      <div className="flex-1 flex overflow-hidden">
        <NodePalette onAdd={addNode} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 relative overflow-hidden">
            <Canvas />
            <button
              onClick={() => setHelpOpen(true)}
              title="Keyboard shortcuts (?)"
              className="absolute bottom-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-bg-panel/90 text-ink-dim shadow-node backdrop-blur transition-colors hover:text-ink hover:border-ink-dim"
            >
              <span className="font-mono text-sm">?</span>
            </button>
          </div>
          <RunConsole open={consoleOpen} onToggle={() => setConsoleOpen((o) => !o)} />
        </div>
        <Inspector />
      </div>
      <ShortcutsHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
