import { fmtTotal } from '../normalize';
import type { AgingTotals } from '../types';

interface KpiCardsProps {
  totals: AgingTotals;
}

export function KpiCards({ totals }: KpiCardsProps) {
  return (
    <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
      <div className="kpi-card">
        <div className="kpi-label">
          <i className="fa-solid fa-calendar-check" />
          Not Due
        </div>
        <div className="kpi-value">{fmtTotal(totals.notDue)}</div>
      </div>

      <div className="kpi-card kpi-warn">
        <div className="kpi-label">
          <i className="fa-solid fa-hourglass-half" />
          31–60
        </div>
        <div className="kpi-value">{fmtTotal(totals.b3160)}</div>
      </div>

      <div className="kpi-card kpi-warn">
        <div className="kpi-label">
          <i className="fa-solid fa-hourglass-end" />
          61–90
        </div>
        <div className="kpi-value">{fmtTotal(totals.b6190)}</div>
      </div>

      <div className="kpi-card kpi-bad">
        <div className="kpi-label">
          <i className="fa-solid fa-triangle-exclamation" />
          91–120
        </div>
        <div className="kpi-value">{fmtTotal(totals.b91120)}</div>
      </div>

      <div className="kpi-card kpi-bad">
        <div className="kpi-label">
          <i className="fa-solid fa-fire" />
          &gt; 120 Days
        </div>
        <div className="kpi-value">{fmtTotal(totals.gt120)}</div>
      </div>
    </div>
  );
}
