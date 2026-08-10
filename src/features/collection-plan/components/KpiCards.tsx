import styles from '../CollectionPlan.module.css';
import { fmtTotal } from '../normalize';
import type { PlanTotals } from '../types';

interface KpiCardsProps {
  totals: PlanTotals;
}

export function KpiCards({ totals }: KpiCardsProps) {
  // Matches ref.html's updateKPIs() exactly: the progress bar/achievement text
  // uses `collected` here, distinct from the per-row/footer ACHV% badge which
  // uses `collectedPlus` (collected + tax + rejections) — an intentional
  // difference in the source, not something to unify.
  const achv = totals.targetPlan > 0 ? (totals.collected / totals.targetPlan) * 100 : 0;

  return (
    <div className={styles.kpiWrap}>
      <div className={styles.kpiCell}>
        <div className={styles.kpiTop}>
          <div className={styles.kpiIcon}>
            <i className="fa-solid fa-scale-balanced" />
          </div>
          <div className={styles.kpiLabel}>Total Outstanding</div>
        </div>
        <div className={styles.kpiValue}>{fmtTotal(totals.totalOutstanding)}</div>
        <div className={styles.kpiSub}>All aging buckets + manual entries</div>
      </div>

      <div className={styles.kpiCell}>
        <div className={styles.kpiTop}>
          <div className={`${styles.kpiIcon} ${styles.kpiIconWarn}`}>
            <i className="fa-solid fa-triangle-exclamation" />
          </div>
          <div className={styles.kpiLabel}>Total Rejections</div>
        </div>
        <div className={`${styles.kpiValue} ${styles.kpiValueWarn}`}>{fmtTotal(totals.rejections)}</div>
        <div className={styles.kpiSub}>From Collection team feedback</div>
      </div>

      <div className={styles.kpiCell}>
        <div className={styles.kpiTop}>
          <div className={`${styles.kpiIcon} ${styles.kpiIconInfo}`}>
            <i className="fa-solid fa-layer-group" />
          </div>
          <div className={styles.kpiLabel}>Outstanding + Rej</div>
        </div>
        <div className={styles.kpiValue}>{fmtTotal(totals.outstandingRej)}</div>
        <div className={styles.kpiSub}>Total exposure to customer</div>
      </div>

      <div className={styles.kpiCell}>
        <div className={styles.kpiTop}>
          <div className={`${styles.kpiIcon} ${styles.kpiIconGreen}`}>
            <i className="fa-solid fa-hand-holding-dollar" />
          </div>
          <div className={styles.kpiLabel}>Total Dues</div>
        </div>
        <div className={styles.kpiValue}>{fmtTotal(totals.totalDues)}</div>
        <div className={styles.kpiSub}>Collectible this period</div>
      </div>

      <div className={styles.kpiCell}>
        <div className={styles.kpiTop}>
          <div className={`${styles.kpiIcon} ${styles.kpiIconTarget}`}>
            <i className="fa-solid fa-bullseye" />
          </div>
          <div className={styles.kpiLabel}>Target Plan</div>
        </div>
        <div className={`${styles.kpiValue} ${styles.kpiValuePos}`}>{fmtTotal(totals.targetPlan)}</div>
        <div className={styles.kpiSub}>Achievement {Math.round(achv)}%</div>
        <div className={styles.kpiProgress}>
          <div className={styles.kpiProgressBar} style={{ width: `${Math.min(100, achv)}%` }} />
        </div>
      </div>
    </div>
  );
}
