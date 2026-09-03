import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ConfirmContext } from './confirmContext';
import type { ConfirmOptions } from './confirmContext';
import { Icon } from './components/Icon';

interface PendingConfirm {
  title?: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  danger: boolean;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  // Keeps the last dialog's content visible while the close transition plays,
  // same idiom used by every acc-drawer-based modal in this app.
  const [displayPending, setDisplayPending] = useState<PendingConfirm | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const open = pending !== null;
  const active = pending ?? displayPending;

  useEffect(() => {
    if (pending) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayPending(pending);
    }
  }, [pending]);

  const settle = useCallback((result: boolean) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setPending(null);
  }, []);

  const confirm = useCallback((options: ConfirmOptions | string) => {
    const opts = typeof options === 'string' ? { message: options } : options;
    return new Promise<boolean>((resolve) => {
      // Only one confirmation can be in flight (window.confirm was blocking,
      // so no call site ever needed to queue a second one) — a fresh call
      // simply replaces whatever is pending.
      resolveRef.current = resolve;
      setPending({
        title: opts.title,
        message: opts.message,
        confirmLabel: opts.confirmLabel ?? 'Confirm',
        cancelLabel: opts.cancelLabel ?? 'Cancel',
        danger: opts.danger ?? false,
      });
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') settle(false);
      if (e.key === 'Enter') settle(true);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, settle]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {createPortal(
        <div className={`acc-confirm-scrim${open ? ' on' : ''}`} onClick={() => settle(false)}>
          <div className="acc-confirm-card" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="acc-confirm-head">
              <span className={`acc-confirm-icon${active?.danger ? ' danger' : ''}`}>
                <Icon className={`fa-solid ${active?.danger ? 'fa-triangle-exclamation' : 'fa-circle-question'}`} />
              </span>
              <div style={{ minWidth: 0 }}>
                {active?.title && <h3 className="acc-confirm-title">{active.title}</h3>}
                <div className="acc-confirm-message">{active?.message}</div>
              </div>
            </div>
            <div className="acc-confirm-foot">
              <button className="acc-btn acc-btn-ghost" onClick={() => settle(false)}>
                {active?.cancelLabel}
              </button>
              <button
                className="acc-btn acc-btn-primary"
                style={active?.danger ? { background: 'var(--bad)', borderColor: 'var(--bad)' } : undefined}
                onClick={() => settle(true)}
              >
                {active?.confirmLabel}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </ConfirmContext.Provider>
  );
}
