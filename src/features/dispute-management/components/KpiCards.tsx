import { fmtEGP } from '../normalize';

interface KpiCardsProps {
  total: number;
  amount: number;
  pending: number;
  approved: number;
}

export function KpiCards({ total, amount, pending, approved }: KpiCardsProps) {
  return (
    <div className="kpi-grid">
      <div className="kpi-card">
        <div className="kpi-label">
          <i className="fa-solid fa-folder-open" /> Total Disputes
        </div>
        <div className="kpi-value">{total.toLocaleString('en-US')}</div>
      </div>
      <div className="kpi-card kpi-gold">
        <div className="kpi-label">
          <i className="fa-solid fa-sack-dollar" /> Disputed Amount
        </div>
        <div className="kpi-value">{fmtEGP(amount)}</div>
      </div>
      <div className="kpi-card kpi-warn">
        <div className="kpi-label">
          <i className="fa-solid fa-clock" /> Pending AR
        </div>
        <div className="kpi-value">{pending.toLocaleString('en-US')}</div>
      </div>
      <div className="kpi-card kpi-ok">
        <div className="kpi-label">
          <i className="fa-solid fa-circle-check" /> Approved
        </div>
        <div className="kpi-value">{approved.toLocaleString('en-US')}</div>
      </div>
    </div>
  );
}
