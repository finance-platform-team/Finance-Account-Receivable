import type { ToastItem } from '../types';
import { Toast } from './Toast';

interface ToastRackProps {
  toasts: ToastItem[];
}

export function ToastRack({ toasts }: ToastRackProps) {
  return (
    <>
      {toasts.map((toast, i) => (
        <Toast key={toast.id} toast={toast} index={i} />
      ))}
    </>
  );
}
