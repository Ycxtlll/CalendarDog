import { X } from "lucide-react";

import { useToastStore } from "@/stores/toastStore";

export function ToastContainer() {
  const { toasts, dismiss } = useToastStore();
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-5 left-0 right-0 z-[60] flex flex-col items-center gap-2 px-5">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-toast-in pointer-events-auto flex w-full items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg"
        >
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
              t.type === "success" ? "bg-holiday-green" : "bg-work-red"
            }`}
          />
          <span className="flex-1 break-all">{t.message}</span>
          <button
            className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => dismiss(t.id)}
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
