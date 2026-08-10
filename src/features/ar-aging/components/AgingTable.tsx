import styles from '../ArAging.module.css';
import { fmt, fmtTotal } from '../normalize';
import type { AgingRow, AgingTotals } from '../types';

const COLUMN_COUNT = 14;

interface AgingTableProps {
  rows: AgingRow[];
  filteredCount: number;
  totals: AgingTotals;
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  onRowClick: (row: AgingRow) => void;
}

function SkeletonRows() {
  const widths = [60, 80, 70, 65, 75];
  return (
    <>
      {widths.map((w, i) => (
        <tr key={i} className={styles.skelRow}>
          <td colSpan={COLUMN_COUNT}>
            <div className={styles.skel} style={{ width: `${w}%` }} />
          </td>
        </tr>
      ))}
    </>
  );
}

export function AgingTable({ rows, filteredCount, totals, loading, error, selectedId, onRowClick }: AgingTableProps) {
  return (
    <div className={styles.tblScroll}>
      <table className={styles.arTbl}>
        <thead>
          <tr className={styles.headRow}>
            <th>
              <i className="fa-solid fa-calendar-check" />
              Payment Term
            </th>
            <th>
              <i className="fa-solid fa-tags" />
              Customer Class
            </th>
            <th>
              <i className="fa-solid fa-layer-group" />
              Company Type
            </th>
            <th>
              <i className="fa-solid fa-building" />
              Type
            </th>
            <th>
              <i className="fa-solid fa-user" />
              Task Owner
            </th>
            <th>
              <i className="fa-solid fa-user-shield" />
              Supervisor
            </th>
            <th>
              <i className="fa-solid fa-hashtag" />
              Company Code
            </th>
            <th className={`${styles.stickCol} ${styles.colGroupEnd}`}>
              <i className="fa-solid fa-briefcase" />
              Company Name
            </th>
            <th className={styles.numeric}>Not Due</th>
            <th className={styles.numeric}>&lt; 30 Days</th>
            <th className={styles.numeric}>31–60</th>
            <th className={styles.numeric}>61–90</th>
            <th className={styles.numeric}>91–120</th>
            <th className={styles.numeric}>&gt; 120 Days</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <SkeletonRows />
          ) : error ? (
            <tr>
              <td colSpan={COLUMN_COUNT} className={styles.stateCell}>
                <div className={`${styles.stateIcon} ${styles.stateIconError}`}>
                  <i className="fa-solid fa-circle-exclamation" />
                </div>
                <div className={styles.stateTitle}>Couldn&apos;t load AR aging</div>
                <div className={styles.stateMsg}>{error}</div>
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={COLUMN_COUNT} className={styles.stateCell}>
                <div className={styles.stateIcon}>
                  <i className="fa-solid fa-filter-circle-xmark" />
                </div>
                <div className={styles.stateTitle}>No matches</div>
                <div className={styles.stateMsg}>
                  No records match the current filters. Try adjusting the search or clearing filters.
                </div>
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr
                key={r.id}
                className={`${styles.rowClickable} ${r.id === selectedId ? styles.rowSelected : ''}`}
                onClick={() => onRowClick(r)}
              >
                <td>{r.paymentTerm}</td>
                <td>{r.customerClass}</td>
                <td>{r.companyType}</td>
                <td>{r.type}</td>
                <td>{r.taskOwner}</td>
                <td>{r.supervisor}</td>
                <td className={styles.colId}>{r.code}</td>
                <td className={`${styles.colBold} ${styles.stickCol} ${styles.colGroupEnd}`}>{r.name}</td>
                <td className={`${styles.colAmt} ${styles.numeric}`}>{fmt(r.notDue)}</td>
                <td className={`${styles.colAmt} ${styles.numeric}`}>{fmt(r.lt30)}</td>
                <td className={`${styles.colAmt} ${styles.numeric}`}>{fmt(r.b3160)}</td>
                <td className={`${styles.colAmt} ${styles.numeric}`}>{fmt(r.b6190)}</td>
                <td className={`${styles.colNeg} ${styles.numeric}`}>{fmt(r.b91120)}</td>
                <td className={`${styles.colNeg} ${styles.numeric}`}>{fmt(r.gt120)}</td>
              </tr>
            ))
          )}
        </tbody>

        {!loading && !error && rows.length > 0 && (
          <tfoot>
            <tr>
              <td colSpan={7} className={styles.colBold}>
                <i className="fa-solid fa-square-poll-vertical" style={{ color: 'var(--gold-dark)', marginRight: 6 }} />
                Total ({filteredCount} companies)
              </td>
              <td className={`${styles.stickCol} ${styles.colGroupEnd}`} />
              <td className={styles.numeric}>{fmtTotal(totals.notDue)}</td>
              <td className={styles.numeric}>{fmtTotal(totals.lt30)}</td>
              <td className={styles.numeric}>{fmtTotal(totals.b3160)}</td>
              <td className={styles.numeric}>{fmtTotal(totals.b6190)}</td>
              <td className={styles.numeric}>{fmtTotal(totals.b91120)}</td>
              <td className={styles.numeric}>{fmtTotal(totals.gt120)}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
