import type { AuditKpis as AuditKpisData } from '../normalizeAudit';

interface AuditKpisProps {
  kpis: AuditKpisData;
}

export function AuditKpis({ kpis }: AuditKpisProps) {
  return (
    <div className="kpi-grid">
      <div className="kpi-card">
        <div className="kpi-label">
          <i className="fa-solid fa-pen-to-square" /> Total Changes
        </div>
        <div className="kpi-value">{kpis.total}</div>
      </div>

      <div className="kpi-card kpi-info">
        <div className="kpi-label">
          <i className="fa-solid fa-building" /> Companies Affected
        </div>
        <div className="kpi-value">{kpis.companies}</div>
      </div>

      <div className="kpi-card kpi-ok">
        <div className="kpi-label">
          <i className="fa-solid fa-user-group" /> Team Members
        </div>
        <div className="kpi-value">{kpis.users}</div>
      </div>

      <div className="kpi-card kpi-warn">
        <div className="kpi-label">
          <i className="fa-solid fa-tags" /> Most Edited Field
        </div>
        <div className="kpi-value" style={{ fontSize: 16 }}>
          {kpis.topField}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
          {kpis.total === 0 ? 'No data yet' : `${kpis.topFieldCount} change${kpis.topFieldCount === 1 ? '' : 's'}`}
        </div>
      </div>
    </div>
  );
}
