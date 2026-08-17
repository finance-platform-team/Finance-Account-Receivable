import { fmtTotal } from '../normalize';
import type { PlanTotals } from '../types';

interface KpiCardsProps {
  totals: PlanTotals;
}

export function KpiCards({ totals }: KpiCardsProps) {
  // Matches ref.html's updateKPIs() exactly: the achievement % here uses
  // `collected`, distinct from the per-row/footer ACHV% badge which uses
  // `collectedPlus` (collected + tax + rejections) — an intentional
  // difference in the source, not something to unify.
  const achv = totals.targetPlan > 0 ? (totals.collected / totals.targetPlan) * 100 : 0;

  return (
    <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
      <div className="kpi-card">
        <div className="kpi-label">
          <i className="fa-solid fa-scale-balanced" /> Total Outstanding
        </div>
        <div className="kpi-value">{fmtTotal(totals.totalOutstanding)}</div>
      </div>

      <div className="kpi-card kpi-warn">
        <div className="kpi-label">
          <i className="fa-solid fa-triangle-exclamation" /> Total Rejections
        </div>
        <div className="kpi-value">{fmtTotal(totals.rejections)}</div>
      </div>

      <div className="kpi-card kpi-info">
        <div className="kpi-label">
          <i className="fa-solid fa-layer-group" /> Outstanding + Rej
        </div>
        <div className="kpi-value">{fmtTotal(totals.outstandingRej)}</div>
      </div>

      <div className="kpi-card kpi-gold">
        <div className="kpi-label">
          <i className="fa-solid fa-hand-holding-dollar" /> Total Dues
        </div>
        <div className="kpi-value">{fmtTotal(totals.totalDues)}</div>
      </div>

      <div className="kpi-card kpi-ok">
        <div className="kpi-label">
          <i className="fa-solid fa-bullseye" /> Target Plan
        </div>
        <div className="kpi-value">
          {fmtTotal(totals.targetPlan)}
          <small> · {Math.round(achv)}% achieved</small>
        </div>
      </div>
    </div>
  );
}
