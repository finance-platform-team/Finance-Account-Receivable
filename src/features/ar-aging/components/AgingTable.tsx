import { MutedDash } from '../../../shared/components/MutedDash';
import type { AgingRow, AgingTotals } from '../types';

const COLUMN_COUNT = 13;

interface AgingTableProps {
  rows: AgingRow[];
  filteredCount: number;
  totals: AgingTotals;
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  onRowClick: (row: AgingRow) => void;
}

// Mirrors normalize.ts's fmt(): a zero bracket amount reads as "no balance in
// this bucket" rather than a real figure, so it renders as a muted dash too.
function numText(value: number): string | null {
  return value ? value.toLocaleString('en-US') : null;
}

const nameCellStyle = {
  maxWidth: 240,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap' as const,
};

export function AgingTable({ rows, filteredCount, totals, loading, error, selectedId, onRowClick }: AgingTableProps) {
  return (
    <div className="acc-tablewrap">
      <table>
        <thead>
          <tr>
            <th>Company Name</th>
            <th>Company Code</th>
            <th>Payment Term</th>
            <th>Customer Class</th>
            <th>Company Type</th>
            <th title="Type (Business Unit)">Type (BU)</th>
            <th>Task Owner</th>
            <th>Supervisor</th>
            <th className="acc-num">Not Due</th>
            <th className="acc-num">31–60</th>
            <th className="acc-num">61–90</th>
            <th className="acc-num">91–120</th>
            <th className="acc-num">&gt; 120 Days</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
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
                  Couldn&apos;t load AR aging.
                  <br />
                  <small>{error}</small>
                </div>
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={COLUMN_COUNT}>
                <div className="acc-state">
                  <i className="fa-solid fa-filter-circle-xmark" />
                  No records match the current filters.
                </div>
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr
                key={r.id}
                className="acc-row"
                onClick={() => onRowClick(r)}
                style={r.id === selectedId ? { background: 'var(--goldbg)' } : undefined}
              >
                <td className="acc-name" style={nameCellStyle} title={r.name} dir="auto">
                  <MutedDash value={r.name} />
                </td>
                <td className="acc-code">
                  <MutedDash value={r.code} />
                </td>
                <td>
                  <MutedDash value={r.paymentTerm} />
                </td>
                <td>
                  <MutedDash value={r.customerClass} />
                </td>
                <td>
                  <MutedDash value={r.companyType} />
                </td>
                <td>
                  <MutedDash value={r.type} />
                </td>
                <td>
                  <MutedDash value={r.taskOwner} />
                </td>
                <td>
                  <MutedDash value={r.supervisor} />
                </td>
                <td className="acc-num">
                  <MutedDash value={numText(r.notDue)} />
                </td>
                <td className="acc-num">
                  <MutedDash value={numText(r.b3160)} />
                </td>
                <td className="acc-num">
                  <MutedDash value={numText(r.b6190)} />
                </td>
                <td className="acc-num">
                  <MutedDash value={numText(r.b91120)} />
                </td>
                <td className="acc-num">
                  <MutedDash value={numText(r.gt120)} />
                </td>
              </tr>
            ))
          )}
        </tbody>

        {!loading && !error && rows.length > 0 && (
          <tfoot>
            <tr style={{ background: 'var(--cream)', fontWeight: 700 }}>
              <td colSpan={8} style={{ padding: '13px 16px', borderTop: '2px solid var(--gold)' }}>
                <i className="fa-solid fa-square-poll-vertical" style={{ color: 'var(--gold)', marginRight: 6 }} />
                Total ({filteredCount.toLocaleString('en-US')} companies)
              </td>
              <td className="acc-num" style={{ borderTop: '2px solid var(--gold)' }}>
                {totals.notDue.toLocaleString('en-US')}
              </td>
              <td className="acc-num" style={{ borderTop: '2px solid var(--gold)' }}>
                {totals.b3160.toLocaleString('en-US')}
              </td>
              <td className="acc-num" style={{ borderTop: '2px solid var(--gold)' }}>
                {totals.b6190.toLocaleString('en-US')}
              </td>
              <td className="acc-num" style={{ borderTop: '2px solid var(--gold)' }}>
                {totals.b91120.toLocaleString('en-US')}
              </td>
              <td className="acc-num" style={{ borderTop: '2px solid var(--gold)' }}>
                {totals.gt120.toLocaleString('en-US')}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
