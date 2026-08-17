import { useEffect, useState } from 'react';
import { MutedDash } from '../../../shared/components/MutedDash';
import { BuCombo } from '../../../shared/components/BuCombo';
import type { BuOption } from '../../../shared/components/BuCombo';
import { NOTES_MAX_LENGTH } from '../normalize';
import type { AgingRow } from '../types';

type BucketKey = 'notDue' | 'lt30' | 'b3160' | 'b6190' | 'b91120' | 'gt120';

interface BucketDef {
  key: BucketKey;
  label: string;
  danger?: boolean;
}

const BUCKETS: BucketDef[] = [
  { key: 'notDue', label: 'Not Due' },
  { key: 'lt30', label: '< 30 Days' },
  { key: 'b3160', label: '31–60' },
  { key: 'b6190', label: '61–90' },
  { key: 'b91120', label: '91–120', danger: true },
  { key: 'gt120', label: '> 120 Days', danger: true },
];

interface AgingDrawerProps {
  row: AgingRow | null;
  open: boolean;
  onClose: () => void;
  onSaveNote: (row: AgingRow, note: string) => Promise<void>;
  onSaveType: (row: AgingRow, buId: string, buName: string) => Promise<void>;
}

export function AgingDrawer({ row, open, onClose, onSaveNote, onSaveType }: AgingDrawerProps) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingType, setSavingType] = useState(false);
  // Keep showing the last-selected row's data while the drawer slides shut
  // (row goes null right away) so the closing animation doesn't flash empty.
  const [displayRow, setDisplayRow] = useState<AgingRow | null>(null);

  useEffect(() => {
    if (row) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayRow(row);
      setNote(row.notes);
    }
  }, [row]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const r = displayRow;
  const total = r ? r.notDue + r.lt30 + r.b3160 + r.b6190 + r.b91120 + r.gt120 : 0;

  const handleSaveNote = async () => {
    if (!r) return;
    setSaving(true);
    try {
      await onSaveNote(r, note);
    } finally {
      setSaving(false);
    }
  };

  const handlePickType = async (opt: BuOption) => {
    if (!r) return;
    setSavingType(true);
    try {
      await onSaveType(r, opt.id, opt.name);
    } finally {
      setSavingType(false);
    }
  };

  return (
    <>
      <div className={`acc-scrim${open ? ' on' : ''}`} onClick={onClose} />
      <aside className={`acc-drawer${open ? ' on' : ''}`} role="dialog" aria-label={r ? `${r.name} detail` : undefined}>
        <div className="acc-dhead">
          <div>
            <h2>
              <i className="fa-solid fa-building" style={{ color: 'var(--gold)', fontSize: 16 }} />
              {r?.name ?? ''}
            </h2>
            {r && (
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                {r.code} · {r.type}
              </div>
            )}
          </div>
          <button className="acc-dclose" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="acc-dbody">
          {r && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                <div className="acc-ro-wrap">
                  <div className="acc-ro-label">Payment Term</div>
                  <div className="acc-ro-value">
                    <MutedDash value={r.paymentTerm} />
                  </div>
                </div>
                <div className="acc-ro-wrap">
                  <div className="acc-ro-label">Customer Class</div>
                  <div className="acc-ro-value">
                    <MutedDash value={r.customerClass} />
                  </div>
                </div>
                <div className="acc-ro-wrap">
                  <div className="acc-ro-label">Company Type</div>
                  <div className="acc-ro-value">
                    <MutedDash value={r.companyType} />
                  </div>
                </div>
                <div className="acc-fld" style={{ marginBottom: 0 }}>
                  <label>Type (BU) {savingType && <span style={{ color: 'var(--muted)', fontWeight: 400 }}>Saving…</span>}</label>
                  <BuCombo valueLabel={r.type === '—' ? '' : r.type} onChange={handlePickType} placeholder="Search…" />
                </div>
                <div className="acc-ro-wrap">
                  <div className="acc-ro-label">Task Owner</div>
                  <div className="acc-ro-value">
                    <MutedDash value={r.taskOwner} />
                  </div>
                </div>
                <div className="acc-ro-wrap">
                  <div className="acc-ro-label">Supervisor</div>
                  <div className="acc-ro-value">
                    <MutedDash value={r.supervisor} />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: 'var(--brown)',
                    marginBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                  }}
                >
                  <i className="fa-solid fa-hourglass" style={{ color: 'var(--gold)' }} /> Aging Buckets — from DotCare
                </div>
                {BUCKETS.map((b) => {
                  const value = r[b.key];
                  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
                  return (
                    <div
                      key={b.key}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '82px 1fr 74px',
                        alignItems: 'center',
                        gap: 10,
                        padding: '6px 0',
                      }}
                    >
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink)' }}>{b.label}</div>
                      <div style={{ height: 7, borderRadius: 999, background: 'var(--line)', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            borderRadius: 999,
                            width: `${pct}%`,
                            background: b.danger ? 'var(--bad)' : 'var(--gold)',
                          }}
                        />
                      </div>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono',monospace",
                          fontSize: 12,
                          fontWeight: 700,
                          textAlign: 'right',
                          color: 'var(--ink)',
                        }}
                      >
                        <MutedDash value={value ? value.toLocaleString('en-US') : null} />
                      </div>
                    </div>
                  );
                })}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: '1px dashed var(--line)',
                  }}
                >
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--brown)' }}>Total Outstanding</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 15, fontWeight: 800, color: 'var(--ink)' }}>
                    {total.toLocaleString('en-US')}
                  </div>
                </div>
              </div>

              <div className="acc-fld">
                <label>Notes</label>
                <textarea
                  placeholder="Add a note for this company…"
                  value={note}
                  maxLength={NOTES_MAX_LENGTH}
                  onChange={(e) => setNote(e.target.value)}
                />
                <div className="acc-hint">
                  {note.length}/{NOTES_MAX_LENGTH}
                </div>
              </div>
              <button
                type="button"
                className="acc-btn acc-btn-primary"
                disabled={saving || note === r.notes}
                onClick={handleSaveNote}
              >
                <i className="fa-solid fa-floppy-disk" /> {saving ? 'Saving…' : 'Save Note'}
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
