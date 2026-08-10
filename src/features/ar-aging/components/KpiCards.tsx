import styles from '../ArAging.module.css';
import { fmtTotal } from '../normalize';
import type { AgingTotals } from '../types';

interface KpiCardsProps {
  totals: AgingTotals;
}

export function KpiCards({ totals }: KpiCardsProps) {
  return (
    <div className={styles.kpiWrap}>
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCell}>
          <div className={styles.kpiTop}>
            <div className={`${styles.kpiIcon} ${styles.kpiIconGreen}`}>
              <i className="fa-solid fa-calendar-check" />
            </div>
            <div className={styles.kpiLabel}>Not Due</div>
          </div>
          <div className={styles.kpiValue}>{fmtTotal(totals.notDue)}</div>
          <div className={styles.kpiSub}>Within payment term</div>
        </div>

        <div className={styles.kpiCell}>
          <div className={styles.kpiTop}>
            <div className={styles.kpiIcon}>
              <i className="fa-solid fa-clock" />
            </div>
            <div className={styles.kpiLabel}>&lt; 30 Days</div>
          </div>
          <div className={styles.kpiValue}>{fmtTotal(totals.lt30)}</div>
          <div className={styles.kpiSub}>Recently due</div>
        </div>

        <div className={styles.kpiCell}>
          <div className={styles.kpiTop}>
            <div className={styles.kpiIcon}>
              <i className="fa-solid fa-hourglass-half" />
            </div>
            <div className={styles.kpiLabel}>31–60</div>
          </div>
          <div className={styles.kpiValue}>{fmtTotal(totals.b3160)}</div>
          <div className={styles.kpiSub}>Follow-up window</div>
        </div>

        <div className={styles.kpiCell}>
          <div className={styles.kpiTop}>
            <div className={`${styles.kpiIcon} ${styles.kpiIconAmber}`}>
              <i className="fa-solid fa-hourglass-end" />
            </div>
            <div className={styles.kpiLabel}>61–90</div>
          </div>
          <div className={styles.kpiValue}>{fmtTotal(totals.b6190)}</div>
          <div className={styles.kpiSub}>Escalation risk</div>
        </div>

        <div className={`${styles.kpiCell} ${styles.kpiCellWarn}`}>
          <div className={styles.kpiTop}>
            <div className={`${styles.kpiIcon} ${styles.kpiIconDanger}`}>
              <i className="fa-solid fa-triangle-exclamation" />
            </div>
            <div className={styles.kpiLabel}>91–120</div>
          </div>
          <div className={`${styles.kpiValue} ${styles.kpiValueDanger}`}>{fmtTotal(totals.b91120)}</div>
          <div className={styles.kpiSub}>Overdue — action required</div>
        </div>

        <div className={`${styles.kpiCell} ${styles.kpiCellCrit}`}>
          <div className={styles.kpiTop}>
            <div className={`${styles.kpiIcon} ${styles.kpiIconDanger}`}>
              <i className="fa-solid fa-fire" />
            </div>
            <div className={styles.kpiLabel}>&gt; 120 Days</div>
          </div>
          <div className={`${styles.kpiValue} ${styles.kpiValueDanger}`}>{fmtTotal(totals.gt120)}</div>
          <div className={styles.kpiSub}>Legal / dispute candidates</div>
        </div>
      </div>
    </div>
  );
}
