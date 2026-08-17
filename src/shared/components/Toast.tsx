import type { ToastItem } from '../types';

const KIND_CLASS: Record<ToastItem['kind'], string> = {
  success: 'acc-toast-ok',
  alert: 'acc-toast-bad',
  info: 'acc-toast-info',
};

interface ToastProps {
  toast: ToastItem;
  index: number;
}

export function Toast({ toast, index }: ToastProps) {
  return (
    <div className={`acc-toast on ${KIND_CLASS[toast.kind]}`} style={{ bottom: 22 + index * 54 }}>
      <strong>{toast.title}</strong>
      {toast.message ? ` — ${toast.message}` : ''}
    </div>
  );
}
