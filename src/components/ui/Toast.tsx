"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "warning" | "info";
interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  message?: string;
}

interface ToastCtx {
  toast: (kind: ToastKind, title: string, message?: string) => void;
}

const Ctx = createContext<ToastCtx>({ toast: () => {} });

export function useToast() {
  return useContext(Ctx);
}

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};
const COLORS = {
  success: "text-ok",
  error: "text-err",
  warning: "text-warn",
  info: "text-brand-soft",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(
    (kind: ToastKind, title: string, message?: string) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t, { id, kind, title, message }]);
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, 4200);
    },
    []
  );

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-[340px]">
        {toasts.map((t) => {
          const Icon = ICONS[t.kind];
          return (
            <div
              key={t.id}
              className="glass border border-line rounded-xl p-3.5 shadow-node animate-slide-up flex gap-3 items-start"
            >
              <Icon size={18} className={cn("mt-0.5 shrink-0", COLORS[t.kind])} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-ink">{t.title}</div>
                {t.message && (
                  <div className="text-xs text-ink-soft mt-0.5 break-words">
                    {t.message}
                  </div>
                )}
              </div>
              <button
                onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
                className="text-ink-dim hover:text-ink transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}
