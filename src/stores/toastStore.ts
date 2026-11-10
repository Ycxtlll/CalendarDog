import { create } from "zustand";

export interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

interface ToastState {
  toasts: Toast[];
  push: (message: string, type?: Toast["type"]) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (message, type = "success") => {
    const id = nextId++;
    set((st) => ({ toasts: [...st.toasts, { id, type, message }] }));
    setTimeout(() => get().dismiss(id), 4000);
  },
  dismiss: (id) =>
    set((st) => ({ toasts: st.toasts.filter((t) => t.id !== id) })),
}));

export const toast = (message: string, type: Toast["type"] = "success") =>
  useToastStore.getState().push(message, type);
