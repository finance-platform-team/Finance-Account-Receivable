import { MutedDash } from '../../../shared/components/MutedDash';
import type { SlaRow } from '../types';

const COLUMN_COUNT = 9;

interface SlaTableProps {
  rows: SlaRow[];
  loading: boolean;
  error: string | null;
  onEdit: (row: SlaRow) => void;
  onDelete: (row: SlaRow) => void;
}

export function SlaTable({ rows, loading, error, onEdit, onDelete }: SlaTableProps) {
  return (
    <div className="acc-tablewrap">
      <table>
        <thead>
          <tr>
            <th>Action</th>
            <th>Responsible</th>
            <th>SLA Type</th>
            <th>SLA</th>
            <th>Escalation Rule</th>
            <th>Escalation Dep 1 / Role 1</th>
            <th>Escalation Dep 2 / Role 2</th>
            <th>Deduction</th>
            <th>Actions</th>
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
                  Couldn&apos;t load SLA rules.
                  <br />
                  <small>{error}</small>
                </div>
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={COLUMN_COUNT}>
                <div className="acc-state">
                  <i className="fa-solid fa-stopwatch" />
                  No SLA rules yet — create the first rule with &ldquo;New SLA&rdquo;.
                </div>
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id} className="acc-row" onClick={() => onEdit(r)}>
                <td className="acc-name" dir="auto">
                  <MutedDash value={r.action} />
                </td>
                <td dir="auto">
                  <MutedDash value={r.responsibleName} />
                </td>
                <td>
                  {r.slaTypeValue != null ? (
                    <span className="acc-cls-gold" style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                      {r.slaTypeLabel}
                    </span>
                  ) : (
                    <MutedDash value={null} />
                  )}
                </td>
                <td>
                  <MutedDash value={r.slaValue} />
                </td>
                <td>
                  <MutedDash value={r.escalationRule} />
                </td>
                <td dir="auto">
                  <MutedDash value={r.department1} />
                  {r.manager1Name && <span style={{ color: 'var(--muted)' }}> / {r.manager1Name}</span>}
                </td>
                <td dir="auto">
                  <MutedDash value={r.department2} />
                  {r.manager2Name && <span style={{ color: 'var(--muted)' }}> / {r.manager2Name}</span>}
                </td>
                <td>
                  {r.deduction ? (
                    <span style={{ color: 'var(--bad)', fontWeight: 600 }}>{r.deduction}</span>
                  ) : (
                    <span style={{ color: 'var(--muted)' }}>No Networking deduction</span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="acc-btn"
                      style={{ padding: '5px 9px' }}
                      title="Edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(r);
                      }}
                    >
                      <i className="fa-solid fa-pen" />
                    </button>
                    <button
                      className="acc-btn"
                      style={{ padding: '5px 9px', color: 'var(--bad)' }}
                      title="Delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(r);
                      }}
                    >
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
