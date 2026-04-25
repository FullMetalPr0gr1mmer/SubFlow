"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "default" | "success" | "error";

interface ToastItem {
  id: number;
  title?: string;
  description?: string;
  kind: ToastKind;
}

interface ToastContextValue {
  push: (t: Omit<ToastItem, "id">) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const idRef = React.useRef(0);

  const push = React.useCallback((t: Omit<ToastItem, "id">) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, ...t }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {toasts.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            className={cn(
              "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 pr-8 shadow-lg transition-all animate-slide-up",
              "data-[state=open]:animate-slide-up data-[state=closed]:opacity-0",
            )}
          >
            <div
              className={cn(
                "mt-1 h-2 w-2 shrink-0 rounded-full",
                t.kind === "success" && "bg-success",
                t.kind === "error" && "bg-danger",
                t.kind === "default" && "bg-brand",
              )}
            />
            <div className="flex-1">
              {t.title && (
                <ToastPrimitive.Title className="text-sm font-semibold text-ink">{t.title}</ToastPrimitive.Title>
              )}
              {t.description && (
                <ToastPrimitive.Description className="mt-0.5 text-sm text-ink-muted">
                  {t.description}
                </ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close className="absolute right-2 top-2 rounded-md p-1 text-ink-muted hover:bg-slate-100">
              <X className="h-4 w-4" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-6 right-6 z-[100] flex w-96 max-w-full flex-col gap-2 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
