import { MutedDash } from '../../../shared/components/MutedDash';
import { fmtCreatedOn } from '../normalize';
import type { PaymentTermRow } from '../types';

const COLUMN_COUNT = 4;

interface PaymentTermsTableProps {
  rows: PaymentTermRow[];
  loading: boolean;
  error: string | null;
  onEdit: (row: PaymentTermRow) => void;
}

export function PaymentTermsTable({ rows, loading, error, onEdit }: PaymentTermsTableProps) {
  return (
    <div className="acc-tablewrap">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th className="acc-num">Number of Days</th>
            <th>Created On</th>
            <th>Created By</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
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
                  Couldn&apos;t load payment terms.
                  <br />
                  <small>{error}</small>
                </div>
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={COLUMN_COUNT}>
                <div className="acc-state">
                  <i className="fa-solid fa-calendar-days" />
                  No payment terms to show.
                </div>
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id} className="acc-row" onClick={() => onEdit(r)}>
                <td className="acc-name">{r.name}</td>
                <td className="acc-num">{r.numberOfDays.toLocaleString('en-US')}</td>
                <td>
                  <MutedDash value={fmtCreatedOn(r.createdOn)} />
                </td>
                <td>
                  <MutedDash value={r.createdBy} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
