import styles from '../shared.module.css';
import type { ToastItem } from '../types';
import { Toast } from './Toast';

interface ToastRackProps {
  toasts: ToastItem[];
}

export function ToastRack({ toasts }: ToastRackProps) {
  return (
    <div className={styles.toastRack}>
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
