"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  History,
  X,
  Camera,
  RotateCcw,
  Trash2,
  GitBranch,
  Clock,
} from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { useToast } from "@/components/ui/Toast";
import {
  listSnapshots,
  saveSnapshot,
  deleteSnapshot,
  type Snapshot,
} from "@/lib/snapshots";
import { fmtRelative } from "@/lib/utils";

export function SnapshotPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const workflowId = useEditorStore((s) => s.workflowId);
  const [snaps, setSnaps] = useState<Snapshot[]>([]);
  const [label, setLabel] = useState("");

  const refresh = useCallback(() => {
    setSnaps(listSnapshots(workflowId));
  }, [workflowId]);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  useEffect(() => {
    const onUpd = () => refresh();
    window.addEventListener("flowforge:snapshots-updated", onUpd);
    return () =>
      window.removeEventListener("flowforge:snapshots-updated", onUpd);
  }, [refresh]);

  const capture = () => {
    const wf = useEditorStore.getState().getWorkflow();
    saveSnapshot(workflowId, wf, label);
    setLabel("");
    toast("success", "Snapshot captured", `${wf.nodes.length} nodes saved`);
    refresh();
  };

  const restore = (snap: Snapshot) => {
    useEditorStore
      .getState()
      .restoreGraph(snap.workflow.nodes, snap.workflow.edges);
    toast("info", "Snapshot restored", snap.label, {
      action: {
        label: "Undo",
        onClick: () => useEditorStore.getState().undo(),
      },
    });
  };

  const remove = (snap: Snapshot) => {
    deleteSnapshot(workflowId, snap.id);
    toast("info", "Snapshot deleted");
    refresh();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed right-0 top-0 z-[71] flex h-full w-[340px] flex-col border-l border-line bg-bg-panel shadow-glow-lg"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* header */}
            <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
              <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                <GitBranch size={16} className="text-brand-soft" />
                Version snapshots
              </span>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-dim transition-colors hover:bg-bg-elevated hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>

            {/* capture row */}
            <div className="border-b border-line p-3">
              <div className="flex items-center gap-2">
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && capture()}
                  placeholder="Label (optional)…"
                  className="min-w-0 flex-1 rounded-lg border border-line bg-bg-soft px-2.5 py-1.5 text-sm text-ink placeholder:text-ink-dim focus:border-brand focus:outline-none"
                />
                <button
                  onClick={capture}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-brand-soft"
                >
                  <Camera size={14} /> Snap
                </button>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-ink-dim">
                Snapshots are stored locally in your browser — capture a
                known-good state and restore it anytime.
              </p>
            </div>

            {/* list */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
              {snaps.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
                  <History size={28} className="text-ink-faint" />
                  <p className="text-sm text-ink-dim">No snapshots yet</p>
                  <p className="text-[11px] text-ink-faint">
                    Capture one before a risky change.
                  </p>
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {snaps.map((s) => (
                    <li
                      key={s.id}
                      className="group rounded-lg border border-line bg-bg-soft p-2.5 transition-colors hover:border-ink-dim"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-ink">
                            {s.label}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-ink-dim">
                            <span className="flex items-center gap-1">
                              <Clock size={10} /> {fmtRelative(s.createdAt)}
                            </span>
                            <span>·</span>
                            <span>
                              {s.nodeCount} nodes · {s.edgeCount} edges
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => restore(s)}
                            title="Restore this snapshot"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-ink-dim transition-colors hover:bg-brand/15 hover:text-brand-soft"
                          >
                            <RotateCcw size={14} />
                          </button>
                          <button
                            onClick={() => remove(s)}
                            title="Delete snapshot"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-ink-dim transition-colors hover:bg-err/10 hover:text-err"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
