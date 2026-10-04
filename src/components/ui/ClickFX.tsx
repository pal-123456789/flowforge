"use client";

import { useEffect } from "react";

/**
 * Global click-feedback system.
 *
 * Uses a single delegated pointerdown listener so EVERY <button> / [role=button]
 * in the app gets a Material-style ripple from the exact click point plus a
 * subtle press-scale — with zero per-button wiring. Opt out of ripple on an
 * element with `data-no-ripple`.
 *
 * Respects prefers-reduced-motion (skips the ripple, keeps the app usable).
 */
export function ClickFX() {
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return; // left click / primary touch only
      const path = e.composedPath?.() ?? [];
      let btn: HTMLElement | null = null;
      for (const el of path) {
        if (!(el instanceof HTMLElement)) continue;
        if (
          el.tagName === "BUTTON" ||
          el.getAttribute("role") === "button" ||
          el.dataset.ripple === "true"
        ) {
          btn = el;
          break;
        }
        if (el.dataset.noRipple === "true") return;
      }
      if (!btn) return;
      if (btn.dataset.noRipple === "true") return;
      if (btn.hasAttribute("disabled")) return;

      const rect = btn.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // ensure the host can contain an absolutely-positioned ripple
      const cs = getComputedStyle(btn);
      if (cs.position === "static") btn.style.position = "relative";
      if (cs.overflow === "visible") btn.style.overflow = "hidden";

      const size = Math.max(rect.width, rect.height) * 2;
      const span = document.createElement("span");
      span.className = "fx-ripple";
      span.style.width = span.style.height = `${size}px`;
      span.style.left = `${e.clientX - rect.left - size / 2}px`;
      span.style.top = `${e.clientY - rect.top - size / 2}px`;
      btn.appendChild(span);
      span.addEventListener("animationend", () => span.remove(), {
        once: true,
      });
      // safety cleanup
      window.setTimeout(() => span.remove(), 800);
    };

    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return null;
}
