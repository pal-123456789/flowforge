"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/Toast";
import { fmtRelative, fmtDuration, cn } from "@/lib/utils";
import type { Workflow, RunRecord } from "@/lib/types";
import {
  Plus,
  Workflow as WorkflowIcon,
  Trash2,
  Clock,
  Boxes,
  ArrowRight,
  LayoutTemplate,
  CheckCircle2,
  XCircle,
  Play,
  Loader2,
} from "lucide-react";
import { Reveal, StaggerGroup, staggerItem, TiltCard } from "./primitives";
import { SectionIntro } from "./Sections";

interface TemplateMeta {
  id: string;
  name: string;
  description: string;
  tags: string[];
}

export function Workspace({
  workflows,
  templates,
  runs,
  loading,
  onRefresh,
}: {
  workflows: Workflow[];
  templates: TemplateMeta[];
  runs: RunRecord[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pendingTpl, setPendingTpl] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const useTemplate = async (id: string) => {
    if (pendingTpl) return;
    setPendingTpl(id);
    try {
      const res = await fetch("/api/workflows/from-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: id }),
      });
      if (res.ok) {
        const { workflow } = await res.json();
        toast("success", "Template loaded", workflow.name);
        router.push(`/editor/${workflow.id}`);
      } else {
        toast("error", "Could not load template");
        setPendingTpl(null);
      }
    } catch {
      toast("error", "Could not load template");
      setPendingTpl(null);
    }
  };

  const remove = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingId(id);
    await fetch(`/api/workflows/${id}`, { method: "DELETE" });
    toast("info", "Workflow deleted");
    onRefresh();
    setDeletingId(null);
  };

  return (
    <section id="workspace" className="relative mx-auto max-w-7xl px-6 py-28">
      <SectionIntro
        eyebrow="Your workspace"
        title="Build, save, and run — all local"
        subtitle="Everything you create is persisted to disk. No account, no cloud, no latency."
      />

      {/* your workflows */}
      <div className="mt-14">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-xl font-bold text-ink">Your workflows</h3>
            <p className="mt-0.5 text-sm text-ink-dim">
              {workflows.length} saved locally
            </p>
          </div>
          <Link
            href="/editor"
            className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-brand-soft"
          >
            <Plus size={16} /> New
          </Link>
        </div>

        {loading ? (
          <SkeletonGrid />
        ) : workflows.length === 0 ? (
          <EmptyWorkflows onCreate={() => router.push("/editor")} />
        ) : (
          <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workflows.map((wf) => (
              <motion.div key={wf.id} variants={staggerItem}>
                <WorkflowCard
                  wf={wf}
                  onDelete={remove}
                  deleting={deletingId === wf.id}
                />
              </motion.div>
            ))}
          </StaggerGroup>
        )}
      </div>

      {/* templates */}
      <div className="mt-20">
        <div className="mb-5">
          <h3 className="text-xl font-bold text-ink">Start from a template</h3>
          <p className="mt-0.5 text-sm text-ink-dim">
            Battle-tested automations you can run in one click.
          </p>
        </div>
        <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <motion.div key={t.id} variants={staggerItem}>
              <TemplateCard
                tpl={t}
                onUse={() => useTemplate(t.id)}
                pending={pendingTpl === t.id}
                disabled={pendingTpl !== null && pendingTpl !== t.id}
              />
            </motion.div>
          ))}
        </StaggerGroup>
      </div>

      {/* recent runs */}
      {runs.length > 0 && (
        <div className="mt-20">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h3 className="text-xl font-bold text-ink">Recent runs</h3>
              <p className="mt-0.5 text-sm text-ink-dim">
                Execution history across all workflows.
              </p>
            </div>
            <Link
              href="/runs"
              className="flex items-center gap-1.5 text-sm font-medium text-brand-soft transition-colors hover:text-brand"
            >
              View all runs <ArrowRight size={15} />
            </Link>
          </div>
          <Reveal>
            <div className="overflow-hidden rounded-2xl border border-line">
              {runs.slice(0, 8).map((r, i) => (
                <Link
                  key={r.id}
                  href={`/runs/${r.id}`}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 text-sm transition-colors hover:bg-bg-panel/50",
                    i % 2 ? "bg-bg-soft/40" : "bg-transparent"
                  )}
                >
                  {r.status === "success" ? (
                    <CheckCircle2 size={16} className="shrink-0 text-ok" />
                  ) : (
                    <XCircle size={16} className="shrink-0 text-err" />
                  )}
                  <span className="flex-1 truncate font-medium text-ink">
                    {r.workflowName}
                  </span>
                  <span className="hidden text-xs text-ink-dim sm:block">
                    {r.trigger}
                  </span>
                  <span className="text-xs text-ink-soft">
                    {r.successCount}/{r.nodeCount} nodes
                  </span>
                  <span className="w-16 text-right text-xs tabular-nums text-ink-dim">
                    {fmtDuration(r.durationMs)}
                  </span>
                  <span className="w-20 text-right text-xs tabular-nums text-ink-dim">
                    {fmtRelative(new Date(r.startedAt).toISOString())}
                  </span>
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      )}
    </section>
  );
}

/* ------------------------------- subparts ------------------------------ */
function WorkflowCard({
  wf,
  onDelete,
  deleting,
}: {
  wf: Workflow;
  onDelete: (id: string, e: React.MouseEvent) => void;
  deleting?: boolean;
}) {
  return (
    <TiltCard max={6} glare={false} className="h-full">
      <Link
        href={`/editor/${wf.id}`}
        className={cn(
          "group relative block h-full rounded-2xl border border-line bg-bg-soft/70 p-5 transition-all hover:border-brand/60 hover:shadow-glow",
          deleting && "pointer-events-none opacity-50"
        )}
      >
        <div className="mb-3 flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/15">
            <WorkflowIcon size={18} className="text-brand-soft" />
          </div>
          <button
            onClick={(e) => onDelete(wf.id, e)}
            disabled={deleting}
            className="rounded-md p-1.5 text-ink-dim opacity-0 transition-all hover:bg-bg-panel hover:text-err group-hover:opacity-100"
          >
            {deleting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Trash2 size={15} />
            )}
          </button>
        </div>
        <h3 className="truncate text-[15px] font-semibold text-ink">
          {wf.name}
        </h3>
        <p className="mt-1 line-clamp-2 min-h-[2.5em] text-[13px] text-ink-dim">
          {wf.description || "No description"}
        </p>
        <div className="mt-4 flex items-center gap-3 text-xs text-ink-dim">
          <span className="flex items-center gap-1">
            <Boxes size={13} /> {wf.nodes.length} nodes
          </span>
          <span className="flex items-center gap-1">
            <Clock size={13} /> {fmtRelative(wf.updatedAt)}
          </span>
          <ArrowRight
            size={15}
            className="ml-auto text-ink-dim transition-all group-hover:translate-x-0.5 group-hover:text-brand-soft"
          />
        </div>
      </Link>
    </TiltCard>
  );
}

function TemplateCard({
  tpl,
  onUse,
  pending,
  disabled,
}: {
  tpl: TemplateMeta;
  onUse: () => void;
  pending?: boolean;
  disabled?: boolean;
}) {
  return (
    <TiltCard max={6} glare={false} className="h-full">
      <button
        onClick={onUse}
        disabled={pending || disabled}
        className={cn(
          "group h-full w-full rounded-2xl border border-line bg-bg-soft/70 p-5 text-left transition-all hover:border-ai/60",
          disabled && "opacity-50"
        )}
      >
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-ai/15">
          {pending ? (
            <Loader2 size={18} className="animate-spin text-ai" />
          ) : (
            <LayoutTemplate size={18} className="text-ai" />
          )}
        </div>
        <h3 className="text-[15px] font-semibold text-ink">{tpl.name}</h3>
        <p className="mt-1.5 line-clamp-2 min-h-[2.6em] text-[13px] leading-relaxed text-ink-soft">
          {tpl.description}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {tpl.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-line bg-bg-panel px-2 py-0.5 text-[10.5px] text-ink-dim"
            >
              {tag}
            </span>
          ))}
        </div>
        <div
          className={cn(
            "mt-4 flex items-center gap-1.5 text-xs font-medium text-ai transition-opacity",
            pending ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          {pending ? (
            <>
              <Loader2 size={13} className="animate-spin" /> Loading…
            </>
          ) : (
            <>
              <Play size={13} /> Use template <ArrowRight size={14} />
            </>
          )}
        </div>
      </button>
    </TiltCard>
  );
}

function EmptyWorkflows({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-bg-soft/40 p-12 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-bg-panel">
        <WorkflowIcon size={26} className="text-ink-dim" />
      </div>
      <h3 className="text-base font-semibold text-ink">No workflows yet</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-ink-dim">
        Create your first automation from scratch, or pick a template to get
        started in seconds.
      </p>
      <button
        onClick={onCreate}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-soft"
      >
        <Plus size={16} /> Create workflow
      </button>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-40 rounded-2xl border border-line bg-bg-soft shimmer"
        />
      ))}
    </div>
  );
}
