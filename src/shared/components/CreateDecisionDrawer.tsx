import { useEffect, useState } from 'react';
import { Cfm_tmshandoffscfm_priority } from '../../generated/models/Cfm_tmshandoffsModel';
import { UserCombo } from './UserCombo';
import type { UserOption } from './UserCombo';

export interface DecisionFormInput {
  title: string;
  description: string;
  actionToBeTaken: string;
  assigneeId: string;
  assigneeName: string;
  priority: number | null;
  dueDate: string;
}

interface CreateDecisionDrawerProps {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (input: DecisionFormInput) => Promise<void>;
}

const PRIORITY_OPTIONS = Object.entries(Cfm_tmshandoffscfm_priority).map(([value, label]) => ({
  value: Number(value),
  label,
}));

function todayLabel(): string {
  return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function CreateDecisionDrawer({ open, submitting, onClose, onSubmit }: CreateDecisionDrawerProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [actionToBeTaken, setActionToBeTaken] = useState('');
  const [assignee, setAssignee] = useState<UserOption | null>(null);
  const [priority, setPriority] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle('');
      setDescription('');
      setActionToBeTaken('');
      setAssignee(null);
      setPriority('');
      setDueDate('');
      setError('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Enter a decision title.');
      return;
    }
    if (!assignee) {
      setError('Select an assignee.');
      return;
    }
    if (!dueDate) {
      setError('Select a due date.');
      return;
    }
    setError('');
    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      actionToBeTaken: actionToBeTaken.trim(),
      assigneeId: assignee.id,
      assigneeName: assignee.name,
      priority: priority === '' ? null : Number(priority),
      dueDate,
    });
  };

  return (
    <>
      <div className={`acc-scrim${open ? ' on' : ''}`} onClick={onClose} />
      <aside className={`acc-drawer${open ? ' on' : ''}`}>
        <div className="acc-dhead">
          <h2>
            <i className="fa-solid fa-clipboard-check" style={{ color: 'var(--gold)', fontSize: 16 }} />
            Create Task Decision
          </h2>
          <button className="acc-dclose" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="acc-dbody">
          <div className={`acc-err${error ? ' on' : ''}`}>{error}</div>

          <div className="acc-fld">
            <label>
              Title <span style={{ color: 'var(--bad)' }}>*</span>
            </label>
            <input placeholder="Enter decision title…" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="acc-fld">
            <label>Description</label>
            <textarea
              placeholder="Describe the decision or action required…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="acc-fld">
            <label>Action to be Taken</label>
            <input
              placeholder="Enter action to be taken…"
              value={actionToBeTaken}
              onChange={(e) => setActionToBeTaken(e.target.value)}
            />
          </div>

          <div className="acc-fld">
            <label>
              Assignee <span style={{ color: 'var(--bad)' }}>*</span>
            </label>
            <UserCombo valueLabel={assignee?.name ?? ''} onChange={setAssignee} />
          </div>

          <div className="acc-fld">
            <label>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="">Select priority…</option>
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="acc-fld">
              <label>Start Date</label>
              <input value={todayLabel()} disabled />
            </div>
            <div className="acc-fld">
              <label>
                Due Date <span style={{ color: 'var(--bad)' }}>*</span>
              </label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="acc-dfoot">
          <button className="acc-btn acc-btn-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="acc-btn acc-btn-primary" disabled={submitting} onClick={handleSubmit}>
            <i className="fa-solid fa-paper-plane" /> {submitting ? 'Sending…' : 'Send Decision'}
          </button>
        </div>
      </aside>
    </>
  );
}
