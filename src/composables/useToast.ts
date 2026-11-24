import { reactive } from 'vue';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

const toasts = reactive<ToastItem[]>([]);
const timers = new Map<number, ReturnType<typeof setTimeout>>();
let seq = 0;

export function dismissToast(id: number): void {
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }

  const index = toasts.findIndex((toast) => toast.id === id);
  if (index >= 0) toasts.splice(index, 1);
}

/** Show a toast for `duration` ms (0 keeps it until dismissed manually). */
export function showToast(message: string, variant: ToastVariant = 'success', duration = 3200): number {
  const id = ++seq;
  toasts.push({ id, message, variant });

  if (duration > 0) {
    timers.set(
      id,
      setTimeout(() => dismissToast(id), duration),
    );
  }

  return id;
}

export function useToast() {
  return { toasts, showToast, dismissToast };
}
