"use client";

import { useCallback, useEffect, useState } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "flowforge:theme";

/** Read the persisted theme, defaulting to dark. */
export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

/** Apply a theme to <html> and persist it. */
export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "light") root.setAttribute("data-theme", "light");
  else root.removeAttribute("data-theme");
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent("flowforge:theme", { detail: theme }));
}

/**
 * Inline script (string) that runs before paint to set data-theme and avoid a
 * flash of the wrong theme. Injected in the document <head>.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");if(t==="light"){document.documentElement.setAttribute("data-theme","light");}}catch(e){}})();`;

/** React hook to read + toggle the current theme, synced across the app. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(getStoredTheme());
    const onChange = (e: Event) => {
      const t = (e as CustomEvent<Theme>).detail;
      if (t) setTheme(t);
    };
    window.addEventListener("flowforge:theme", onChange as EventListener);
    return () =>
      window.removeEventListener("flowforge:theme", onChange as EventListener);
  }, []);

  const toggle = useCallback(() => {
    const next: Theme = getStoredTheme() === "light" ? "dark" : "light";
    applyTheme(next);
  }, []);

  const set = useCallback((t: Theme) => applyTheme(t), []);

  return { theme, toggle, set };
}
