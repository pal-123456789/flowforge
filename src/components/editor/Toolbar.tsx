"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useEditorStore } from "@/store/editorStore";
import { analyzeGraph } from "@/lib/graph";
import { runLive } from "@/lib/runLive";
import { useToast } from "@/components/ui/Toast";
import { Icon } from "@/components/ui/Icon";
import {
  Play,
  Save,
  Loader2,
  Undo2,
  Redo2,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Webhook,
  Download,
  Upload,
  Sun,
  Moon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";

export function Toolbar() {
  const { toast } = useToast();
  const router = useRouter();
  const { theme, toggle: toggleTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const name = useEditorStore((s) => s.name);
  const setName = useEditorStore((s) => s.setName);
  const dirty = useEditorStore((s) => s.dirty);
  const running = useEditorStore((s) => s.running);
  const nodes = useEditorStore((s) => s.nodes);
  const edges = useEditorStore((s) => s.edges);
  const workflowId = useEditorStore((s) => s.workflowId);

  const analysis = analyzeGraph(nodes, edges);
  const errorCount = analysis.issues.filter((i) => i.level === "error").length;
  const warnCount = analysis.issues.filter((i) => i.level === "warning").length;

  const run = useCallback(async (fromNodeId?: string) => {
    const store = useEditorStore.getState();
    const a = analyzeGraph(store.nodes, store.edges);
    if (!a.isValid) {
      toast(
        "error",
        "Can't run — fix validation errors",
        a.issues.find((i) => i.level === "error")?.message
      );
      return;
    }
    store.resetStatuses();
    store.setRunning(true);
    store.clearLogs();

    // set all to waiting
    for (const n of store.nodes) store.setNodeStatus(n.id, "waiting");

    try {
      await runLive(
        store.nodes.map((n) => ({
          id: n.id,
          type: "flowNode",
          position: n.position,
          data: n.data,
        })),
        store.edges,
        { workflowId: store.workflowId, workflowName: store.name },
        {
          onNodeStart: (id) => {
            useEditorStore.getState().setNodeStatus(id, "running");
          },
          onNodeFinish: (r) => {
            useEditorStore.getState().applyRunResult(r);
          },
          onLog: (l) => useEditorStore.getState().appendLog(l),
          onDone: (record) => {
            useEditorStore.getState().setLastRun(record);
            // persist the run so it appears in run history + analytics
            // (skipped automatically for unsaved/inline workflows)
            if (record.workflowId && record.workflowId !== "inline") {
              fetch("/api/runs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ run: record }),
              }).catch(() => {});
            }
          },
        },
        fromNodeId ? { fromNodeId } : undefined
      );
      const final = useEditorStore.getState().lastRun;
      const canViewDetail =
        final && final.workflowId && final.workflowId !== "inline";
      const detailAction = canViewDetail
        ? {
            label: "View details →",
            onClick: () => router.push(`/runs/${final!.id}`),
          }
        : undefined;
      const scope = fromNodeId ? "Partial run" : "Workflow";
      if (final?.status === "success") {
        toast(
          "success",
          `${scope} completed`,
          `${final.successCount} nodes · ${final.durationMs}ms`,
          { action: detailAction }
        );
      } else {
        toast(
          "error",
          `${scope} finished with errors`,
          `${final?.errorCount} node(s) failed`,
          { action: detailAction }
        );
      }
    } catch (e) {
      toast("error", "Run failed", (e as Error).message);
    } finally {
      useEditorStore.getState().setRunning(false);
    }
  }, [toast, router]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const wf = useEditorStore.getState().getWorkflow();
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wf),
      });
      if (!res.ok) throw new Error("save failed");
      useEditorStore.getState().markSaved();
      toast("success", "Workflow saved");
    } catch (e) {
      toast("error", "Save failed", (e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [toast]);

  // respond to global keyboard shortcuts (Ctrl+S / Ctrl+Enter) dispatched by EditorShell
  useEffect(() => {
    const onSave = () => save();
    const onRun = () => {
      if (!useEditorStore.getState().running) run();
    };
    const onRunFrom = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (id && !useEditorStore.getState().running) run(id);
    };
    window.addEventListener("flowforge:save", onSave);
    window.addEventListener("flowforge:run", onRun);
    window.addEventListener("flowforge:run-from", onRunFrom as EventListener);
    return () => {
      window.removeEventListener("flowforge:save", onSave);
      window.removeEventListener("flowforge:run", onRun);
      window.removeEventListener(
        "flowforge:run-from",
        onRunFrom as EventListener
      );
    };
  }, [save, run]);

  const copyWebhook = () => {
    const url = `${window.location.origin}/api/webhook/${workflowId}`;
    navigator.clipboard?.writeText(url);
    toast("info", "Webhook URL copied", url);
  };

  const exportJson = useCallback(() => {
    const wf = useEditorStore.getState().getWorkflow();
    const blob = new Blob([JSON.stringify(wf, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug =
      wf.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "workflow";
    a.href = url;
    a.download = `${slug}.flowforge.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("success", "Workflow exported", `${slug}.flowforge.json`);
  }, [toast]);

  const importJson = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (
          !parsed ||
          typeof parsed !== "object" ||
          !Array.isArray(parsed.nodes) ||
          !Array.isArray(parsed.edges)
        ) {
          throw new Error("File is not a valid FlowForge workflow");
        }
        const now = new Date().toISOString();
        useEditorStore.getState().loadWorkflow({
          id: parsed.id || `wf_${Date.now().toString(36)}`,
          name: parsed.name || "Imported workflow",
          description: parsed.description || "",
          tags: Array.isArray(parsed.tags) ? parsed.tags : [],
          nodes: parsed.nodes,
          edges: parsed.edges,
          createdAt: parsed.createdAt || now,
          updatedAt: now,
        });
        // mark dirty so the user is nudged to save the imported copy
        useEditorStore.getState().setName(parsed.name || "Imported workflow");
        toast(
          "success",
          "Workflow imported",
          `${parsed.nodes.length} nodes · ${parsed.edges.length} connections`
        );
      } catch (e) {
        toast("error", "Import failed", (e as Error).message);
      }
    },
    [toast]
  );

  return (
    <div className="h-14 shrink-0 border-b border-line bg-bg-soft flex items-center px-3 gap-3">
      <Link
        href="/"
        className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-dim hover:text-ink hover:bg-bg-panel transition-colors"
      >
        <ArrowLeft size={18} />
      </Link>

      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-brand-dim flex items-center justify-center">
          <Icon name="Workflow" size={17} className="text-white" />
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-transparent text-sm font-semibold text-ink focus:outline-none focus:bg-bg-panel rounded px-2 py-1 w-56"
          placeholder="Workflow name"
        />
        {dirty && <span className="w-1.5 h-1.5 rounded-full bg-warn" title="Unsaved changes" />}
      </div>

      {/* validation */}
      <div className="flex items-center gap-2 ml-2">
        {errorCount > 0 ? (
          <span className="flex items-center gap-1.5 text-xs text-err bg-err/10 border border-err/30 px-2.5 py-1 rounded-lg">
            <AlertTriangle size={13} /> {errorCount} error{errorCount > 1 ? "s" : ""}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-ok bg-ok/10 border border-ok/30 px-2.5 py-1 rounded-lg">
            <CheckCircle2 size={13} /> Valid DAG
          </span>
        )}
        {warnCount > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-warn" title="warnings">
            <AlertTriangle size={13} /> {warnCount}
          </span>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <IconBtn
          onClick={() => useEditorStore.getState().undo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={16} />
        </IconBtn>
        <IconBtn
          onClick={() => useEditorStore.getState().redo()}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 size={16} />
        </IconBtn>

        <div className="w-px h-6 bg-line mx-1" />

        <IconBtn
          onClick={toggleTheme}
          title={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
        >
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </IconBtn>

        <IconBtn onClick={copyWebhook} title="Copy webhook URL">
          <Webhook size={16} />
        </IconBtn>

        <IconBtn onClick={exportJson} title="Export workflow as JSON">
          <Download size={16} />
        </IconBtn>

        <IconBtn
          onClick={() => fileInputRef.current?.click()}
          title="Import workflow from JSON"
        >
          <Upload size={16} />
        </IconBtn>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importJson(f);
            e.target.value = "";
          }}
        />

        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-bg-panel border border-line text-sm font-medium text-ink-soft hover:text-ink hover:border-ink-dim transition-colors disabled:opacity-60"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Save
        </button>

        <button
          onClick={() => run()}
          disabled={running || errorCount > 0}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
            running || errorCount > 0
              ? "bg-brand/40 text-white/70 cursor-not-allowed"
              : "bg-brand text-white hover:bg-brand-soft shadow-glow"
          )}
        >
          {running ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Play size={15} fill="currentColor" />
          )}
          {running ? "Running…" : "Run"}
        </button>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-dim hover:text-ink hover:bg-bg-panel transition-colors"
    >
      {children}
    </button>
  );
}
