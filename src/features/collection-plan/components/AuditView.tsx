import { Fragment } from 'react';
import type { CSSProperties } from 'react';
import { MutedDash } from '../../../shared/components/MutedDash';
import { auditInitials, fmtAuditNum } from '../normalizeAudit';
import type { AuditRow } from '../types';

const COLUMN_COUNT = 7;

interface AuditViewProps {
  rows: AuditRow[];
  grouped: boolean;
  loading: boolean;
  error: string | null;
}

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

function fmtAuditDateTime(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function pillStyle(bg: string, fg: string): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: 11,
    fontWeight: 700,
    padding: '3px 9px',
    borderRadius: 999,
    background: bg,
    color: fg,
    whiteSpace: 'nowrap',
  };
}

function TypePill({ value }: { value: string }) {
  if (!value || value === '—') return <MutedDash value={value} />;
  return <span style={pillStyle('var(--infobg)', 'var(--info)')}>{value}</span>;
}

function FieldPill({ value }: { value: string }) {
  return <span style={pillStyle('var(--goldbg)', 'var(--brown)')}>{value}</span>;
}

function DeltaCell({ row }: { row: AuditRow }) {
  const oldN = row.oldValue ?? 0;
  const newN = row.newValue ?? 0;
  const diff = newN - oldN;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13 }}>
      <span style={{ color: 'var(--muted)', textDecoration: 'line-through' }}>{fmtAuditNum(row.oldValue)}</span>
      <i className="fa-solid fa-arrow-right" style={{ color: 'var(--muted)', fontSize: 11 }} />
      <span style={{ color: 'var(--ink)', fontWeight: 800 }}>{fmtAuditNum(row.newValue)}</span>
      {diff !== 0 && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            fontWeight: 700,
            fontSize: 10.5,
            padding: '2px 7px',
            borderRadius: 999,
            background: diff > 0 ? 'var(--okbg)' : 'var(--badbg)',
            color: diff > 0 ? 'var(--ok)' : 'var(--bad)',
          }}
        >
          <i className={`fa-solid ${diff > 0 ? 'fa-arrow-up' : 'fa-arrow-down'}`} />
          {fmtAuditNum(Math.abs(diff))}
        </span>
      )}
    </span>
  );
}

function UserCell({ name }: { name: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: 'var(--goldbg)',
          color: 'var(--brown)',
          fontSize: 9,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {auditInitials(name)}
      </span>
      <MutedDash value={name} />
    </span>
  );
}

interface AuditGroup {
  name: string;
  code: string;
  type: string;
  rows: AuditRow[];
}

function groupRows(rows: AuditRow[]): AuditGroup[] {
  const groups = new Map<string, AuditGroup>();
  rows.forEach((r) => {
    const key = `${r.companyName}|${r.companyCode}`;
    let group = groups.get(key);
    if (!group) {
      group = { name: r.companyName, code: r.companyCode, type: r.type, rows: [] };
      groups.set(key, group);
    }
    group.rows.push(r);
  });
  // Most recently-changed company first; each group's rows are already
  // newest-first since the audit trail is loaded ordered by createdon desc.
  return Array.from(groups.values()).sort(
    (a, b) => new Date(b.rows[0].when).getTime() - new Date(a.rows[0].when).getTime()
  );
}

export function AuditView({ rows, grouped, loading, error }: AuditViewProps) {
  return (
    <div className="acc-tablewrap">
      <table>
        <thead>
          <tr>
            <th>
              <i className="fa-solid fa-clock" /> Date &amp; Time
            </th>
            <th>
              <i className="fa-solid fa-briefcase" /> Company
            </th>
            <th>
              <i className="fa-solid fa-hashtag" /> Code
            </th>
            <th>
              <i className="fa-solid fa-building" /> Type
            </th>
            <th>
              <i className="fa-solid fa-tags" /> Field
            </th>
            <th>
              <i className="fa-solid fa-right-left" /> Old → New
            </th>
            <th>
              <i className="fa-solid fa-user" /> Changed By
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
                  Couldn&apos;t load audit trail.
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
                  No audit entries match the current filters.
                </div>
              </td>
            </tr>
          ) : grouped ? (
            groupRows(rows).map((g) => (
              <Fragment key={`${g.name}|${g.code}`}>
                <tr style={{ background: 'var(--goldbg)' }}>
                  <td colSpan={COLUMN_COUNT} style={{ borderTop: '2px solid var(--gold)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          fontWeight: 800,
                          fontSize: 13,
                          color: 'var(--brown)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <i className="fa-solid fa-building" style={{ color: 'var(--gold)' }} />
                        {g.name}
                        <span className="acc-code">{g.code}</span>
                        {g.type && g.type !== '—' && <TypePill value={g.type} />}
                      </span>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: 'var(--muted)',
                          background: 'var(--card)',
                          padding: '3px 10px',
                          borderRadius: 999,
                          border: '1px solid var(--line)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {g.rows.length} change{g.rows.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  </td>
                </tr>
                {g.rows.map((r) => (
                  <tr key={r.id}>
                    <td style={{ paddingLeft: 30, color: 'var(--muted)' }}>{fmtAuditDateTime(r.when)}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td>
                      <FieldPill value={r.field} />
                    </td>
                    <td>
                      <DeltaCell row={r} />
                    </td>
                    <td>
                      <UserCell name={r.changedBy} />
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))
          ) : (
            rows.map((r) => (
              <tr key={r.id}>
                <td style={{ color: 'var(--muted)' }}>{fmtAuditDateTime(r.when)}</td>
                <td className="acc-name" dir="auto">
                  <MutedDash value={r.companyName} />
                </td>
                <td className="acc-code">
                  <MutedDash value={r.companyCode} />
                </td>
                <td>
                  <TypePill value={r.type} />
                </td>
                <td>
                  <FieldPill value={r.field} />
                </td>
                <td>
                  <DeltaCell row={r} />
                </td>
                <td>
                  <UserCell name={r.changedBy} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
