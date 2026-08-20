import { useEffect, useState } from 'react';
import { MutedDash } from '../../../shared/components/MutedDash';
import { badgeClassForStatus } from '../normalize';
import type { TmsHandoffRow } from '../types';

function fmtDate(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface TmsHandoffDrawerProps {
  row: TmsHandoffRow | null;
  open: boolean;
  onClose: () => void;
}

export function TmsHandoffDrawer({ row, open, onClose }: TmsHandoffDrawerProps) {
  // Keep showing the last-selected row while the drawer slides shut (row goes
  // null right away) so the closing animation doesn't flash empty.
  const [displayRow, setDisplayRow] = useState<TmsHandoffRow | null>(null);

  useEffect(() => {
    if (row) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayRow(row);
    }
  }, [row]);

  const r = displayRow;

  return (
    <>
      <div className={`acc-scrim${open ? ' on' : ''}`} onClick={onClose} />
      <aside className={`acc-drawer${open ? ' on' : ''}`} role="dialog" aria-label={r ? `${r.title} detail` : undefined}>
        <div className="acc-dhead">
          <div>
            <h2>
              <i className="fa-solid fa-right-left" style={{ color: 'var(--gold)', fontSize: 16 }} />
              {r?.title ?? ''}
            </h2>
            {r && (
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                {r.taskCode} · {r.decisionId}
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
              <div style={{ marginBottom: 16 }}>
                <span
                  className={badgeClassForStatus(r.statusCode)}
                  style={{ padding: '4px 12px', borderRadius: 999, fontSize: 11.5, fontWeight: 700 }}
                >
                  {r.statusLabel}
                </span>
              </div>

              <div className="acc-grid-2" style={{ marginBottom: 20 }}>
                <div className="acc-ro-wrap">
                  <div className="acc-ro-label">Type / Action</div>
                  <div className="acc-ro-value">
                    <MutedDash value={r.typeAction} />
                  </div>
                </div>
                <div className="acc-ro-wrap">
                  <div className="acc-ro-label">Assignee</div>
                  <div className="acc-ro-value">
                    <MutedDash value={r.assignee} />
                  </div>
                </div>
                <div className="acc-ro-wrap">
                  <div className="acc-ro-label">Priority</div>
                  <div className="acc-ro-value">
                    <MutedDash value={r.priority} />
                  </div>
                </div>
                <div className="acc-ro-wrap">
                  <div className="acc-ro-label">SLA</div>
                  <div className="acc-ro-value">
                    <MutedDash value={r.sla} />
                  </div>
                </div>
                <div className="acc-ro-wrap">
                  <div className="acc-ro-label">Due Date</div>
                  <div className="acc-ro-value">{fmtDate(r.dueDate)}</div>
                </div>
                <div className="acc-ro-wrap">
                  <div className="acc-ro-label">Sent</div>
                  <div className="acc-ro-value">{fmtDate(r.createdOn)}</div>
                </div>
              </div>

              <div className="acc-fld">
                <label>Description</label>
                <div
                  style={{
                    background: 'var(--field-bg)',
                    border: '1px solid var(--line)',
                    borderRadius: 9,
                    padding: '10px 12px',
                    fontSize: 13,
                    color: r.description ? 'var(--ink)' : 'var(--muted)',
                    minHeight: 60,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {r.description || 'No description provided.'}
                </div>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
