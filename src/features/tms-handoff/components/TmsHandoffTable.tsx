import { MutedDash } from '../../../shared/components/MutedDash';
import { badgeClassForStatus, initials, slaTone } from '../normalize';
import type { TmsHandoffRow } from '../types';

const COLUMN_COUNT = 9;

const SLA_COLOR: Record<string, string> = {
  ok: 'var(--ok)',
  warn: 'var(--warn)',
  bad: 'var(--bad)',
};

function fmtDate(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const titleCellStyle = {
  maxWidth: 220,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap' as const,
};

interface TmsHandoffTableProps {
  rows: TmsHandoffRow[];
  loading: boolean;
  error: string | null;
  onView: (row: TmsHandoffRow) => void;
}

export function TmsHandoffTable({ rows, loading, error, onView }: TmsHandoffTableProps) {
  return (
    <div className="acc-tablewrap">
      <table>
        <thead>
          <tr>
            <th>Task ID</th>
            <th>Decision ID</th>
            <th>Task Title</th>
            <th>Type / Action</th>
            <th>Assignee</th>
            <th>SLA / Due</th>
            <th>Status</th>
            <th>Sent</th>
            <th>View</th>
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
                  Couldn&apos;t load TMS handoff tasks.
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
                  No tasks match the current filters.
                </div>
              </td>
            </tr>
          ) : (
            rows.map((r) => {
              const tone = slaTone(r.dueDate);
              return (
                <tr key={r.id} className="acc-row" onClick={() => onView(r)}>
                  <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11.5, color: 'var(--muted)' }}>
                    <MutedDash value={r.taskCode} />
                  </td>
                  <td style={{ fontWeight: 700, fontSize: 11.5, color: 'var(--brown)' }}>
                    <MutedDash value={r.decisionId} />
                  </td>
                  <td style={titleCellStyle} title={r.title} dir="auto">
                    <MutedDash value={r.title} />
                  </td>
                  <td style={{ fontSize: 11.5, color: 'var(--muted)', fontStyle: 'italic' }}>
                    <MutedDash value={r.typeAction} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: 'var(--goldbg)',
                          color: 'var(--brown)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 9.5,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {initials(r.assignee)}
                      </div>
                      <span
                        style={{
                          fontSize: 11.5,
                          color: 'var(--ink)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {r.assignee}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {r.sla && r.sla !== '—' ? (
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: SLA_COLOR[tone],
                          }}
                        >
                          <i className="fa-regular fa-clock" style={{ marginRight: 3 }} />
                          {r.sla}
                        </span>
                      ) : (
                        <MutedDash value={null} />
                      )}
                      <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>{fmtDate(r.dueDate)}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={badgeClassForStatus(r.statusCode)}
                      style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}
                    >
                      {r.statusLabel}
                    </span>
                  </td>
                  <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    {fmtDate(r.createdOn)}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="acc-btn"
                      style={{ padding: '4px 10px', fontSize: 11 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onView(r);
                      }}
                    >
                      <i className="fa-regular fa-eye" /> View
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
