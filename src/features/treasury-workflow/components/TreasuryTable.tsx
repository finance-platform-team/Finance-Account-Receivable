import { MutedDash } from '../../../shared/components/MutedDash';
import { fmt } from '../../AR Verification/normalize';
import type { VerificationRow } from '../../AR Verification/types';

const COLUMN_COUNT = 9;

interface TreasuryTableProps {
  rows: VerificationRow[];
  loading: boolean;
  error: string | null;
  onOpenProofFiles: (row: VerificationRow) => void;
}

export function TreasuryTable({ rows, loading, error, onOpenProofFiles }: TreasuryTableProps) {
  return (
    <div className="acc-tablewrap">
      <table>
        <thead>
          <tr>
            <th>Ref</th>
            <th>Entity</th>
            <th>Company Code</th>
            <th>Company Name</th>
            <th>Collection Date</th>
            <th>Bank Account</th>
            <th className="acc-num">Collected (Net)</th>
            <th>Allocate To Months</th>
            <th>Proof</th>
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
                  Couldn&apos;t load Treasury Workflow.
                  <br />
                  <small>{error}</small>
                </div>
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={COLUMN_COUNT}>
                <div className="acc-state">
                  <i className="fa-solid fa-building-columns" />
                  No collections are currently pending a bank statement.
                </div>
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id}>
                <td className="acc-code">
                  <MutedDash value={r.ref} />
                </td>
                <td>
                  <span className="acc-cls-gold" style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                    {r.entity}
                  </span>
                </td>
                <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11.5, color: 'var(--muted)' }}>
                  <MutedDash value={r.companyCode} />
                </td>
                <td className="acc-name" dir="auto">
                  <MutedDash value={r.companyName} />
                </td>
                <td>
                  <MutedDash value={r.date ? r.date.slice(0, 10) : null} />
                </td>
                <td>
                  <MutedDash value={r.bankAccount} />
                </td>
                <td className="acc-num">
                  <MutedDash value={fmt(r.net)} />
                </td>
                <td>
                  <MutedDash value={r.monthsLabel} />
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
                    <MutedDash value={null} />
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
