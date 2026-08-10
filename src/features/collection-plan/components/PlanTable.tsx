import styles from '../CollectionPlan.module.css';
import { EditableCell } from './EditableCell';
import { achvIcon, achvLevel, fmt, fmtTotal, rowAchievement, rowTargetPlan } from '../normalize';
import type { DirtyChange, EditableFieldKey, PlanRow, PlanTotals } from '../types';

const COLUMN_COUNT = 22;

type CellMode = 'instant' | 'dirty' | 'locked';

interface PlanTableProps {
  rows: PlanRow[];
  filteredCount: number;
  totals: PlanTotals;
  targetPct: number;
  loading: boolean;
  error: string | null;
  cellMode: CellMode;
  dirtyChanges: Map<string, DirtyChange>;
  onInstantSave: (rowId: string, field: EditableFieldKey, value: number) => Promise<void>;
  onDirtyChange: (rowId: string, field: EditableFieldKey, value: number, orig: number) => void;
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

function AchvBadge({ pct }: { pct: number }) {
  const level = achvLevel(pct);
  const levelClass = level === 'over' ? styles.achvOver : level === 'mid' ? styles.achvMid : styles.achvLow;
  return (
    <span className={`${styles.achvBadge} ${levelClass}`}>
      <i className={`fa-solid ${achvIcon(pct)}`} />
      {Math.round(pct)}%
    </span>
  );
}

export function PlanTable({
  rows,
  filteredCount,
  totals,
  targetPct,
  loading,
  error,
  cellMode,
  dirtyChanges,
  onInstantSave,
  onDirtyChange,
}: PlanTableProps) {
  const overallAchv = totals.targetPlan > 0 ? (totals.collectedPlus / totals.targetPlan) * 100 : 0;

  const editableCell = (row: PlanRow, field: EditableFieldKey, isGroupEnd?: boolean) => {
    const dirty = dirtyChanges.get(`${row.id}|${field}`);
    return (
      <EditableCell
        key={field}
        value={row[field]}
        mode={cellMode}
        isGroupEnd={isGroupEnd}
        isDirty={dirty !== undefined}
        onInstantSave={(value) => onInstantSave(row.id, field, value)}
        onDirtyChange={(value, orig) => onDirtyChange(row.id, field, value, orig)}
      />
    );
  };

  return (
    <div className={styles.tblScroll}>
      <table className={styles.planTbl}>
        <thead>
          <tr className={styles.groupRow}>
            <th colSpan={6}>
              <i className="fa-solid fa-address-book" />
              Company Metadata
            </th>
            <th colSpan={1} />
            <th colSpan={1} className={`${styles.stickCol} ${styles.colGroupEnd}`} />
            <th colSpan={6} className={styles.colGroupEnd}>
              <i className="fa-solid fa-pen-to-square" />
              Manual Entry — AR Team
            </th>
            <th colSpan={5} className={styles.colGroupEnd}>
              <i className="fa-solid fa-calculator" />
              Calculated / DotCare
            </th>
            <th colSpan={3}>
              <i className="fa-solid fa-cash-register" />
              Collection Achievement
            </th>
          </tr>
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
            <th className={styles.numeric}>Early Payment</th>
            <th className={styles.numeric}>Legal Issues</th>
            <th className={styles.numeric}>Bankruptcy</th>
            <th className={styles.numeric}>Claims Issue</th>
            <th className={styles.numeric}>Stopped</th>
            <th className={`${styles.numeric} ${styles.colGroupEnd}`}>Agreed Recon.</th>
            <th className={styles.numeric}>Total Outstanding</th>
            <th className={styles.numeric}>Rejections</th>
            <th className={styles.numeric}>Outstanding + Rej</th>
            <th className={styles.numeric}>Total Dues</th>
            <th className={`${styles.numeric} ${styles.colGroupEnd}`}>Target Plan</th>
            <th className={styles.numeric}>Collected</th>
            <th className={styles.numeric}>Collected + Tax + Rej</th>
            <th className={styles.numeric}>ACHV %</th>
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
                <div className={styles.stateTitle}>Couldn&apos;t load Collection Plan</div>
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
            rows.map((r) => {
              const targetPlan = rowTargetPlan(r, targetPct);
              const achv = rowAchievement(r, targetPct);
              return (
                <tr key={r.id}>
                  <td>{r.paymentTerm}</td>
                  <td>{r.customerClass}</td>
                  <td>{r.companyType}</td>
                  <td>{r.bu}</td>
                  <td>{r.taskOwner}</td>
                  <td>{r.supervisor}</td>
                  <td className={styles.colId}>{r.code}</td>
                  <td className={`${styles.colBold} ${styles.stickCol} ${styles.colGroupEnd}`}>{r.name}</td>
                  {editableCell(r, 'earlypayment')}
                  {editableCell(r, 'legalissues')}
                  {editableCell(r, 'bankruptcy')}
                  {editableCell(r, 'claimsissue')}
                  {editableCell(r, 'stopped')}
                  {editableCell(r, 'agreedrecon', true)}
                  <td className={`${styles.colAmt} ${styles.numeric}`}>{fmt(r.totalOutstanding)}</td>
                  <td className={`${styles.colRej} ${styles.numeric}`}>{fmt(r.rejections)}</td>
                  <td className={`${styles.colAmt} ${styles.numeric}`}>{fmt(r.outstandingRej)}</td>
                  <td className={`${styles.colAmt} ${styles.numeric}`}>{fmt(r.totalDues)}</td>
                  <td className={`${styles.colPos} ${styles.numeric} ${styles.colGroupEnd}`}>{fmt(targetPlan)}</td>
                  <td className={`${styles.colAmt} ${styles.numeric}`}>{fmt(r.collected)}</td>
                  <td className={`${styles.colAmt} ${styles.numeric}`}>{fmt(r.collectedPlus)}</td>
                  <td className={styles.numeric}>
                    <AchvBadge pct={achv} />
                  </td>
                </tr>
              );
            })
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
              <td colSpan={5} />
              <td className={`${styles.colAmt} ${styles.colGroupEnd}`} style={{ textAlign: 'right' }}>
                {fmtTotal(totals.agreedrecon)}
              </td>
              <td className={styles.colAmt} style={{ textAlign: 'right' }}>
                {fmtTotal(totals.totalOutstanding)}
              </td>
              <td className={styles.colRej} style={{ textAlign: 'right' }}>
                {fmtTotal(totals.rejections)}
              </td>
              <td className={styles.colAmt} style={{ textAlign: 'right' }}>
                {fmtTotal(totals.outstandingRej)}
              </td>
              <td className={styles.colAmt} style={{ textAlign: 'right' }}>
                {fmtTotal(totals.totalDues)}
              </td>
              <td className={`${styles.colPos} ${styles.colGroupEnd}`} style={{ textAlign: 'right' }}>
                {fmtTotal(totals.targetPlan)}
              </td>
              <td className={styles.colAmt} style={{ textAlign: 'right' }}>
                {fmtTotal(totals.collected)}
              </td>
              <td className={styles.colAmt} style={{ textAlign: 'right' }}>
                {fmtTotal(totals.collectedPlus)}
              </td>
              <td style={{ textAlign: 'right' }}>
                <AchvBadge pct={overallAchv} />
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
