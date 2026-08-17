import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { fmtEGP, UPDATE_TYPE_OPTIONS } from '../normalize';
import { useDisputeHistory } from '../useDisputeHistory';
import type { DisputeRow } from '../types';

interface DetailModalProps {
  row: DisputeRow | null;
  onClose: () => void;
  onToast: (title: string, message: string, kind: 'success' | 'alert' | 'info') => void;
}

function todayValue(): string {
  return new Date().toISOString().slice(0, 10);
}

const factsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 1,
  background: 'var(--line)',
  border: '1px solid var(--line)',
  borderRadius: 10,
  overflow: 'hidden',
  marginBottom: 18,
};

const factCellStyle: CSSProperties = { background: 'var(--card)', padding: '11px 13px' };

const factLabelStyle: CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '.05em',
  color: 'var(--muted)',
};

const sectLblStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '.05em',
  color: 'var(--muted)',
  margin: '4px 0 12px',
};

function Fact({ label, value, amt }: { label: string; value: ReactNode; amt?: boolean }) {
  return (
    <div style={factCellStyle}>
      <div style={factLabelStyle}>{label}</div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--ink)',
          marginTop: 4,
          ...(amt ? { fontFamily: "'JetBrains Mono',monospace", color: 'var(--gold)' } : null),
        }}
      >
        {value}
      </div>
    </div>
  );
}

export function DetailModal({ row, onClose, onToast }: DetailModalProps) {
  const [displayRow, setDisplayRow] = useState<DisputeRow | null>(row);
  const open = row !== null;

  useEffect(() => {
    if (row) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayRow(row);
    }
  }, [row]);

  const { history, loading, error, addUpdate } = useDisputeHistory(displayRow?.id ?? null);
  const [date, setDate] = useState(todayValue());
  const [type, setType] = useState<number>(UPDATE_TYPE_OPTIONS[0]?.value ?? 0);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (row) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDate(todayValue());
      setType(UPDATE_TYPE_OPTIONS[0]?.value ?? 0);
      setNote('');
    }
  }, [row]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleAddUpdate = async () => {
    if (!note.trim()) {
      onToast('Missing note', 'Enter what happened.', 'alert');
      return;
    }
    setSaving(true);
    try {
      await addUpdate({
        typeValue: type,
        note: note.trim(),
        dateIso: date ? new Date(`${date}T00:00:00`).toISOString() : null,
      });
      onToast('Update added', 'The history entry was saved.', 'success');
      setNote('');
    } catch (err) {
      onToast('Could not add update', err instanceof Error ? err.message : 'Unknown error.', 'alert');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className={`acc-scrim${open ? ' on' : ''}`} onClick={onClose} />
      <aside className={`acc-drawer${open ? ' on' : ''}`}>
        <div className="acc-dhead">
          <h2>
            <i className="fa-solid fa-scale-balanced" style={{ color: 'var(--gold)', fontSize: 16 }} />
            {displayRow && (
              <span dir="auto">
                {displayRow.name} · {displayRow.code} · {displayRow.category}
              </span>
            )}
          </h2>
          <button className="acc-dclose" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="acc-dbody">
          {displayRow && (
            <>
              <div style={factsGridStyle}>
                <Fact label="Amount" value={fmtEGP(displayRow.amount)} amt />
                <Fact label="Total Claim" value={fmtEGP(displayRow.totalClaim)} amt />
                <Fact label="Due (Y/M)" value={displayRow.due} />
                <Fact label="AR Review" value={displayRow.arReview} />
              </div>

              <div style={sectLblStyle}>History</div>
              {loading ? (
                <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 20 }}>Loading…</div>
              ) : error ? (
                <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 20 }}>
                  <i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--bad)' }} /> History
                  unavailable — {error}
                </div>
              ) : history.length === 0 ? (
                <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 20 }}>
                  No history yet. Add the first update below.
                </div>
              ) : (
                <div style={{ position: 'relative', paddingLeft: 22, marginBottom: 20 }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: 5,
                      top: 4,
                      bottom: 4,
                      width: 2,
                      background: 'var(--line)',
                    }}
                  />
                  {history.map((h) => (
                    <div key={h.id} style={{ position: 'relative', marginBottom: 15 }}>
                      <div
                        style={{
                          position: 'absolute',
                          left: -22,
                          top: 3,
                          width: 11,
                          height: 11,
                          borderRadius: '50%',
                          background: 'var(--gold)',
                          border: '2px solid var(--card)',
                          boxShadow: '0 0 0 1px var(--gold)',
                        }}
                      />
                      <div
                        style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}
                      >
                        <span style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--brown)' }}>{h.typeLabel}</span>
                        <span style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                          {h.date ? h.date.slice(0, 10) : ''}
                        </span>
                      </div>
                      {h.note && (
                        <div
                          style={{
                            background: 'var(--goldbg)',
                            borderRadius: 10,
                            padding: '8px 11px',
                            marginTop: 6,
                            fontSize: 12,
                            color: 'var(--ink)',
                          }}
                        >
                          {h.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}>
                <div style={sectLblStyle}>Add update</div>
                <div className="acc-fld">
                  <label>Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="acc-fld">
                  <label>Update type</label>
                  <select value={type} onChange={(e) => setType(Number(e.target.value))}>
                    {UPDATE_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="acc-fld">
                  <label>What happened?</label>
                  <textarea placeholder="Free text…" value={note} onChange={(e) => setNote(e.target.value)} />
                </div>
              </div>
            </>
          )}
        </div>
        <div className="acc-dfoot">
          <button className="acc-btn acc-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="acc-btn acc-btn-primary" disabled={saving} onClick={handleAddUpdate}>
            {saving ? (
              'Saving…'
            ) : (
              <>
                <i className="fa-solid fa-paper-plane" /> Add Update
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
