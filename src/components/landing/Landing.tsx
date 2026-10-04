"use client";

import { useEffect, useState } from "react";
import type { Workflow, RunRecord } from "@/lib/types";
import { NODE_TYPES } from "@/lib/nodeRegistry";
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { LandingNav, Hero } from "@/components/landing/Hero";
import { CapabilityMarquee, Features } from "@/components/landing/Sections";
import { NodeUniverse } from "@/components/landing/NodeUniverse";
import { LiveDemo } from "@/components/landing/LiveDemo";
import { Metrics, Architecture } from "@/components/landing/Metrics";
import { Workspace } from "@/components/landing/Workspace";
import { CTA, LandingFooter } from "@/components/landing/CTA";
import { useCommandPalette } from "@/components/CommandPalette";

interface TemplateMeta {
  id: string;
  name: string;
  description: string;
  tags: string[];
}

export function Landing() {
  const { open } = useCommandPalette();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const [w, t, r] = await Promise.all([
        fetch("/api/workflows").then((x) => x.json()),
        fetch("/api/templates").then((x) => x.json()),
        fetch("/api/runs").then((x) => x.json()),
      ]);
      setWorkflows(w.workflows || []);
      setTemplates(t.templates || []);
      setRuns(r.runs || []);
    } catch {
      /* offline-safe: keep empties */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const totalRuns = runs.length;
  const successRuns = runs.filter((r) => r.status === "success").length;
  const successRate = totalRuns
    ? Math.round((successRuns / totalRuns) * 100)
    : 100;

  return (
    <SmoothScroll>
      <div className="relative noise">
        <ScrollProgress />
        <LandingNav onCommand={open} />
        <Hero nodeCount={NODE_TYPES.length} />
        <CapabilityMarquee />
        <Features />
        <NodeUniverse />
        <LiveDemo />
        <Metrics
          nodeCount={NODE_TYPES.length}
          workflowCount={workflows.length}
          runCount={totalRuns}
          successRate={successRate}
        />
        <Architecture />
        <Workspace
          workflows={workflows}
          templates={templates}
          runs={runs}
          loading={loading}
          onRefresh={refresh}
        />
        <CTA />
        <LandingFooter />
      </div>
    </SmoothScroll>
  );
}
