"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/** Thin gradient progress bar fixed to the top of the viewport. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    restDelta: 0.001,
  });
  return (
    <motion.div
      style={{ scaleX }}
      className="scroll-progress fixed left-0 top-0 z-[60] h-[3px] w-full origin-left"
    />
  );
}
