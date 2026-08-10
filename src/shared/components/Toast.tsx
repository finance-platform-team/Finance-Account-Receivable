import { useEffect, useState } from 'react';
import styles from '../shared.module.css';
import type { ToastItem } from '../types';

const TOAST_ICON: Record<ToastItem['kind'], string> = {
  success: 'fa-circle-check',
  alert: 'fa-triangle-exclamation',
  info: 'fa-circle-info',
};

const KIND_CLASS: Record<ToastItem['kind'], string> = {
  success: styles.toastSuccess,
  alert: styles.toastAlert,
  info: styles.toastInfo,
};

interface ToastProps {
  toast: ToastItem;
}

export function Toast({ toast }: ToastProps) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setLeaving(true), 3200);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      className={`${styles.toast} ${KIND_CLASS[toast.kind]}`}
      style={leaving ? { opacity: 0, transform: 'translateX(50px)' } : undefined}
    >
      <div className={styles.toastIcon}>
        <i className={`fa-solid ${TOAST_ICON[toast.kind]}`} />
      </div>
      <div className={styles.toastBody}>
        <div className={styles.toastTitle}>{toast.title}</div>
        <div className={styles.toastMsg}>{toast.message}</div>
      </div>
    </div>
  );
}
