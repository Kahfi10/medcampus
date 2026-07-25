"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (opts: Omit<Toast, "id">) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastType, React.ReactNode> = {
  success: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="8" fill="#30B86A" />
      <path d="M5.5 9l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="8" fill="#FF3B30" />
      <path d="M6 6l6 6M12 6l-6 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  warning: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="8" fill="#FF9F0A" />
      <path d="M9 5.5v4M9 11.5v.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="8" fill="#0066CC" />
      <path d="M9 8v4M9 6.5v.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

const BORDER_COLOR: Record<ToastType, string> = {
  success: "#30B86A",
  error: "#FF3B30",
  warning: "#FF9F0A",
  info: "#0066CC",
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current,
      { opacity: 0, x: 60, scale: 0.95 },
      { opacity: 1, x: 0, scale: 1, duration: 0.35, ease: "power2.out" }
    );

    const timer = setTimeout(() => {
      if (!ref.current) return;
      gsap.to(ref.current, {
        opacity: 0, x: 40, scale: 0.95, duration: 0.25, ease: "power2.in",
        onComplete: () => onRemove(toast.id),
      });
    }, toast.duration ?? 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      ref={ref}
      className="flex items-start gap-3 bg-white rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border-l-[3px] px-4 py-3.5 min-w-[280px] max-w-[360px] cursor-pointer"
      style={{ borderLeftColor: BORDER_COLOR[toast.type] }}
      onClick={() => onRemove(toast.id)}
    >
      <div className="flex-shrink-0 mt-0.5">{ICONS[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-[#1D1D1F] leading-snug">{toast.title}</p>
        {toast.message && (
          <p className="text-[13px] text-[#6E6E73] mt-0.5 leading-snug">{toast.message}</p>
        )}
      </div>
      <button className="flex-shrink-0 text-[#6E6E73] hover:text-[#1D1D1F] transition-colors mt-0.5">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const add = useCallback((opts: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev.slice(-4), { ...opts, id }]);
  }, []);

  const value: ToastContextValue = {
    toast: add,
    success: (title, message) => add({ type: "success", title, message }),
    error: (title, message) => add({ type: "error", title, message }),
    warning: (title, message) => add({ type: "warning", title, message }),
    info: (title, message) => add({ type: "info", title, message }),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
