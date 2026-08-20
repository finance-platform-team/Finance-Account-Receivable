import { useEffect, useState } from 'react';
import { UserCombo } from '../../../shared/components/UserCombo';
import type { UserOption } from '../../../shared/components/UserCombo';
import { SLA_TYPE_OPTIONS } from '../normalize';
import type { SlaFormInput, SlaRow } from '../types';

interface SlaFormDrawerProps {
  open: boolean;
  editing: SlaRow | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (input: SlaFormInput) => Promise<void>;
  onDelete: (row: SlaRow) => void;
}

const EMPTY_FORM: SlaFormInput = {
  action: '',
  slaTypeValue: null,
  slaValue: '',
  responsibleId: null,
  responsibleName: '',
  escalationRule: '',
  department1: '',
  manager1Id: null,
  manager1Name: '',
  department2: '',
  manager2Id: null,
  manager2Name: '',
  deduction: '',
};

export function SlaFormDrawer({ open, editing, submitting, onClose, onSubmit, onDelete }: SlaFormDrawerProps) {
  const [form, setForm] = useState<SlaFormInput>(EMPTY_FORM);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(
        editing
          ? {
              action: editing.action === '—' ? '' : editing.action,
              slaTypeValue: editing.slaTypeValue,
              slaValue: editing.slaValue,
              responsibleId: editing.responsibleId,
              responsibleName: editing.responsibleName === '—' ? '' : editing.responsibleName,
              escalationRule: editing.escalationRule,
              department1: editing.department1,
              manager1Id: editing.manager1Id,
              manager1Name: editing.manager1Name === '—' ? '' : editing.manager1Name,
              department2: editing.department2,
              manager2Id: editing.manager2Id,
              manager2Name: editing.manager2Name === '—' ? '' : editing.manager2Name,
              deduction: editing.deduction,
            }
          : EMPTY_FORM
      );
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

  const set = <K extends keyof SlaFormInput>(key: K, value: SlaFormInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const pickUser = (key: 'responsible' | 'manager1' | 'manager2') => (opt: UserOption) => {
    if (key === 'responsible') {
      set('responsibleId', opt.id);
      set('responsibleName', opt.name);
    } else if (key === 'manager1') {
      set('manager1Id', opt.id);
      set('manager1Name', opt.name);
    } else {
      set('manager2Id', opt.id);
      set('manager2Name', opt.name);
    }
  };

  const handleSubmit = async () => {
    if (!form.action.trim()) {
      setError('Enter an action.');
      return;
    }
    setError('');
    await onSubmit(form);
  };

  return (
    <>
      <div className={`acc-scrim${open ? ' on' : ''}`} onClick={onClose} />
      <aside className={`acc-drawer${open ? ' on' : ''}`}>
        <div className="acc-dhead">
          <h2>
            <i className="fa-solid fa-stopwatch" style={{ color: 'var(--gold)', fontSize: 16 }} />
            {editing ? 'Edit SLA Rule' : 'New SLA Rule'}
          </h2>
          <button className="acc-dclose" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="acc-dbody">
          <div className={`acc-err${error ? ' on' : ''}`}>{error}</div>

          <div className="acc-fld">
            <label>
              Action <span style={{ color: 'var(--bad)' }}>*</span>
            </label>
            <input
              placeholder="e.g. Assign Task Owner and Supervisor"
              value={form.action}
              onChange={(e) => set('action', e.target.value)}
            />
          </div>

          <div className="acc-grid-2">
            <div className="acc-fld">
              <label>SLA Type</label>
              <select
                value={form.slaTypeValue ?? ''}
                onChange={(e) => set('slaTypeValue', e.target.value === '' ? null : Number(e.target.value))}
              >
                <option value="">— none —</option>
                {SLA_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="acc-fld">
              <label>SLA (hours / date)</label>
              <input placeholder="e.g. 24 or 1 working day" value={form.slaValue} onChange={(e) => set('slaValue', e.target.value)} />
            </div>
          </div>

          <div className="acc-fld">
            <label>Responsible</label>
            <UserCombo valueLabel={form.responsibleName} onChange={pickUser('responsible')} />
          </div>

          <div className="acc-fld">
            <label>Escalation Rule</label>
            <input
              placeholder="e.g. Assignment pending after cutoff"
              value={form.escalationRule}
              onChange={(e) => set('escalationRule', e.target.value)}
            />
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--brown)', margin: '18px 0 10px' }}>
            Escalation Level 1
          </div>
          <div className="acc-grid-2">
            <div className="acc-fld">
              <label>Department 1</label>
              <input placeholder="Department" value={form.department1} onChange={(e) => set('department1', e.target.value)} />
            </div>
            <div className="acc-fld">
              <label>Role / Manager 1</label>
              <UserCombo valueLabel={form.manager1Name} onChange={pickUser('manager1')} />
            </div>
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--brown)', margin: '18px 0 10px' }}>
            Escalation Level 2
          </div>
          <div className="acc-grid-2">
            <div className="acc-fld">
              <label>Department 2</label>
              <input placeholder="Department" value={form.department2} onChange={(e) => set('department2', e.target.value)} />
            </div>
            <div className="acc-fld">
              <label>Role / Manager 2</label>
              <UserCombo valueLabel={form.manager2Name} onChange={pickUser('manager2')} />
            </div>
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--brown)', margin: '18px 0 10px' }}>
            Deduction
          </div>
          <div className="acc-fld">
            <label>Deduction / Flag</label>
            <input
              placeholder="e.g. KPI flag, Technical SLA flag"
              value={form.deduction}
              onChange={(e) => set('deduction', e.target.value)}
            />
            <div className="acc-hint">Leave blank for CFM/Legal read-only rows (No Networking deduction).</div>
          </div>
        </div>
        <div className="acc-dfoot">
          {editing && (
            <button
              className="acc-btn"
              style={{ color: 'var(--bad)', marginRight: 'auto' }}
              disabled={submitting}
              onClick={() => onDelete(editing)}
            >
              <i className="fa-solid fa-trash" /> Delete
            </button>
          )}
          <button className="acc-btn acc-btn-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="acc-btn acc-btn-primary" disabled={submitting} onClick={handleSubmit}>
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </aside>
    </>
  );
}
