"use client";

import type { Workflow } from "./types";

/**
 * Lightweight, local workflow version history ("snapshots").
 *
 * Snapshots are stored per-workflow in localStorage so a user can capture a
 * known-good state, browse their history, and restore any point — entirely
 * offline, no server round-trip. This complements the server-side save.
 */

export interface Snapshot {
  id: string;
  label: string;
  createdAt: string;
  nodeCount: number;
  edgeCount: number;
  /** the full workflow graph at capture time */
  workflow: Workflow;
}

const KEY_PREFIX = "flowforge:snapshots:";
const MAX_SNAPSHOTS = 25;

function keyFor(workflowId: string) {
  return `${KEY_PREFIX}${workflowId || "inline"}`;
}

export function listSnapshots(workflowId: string): Snapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(keyFor(workflowId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Snapshot[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSnapshot(
  workflowId: string,
  workflow: Workflow,
  label?: string
): Snapshot[] {
  if (typeof window === "undefined") return [];
  const existing = listSnapshots(workflowId);
  const snap: Snapshot = {
    id: `snap_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 6)}`,
    label: label?.trim() || defaultLabel(),
    createdAt: new Date().toISOString(),
    nodeCount: workflow.nodes.length,
    edgeCount: workflow.edges.length,
    workflow: JSON.parse(JSON.stringify(workflow)),
  };
  const next = [snap, ...existing].slice(0, MAX_SNAPSHOTS);
  persist(workflowId, next);
  return next;
}

export function deleteSnapshot(workflowId: string, id: string): Snapshot[] {
  const next = listSnapshots(workflowId).filter((s) => s.id !== id);
  persist(workflowId, next);
  return next;
}

export function clearSnapshots(workflowId: string): void {
  persist(workflowId, []);
}

export function getSnapshot(
  workflowId: string,
  id: string
): Snapshot | undefined {
  return listSnapshots(workflowId).find((s) => s.id === id);
}

function persist(workflowId: string, snaps: Snapshot[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(keyFor(workflowId), JSON.stringify(snaps));
    window.dispatchEvent(
      new CustomEvent("flowforge:snapshots-updated", { detail: workflowId })
    );
  } catch {
    /* quota / unavailable — ignore */
  }
}

function defaultLabel() {
  const d = new Date();
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
