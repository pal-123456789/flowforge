"use client";

import { createElement } from "react";
import type { LucideProps } from "lucide-react";
import {
  Box,
  Play,
  Webhook,
  Clock,
  Timer,
  Globe,
  Mail,
  Terminal,
  Hourglass,
  FileText,
  GitBranch,
  Split,
  Filter,
  Merge,
  Repeat,
  PencilRuler,
  Shuffle,
  Braces,
  Type,
  Calculator,
  Sparkles,
} from "lucide-react";

/**
 * Explicit icon registry.
 *
 * We intentionally avoid `import * as Icons from "lucide-react"` here: that
 * barrel import pulls every one of lucide's ~1500 icon modules into the dev
 * compile graph, adding thousands of modules and many seconds to each rebuild.
 * Mapping only the icons the node registry actually references keeps the
 * bundle (and dev compile) tiny.
 */
const ICONS: Record<string, React.ComponentType<LucideProps>> = {
  Box,
  Play,
  Webhook,
  Clock,
  Timer,
  Globe,
  Mail,
  Terminal,
  Hourglass,
  FileText,
  GitBranch,
  Split,
  Filter,
  Merge,
  Repeat,
  PencilRuler,
  Shuffle,
  Braces,
  Type,
  Calculator,
  Sparkles,
};

/** Render a lucide icon by its string name (from the node registry). */
export function Icon({
  name,
  ...props
}: { name: string } & LucideProps) {
  const Cmp = ICONS[name];
  if (!Cmp) return createElement(Box, props);
  return createElement(Cmp, props);
}
