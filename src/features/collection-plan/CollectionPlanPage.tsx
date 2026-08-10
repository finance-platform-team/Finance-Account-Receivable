import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './CollectionPlan.module.css';
import { AuditView } from './components/AuditView';
import { KpiCards } from './components/KpiCards';
import { FilterBar } from './components/FilterBar';
import { PlanTable } from './components/PlanTable';
import { useCollectionPlanData } from './useCollectionPlanData';
import { usePlanSubmissionLock } from './usePlanSubmissionLock';
import { useToasts } from '../../shared/useToasts';
import { ToastRack } from '../../shared/components/ToastRack';
import { Pagination } from '../../shared/components/Pagination';
import { EDITABLE_FIELDS, EDITABLE_FIELD_LABELS, rowTargetPlan } from './normalize';
import type { PageSize } from '../../shared/types';
import type { DirtyChange, EditableFieldKey, PlanTotals } from './types';

const EMPTY_TOTALS: PlanTotals = {
  agreedrecon: 0,
  totalOutstanding: 0,
  rejections: 0,
  outstandingRej: 0,
  totalDues: 0,
  targetPlan: 0,
  collected: 0,
  collectedPlus: 0,
};

type ViewTab = 'plan' | 'audit';
type PctSaveState = 'idle' | 'saving' | 'saved' | 'error';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function dirtyKey(rowId: string, field: EditableFieldKey): string {
  return `${rowId}|${field}`;
}

export function CollectionPlanPage() {
  const { rows, loading, error, updateRow } = useCollectionPlanData();
  const { locked, send } = usePlanSubmissionLock();
  const { toasts, push } = useToasts();

  const [viewTab, setViewTab] = useState<ViewTab>('plan');
  const [search, setSearch] = useState('');
  const [bu, setBu] = useState('');
  const [paymentTerm, setPaymentTerm] = useState('');
  const [customerClass, setCustomerClass] = useState('');
  const [companyType, setCompanyType] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(15);
  const [targetPct, setTargetPct] = useState(100);
  const [pctSaveState, setPctSaveState] = useState<PctSaveState>('idle');
  const [manualUnlock, setManualUnlock] = useState(false);
  const [dirtyChanges, setDirtyChanges] = useState<Map<string, DirtyChange>>(new Map());
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // ref.html's reload() toasts once on a successful initial load — AR Aging's
  // equivalent doesn't. Both are read from the same real source (ref.html).
  useEffect(() => {
    if (!loading && !error) {
      // Records when the async load completed, matching ref.html's reload() success toast.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLastRefresh(new Date());
      push('Loaded', `${rows.length} plan records loaded from Dataverse.`, 'success');
    }
    // Only the initial load transition matters here; `rows`/`push` deliberately excluded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, error]);

  const cellMode = !locked ? 'instant' : manualUnlock ? 'dirty' : 'locked';

  const buOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.bu).filter((t) => t && t !== '—'))).sort(),
    [rows]
  );
  const paymentTermOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.paymentTerm).filter((t) => t && t !== '—'))).sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (bu && r.bu !== bu) return false;
      if (customerClass && r.customerClass !== customerClass) return false;
      if (companyType && r.companyType !== companyType) return false;
      if (paymentTerm && r.paymentTerm !== paymentTerm) return false;
      if (q) {
        const haystack = `${r.code} ${r.name} ${r.taskOwner} ${r.supervisor}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, bu, customerClass, companyType, paymentTerm, search]);

  const totals = useMemo<PlanTotals>(() => {
    return filtered.reduce(
      (acc, r) => ({
        agreedrecon: acc.agreedrecon + r.agreedrecon,
        totalOutstanding: acc.totalOutstanding + r.totalOutstanding,
        rejections: acc.rejections + r.rejections,
        outstandingRej: acc.outstandingRej + r.outstandingRej,
        totalDues: acc.totalDues + r.totalDues,
        targetPlan: acc.targetPlan + rowTargetPlan(r, targetPct),
        collected: acc.collected + r.collected,
        collectedPlus: acc.collectedPlus + r.collectedPlus,
      }),
      { ...EMPTY_TOTALS }
    );
  }, [filtered, targetPct]);

  const totalPages = useMemo(() => {
    const size = pageSize === 'all' ? Math.max(filtered.length, 1) : pageSize;
    return Math.max(1, Math.ceil(filtered.length / size));
  }, [filtered.length, pageSize]);
  const currentPage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    if (pageSize === 'all') return filtered;
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const resetPage = useCallback(() => setPage(1), []);

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setBu('');
    setPaymentTerm('');
    setCustomerClass('');
    setCompanyType('');
    resetPage();
  }, [resetPage]);

  const handleInstantSave = useCallback(
    async (rowId: string, field: EditableFieldKey, value: number) => {
      const row = rows.find((r) => r.id === rowId);
      await updateRow(rowId, { [EDITABLE_FIELDS[field]]: value });
      push('Saved', `${EDITABLE_FIELD_LABELS[field]} updated for ${row?.name ?? 'company'}`, 'success');
    },
    [rows, updateRow, push]
  );

  const handleDirtyChange = useCallback((rowId: string, field: EditableFieldKey, value: number, orig: number) => {
    setDirtyChanges((prev) => {
      const next = new Map(prev);
      const key = dirtyKey(rowId, field);
      if (value === orig) {
        next.delete(key);
      } else {
        next.set(key, { value, orig });
      }
      return next;
    });
  }, []);

  const handleEditUnlock = useCallback(() => {
    setManualUnlock(true);
    push(
      'Editing enabled',
      'Manual Entry columns are open. Make your changes, then use Confirm Edit to save them all at once.',
      'info'
    );
  }, [push]);

  const handleCancelEdit = useCallback(() => {
    if (dirtyChanges.size > 0 && !window.confirm(`Discard ${dirtyChanges.size} unsaved change(s)?`)) {
      return;
    }
    setDirtyChanges(new Map());
    setManualUnlock(false);
  }, [dirtyChanges.size]);

  const handleConfirmEdit = useCallback(async () => {
    if (dirtyChanges.size === 0) {
      push('Nothing to save', 'No changes were made.', 'info');
      return;
    }
    const entries = Array.from(dirtyChanges.entries());
    const affectedIds = new Set(entries.map(([key]) => key.split('|')[0]));
    if (
      !window.confirm(
        `Save ${entries.length} change(s) across ${affectedIds.size} compan${affectedIds.size === 1 ? 'y' : 'ies'}?`
      )
    ) {
      return;
    }

    let okCount = 0;
    let failCount = 0;
    let firstErr = '';
    for (const [key, change] of entries) {
      const [rowId, field] = key.split('|') as [string, EditableFieldKey];
      try {
        await updateRow(rowId, { [EDITABLE_FIELDS[field]]: change.value });
        okCount++;
      } catch (err) {
        failCount++;
        if (!firstErr) firstErr = err instanceof Error ? err.message : 'Save failed.';
      }
    }

    setDirtyChanges(new Map());
    setManualUnlock(false);

    if (failCount === 0) {
      push(
        'Changes saved',
        `${okCount} field(s) updated successfully. (Audit log not recorded — connect cfm_manualentryaudits to enable it.)`,
        'alert'
      );
    } else {
      push('Saved with errors', `Saved ${okCount}, failed ${failCount}. ${firstErr}`, 'alert');
    }
  }, [dirtyChanges, updateRow, push]);

  const handleTargetPctBlur = useCallback(async () => {
    setPctSaveState('saving');
    let ok = 0;
    let fail = 0;
    let firstErr = '';
    for (const r of rows) {
      const target = r.targetPlanDB > 0 ? r.targetPlanDB : rowTargetPlan(r, targetPct);
      const achv = target > 0 ? (r.collected / target) * 100 : 0;
      if (r.achievement != null && Math.abs(r.achievement - achv) < 0.005) continue;
      try {
        await updateRow(r.id, { cfm_achievement: achv });
        ok++;
      } catch (err) {
        fail++;
        if (!firstErr) firstErr = err instanceof Error ? err.message : 'Recalc failed.';
      }
    }
    if (fail === 0) {
      setPctSaveState('saved');
      setTimeout(() => setPctSaveState('idle'), 1600);
      if (ok > 0) push('Achievement updated', `${ok} row(s) recalculated & saved.`, 'success');
    } else {
      setPctSaveState('error');
      push(`Recalc: saved ${ok}, failed ${fail}`, firstErr, 'alert');
    }
  }, [rows, targetPct, updateRow, push]);

  const handleExportCsv = useCallback(() => {
    if (!filtered.length) {
      push('Export', 'Nothing to export with current filters.', 'alert');
      return;
    }
    const cols = [
      'Payment Term',
      'Customer Class',
      'Company Type',
      'Type',
      'Task Owner',
      'Supervisor',
      'Company Code',
      'Company Name',
      'Early Payment',
      'Legal Issues',
      'Bankruptcy',
      'Claims Issue',
      'Stopped',
      'Agreed Recon',
      'Total Outstanding',
      'Rejections',
      'Outstanding + Rej',
      'Total Dues',
      'Target Plan',
      'Collected',
      'Collected + Tax + Rej',
    ];
    const esc = (v: string | number) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [cols.join(',')].concat(
      filtered.map((r) =>
        [
          r.paymentTerm,
          r.customerClass,
          r.companyType,
          r.bu,
          r.taskOwner,
          r.supervisor,
          r.code,
          r.name,
          r.earlypayment,
          r.legalissues,
          r.bankruptcy,
          r.claimsissue,
          r.stopped,
          r.agreedrecon,
          r.totalOutstanding,
          r.rejections,
          r.outstandingRej,
          r.totalDues,
          rowTargetPlan(r, targetPct),
          r.collected,
          r.collectedPlus,
        ]
          .map(esc)
          .join(',')
      )
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collection_plan_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    push('Exported', `${filtered.length} rows saved to CSV.`, 'success');
  }, [filtered, targetPct, push]);

  const handleOpenDecision = useCallback(() => {
    push('Create Task Decision', 'Decision modal not yet wired. Will open the Task Decision form and route via TMS.', 'info');
  }, [push]);

  const handleSend = useCallback(async () => {
    const result = await send();
    if (result.error === 'already-sent') {
      push('Already sent', 'The Collection Plan was already sent this month.', 'info');
      return;
    }
    if (!result.ok) {
      push('Send failed', result.error ?? 'Unknown error.', 'alert');
      return;
    }
    if (result.isLate) {
      push(
        'Sent (Late)',
        'Submission logged past day 7 of the month. The responsible manager will be notified automatically.',
        'alert'
      );
    } else {
      push('Sent', 'Collection Plan submission logged successfully for the Collection Team.', 'success');
    }
  }, [send, push]);

  const now = new Date();
  const planPeriodLabel = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  const lastRefreshLabel = lastRefresh
    ? lastRefresh.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    : '—';

  const isPlan = viewTab === 'plan';
  const pgTitle = isPlan ? 'Collection Plan' : 'Manual Entry Audit';
  const pgSub = isPlan
    ? 'Auto-populated from DotCare and controlled by AR Supervisor before routing to Collection.'
    : 'Every change made to Manual Entry fields after a Collection Plan was sent — who changed it, when, and what it was before.';

  return (
    <div className={styles.page}>
      <div className={styles.pgHdr}>
        <div>
          <div className={styles.pgEyebrow}>
            <i className="fa-solid fa-chart-line" /> AR Planning
          </div>
          <h1 className={styles.pgTitle}>
            {pgTitle}
            <span className={styles.statusChip}>
              <i className="fa-solid fa-circle" /> {locked ? 'Sent' : 'Draft'}
            </span>
          </h1>
          <div className={styles.pgSub}>{pgSub}</div>
        </div>

        {isPlan ? (
          <div className={styles.hdrActions}>
            <button className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={handleExportCsv}>
              <i className="fa-solid fa-file-arrow-down" /> Export
            </button>
            <button className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={handleOpenDecision}>
              <i className="fa-solid fa-clipboard-check" /> Decision
            </button>
            {locked && !manualUnlock && (
              <button className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={handleEditUnlock}>
                <i className="fa-solid fa-lock-open" /> Edit
              </button>
            )}
            {locked && manualUnlock && (
              <button className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={handleCancelEdit}>
                <i className="fa-solid fa-xmark" /> Cancel
              </button>
            )}
            {locked && manualUnlock && (
              <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`} onClick={handleConfirmEdit}>
                <i className="fa-solid fa-check" /> Confirm Edit{dirtyChanges.size ? ` (${dirtyChanges.size})` : ''}
              </button>
            )}
            <button
              className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm} ${locked ? styles.btnLocked : ''}`}
              onClick={handleSend}
              title={locked ? 'Already sent this month' : undefined}
            >
              <i className="fa-solid fa-paper-plane" /> Send to Collection Team
            </button>
          </div>
        ) : (
          <div className={styles.hdrActions}>
            <button className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} disabled>
              <i className="fa-solid fa-file-arrow-down" /> Export
            </button>
            <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`} disabled>
              <i className="fa-solid fa-rotate" /> Refresh
            </button>
          </div>
        )}
      </div>

      <div className={styles.viewTabs}>
        <button
          className={`${styles.viewTab} ${isPlan ? styles.viewTabActive : ''}`}
          onClick={() => setViewTab('plan')}
        >
          <i className="fa-solid fa-clipboard-list" /> Collection Plan
        </button>
        <button
          className={`${styles.viewTab} ${!isPlan ? styles.viewTabActive : ''}`}
          onClick={() => setViewTab('audit')}
        >
          <i className="fa-solid fa-clock-rotate-left" /> Manual Entry Audit
        </button>
      </div>

      {isPlan ? (
        <div>
          <div className={styles.planMeta}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div className={styles.metaGroup}>
                <i className="fa-solid fa-calendar-days" />
                <span>
                  <strong>Plan Period:</strong> {planPeriodLabel}
                </span>
              </div>
              <div className={styles.metaSep} />
              <div className={styles.metaGroup}>
                <i className="fa-solid fa-bullseye" />
                <span>
                  <strong>Target Plan:</strong> Total Dues ×
                </span>
                <input
                  className={`${styles.pctInput} ${
                    pctSaveState === 'saving'
                      ? styles.saving
                      : pctSaveState === 'saved'
                        ? styles.saved
                        : pctSaveState === 'error'
                          ? styles.errorState
                          : ''
                  }`}
                  type="number"
                  min={0}
                  step={1}
                  value={targetPct}
                  onChange={(e) => setTargetPct(isNaN(parseFloat(e.target.value)) ? 100 : parseFloat(e.target.value))}
                  onBlur={handleTargetPctBlur}
                />
                <span>%</span>
              </div>
              <div className={styles.metaSep} />
              <div className={styles.metaGroup}>
                <i className="fa-solid fa-clock" />
                <span>
                  Last refresh: <strong>{lastRefreshLabel}</strong>
                </span>
              </div>
            </div>
          </div>

          <KpiCards totals={loading || error ? EMPTY_TOTALS : totals} />

          <div className={styles.tblShell}>
            <FilterBar
              search={search}
              onSearchChange={(v) => {
                setSearch(v);
                resetPage();
              }}
              bu={bu}
              onBuChange={(v) => {
                setBu(v);
                resetPage();
              }}
              buOptions={buOptions}
              paymentTerm={paymentTerm}
              onPaymentTermChange={(v) => {
                setPaymentTerm(v);
                resetPage();
              }}
              paymentTermOptions={paymentTermOptions}
              customerClass={customerClass}
              onCustomerClassChange={(v) => {
                setCustomerClass(v);
                resetPage();
              }}
              companyType={companyType}
              onCompanyTypeChange={(v) => {
                setCompanyType(v);
                resetPage();
              }}
              onClear={handleClearFilters}
              showing={loading || error ? 0 : filtered.length}
              total={rows.length}
            />

            <PlanTable
              rows={paged}
              filteredCount={filtered.length}
              totals={totals}
              targetPct={targetPct}
              loading={loading}
              error={error}
              cellMode={cellMode}
              dirtyChanges={dirtyChanges}
              onInstantSave={handleInstantSave}
              onDirtyChange={handleDirtyChange}
            />

            {!loading && !error && (
              <Pagination
                page={currentPage}
                pageSize={pageSize}
                totalRows={filtered.length}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  resetPage();
                }}
              />
            )}
          </div>
        </div>
      ) : (
        <AuditView />
      )}

      <ToastRack toasts={toasts} />
    </div>
  );
}
