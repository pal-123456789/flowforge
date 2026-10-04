"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "warning" | "info";

interface ToastAction {
  label: string;
  /** Called when the action is clicked. Return nothing. */
  onClick: () => void;
}

interface ToastOptions {
  /** Auto-dismiss delay in ms. Defaults to 4200. Pass 0 to make it sticky. */
  duration?: number;
  /** Optional inline action button. */
  action?: ToastAction;
}

interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  message?: string;
  action?: ToastAction;
}

interface ToastCtx {
  toast: (
    kind: ToastKind,
    title: string,
    message?: string,
    options?: ToastOptions
  ) => void;
  dismiss: (id: string) => void;
}

const Ctx = createContext<ToastCtx>({ toast: () => {}, dismiss: () => {} });

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

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback<ToastCtx["toast"]>(
    (kind, title, message, options) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [
        ...t,
        { id, kind, title, message, action: options?.action },
      ]);
      const duration = options?.duration ?? 4200;
      if (duration > 0) {
        setTimeout(() => {
          setToasts((t) => t.filter((x) => x.id !== id));
        }, duration);
      }
    },
    []
  );

  return (
    <Ctx.Provider value={{ toast, dismiss }}>
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
                {t.action && (
                  <button
                    onClick={() => {
                      t.action!.onClick();
                      dismiss(t.id);
                    }}
                    className={cn(
                      "mt-2 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                      "border-line text-ink-soft hover:border-brand/50 hover:text-ink"
                    )}
                  >
                    {t.action.label}
                  </button>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
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
