"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles,
  MousePointerClick,
  Boxes,
  Settings2,
  Play,
  Command,
  ArrowRight,
  X,
} from "lucide-react";

const TOUR_KEY = "flowforge:onboarded";

interface Step {
  icon: React.ReactNode;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    icon: <Boxes size={20} />,
    title: "Drag nodes from the palette",
    body: "The left panel holds 20 node types across 5 categories — triggers, actions, logic, data, and AI. Drag any onto the canvas, or double-click an empty spot for a quick-add menu.",
  },
  {
    icon: <MousePointerClick size={20} />,
    title: "Connect them into a flow",
    body: "Drag from a node's right handle to another node's left handle to wire up your automation. Branch nodes like If and Switch expose multiple outputs.",
  },
  {
    icon: <Settings2 size={20} />,
    title: "Configure in the inspector",
    body: "Select any node to edit its settings on the right. Use {{expressions}} to reference data flowing through the graph. You can even run from a single node.",
  },
  {
    icon: <Play size={20} />,
    title: "Run it live",
    body: "Hit Run (or Ctrl+Enter) to execute the whole graph in your browser — fully offline. Watch each node light up, then inspect logs and outputs in the console.",
  },
  {
    icon: <Command size={20} />,
    title: "Everything is a keystroke away",
    body: "Press Ctrl+K for the command palette, ? for all keyboard shortcuts, and Ctrl+S to save. Your workflows persist locally — no account required.",
  },
];

export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(TOUR_KEY)) {
        // small delay so the editor has mounted/animated in
        const t = setTimeout(() => setOpen(true), 650);
        return () => clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
    // allow re-opening the tour from elsewhere
    const reopen = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener("flowforge:tour", reopen);
    return () => window.removeEventListener("flowforge:tour", reopen);
  }, []);

  const finish = () => {
    try {
      localStorage.setItem(TOUR_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else finish();
  };

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={finish}
          />
          <motion.div
            key="card"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-line bg-bg-panel/95 shadow-glow-lg backdrop-blur-xl"
          >
            {/* header */}
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-soft">
                <Sparkles size={14} /> Welcome to FlowForge
              </span>
              <button
                onClick={finish}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-dim transition-colors hover:bg-bg-elevated hover:text-ink"
                title="Skip tour"
              >
                <X size={16} />
              </button>
            </div>

            {/* body */}
            <div className="px-6 py-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand/15 text-brand-soft">
                    {current.icon}
                  </div>
                  <h3 className="text-lg font-bold text-ink">
                    {current.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    {current.body}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* footer */}
            <div className="flex items-center justify-between border-t border-line px-5 py-3.5">
              <div className="flex items-center gap-1.5">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className={
                      "h-1.5 rounded-full transition-all " +
                      (i === step
                        ? "w-5 bg-brand"
                        : "w-1.5 bg-line hover:bg-ink-dim")
                    }
                    aria-label={`Go to step ${i + 1}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {!isLast && (
                  <button
                    onClick={finish}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-dim transition-colors hover:text-ink"
                  >
                    Skip
                  </button>
                )}
                <button
                  onClick={next}
                  className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-1.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-brand-soft"
                >
                  {isLast ? "Get started" : "Next"}
                  {!isLast && <ArrowRight size={15} />}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
