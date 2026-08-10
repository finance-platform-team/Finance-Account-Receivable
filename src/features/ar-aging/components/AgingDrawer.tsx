import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import styles from '../ArAging.module.css';
import { fmt, fmtTotal } from '../normalize';
import type { AgingRow } from '../types';

// Placeholder options for the decision form. ref.html itself leaves the real
// "Task Decision" integration as a TODO (routed through an external TMS flow
// that isn't part of this app's connected Dataverse schema), so these exist to
// make the form usable without inventing a write target that doesn't exist yet.
const DECISION_OPTIONS = [
  'Schedule Follow-up Call',
  'Escalate to Legal',
  'Refer for Write-off',
  'Approve Payment Plan',
  'No Action Needed',
];

type BucketKey = 'notDue' | 'lt30' | 'b3160' | 'b6190' | 'b91120' | 'gt120';

interface BucketDef {
  key: BucketKey;
  label: string;
  danger?: boolean;
}

const BUCKETS: BucketDef[] = [
  { key: 'notDue', label: 'Not Due' },
  { key: 'lt30', label: '< 30 Days' },
  { key: 'b3160', label: '31–60' },
  { key: 'b6190', label: '61–90' },
  { key: 'b91120', label: '91–120', danger: true },
  { key: 'gt120', label: '> 120 Days', danger: true },
];

interface AgingDrawerProps {
  row: AgingRow;
  onClose: () => void;
  onSubmitDecision: (row: AgingRow, decisionType: string, notes: string) => void;
}

export function AgingDrawer({ row, onClose, onSubmitDecision }: AgingDrawerProps) {
  // The parent remounts this component via `key={row.id}` when the selected row
  // changes, so this local state naturally resets per row without an effect.
  const [decisionType, setDecisionType] = useState(DECISION_OPTIONS[0]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const total = row.notDue + row.lt30 + row.b3160 + row.b6190 + row.b91120 + row.gt120;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmitDecision(row, decisionType, notes);
  };

  return (
    <>
      <div className={styles.drawerOverlay} onClick={onClose} />
      <aside className={styles.drawer} role="dialog" aria-label={`${row.name} detail`}>
        <div className={styles.drawerHeader}>
          <div>
            <div className={styles.drawerEyebrow}>Company Detail</div>
            <div className={styles.drawerTitle}>{row.name}</div>
            <div className={styles.drawerSub}>
              {row.code} · {row.type}
            </div>
          </div>
          <button className={styles.drawerClose} onClick={onClose} title="Close">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className={styles.drawerBody}>
          <div className={styles.drawerSection}>
            <div className={styles.drawerSectionTitle}>
              <i className="fa-solid fa-address-book" /> Customer Metadata
            </div>
            <div className={styles.drawerMetaGrid}>
              <div className={styles.drawerMetaItem}>
                <div className={styles.drawerMetaLabel}>Payment Term</div>
                <div className={styles.drawerMetaValue}>{row.paymentTerm}</div>
              </div>
              <div className={styles.drawerMetaItem}>
                <div className={styles.drawerMetaLabel}>Customer Class</div>
                <div className={styles.drawerMetaValue}>{row.customerClass}</div>
              </div>
              <div className={styles.drawerMetaItem}>
                <div className={styles.drawerMetaLabel}>Company Type</div>
                <div className={styles.drawerMetaValue}>{row.companyType}</div>
              </div>
              <div className={styles.drawerMetaItem}>
                <div className={styles.drawerMetaLabel}>Type (BU)</div>
                <div className={styles.drawerMetaValue}>{row.type}</div>
              </div>
              <div className={styles.drawerMetaItem}>
                <div className={styles.drawerMetaLabel}>Task Owner</div>
                <div className={styles.drawerMetaValue}>{row.taskOwner}</div>
              </div>
              <div className={styles.drawerMetaItem}>
                <div className={styles.drawerMetaLabel}>Supervisor</div>
                <div className={styles.drawerMetaValue}>{row.supervisor}</div>
              </div>
            </div>
          </div>

          <div className={styles.drawerSection}>
            <div className={styles.drawerSectionTitle}>
              <i className="fa-solid fa-hourglass" /> Aging Buckets — from DotCare
            </div>
            {BUCKETS.map((b) => {
              const value = row[b.key];
              const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
              return (
                <div key={b.key} className={styles.drawerBucketRow}>
                  <div className={styles.drawerBucketLabel}>{b.label}</div>
                  <div className={styles.drawerBucketTrack}>
                    <div
                      className={`${styles.drawerBucketFill} ${b.danger ? styles.drawerBucketFillDanger : ''}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className={styles.drawerBucketValue}>{fmt(value)}</div>
                </div>
              );
            })}
            <div className={styles.drawerTotalRow}>
              <div className={styles.drawerTotalLabel}>Total Outstanding</div>
              <div className={styles.drawerTotalValue}>{fmtTotal(total)}</div>
            </div>
          </div>

          <form className={styles.drawerSection} onSubmit={handleSubmit}>
            <div className={styles.drawerSectionTitle}>
              <i className="fa-solid fa-clipboard-check" /> Decision
            </div>
            <div className={styles.drawerFormGroup}>
              <label className={styles.drawerFormLabel} htmlFor="drawer-decision-type">
                Decision Type
              </label>
              <select
                id="drawer-decision-type"
                className={styles.drawerSelect}
                value={decisionType}
                onChange={(e) => setDecisionType(e.target.value)}
              >
                {DECISION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.drawerFormGroup}>
              <label className={styles.drawerFormLabel} htmlFor="drawer-decision-notes">
                Notes
              </label>
              <textarea
                id="drawer-decision-notes"
                className={styles.drawerTextarea}
                placeholder="Add context for the collections team…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <button type="submit" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}>
              <i className="fa-solid fa-paper-plane" /> Submit Decision
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
