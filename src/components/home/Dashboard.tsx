"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { fmtRelative, fmtDuration, cn } from "@/lib/utils";
import type { Workflow, RunRecord } from "@/lib/types";
import { NODE_TYPES } from "@/lib/nodeRegistry";
import {
  Plus,
  Workflow as WorkflowIcon,
  Sparkles,
  Zap,
  GitBranch,
  Play,
  Trash2,
  Clock,
  LayoutTemplate,
  ArrowRight,
  Boxes,
  Activity,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface TemplateMeta {
  id: string;
  name: string;
  description: string;
  tags: string[];
}

export function Dashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const [w, t, r] = await Promise.all([
      fetch("/api/workflows").then((x) => x.json()),
      fetch("/api/templates").then((x) => x.json()),
      fetch("/api/runs").then((x) => x.json()),
    ]);
    setWorkflows(w.workflows || []);
    setTemplates(t.templates || []);
    setRuns(r.runs || []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const createBlank = async () => {
    const res = await fetch("/api/templates");
    void res;
    router.push("/editor");
  };

  const useTemplate = async (id: string) => {
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
    }
  };

  const remove = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await fetch(`/api/workflows/${id}`, { method: "DELETE" });
    toast("info", "Workflow deleted");
    refresh();
  };

  const totalRuns = runs.length;
  const successRuns = runs.filter((r) => r.status === "success").length;

  return (
    <div className="min-h-screen">
      {/* top nav */}
      <nav className="sticky top-0 z-40 glass border-b border-line">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand to-brand-dim flex items-center justify-center shadow-glow">
              <WorkflowIcon size={19} className="text-white" />
            </div>
            <div>
              <div className="text-[15px] font-bold text-ink leading-none">
                FlowForge
              </div>
              <div className="text-[10px] text-ink-dim mt-0.5">
                Visual Workflow Automation
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com"
              className="text-xs text-ink-dim hover:text-ink hidden sm:block"
            >
              ALGOTHON&apos;26 · ALG-AUTO-01
            </a>
            <Link
              href="/editor"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-soft transition-colors shadow-glow"
            >
              <Plus size={16} /> New workflow
            </Link>
          </div>
        </div>
      </nav>

      {/* hero */}
      <header className="relative overflow-hidden border-b border-line">
        <div className="absolute inset-0 grid-fade opacity-40 pointer-events-none">
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                "radial-gradient(circle, #242838 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />
        </div>
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bg-panel border border-line text-xs text-ink-soft mb-5 animate-fade-in">
            <Sparkles size={13} className="text-brand-soft" />
            Build automations visually — runs 100% offline
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-ink tracking-tight text-balance max-w-3xl mx-auto leading-[1.1]">
            Automate anything with a{" "}
            <span className="bg-gradient-to-r from-brand-soft to-ai bg-clip-text text-transparent">
              drag-and-drop
            </span>{" "}
            workflow canvas
          </h1>
          <p className="text-ink-soft text-base mt-5 max-w-xl mx-auto text-balance leading-relaxed">
            Connect triggers, conditions, actions and transforms on an infinite
            canvas. Watch your logic execute live, node by node — no code
            required.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <Link
              href="/editor"
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-brand text-white font-semibold hover:bg-brand-soft transition-colors shadow-glow"
            >
              <Zap size={17} /> Start building
            </Link>
            <a
              href="#templates"
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-bg-panel border border-line text-ink-soft font-medium hover:text-ink hover:border-ink-dim transition-colors"
            >
              <LayoutTemplate size={17} /> Browse templates
            </a>
          </div>

          {/* stat chips */}
          <div className="flex items-center justify-center gap-3 mt-10 flex-wrap">
            <StatChip icon={<Boxes size={15} />} label="Node types" value={NODE_TYPES.length} />
            <StatChip icon={<WorkflowIcon size={15} />} label="Workflows" value={workflows.length} />
            <StatChip icon={<Activity size={15} />} label="Runs" value={totalRuns} />
            <StatChip
              icon={<CheckCircle2 size={15} />}
              label="Success rate"
              value={totalRuns ? `${Math.round((successRuns / totalRuns) * 100)}%` : "—"}
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-14">
        {/* capabilities */}
        <section className="grid sm:grid-cols-3 gap-4">
          <Feature
            icon={<GitBranch size={20} />}
            color="#f59e0b"
            title="Branch & loop logic"
            desc="If/else, switch, filters, loops and merge — model real decisions, not just linear steps."
          />
          <Feature
            icon={<Play size={20} />}
            color="#22c55e"
            title="Live execution engine"
            desc="A topological DAG engine runs your graph and lights up each node with its real input & output."
          />
          <Feature
            icon={<Sparkles size={20} />}
            color="#06b6d4"
            title="AI steps, offline-safe"
            desc="Summarize, classify sentiment, extract keywords. Uses OpenAI if a key exists, else a built-in mock."
          />
        </section>

        {/* your workflows */}
        <section>
          <SectionHeader
            title="Your workflows"
            subtitle="Everything you've built, saved locally."
          />
          {loading ? (
            <SkeletonGrid />
          ) : workflows.length === 0 ? (
            <EmptyWorkflows onCreate={createBlank} />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflows.map((wf) => (
                <WorkflowCard key={wf.id} wf={wf} onDelete={remove} />
              ))}
            </div>
          )}
        </section>

        {/* templates */}
        <section id="templates">
          <SectionHeader
            title="Start from a template"
            subtitle="Battle-tested automations you can run in one click."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((t) => (
              <TemplateCard key={t.id} tpl={t} onUse={() => useTemplate(t.id)} />
            ))}
          </div>
        </section>

        {/* recent runs */}
        {runs.length > 0 && (
          <section>
            <SectionHeader
              title="Recent runs"
              subtitle="Execution history across all workflows."
            />
            <div className="rounded-xl border border-line overflow-hidden">
              {runs.slice(0, 8).map((r, i) => (
                <div
                  key={r.id}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 text-sm",
                    i % 2 ? "bg-bg-soft/40" : "bg-transparent"
                  )}
                >
                  {r.status === "success" ? (
                    <CheckCircle2 size={16} className="text-ok shrink-0" />
                  ) : (
                    <XCircle size={16} className="text-err shrink-0" />
                  )}
                  <span className="font-medium text-ink flex-1 truncate">
                    {r.workflowName}
                  </span>
                  <span className="text-ink-dim text-xs hidden sm:block">
                    {r.trigger}
                  </span>
                  <span className="text-ink-soft text-xs">
                    {r.successCount}/{r.nodeCount} nodes
                  </span>
                  <span className="text-ink-dim text-xs tabular-nums w-16 text-right">
                    {fmtDuration(r.durationMs)}
                  </span>
                  <span className="text-ink-dim text-xs tabular-nums w-20 text-right">
                    {fmtRelative(new Date(r.startedAt).toISOString())}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-line mt-10">
        <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between text-xs text-ink-dim">
          <span>FlowForge — built for ALGOTHON&apos;26 · ALG-AUTO-01 Visual Workflow Automation</span>
          <span>Next.js · React Flow · TypeScript · Zustand</span>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------- subparts -------------------------------- */

function StatChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-bg-panel/60 border border-line">
      <span className="text-brand-soft">{icon}</span>
      <span className="text-lg font-bold text-ink tabular-nums">{value}</span>
      <span className="text-xs text-ink-dim">{label}</span>
    </div>
  );
}

function Feature({
  icon,
  color,
  title,
  desc,
}: {
  icon: React.ReactNode;
  color: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="p-5 rounded-xl bg-bg-soft border border-line hover:border-ink-dim transition-colors group">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-3.5"
        style={{ background: `${color}1f`, color }}
      >
        {icon}
      </div>
      <h3 className="text-[15px] font-semibold text-ink mb-1.5">{title}</h3>
      <p className="text-[13px] text-ink-soft leading-relaxed">{desc}</p>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      <p className="text-sm text-ink-dim mt-0.5">{subtitle}</p>
    </div>
  );
}

function WorkflowCard({
  wf,
  onDelete,
}: {
  wf: Workflow;
  onDelete: (id: string, e: React.MouseEvent) => void;
}) {
  return (
    <Link
      href={`/editor/${wf.id}`}
      className="group relative p-5 rounded-xl bg-bg-soft border border-line hover:border-brand/60 hover:shadow-glow transition-all block"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-brand/15 flex items-center justify-center">
          <WorkflowIcon size={18} className="text-brand-soft" />
        </div>
        <button
          onClick={(e) => onDelete(wf.id, e)}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-ink-dim hover:text-err hover:bg-bg-panel transition-all"
        >
          <Trash2 size={15} />
        </button>
      </div>
      <h3 className="text-[15px] font-semibold text-ink truncate">{wf.name}</h3>
      <p className="text-[13px] text-ink-dim mt-1 line-clamp-2 min-h-[2.5em]">
        {wf.description || "No description"}
      </p>
      <div className="flex items-center gap-3 mt-4 text-xs text-ink-dim">
        <span className="flex items-center gap-1">
          <Boxes size={13} /> {wf.nodes.length} nodes
        </span>
        <span className="flex items-center gap-1">
          <Clock size={13} /> {fmtRelative(wf.updatedAt)}
        </span>
        <ArrowRight
          size={15}
          className="ml-auto text-ink-dim group-hover:text-brand-soft group-hover:translate-x-0.5 transition-all"
        />
      </div>
    </Link>
  );
}

function TemplateCard({
  tpl,
  onUse,
}: {
  tpl: TemplateMeta;
  onUse: () => void;
}) {
  return (
    <button
      onClick={onUse}
      className="group text-left p-5 rounded-xl bg-bg-soft border border-line hover:border-ai/60 transition-all"
    >
      <div className="w-10 h-10 rounded-lg bg-ai/15 flex items-center justify-center mb-3">
        <LayoutTemplate size={18} className="text-ai" />
      </div>
      <h3 className="text-[15px] font-semibold text-ink">{tpl.name}</h3>
      <p className="text-[13px] text-ink-soft mt-1.5 line-clamp-2 leading-relaxed min-h-[2.6em]">
        {tpl.description}
      </p>
      <div className="flex items-center gap-1.5 mt-4 flex-wrap">
        {tpl.tags.map((tag) => (
          <span
            key={tag}
            className="text-[10.5px] px-2 py-0.5 rounded-full bg-bg-panel border border-line text-ink-dim"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-4 text-xs font-medium text-ai opacity-0 group-hover:opacity-100 transition-opacity">
        Use template <ArrowRight size={14} />
      </div>
    </button>
  );
}

function EmptyWorkflows({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-bg-soft/40 p-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-bg-panel border border-line flex items-center justify-center mx-auto mb-4">
        <WorkflowIcon size={26} className="text-ink-dim" />
      </div>
      <h3 className="text-base font-semibold text-ink">No workflows yet</h3>
      <p className="text-sm text-ink-dim mt-1 max-w-sm mx-auto">
        Create your first automation from scratch, or pick a template below to
        get started in seconds.
      </p>
      <button
        onClick={onCreate}
        className="inline-flex items-center gap-2 mt-5 px-4 py-2.5 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-soft transition-colors"
      >
        <Plus size={16} /> Create workflow
      </button>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-40 rounded-xl bg-bg-soft border border-line animate-pulse"
        />
      ))}
    </div>
  );
}
