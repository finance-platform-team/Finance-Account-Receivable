import type { CSSProperties } from 'react';
import { MutedDash } from '../../../shared/components/MutedDash';
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
  onRowDoubleClick: (row: PlanRow) => void;
}

// theme.css has no notion of grouped column headers or a totals tfoot, so
// this dense 22-column table hand-styles those bits inline (tokens only) on
// top of the shared .acc-tablewrap/table shape. No sticky column — a
// position:sticky;left:0 cell only aligns with the content beneath it if its
// left offset matches the cumulative width of every preceding column, which
// isn't knowable for auto-sized columns without JS measurement; a naive
// left:0 just overlaps column 1's header/body, which is what produced the
// stray dark rectangle + clipped header text reported earlier.
const GROUP_TH: CSSProperties = {
  padding: '7px 13px',
  fontSize: 9.5,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '.06em',
  color: 'rgba(255,255,255,.7)',
  textAlign: 'left',
  whiteSpace: 'nowrap',
  borderRight: '1px solid rgba(255,255,255,.1)',
};
const GROUP_TH_END: CSSProperties = { ...GROUP_TH, borderRight: '2px solid rgba(255,255,255,.25)' };
const GROUP_END_TD: CSSProperties = { borderRight: '1px dashed var(--line)' };
const FOOT_TD: CSSProperties = { fontWeight: 800, color: 'var(--ink)', borderTop: '2px solid var(--gold)', background: 'var(--goldbg)' };
const nameCellStyle: CSSProperties = { maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

function SkeletonRows() {
  const widths = [60, 80, 70, 65, 75];
  return (
    <>
      {widths.map((w, i) => (
        <tr key={i}>
          <td colSpan={COLUMN_COUNT} style={{ padding: '13px 16px' }}>
            <div className="acc-skel" style={{ width: `${w}%` }} />
          </td>
        </tr>
      ))}
    </>
  );
}

function achvBadgeStyle(pct: number): CSSProperties {
  const level = achvLevel(pct);
  const tones = {
    over: { bg: 'var(--okbg)', fg: 'var(--ok)' },
    mid: { bg: 'var(--warnbg)', fg: 'var(--warn)' },
    low: { bg: 'var(--badbg)', fg: 'var(--bad)' },
  } as const;
  const { bg, fg } = tones[level];
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    fontWeight: 800,
    fontSize: 11,
    padding: '5px 12px',
    borderRadius: 999,
    minWidth: 62,
    background: bg,
    color: fg,
  };
}

function AchvBadge({ pct }: { pct: number }) {
  return (
    <span style={achvBadgeStyle(pct)}>
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
  onRowDoubleClick,
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
    <div className="acc-tablewrap" style={{ maxHeight: '70vh', overflow: 'auto' }}>
      <table style={{ minWidth: 2400 }}>
        <thead>
          <tr style={{ background: 'var(--brown)' }}>
            <th colSpan={8} style={GROUP_TH}>
              <i className="fa-solid fa-address-book" /> Company Metadata
            </th>
            <th colSpan={6} style={GROUP_TH_END}>
              <i className="fa-solid fa-pen-to-square" /> Manual Entry — AR Team
            </th>
            <th colSpan={5} style={GROUP_TH_END}>
              <i className="fa-solid fa-calculator" /> Calculated / DotCare
            </th>
            <th colSpan={3} style={GROUP_TH}>
              <i className="fa-solid fa-cash-register" /> Collection Achievement
            </th>
          </tr>
          <tr>
            <th style={{ minWidth: 150 }}>Payment Term</th>
            <th style={{ minWidth: 140 }}>Customer Class</th>
            <th>Company Type</th>
            <th style={{ minWidth: 140 }} title="Type (Business Unit)">
              Type (BU)
            </th>
            <th>Task Owner</th>
            <th>Supervisor</th>
            <th>Company Code</th>
            <th>Company Name</th>
            <th className="acc-num">Early Payment</th>
            <th className="acc-num">Legal Issues</th>
            <th className="acc-num">Bankruptcy</th>
            <th className="acc-num">Claims Issue</th>
            <th className="acc-num">Stopped</th>
            <th className="acc-num" style={GROUP_END_TD}>
              Agreed Recon.
            </th>
            <th className="acc-num">Total Outstanding</th>
            <th className="acc-num">Rejections</th>
            <th className="acc-num">Outstanding + Rej</th>
            <th className="acc-num">Total Dues</th>
            <th className="acc-num" style={GROUP_END_TD}>
              Target Plan
            </th>
            <th className="acc-num">Collected</th>
            <th className="acc-num">Collected + Tax + Rej</th>
            <th className="acc-num" title="Achievement %">
              Achievement %
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
                  Couldn&apos;t load Collection Plan.
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
            rows.map((r) => {
              const targetPlan = rowTargetPlan(r, targetPct);
              const achv = rowAchievement(r, targetPct);
              return (
                <tr key={r.id} onDoubleClick={() => onRowDoubleClick(r)} style={{ cursor: 'pointer' }}>
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
                    <MutedDash value={r.bu} />
                  </td>
                  <td>
                    <MutedDash value={r.taskOwner} />
                  </td>
                  <td>
                    <MutedDash value={r.supervisor} />
                  </td>
                  <td className="acc-code">
                    <MutedDash value={r.code} />
                  </td>
                  <td className="acc-name" style={nameCellStyle} title={r.name} dir="auto">
                    <MutedDash value={r.name} />
                  </td>
                  {editableCell(r, 'earlypayment')}
                  {editableCell(r, 'legalissues')}
                  {editableCell(r, 'bankruptcy')}
                  {editableCell(r, 'claimsissue')}
                  {editableCell(r, 'stopped')}
                  {editableCell(r, 'agreedrecon', true)}
                  <td className="acc-num">
                    <MutedDash value={fmt(r.totalOutstanding)} />
                  </td>
                  <td className="acc-num" style={{ color: 'var(--gold)', fontWeight: 600 }}>
                    <MutedDash value={fmt(r.rejections)} />
                  </td>
                  <td className="acc-num">
                    <MutedDash value={fmt(r.outstandingRej)} />
                  </td>
                  <td className="acc-num">
                    <MutedDash value={fmt(r.totalDues)} />
                  </td>
                  <td className="acc-num" style={{ ...GROUP_END_TD, color: 'var(--ok)', fontWeight: 700 }}>
                    <MutedDash value={fmt(targetPlan)} />
                  </td>
                  <td className="acc-num">
                    <MutedDash value={fmt(r.collected)} />
                  </td>
                  <td className="acc-num">
                    <MutedDash value={fmt(r.collectedPlus)} />
                  </td>
                  <td className="acc-num">
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
              <td colSpan={8} style={FOOT_TD}>
                <i className="fa-solid fa-square-poll-vertical" style={{ color: 'var(--gold)', marginRight: 6 }} />
                Total ({filteredCount} companies)
              </td>
              <td colSpan={5} style={FOOT_TD} />
              <td className="acc-num" style={{ ...FOOT_TD, ...GROUP_END_TD }}>
                {fmtTotal(totals.agreedrecon)}
              </td>
              <td className="acc-num" style={FOOT_TD}>
                {fmtTotal(totals.totalOutstanding)}
              </td>
              <td className="acc-num" style={{ ...FOOT_TD, color: 'var(--gold)' }}>
                {fmtTotal(totals.rejections)}
              </td>
              <td className="acc-num" style={FOOT_TD}>
                {fmtTotal(totals.outstandingRej)}
              </td>
              <td className="acc-num" style={FOOT_TD}>
                {fmtTotal(totals.totalDues)}
              </td>
              <td className="acc-num" style={{ ...FOOT_TD, ...GROUP_END_TD, color: 'var(--ok)' }}>
                {fmtTotal(totals.targetPlan)}
              </td>
              <td className="acc-num" style={FOOT_TD}>
                {fmtTotal(totals.collected)}
              </td>
              <td className="acc-num" style={FOOT_TD}>
                {fmtTotal(totals.collectedPlus)}
              </td>
              <td className="acc-num" style={FOOT_TD}>
                <AchvBadge pct={overallAchv} />
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
