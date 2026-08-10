import { useCallback, useRef, useState } from 'react';
import type { ToastItem, ToastKind } from './types';

interface UseToastsResult {
  toasts: ToastItem[];
  push: (title: string, message: string, kind?: ToastKind) => void;
  dismiss: (id: number) => void;
}

export function useToasts(): UseToastsResult {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (title: string, message: string, kind: ToastKind = 'info') => {
      const id = ++seq.current;
      setToasts((prev) => [...prev, { id, title, message, kind }]);
      window.setTimeout(() => dismiss(id), 3600);
    },
    [dismiss]
  );

  return { toasts, push, dismiss };
}
