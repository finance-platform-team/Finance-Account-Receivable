import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export interface ConfirmModalConfig {
  title: string;
  titleIcon: string;
  titleColor?: string;
  body: ReactNode;
  commentRequired?: boolean;
  commentPlaceholder?: string;
  confirmLabel: string;
  confirmVariant: 'primary' | 'reject';
  confirmIcon: string;
  onOk: (comment: string) => void | Promise<void>;
}

interface ConfirmModalProps {
  config: ConfirmModalConfig | null;
  onClose: () => void;
}

export function ConfirmModal({ config, onClose }: ConfirmModalProps) {
  const [comment, setComment] = useState('');
  const [showRequiredError, setShowRequiredError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [displayConfig, setDisplayConfig] = useState<ConfirmModalConfig | null>(null);

  const open = config !== null;
  // Keep the drawer's content around after `config` goes back to null (close),
  // so the closing slide-out transition still has something to show — the
  // same reason PaymentTermFormModal never conditionally unmounts.
  const active = config ?? displayConfig;

  useEffect(() => {
    if (config) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayConfig(config);
      setComment('');
      setShowRequiredError(false);
      setSubmitting(false);
    }
  }, [config]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleClose = () => onClose();

  const handleConfirm = async () => {
    if (!active) return;
    if (active.commentRequired && !comment.trim()) {
      setShowRequiredError(true);
      return;
    }
    setSubmitting(true);
    await active.onOk(comment.trim());
    handleClose();
  };

  return (
    <>
      <div className={`acc-scrim${open ? ' on' : ''}`} onClick={handleClose} />
      <aside className={`acc-drawer${open ? ' on' : ''}`} role="dialog">
        <div className="acc-dhead">
          <h2>
            <i
              className={`fa-solid ${active?.titleIcon ?? ''}`}
              style={{ color: active?.titleColor ?? 'var(--gold)', fontSize: 16 }}
            />
            {active?.title}
          </h2>
          <button className="acc-dclose" onClick={handleClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="acc-dbody">
          <div style={{ fontSize: 13.5, color: 'var(--ink)', marginBottom: active?.commentPlaceholder !== undefined ? 16 : 0 }}>
            {active?.body}
          </div>
          {active?.commentPlaceholder !== undefined && (
            <div className="acc-fld">
              <label>
                Comment{' '}
                {active.commentRequired ? (
                  <span style={{ color: 'var(--bad)' }}>*</span>
                ) : (
                  <span style={{ color: 'var(--muted)', fontWeight: 400, fontStyle: 'italic' }}>(optional)</span>
                )}
              </label>
              <textarea
                placeholder={active.commentPlaceholder}
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  if (showRequiredError) setShowRequiredError(false);
                }}
              />
              <div className={`acc-err${showRequiredError ? ' on' : ''}`}>A comment is required to reject an entry.</div>
            </div>
          )}
        </div>
        <div className="acc-dfoot">
          <button className="acc-btn acc-btn-ghost" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="acc-btn acc-btn-primary"
            style={active?.confirmVariant === 'reject' ? { background: 'var(--bad)', borderColor: 'var(--bad)' } : undefined}
            onClick={handleConfirm}
            disabled={submitting}
          >
            <i className={`fa-solid ${active?.confirmIcon ?? ''}`} /> {submitting ? 'Working…' : active?.confirmLabel}
          </button>
        </div>
      </aside>
    </>
  );
}
