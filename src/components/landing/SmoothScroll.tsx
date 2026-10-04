"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * SmoothScroll — wraps the app in a Lenis smooth-scroll instance.
 * Degrades gracefully: if Lenis fails to init (reduced-motion, SSR edge),
 * the page simply uses native scrolling.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    let lenis: Lenis | null = null;
    let raf = 0;
    try {
      lenis = new Lenis({
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.5,
      });
      const loop = (time: number) => {
        lenis?.raf(time);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);

      // expose instance so modals/overlays can pause smooth-scroll
      (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

      // allow anchor links to drive Lenis
      const onClick = (e: Event) => {
        const target = e.target as HTMLElement;
        const anchor = target.closest<HTMLAnchorElement>('a[href^="#"]');
        if (!anchor) return;
        const id = anchor.getAttribute("href");
        if (!id || id === "#") return;
        const el = document.querySelector(id);
        if (el) {
          e.preventDefault();
          lenis?.scrollTo(el as HTMLElement, { offset: -80 });
        }
      };
      document.addEventListener("click", onClick);
      return () => {
        document.removeEventListener("click", onClick);
        cancelAnimationFrame(raf);
        delete (window as unknown as { __lenis?: Lenis }).__lenis;
        lenis?.destroy();
      };
    } catch {
      cancelAnimationFrame(raf);
      lenis?.destroy();
    }
  }, []);

  return <>{children}</>;
}
