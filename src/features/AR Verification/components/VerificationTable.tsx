import { Fragment } from 'react';
import { MutedDash } from '../../../shared/components/MutedDash';
import { fmt, fmtDate, fmtDateTime, fmtSAR, isLocked, statusIcon, statusPillClass } from '../normalize';
import type { VerificationRow } from '../types';

const COLUMN_COUNT = 23;

interface VerificationTableProps {
  rows: VerificationRow[];
  loading: boolean;
  error: string | null;
  selected: Set<string>;
  expanded: Set<string>;
  onToggleSelect: (id: string, checked: boolean) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onToggleExpand: (id: string) => void;
  onOpenProofFiles: (row: VerificationRow) => void;
}

/** Maps normalize.ts's pill-class names onto this app's tinted badge classes, keeping the same meaning. */
function statusTone(pillClass: string): string {
  switch (pillClass) {
    case 'linked':
      return 'acc-cls-ok';
    case 'rejected':
      return 'acc-cls-bad';
    case 'allocated':
      return 'acc-cls-info';
    case 'bank':
      return 'acc-cls-warn';
    default:
      return 'acc-cls-info';
  }
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: COLUMN_COUNT }).map((__, j) => (
            <td key={j}>
              <div className="acc-skel" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function AllocationTable({ row }: { row: VerificationRow }) {
  return (
    <tr>
      <td colSpan={COLUMN_COUNT} style={{ padding: 0 }}>
        <div style={{ padding: '14px 18px 16px', background: 'var(--cream)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '.06em',
              color: 'var(--muted)',
              marginBottom: 8,
            }}
          >
            <i className="fa-solid fa-layer-group" style={{ color: 'var(--gold)' }} /> Allocations · {row.ref} ·{' '}
            {row.allocs.length} month
            {row.allocs.length === 1 ? '' : 's'}
          </div>
          <div className="acc-tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th className="acc-num">Claim</th>
                  <th className="acc-num">Amount</th>
                  <th className="acc-num">Tax</th>
                  <th className="acc-num">Vol Disc</th>
                  <th className="acc-num">Early Disc</th>
                  <th className="acc-num">Admin</th>
                  <th className="acc-num">Rejection</th>
                  <th className="acc-num">Gross</th>
                </tr>
              </thead>
              <tbody>
                {row.allocs.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="acc-state">No allocations recorded for this entry.</div>
                    </td>
                  </tr>
                ) : (
                  row.allocs.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <MutedDash value={a.month} />
                      </td>
                      <td className="acc-num">
                        <MutedDash value={fmt(a.claim)} />
                      </td>
                      <td className="acc-num">
                        <MutedDash value={fmt(a.amount)} />
                      </td>
                      <td className="acc-num">
                        <MutedDash value={fmt(a.tax)} />
                      </td>
                      <td className="acc-num">
                        <MutedDash value={fmt(a.volumeDiscount)} />
                      </td>
                      <td className="acc-num">
                        <MutedDash value={fmt(a.earlyDiscount)} />
                      </td>
                      <td className="acc-num">
                        <MutedDash value={fmt(a.admin)} />
                      </td>
                      <td className="acc-num">
                        {a.rejection > 0 ? (
                          <span style={{ color: 'var(--bad)', fontWeight: 700 }}>{fmt(a.rejection)}</span>
                        ) : (
                          <MutedDash value={fmt(a.rejection)} />
                        )}
                      </td>
                      <td className="acc-num">
                        <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{fmt(a.gross)}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </td>
    </tr>
  );
}

export function VerificationTable({
  rows,
  loading,
  error,
  selected,
  expanded,
  onToggleSelect,
  onToggleSelectAll,
  onToggleExpand,
  onOpenProofFiles,
}: VerificationTableProps) {
  const selectableOnPage = rows.filter((r) => !isLocked(r.status)).map((r) => r.id);
  const allSelectedOnPage = selectableOnPage.length > 0 && selectableOnPage.every((id) => selected.has(id));

  return (
    <div className="acc-tablewrap">
      <table style={{ minWidth: 2200 }}>
        <thead>
          <tr>
            <th className="acc-check">
              <input
                type="checkbox"
                checked={allSelectedOnPage}
                onChange={(e) => onToggleSelectAll(e.target.checked)}
                aria-label="Select all"
              />
            </th>
            <th />
            <th>
              <i className="fa-solid fa-hashtag" /> Ref
            </th>
            <th>
              <i className="fa-solid fa-building" /> Entity
            </th>
            <th>
              <i className="fa-solid fa-hashtag" /> Company Code
            </th>
            <th>
              <i className="fa-solid fa-briefcase" /> Company Name
            </th>
            <th>
              <i className="fa-solid fa-calendar-day" /> Collection Date
            </th>
            <th>
              <i className="fa-solid fa-credit-card" /> Payment Method
            </th>
            <th>
              <i className="fa-solid fa-building-columns" /> Bank Account
            </th>
            <th className="acc-num">
              <i className="fa-solid fa-coins" /> Collected (Net)
            </th>
            <th>
              <i className="fa-solid fa-calendar-week" /> Allocate to Months
            </th>
            <th>
              <i className="fa-solid fa-file-lines" /> Claim(s)
            </th>
            <th className="acc-num">Tax</th>
            <th className="acc-num">Vol Disc</th>
            <th className="acc-num">Early Disc</th>
            <th className="acc-num">Admin</th>
            <th className="acc-num">Rejection</th>
            <th className="acc-num">Gross</th>
            <th>
              <i className="fa-solid fa-file-signature" /> Proof
            </th>
            <th>
              <i className="fa-solid fa-shield-halved" /> Status
            </th>
            <th>
              <i className="fa-solid fa-user-check" /> Action By
            </th>
            <th>
              <i className="fa-solid fa-clock" /> Action On
            </th>
            <th>
              <i className="fa-solid fa-note-sticky" /> Notes
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <SkeletonRows />
          ) : error ? (
            <tr>
              <td colSpan={COLUMN_COUNT}>
                <div className="acc-state">
                  <i className="fa-solid fa-triangle-exclamation" />
                  Couldn&apos;t load AR Verification entries.
                  <br />
                  <small>{error}</small>
                </div>
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={COLUMN_COUNT}>
                <div className="acc-state">
                  <i className="fa-solid fa-inbox" />
                  No entries to verify.
                  <br />
                  <small>Try clearing filters, or wait for the Collection team to submit new entries.</small>
                </div>
              </td>
            </tr>
          ) : (
            rows.map((r) => {
              const locked = isLocked(r.status);
              const isSelected = selected.has(r.id);
              const isExpanded = expanded.has(r.id);
              return (
                <Fragment key={r.id}>
                  <tr
                    style={{
                      background: isSelected ? 'var(--goldbg)' : undefined,
                      color: locked ? 'var(--muted)' : undefined,
                    }}
                  >
                    <td className="acc-check" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={locked}
                        onChange={(e) => onToggleSelect(r.id, e.target.checked)}
                        aria-label={`Select ${r.ref}`}
                      />
                    </td>
                    <td>
                      <button
                        onClick={() => onToggleExpand(r.id)}
                        aria-label="Expand"
                        style={{ background: 'transparent', border: 'none', color: 'var(--gold)', cursor: 'pointer', padding: '4px 6px' }}
                      >
                        <i
                          className="fa-solid fa-chevron-right"
                          style={{
                            display: 'inline-block',
                            transition: 'transform .2s',
                            transform: isExpanded ? 'rotate(90deg)' : 'none',
                          }}
                        />
                      </button>
                    </td>
                    <td className="acc-code">{r.ref}</td>
                    <td>
                      <span className="acc-cls-gold" style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                        {r.entity}
                      </span>
                    </td>
                    <td className="acc-code">{r.companyCode}</td>
                    <td className="acc-name" dir="auto">
                      {r.companyName}
                    </td>
                    <td>
                      <MutedDash value={fmtDate(r.date)} />
                    </td>
                    <td>
                      <span className="acc-cls-info" style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                        {r.methodLabel}
                      </span>
                    </td>
                    <td>
                      <MutedDash value={r.bankAccount} />
                    </td>
                    <td className="acc-num">
                      <MutedDash value={fmtSAR(r.net)} />
                    </td>
                    <td>
                      <MutedDash value={r.monthsLabel} />
                    </td>
                    <td>
                      <MutedDash value={r.claimsLabel} />
                    </td>
                    <td className="acc-num">
                      <MutedDash value={fmt(r.tax)} />
                    </td>
                    <td className="acc-num">
                      <MutedDash value={fmt(r.vol)} />
                    </td>
                    <td className="acc-num">
                      <MutedDash value={fmt(r.early)} />
                    </td>
                    <td className="acc-num">
                      <MutedDash value={fmt(r.admin)} />
                    </td>
                    <td className="acc-num">
                      {r.reject > 0 ? (
                        <span style={{ color: 'var(--bad)', fontWeight: 700 }}>{fmt(r.reject)}</span>
                      ) : (
                        <MutedDash value={fmt(r.reject)} />
                      )}
                    </td>
                    <td className="acc-num">
                      <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{fmt(r.gross)}</span>
                    </td>
                    <td>
                      {r.proof ? (
                        <button
                          onClick={() => onOpenProofFiles(r)}
                          className="acc-btn"
                          style={{
                            background: 'var(--goldbg)',
                            borderColor: 'var(--gold)',
                            color: 'var(--brown)',
                            padding: '5px 10px',
                            fontSize: 12,
                          }}
                        >
                          <i className="fa-solid fa-folder-open" /> View files
                        </button>
                      ) : (
                        <button
                          onClick={() => onOpenProofFiles(r)}
                          className="acc-btn"
                          style={{ padding: '5px 10px', fontSize: 12 }}
                        >
                          <i className="fa-solid fa-upload" /> Upload
                        </button>
                      )}
                    </td>
                    <td>
                      <span
                        className={statusTone(statusPillClass(r.status))}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}
                      >
                        <i className={`fa-solid ${statusIcon(r.status)}`} /> {r.statusLabel}
                      </span>
                    </td>
                    <td>
                      <span className="acc-typ">
                        <i className="fa-solid fa-user" style={{ color: 'var(--muted)', fontSize: 11 }} />
                        <MutedDash value={r.actionBy} />
                      </span>
                    </td>
                    <td>
                      <MutedDash value={fmtDateTime(r.actionOn)} />
                    </td>
                    <td
                      title={r.note || undefined}
                      style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      <MutedDash value={r.note} />
                    </td>
                  </tr>
                  {isExpanded && <AllocationTable row={r} />}
                </Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
