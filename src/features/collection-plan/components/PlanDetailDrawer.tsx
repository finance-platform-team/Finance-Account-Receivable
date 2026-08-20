import { useEffect, useState } from 'react';
import { MutedDash } from '../../../shared/components/MutedDash';
import { fmt, fmtTotal, rowAchievement, rowTargetPlan } from '../normalize';
import type { PlanRow } from '../types';

function achvColor(pct: number): string {
  if (pct >= 100) return 'var(--ok)';
  if (pct >= 60) return 'var(--warn)';
  return 'var(--bad)';
}

interface PlanDetailDrawerProps {
  row: PlanRow | null;
  open: boolean;
  targetPct: number;
  onClose: () => void;
}

export function PlanDetailDrawer({ row, open, targetPct, onClose }: PlanDetailDrawerProps) {
  // Keep showing the last-selected row while the drawer slides shut (row goes
  // null right away) so the closing animation doesn't flash empty.
  const [displayRow, setDisplayRow] = useState<PlanRow | null>(null);

  useEffect(() => {
    if (row) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayRow(row);
    }
  }, [row]);

  const r = displayRow;
  const targetPlan = r ? rowTargetPlan(r, targetPct) : 0;
  const achv = r ? rowAchievement(r, targetPct) : 0;

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
                {r.code} · {r.bu}
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
                <i className="fa-solid fa-address-book" style={{ color: 'var(--gold)' }} /> Company Metadata
              </div>
              <div className="acc-grid-2" style={{ marginBottom: 20 }}>
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
                <div className="acc-ro-wrap">
                  <div className="acc-ro-label">Type (BU)</div>
                  <div className="acc-ro-value">
                    <MutedDash value={r.bu} />
                  </div>
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
                <i className="fa-solid fa-pen-to-square" style={{ color: 'var(--gold)' }} /> Manual Entry — AR Team
              </div>
              <div className="acc-grid-3" style={{ marginBottom: 20 }}>
                <div className="acc-ro-wrap">
                  <div className="acc-ro-label">Early Payment</div>
                  <div className="acc-ro-value">{fmt(r.earlypayment)}</div>
                </div>
                <div className="acc-ro-wrap">
                  <div className="acc-ro-label">Legal Issues</div>
                  <div className="acc-ro-value">{fmt(r.legalissues)}</div>
                </div>
                <div className="acc-ro-wrap">
                  <div className="acc-ro-label">Bankruptcy</div>
                  <div className="acc-ro-value">{fmt(r.bankruptcy)}</div>
                </div>
                <div className="acc-ro-wrap">
                  <div className="acc-ro-label">Claims Issue</div>
                  <div className="acc-ro-value">{fmt(r.claimsissue)}</div>
                </div>
                <div className="acc-ro-wrap">
                  <div className="acc-ro-label">Stopped</div>
                  <div className="acc-ro-value">{fmt(r.stopped)}</div>
                </div>
                <div className="acc-ro-wrap">
                  <div className="acc-ro-label">Agreed Recon.</div>
                  <div className="acc-ro-value">{fmt(r.agreedrecon)}</div>
                </div>
              </div>

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
                <i className="fa-solid fa-calculator" style={{ color: 'var(--gold)' }} /> Calculated / DotCare
              </div>
              <div className="acc-grid-2" style={{ marginBottom: 20 }}>
                <div className="acc-ro-wrap">
                  <div className="acc-ro-label">Total Outstanding</div>
                  <div className="acc-ro-value">{fmt(r.totalOutstanding)}</div>
                </div>
                <div className="acc-ro-wrap">
                  <div className="acc-ro-label">Rejections</div>
                  <div className="acc-ro-value" style={{ color: 'var(--gold)' }}>
                    {fmt(r.rejections)}
                  </div>
                </div>
                <div className="acc-ro-wrap">
                  <div className="acc-ro-label">Outstanding + Rej</div>
                  <div className="acc-ro-value">{fmt(r.outstandingRej)}</div>
                </div>
                <div className="acc-ro-wrap">
                  <div className="acc-ro-label">Total Dues</div>
                  <div className="acc-ro-value">{fmt(r.totalDues)}</div>
                </div>
                <div className="acc-ro-wrap">
                  <div className="acc-ro-label">Target Plan</div>
                  <div className="acc-ro-value" style={{ color: 'var(--ok)' }}>
                    {fmt(targetPlan)}
                  </div>
                </div>
                <div className="acc-ro-wrap">
                  <div className="acc-ro-label">Collected</div>
                  <div className="acc-ro-value">{fmt(r.collected)}</div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: '1px dashed var(--line)',
                }}
              >
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--brown)' }}>Achievement</div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 17,
                    fontWeight: 800,
                    color: achvColor(achv),
                  }}
                >
                  {Math.round(achv)}%
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                Collected + Tax + Rej: <strong style={{ color: 'var(--ink)' }}>{fmtTotal(r.collectedPlus)}</strong>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
