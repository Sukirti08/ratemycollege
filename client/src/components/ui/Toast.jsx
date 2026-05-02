import { useEffect } from "react";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";

// If using a Zustand store, import it here:
// import { useToastStore } from "../../store/toastStore";

const TYPE_CONFIG = {
  success: {
    icon: CheckCircle,
    bg: "bg-green-50",
    border: "border-green-200",
    icon_color: "text-green-500",
    text: "text-green-800",
  },
  error: {
    icon: XCircle,
    bg: "bg-red-50",
    border: "border-red-200",
    icon_color: "text-red-500",
    text: "text-red-800",
  },
  info: {
    icon: Info,
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon_color: "text-blue-500",
    text: "text-blue-800",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    icon_color: "text-yellow-500",
    text: "text-yellow-800",
  },
};

function ToastItem({ toast, onClose }) {
  const config = TYPE_CONFIG[toast.type] || TYPE_CONFIG.info;
  const Icon = config.icon;

  useEffect(() => {
    if (toast.duration !== Infinity) {
      const id = setTimeout(() => onClose(toast.id), toast.duration || 4000);
      return () => clearTimeout(id);
    }
  }, [toast.id, toast.duration, onClose]);

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl border shadow-lg max-w-sm w-full
        ${config.bg} ${config.border}
        animate-[slideUp_0.3s_ease-out]
      `}
      style={{
        animation: "slideUp 0.3s cubic-bezier(0.21,1.02,0.73,1) forwards",
      }}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.icon_color}`} />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className={`font-semibold text-sm ${config.text}`}>{toast.title}</p>
        )}
        {toast.message && (
          <p className={`text-sm ${config.text} ${toast.title ? "opacity-80" : ""}`}>
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className={`shrink-0 p-0.5 rounded-md hover:bg-black/10 transition-colors ${config.text}`}
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

export default function Toast({ toasts: propToasts, onClose: propClose }) {
  // Optionally read from store if no props:
  // const { toasts: storeToasts, remove } = useToastStore();
  // const toasts = propToasts ?? storeToasts;
  // const onClose = propClose ?? remove;

  const toasts = propToasts || [];
  const onClose = propClose || (() => {});

  if (!toasts.length) return null;

  return (
    <div className="fixed z-[9999] bottom-4 right-4 max-sm:right-0 max-sm:left-0 max-sm:flex max-sm:justify-center max-sm:px-4 flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto w-full max-w-sm">
          <ToastItem toast={t} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}
