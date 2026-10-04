import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "var(--c-bg)",
          soft: "var(--c-bg-soft)",
          panel: "var(--c-bg-panel)",
          elevated: "var(--c-bg-elevated)",
          glass: "var(--c-bg-glass)",
        },
        line: {
          DEFAULT: "var(--c-line)",
          soft: "var(--c-line-soft)",
          bright: "var(--c-line-bright)",
        },
        ink: {
          DEFAULT: "var(--c-ink)",
          soft: "var(--c-ink-soft)",
          dim: "var(--c-ink-dim)",
          faint: "var(--c-ink-faint)",
        },
        brand: {
          DEFAULT: "#7c5cff",
          soft: "#9d84ff",
          dim: "#5b3fd6",
          deep: "#3d2a9e",
        },
        iris: "#06b6d4",
        magenta: "#ec4899",
        amber: "#f59e0b",
        emerald: "#22c55e",
        trigger: "#22c55e",
        action: "#3b82f6",
        logic: "#f59e0b",
        data: "#ec4899",
        ai: "#06b6d4",
        ok: "#22c55e",
        warn: "#f59e0b",
        err: "#ef4444",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        display: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-0.045em",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(124,92,255,0.4), 0 8px 40px -8px rgba(124,92,255,0.5)",
        "glow-lg":
          "0 0 0 1px rgba(124,92,255,0.35), 0 20px 80px -12px rgba(124,92,255,0.55)",
        node: "0 4px 24px -6px rgba(0,0,0,0.6)",
        "node-lg": "0 20px 60px -16px rgba(0,0,0,0.75)",
        inset: "inset 0 1px 0 0 rgba(255,255,255,0.05)",
        "glass-edge":
          "inset 0 1px 0 0 rgba(255,255,255,0.07), inset 0 -1px 0 0 rgba(0,0,0,0.3)",
      },
      backgroundImage: {
        "aurora":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,92,255,0.35), transparent), radial-gradient(ellipse 60% 50% at 80% 50%, rgba(6,182,212,0.18), transparent), radial-gradient(ellipse 60% 50% at 20% 60%, rgba(236,72,153,0.14), transparent)",
        "grid-dots":
          "radial-gradient(circle, rgba(46,51,80,0.6) 1px, transparent 1px)",
        "shine":
          "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)",
        "brand-gradient":
          "linear-gradient(135deg, #9d84ff 0%, #7c5cff 40%, #06b6d4 100%)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(124,92,255,0.5)" },
          "70%": { boxShadow: "0 0 0 8px rgba(124,92,255,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(124,92,255,0)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        "float-slow": {
          "0%,100%": { transform: "translateY(0) translateX(0)" },
          "33%": { transform: "translateY(-10px) translateX(6px)" },
          "66%": { transform: "translateY(8px) translateX(-6px)" },
        },
        "aurora-drift": {
          "0%,100%": { transform: "translate(0,0) scale(1)", opacity: "0.8" },
          "50%": { transform: "translate(4%,-3%) scale(1.08)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "glow-pulse": {
          "0%,100%": { opacity: "0.5", filter: "blur(60px)" },
          "50%": { opacity: "0.9", filter: "blur(80px)" },
        },
        "gradient-x": {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.94)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        blink: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "border-flow": {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-up": "slide-up 0.25s ease-out",
        "pulse-ring": "pulse-ring 1.4s ease-out infinite",
        float: "float 6s ease-in-out infinite",
        "float-slow": "float-slow 12s ease-in-out infinite",
        "aurora-drift": "aurora-drift 14s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
        marquee: "marquee 30s linear infinite",
        "spin-slow": "spin-slow 18s linear infinite",
        "glow-pulse": "glow-pulse 6s ease-in-out infinite",
        "gradient-x": "gradient-x 6s ease infinite",
        "scale-in": "scale-in 0.3s cubic-bezier(0.22,1,0.36,1)",
        blink: "blink 1.1s step-end infinite",
        "border-flow": "border-flow 4s ease infinite",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.22, 1, 0.36, 1)",
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
