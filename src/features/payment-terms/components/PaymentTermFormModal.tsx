import { useEffect, useState } from 'react';
import type { PaymentTermRow } from '../types';

interface PaymentTermFormModalProps {
  open: boolean;
  editing: PaymentTermRow | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (input: { name: string; numberOfDays: number }) => Promise<void>;
}

export function PaymentTermFormModal({ open, editing, submitting, onClose, onSubmit }: PaymentTermFormModalProps) {
  const [name, setName] = useState('');
  const [numberOfDays, setNumberOfDays] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(editing?.name ?? '');
      setNumberOfDays(editing ? String(editing.numberOfDays) : '');
      setError('');
    }
  }, [open, editing]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const isEdit = editing !== null;

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const days = Number(numberOfDays);
    if (!trimmedName) {
      setError('Enter a name for this payment term.');
      return;
    }
    if (numberOfDays.trim() === '' || isNaN(days) || days < 0) {
      setError('Enter a valid number of days.');
      return;
    }
    setError('');
    await onSubmit({ name: trimmedName, numberOfDays: days });
  };

  return (
    <>
      <div className={`acc-scrim${open ? ' on' : ''}`} onClick={onClose} />
      <aside className={`acc-drawer${open ? ' on' : ''}`}>
        <div className="acc-dhead">
          <h2>
            <i
              className={`fa-solid ${isEdit ? 'fa-pen' : 'fa-plus'}`}
              style={{ color: 'var(--gold)', fontSize: 16 }}
            />
            {isEdit ? 'Edit Payment Term' : 'New Payment Term'}
          </h2>
          <button className="acc-dclose" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="acc-dbody">
          <div className={`acc-err${error ? ' on' : ''}`}>{error}</div>
          <div className="acc-fld">
            <label>Name</label>
            <input placeholder="e.g. NET 30" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="acc-fld">
            <label>Number of Days</label>
            <input
              type="number"
              min={0}
              step={1}
              placeholder="30"
              value={numberOfDays}
              onChange={(e) => setNumberOfDays(e.target.value)}
            />
          </div>
        </div>
        <div className="acc-dfoot">
          <button className="acc-btn acc-btn-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="acc-btn acc-btn-primary" disabled={submitting} onClick={handleSubmit}>
            {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create'}
          </button>
        </div>
      </aside>
    </>
  );
}
