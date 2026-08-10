import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, description: string, duration?: number) => void;
  showSuccess: (title: string, description: string) => void;
  showError: (title: string, description: string) => void;
  showInfo: (title: string, description: string) => void;
  showWarning: (title: string, description: string) => void;
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, title: string, description: string, duration = 4000) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: ToastMessage = { id, type, title, description, duration };
      
      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const showSuccess = useCallback((title: string, description: string) => {
    showToast("success", title, description);
  }, [showToast]);

  const showError = useCallback((title: string, description: string) => {
    showToast("error", title, description);
  }, [showToast]);

  const showInfo = useCallback((title: string, description: string) => {
    showToast("info", title, description);
  }, [showToast]);

  const showWarning = useCallback((title: string, description: string) => {
    showToast("warning", title, description);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo, showWarning, toasts, removeToast }}>
      {children}
      
      {/* Toast Portal Container */}
      <div 
        id="toast-portal-container"
        className="fixed top-5 right-5 z-55 flex flex-col gap-3 max-w-sm w-full pointer-events-none"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            let bgColor = "bg-white border-slate-200 text-slate-900 shadow-lg";
            let iconColor = "text-slate-500";
            let Icon = Info;

            if (toast.type === "success") {
              bgColor = "bg-slate-900/95 border-emerald-500/40 text-slate-100 shadow-emerald-950/20";
              iconColor = "text-emerald-400";
              Icon = CheckCircle2;
            } else if (toast.type === "error") {
              bgColor = "bg-rose-950/95 border-rose-550/40 text-rose-50 shadow-rose-950/30";
              iconColor = "text-rose-400";
              Icon = AlertCircle;
            } else if (toast.type === "warning") {
              bgColor = "bg-amber-950/95 border-amber-550/40 text-amber-50 shadow-amber-950/20";
              iconColor = "text-amber-400";
              Icon = AlertTriangle;
            } else if (toast.type === "info") {
              bgColor = "bg-sky-950/95 border-sky-550/40 text-sky-50 shadow-sky-950/20";
              iconColor = "text-sky-400";
              Icon = Info;
            }

            return (
              <motion.div
                key={toast.id}
                id={toast.id}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.95, x: 50 }}
                animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 100, transition: { duration: 0.15 } }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className={`pointer-events-auto w-full border ${bgColor} p-4 rounded-xl shadow-xl flex gap-3 block backdrop-blur-md`}
              >
                <div className={`mt-0.5 shrink-0 ${iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold tracking-wide font-display text-white">
                    {toast.title}
                  </h4>
                  <p className="text-[11px] leading-snug text-slate-300 mt-1">
                    {toast.description}
                  </p>
                </div>
                <button
                  type="button"
                  id={`${toast.id}-close-btn`}
                  onClick={() => removeToast(toast.id)}
                  className="shrink-0 h-6 w-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
