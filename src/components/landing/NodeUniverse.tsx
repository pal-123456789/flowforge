"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  NODE_TYPES,
  CATEGORY_META,
  CATEGORY_HEX,
  nodesByCategory,
} from "@/lib/nodeRegistry";
import type { NodeCategory } from "@/lib/types";
import { Reveal, StaggerGroup, staggerItem, TiltCard } from "./primitives";
import { SectionIntro } from "./Sections";

const CATS: NodeCategory[] = ["trigger", "action", "logic", "data", "ai"];

export function NodeUniverse() {
  const [active, setActive] = useState<NodeCategory | "all">("all");
  const byCat = nodesByCategory();
  const shown =
    active === "all" ? NODE_TYPES : byCat[active as NodeCategory] ?? [];

  return (
    <section
      id="nodes"
      className="relative overflow-hidden border-y border-line/50 bg-bg-soft/30 py-28"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #7c5cff 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-6">
        <SectionIntro
          eyebrow="Node library"
          title="A universe of building blocks"
          subtitle={`${NODE_TYPES.length} node types across ${CATS.length} categories — each with deep, typed configuration.`}
        />

        {/* filter pills */}
        <Reveal delay={0.2}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            <FilterPill
              label="All nodes"
              count={NODE_TYPES.length}
              active={active === "all"}
              color="#7c5cff"
              onClick={() => setActive("all")}
            />
            {CATS.map((c) => (
              <FilterPill
                key={c}
                label={CATEGORY_META[c].label}
                count={byCat[c].length}
                active={active === c}
                color={CATEGORY_HEX[c]}
                onClick={() => setActive(c)}
              />
            ))}
          </div>
        </Reveal>

        <StaggerGroup
          key={active}
          className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
        >
          {shown.map((n) => {
            const hex = CATEGORY_HEX[n.category];
            return (
              <motion.div key={n.type} variants={staggerItem} layout>
                <TiltCard
                  max={8}
                  glare={false}
                  className="group h-full rounded-xl border border-line bg-bg-panel/50 p-4 transition-all hover:border-line-bright hover:bg-bg-panel"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110"
                      style={{ background: `${hex}1f`, color: hex }}
                    >
                      <Icon name={n.icon} size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-ink">
                        {n.label}
                      </div>
                      <div
                        className="mt-0.5 text-[10px] font-medium uppercase tracking-wide"
                        style={{ color: hex }}
                      >
                        {n.category}
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-ink-dim">
                    {n.description}
                  </p>
                </TiltCard>
              </motion.div>
            );
          })}
        </StaggerGroup>
      </div>
    </section>
  );
}

function FilterPill({
  label,
  count,
  active,
  color,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
        active
          ? "border-transparent text-white"
          : "border-line bg-bg-panel/50 text-ink-soft hover:text-ink"
      }`}
      style={active ? { background: color } : undefined}
    >
      {label}
      <span
        className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
          active ? "bg-black/20" : "bg-bg-elevated text-ink-dim"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
