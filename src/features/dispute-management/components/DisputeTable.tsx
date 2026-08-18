import { useRef, useState } from 'react';
import type { ChangeEvent, CSSProperties } from 'react';
import { MutedDash } from '../../../shared/components/MutedDash';
import { AR_REVIEW_OPTIONS, fmtEGP } from '../normalize';
import type { DisputeRow } from '../types';

const COLUMN_COUNT = 10;

interface DisputeTableProps {
  rows: DisputeRow[];
  loading: boolean;
  error: string | null;
  onOpenDetail: (id: string) => void;
  onOpenProofFiles: (row: DisputeRow) => void;
  onSaveAgreement: (id: string, value: string) => Promise<void>;
  onSaveArReview: (id: string, value: number) => Promise<void>;
}

const cellControlStyle: CSSProperties = {
  width: '100%',
  minWidth: 110,
  padding: '5px 8px',
  border: '1px solid var(--line)',
  borderRadius: 7,
  fontSize: 12,
  fontFamily: 'Inter',
  background: 'var(--field-bg)',
  color: 'var(--ink)',
  boxSizing: 'border-box',
};

// Semantic tint per AR Review state — Pending/Approved/Rejected each get their
// own color pair instead of only Pending being highlighted and everything
// else falling back to the plain (harder-to-read) default control style.
const AR_REVIEW_TONE: Record<string, CSSProperties> = {
  Pending: { color: 'var(--warn)', background: 'var(--warnbg)', borderColor: 'var(--warn)' },
  Approved: { color: 'var(--ok)', background: 'var(--okbg)', borderColor: 'var(--ok)' },
  // normalize.ts trims the raw enum label ("Rejected " -> "Rejected") before it reaches this component.
  Rejected: { color: 'var(--bad)', background: 'var(--badbg)', borderColor: 'var(--bad)' },
};

function AgreementCell({
  row,
  onSave,
}: {
  row: DisputeRow;
  onSave: (id: string, value: string) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleBlur = () => {
    const value = inputRef.current?.value ?? '';
    if (value === row.agreement) return;
    void onSave(row.id, value);
  };

  return (
    <input
      ref={inputRef}
      style={cellControlStyle}
      placeholder="Agreement..."
      defaultValue={row.agreement}
      onClick={(e) => e.stopPropagation()}
      onBlur={handleBlur}
    />
  );
}

function ArReviewCell({
  row,
  onSave,
}: {
  row: DisputeRow;
  onSave: (id: string, value: number) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const tone = AR_REVIEW_TONE[row.arReview];

  const handleChange = async (e: ChangeEvent<HTMLSelectElement>) => {
    const value = Number(e.target.value);
    setSaving(true);
    try {
      await onSave(row.id, value);
    } finally {
      setSaving(false);
    }
  };

  return (
    <select
      style={{
        ...cellControlStyle,
        minWidth: 92,
        cursor: 'pointer',
        fontWeight: 600,
        ...tone,
      }}
      value={row.arReviewValue ?? ''}
      disabled={saving}
      onClick={(e) => e.stopPropagation()}
      onChange={handleChange}
    >
      {AR_REVIEW_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function DisputeTable({
  rows,
  loading,
  error,
  onOpenDetail,
  onOpenProofFiles,
  onSaveAgreement,
  onSaveArReview,
}: DisputeTableProps) {
  return (
    <div className="acc-tablewrap">
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Company</th>
            <th className="acc-num">Amount</th>
            <th className="acc-num">Rej %</th>
            <th>Due</th>
            <th>Category</th>
            <th>Owner</th>
            <th>Proof</th>
            <th>Agreement</th>
            <th>AR Review</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: COLUMN_COUNT }).map((__, j) => (
                  <td key={j}>
                    <div className="acc-skel" />
                  </td>
                ))}
              </tr>
            ))
          ) : error ? (
            <tr>
              <td colSpan={COLUMN_COUNT}>
                <div className="acc-state">
                  <i className="fa-solid fa-triangle-exclamation" />
                  Could not load disputes.
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
                  No disputes to show.
                </div>
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr
                key={r.id}
                className="acc-row"
                onDoubleClick={() => onOpenDetail(r.id)}
                title="Double-click for full details & history"
              >
                <td className="acc-code">{r.code}</td>
                <td className="acc-name" dir="auto">
                  {r.name}
                  {r.auto && (
                    <span
                      style={{
                        fontSize: 8,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '.05em',
                        color: 'var(--muted)',
                        background: 'var(--bg)',
                        border: '1px solid var(--line)',
                        padding: '2px 6px',
                        borderRadius: 4,
                        marginLeft: 6,
                      }}
                    >
                      AUTO
                    </span>
                  )}
                </td>
                <td className="acc-num">{fmtEGP(r.amount)}</td>
                <td
                  className="acc-num"
                  style={{ color: (r.rejPct ?? 0) >= 6 ? 'var(--bad)' : 'var(--ok)', fontWeight: 600 }}
                >
                  {r.rejPct != null ? `${r.rejPct}%` : <MutedDash value={null} />}
                </td>
                <td>
                  <MutedDash value={r.due} />
                </td>
                <td style={{ fontWeight: 600 }}>{r.category}</td>
                <td dir="auto">
                  <MutedDash value={r.owner} />
                </td>
                <td>
                  {r.proof ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenProofFiles(r);
                      }}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenProofFiles(r);
                      }}
                      className="acc-btn"
                      style={{ padding: '5px 10px', fontSize: 12 }}
                    >
                      <i className="fa-solid fa-upload" /> Upload
                    </button>
                  )}
                </td>
                <td>
                  <AgreementCell row={r} onSave={onSaveAgreement} />
                </td>
                <td>
                  <ArReviewCell row={r} onSave={onSaveArReview} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
