import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { AuditView } from './components/AuditView';
import { AuditFilterBar } from './components/AuditFilterBar';
import { AuditKpis } from './components/AuditKpis';
import { AuditPagination, AUDIT_PAGE_SIZE } from './components/AuditPagination';
import { KpiCards } from './components/KpiCards';
import { FilterBar } from './components/FilterBar';
import { PlanTable } from './components/PlanTable';
import { PlanDetailDrawer } from './components/PlanDetailDrawer';
import { CreateDecisionDrawer } from '../../shared/components/CreateDecisionDrawer';
import type { DecisionFormInput } from '../../shared/components/CreateDecisionDrawer';
import { useCollectionPlanData } from './useCollectionPlanData';
import { useAuditData } from './useAuditData';
import { usePlanSubmissionLock } from './usePlanSubmissionLock';
import { useToasts } from '../../shared/useToasts';
import { ToastRack } from '../../shared/components/ToastRack';
import { Pagination } from '../../shared/components/Pagination';
import { EDITABLE_FIELDS, EDITABLE_FIELD_LABELS, rowTargetPlan } from './normalize';
import { computeAuditKpis, createManualEntryAudit, defaultAuditMonthRange } from './normalizeAudit';
import { useRegion } from '../../shared/regionContext';
import { regionForBu } from '../../shared/region';
import { Cfm_tmshandoffsService } from '../../generated/services/Cfm_tmshandoffsService';
import type {
  Cfm_tmshandoffscfm_decisionfromwhere,
  Cfm_tmshandoffscfm_priority,
  Cfm_tmshandoffscfm_progress,
  Cfm_tmshandoffscfm_tagename,
} from '../../generated/models/Cfm_tmshandoffsModel';
import type { PageSize } from '../../shared/types';
import type { DirtyChange, EditableFieldKey, PlanRow, PlanTotals } from './types';

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

const escCsv = (v: string | number): string => `"${String(v ?? '').replace(/"/g, '""')}"`;

const TAB_BTN_BASE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '9px 16px',
  borderRadius: 9,
  fontWeight: 600,
  fontSize: 13,
  fontFamily: "'Outfit',sans-serif",
  cursor: 'pointer',
};

function tabButtonStyle(active: boolean): CSSProperties {
  return {
    ...TAB_BTN_BASE,
    border: active ? '1px solid var(--brown)' : '1px solid var(--line)',
    background: active ? 'var(--brown)' : 'var(--card)',
    color: active ? '#fff' : 'var(--ink)',
  };
}

function pctInputStyle(state: PctSaveState): CSSProperties {
  const base: CSSProperties = {
    width: 64,
    padding: '6px 10px',
    border: '1px solid var(--line)',
    borderRadius: 8,
    fontFamily: "'Outfit',sans-serif",
    fontWeight: 700,
    fontSize: 13,
    color: 'var(--ink)',
    textAlign: 'center',
    outline: 'none',
    background: 'var(--card)',
  };
  if (state === 'saving') return { ...base, borderColor: 'var(--gold)', background: 'var(--goldbg)' };
  if (state === 'saved') return { ...base, borderColor: 'var(--ok)', background: 'var(--okbg)' };
  if (state === 'error') return { ...base, borderColor: 'var(--bad)', background: 'var(--badbg)' };
  return base;
}

export function CollectionPlanPage() {
  const { rows: allRows, loading, error, updateRow } = useCollectionPlanData();
  const { locked, send } = usePlanSubmissionLock();
  const { toasts, push } = useToasts();
  const { region } = useRegion();

  // Scope every company on this page to the selected region's BU list before any
  // other filter runs. `region` is null only while the (blocking) picker hasn't
  // been answered yet — show everything rather than guess in that window. The
  // Audit tab keeps joining against the unfiltered `allRows` (see auditFiltered
  // below) so its company/type lookups never break, then applies the same
  // region check on the result.
  const rows = useMemo(
    () => (region ? allRows.filter((r) => regionForBu(r.bu) === region) : allRows),
    [allRows, region]
  );

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
  const [decisionDrawerOpen, setDecisionDrawerOpen] = useState(false);
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);
  const [selectedPlanRow, setSelectedPlanRow] = useState<PlanRow | null>(null);
  const [planDrawerOpen, setPlanDrawerOpen] = useState(false);

  const [auditSearch, setAuditSearch] = useState('');
  const [auditField, setAuditField] = useState('');
  const [auditUser, setAuditUser] = useState('');
  const [auditFrom, setAuditFrom] = useState('');
  const [auditTo, setAuditTo] = useState('');
  const [auditGroup, setAuditGroup] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const auditDefaultsSetRef = useRef(false);
  const targetPctInitRef = useRef(false);

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

  // Restores the last-saved target % once data loads, instead of always resetting to 100.
  useEffect(() => {
    if (!loading && !error && !targetPctInitRef.current && allRows.length > 0) {
      targetPctInitRef.current = true;
      const withPct = allRows.find((r) => r.targetPercentage != null);
      if (withPct?.targetPercentage != null) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTargetPct(withPct.targetPercentage);
      }
    }
  }, [loading, error, allRows]);

  const { auditRows, loading: auditLoading, error: auditError, reload: reloadAudit } = useAuditData(
    allRows,
    viewTab === 'audit'
  );

  // Defaults the audit date filter to the current month the first time the tab is opened,
  // matching ref.html's setDefaultAuditDateRange() call on the AUDIT_LOADED false->true transition.
  useEffect(() => {
    if (viewTab === 'audit' && !auditDefaultsSetRef.current) {
      auditDefaultsSetRef.current = true;
      const { from, to } = defaultAuditMonthRange();
      setAuditFrom(from);
      setAuditTo(to);
    }
  }, [viewTab]);

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

  const auditUserOptions = useMemo(
    () => Array.from(new Set(auditRows.map((r) => r.changedBy))).filter((u) => u && u !== '—').sort(),
    [auditRows]
  );

  const auditFiltered = useMemo(() => {
    const q = auditSearch.trim().toLowerCase();
    return auditRows.filter((r) => {
      if (region && regionForBu(r.type) !== region) return false;
      if (auditField && r.field !== auditField) return false;
      if (auditUser && r.changedBy !== auditUser) return false;
      if (auditFrom && new Date(r.when) < new Date(`${auditFrom}T00:00:00`)) return false;
      if (auditTo && new Date(r.when) > new Date(`${auditTo}T23:59:59`)) return false;
      if (q) {
        const haystack = `${r.companyName} ${r.companyCode} ${r.type} ${r.changedBy}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [auditRows, region, auditField, auditUser, auditFrom, auditTo, auditSearch]);

  const auditKpis = useMemo(() => computeAuditKpis(auditFiltered), [auditFiltered]);

  const auditCurrentPage = Math.min(auditPage, Math.max(1, Math.ceil(auditFiltered.length / AUDIT_PAGE_SIZE)));

  const auditDisplayRows = useMemo(() => {
    if (auditGroup) return auditFiltered;
    const start = (auditCurrentPage - 1) * AUDIT_PAGE_SIZE;
    return auditFiltered.slice(start, start + AUDIT_PAGE_SIZE);
  }, [auditFiltered, auditGroup, auditCurrentPage]);

  const resetPage = useCallback(() => setPage(1), []);

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setBu('');
    setPaymentTerm('');
    setCustomerClass('');
    setCompanyType('');
    resetPage();
  }, [resetPage]);

  const handleClearAuditFilters = useCallback(() => {
    setAuditSearch('');
    setAuditField('');
    setAuditUser('');
    setAuditGroup(false);
    const { from, to } = defaultAuditMonthRange();
    setAuditFrom(from);
    setAuditTo(to);
    setAuditPage(1);
  }, []);

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

    const nowISO = new Date().toISOString();
    let okCount = 0;
    let failCount = 0;
    let firstErr = '';
    let auditFailCount = 0;
    for (const [key, change] of entries) {
      const [rowId, field] = key.split('|') as [string, EditableFieldKey];
      try {
        await updateRow(rowId, { [EDITABLE_FIELDS[field]]: change.value });
        okCount++;
        try {
          await createManualEntryAudit(rowId, EDITABLE_FIELD_LABELS[field], change.orig, change.value, nowISO);
        } catch (auditErr) {
          auditFailCount++;
          console.error('Audit log failed for', rowId, field, auditErr);
        }
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
        `${okCount} field(s) updated successfully.` +
          (auditFailCount
            ? ` (${auditFailCount} audit log entr${auditFailCount === 1 ? 'y' : 'ies'} failed to record.)`
            : ''),
        auditFailCount ? 'alert' : 'success'
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
      const achvChanged = r.achievement == null || Math.abs(r.achievement - achv) >= 0.005;
      const pctChanged = r.targetPercentage == null || Math.abs(r.targetPercentage - targetPct) >= 0.005;
      if (!achvChanged && !pctChanged) continue;
      try {
        await updateRow(r.id, { cfm_achievement: achv, cfm_targetpercentage: targetPct });
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
          .map(escCsv)
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

  const handleExportAuditCsv = useCallback(() => {
    if (!auditFiltered.length) {
      push('Export', 'Nothing to export with current filters.', 'alert');
      return;
    }
    const cols = ['Date & Time', 'Company', 'Company Code', 'Type', 'Field', 'Old Value', 'New Value', 'Changed By'];
    const lines = [cols.join(',')].concat(
      auditFiltered.map((r) =>
        [
          new Date(r.when).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          r.companyName,
          r.companyCode,
          r.type,
          r.field,
          r.oldValue ?? '',
          r.newValue ?? '',
          r.changedBy,
        ]
          .map(escCsv)
          .join(',')
      )
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manual_entry_audit_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    push('Exported', `${auditFiltered.length} rows saved to CSV.`, 'success');
  }, [auditFiltered, push]);

  const handleOpenDecision = useCallback(() => setDecisionDrawerOpen(true), []);
  const handleCloseDecision = useCallback(() => setDecisionDrawerOpen(false), []);

  const handleRowDoubleClick = useCallback((row: PlanRow) => {
    setSelectedPlanRow(row);
    setPlanDrawerOpen(true);
  }, []);
  const handleClosePlanDrawer = useCallback(() => setPlanDrawerOpen(false), []);

  const handleSubmitDecision = useCallback(
    async (input: DecisionFormInput) => {
      setDecisionSubmitting(true);
      try {
        const result = await Cfm_tmshandoffsService.create({
          cfm_tasktitle: input.title,
          ...(input.description ? { cfm_taskdescription: input.description } : {}),
          ...(input.actionToBeTaken ? { cfm_typeaction: input.actionToBeTaken } : {}),
          'cfm_Assignee@odata.bind': `/systemusers(${input.assigneeId})`,
          ...(input.priority != null ? { cfm_priority: input.priority as Cfm_tmshandoffscfm_priority } : {}),
          cfm_duedate: new Date(`${input.dueDate}T00:00:00`).toISOString(),
          // This button lives on the AR / Collection Plan module.
          cfm_decisionfromwhere: 5 as Cfm_tmshandoffscfm_decisionfromwhere, // 'AR'
          cfm_tagename: 766340000 as Cfm_tmshandoffscfm_tagename, // 'Collection'
          // "Send Decision" submits it immediately, rather than leaving it as a draft.
          cfm_progress: 123200005 as Cfm_tmshandoffscfm_progress, // 'Submited'
          statecode: 0,
        });
        if (!result.success) {
          throw new Error(result.error?.message || 'Could not save the decision.');
        }
        push('Decision sent', `"${input.title}" was created and routed via TMS.`, 'success');
        setDecisionDrawerOpen(false);
      } catch (err) {
        push('Could not save decision', err instanceof Error ? err.message : 'Unknown error.', 'alert');
      } finally {
        setDecisionSubmitting(false);
      }
    },
    [push]
  );

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
    <div className="acc-wrap">
      <div className="acc-head">
        <div>
          <h1 className="acc-title">
            {pgTitle}
            <span
              style={{
                marginLeft: 10,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '.04em',
                padding: '4px 10px',
                borderRadius: 999,
                background: locked ? 'var(--okbg)' : 'var(--warnbg)',
                color: locked ? 'var(--ok)' : 'var(--warn)',
                verticalAlign: 'middle',
              }}
            >
              <i className="fa-solid fa-circle" style={{ fontSize: 8 }} /> {locked ? 'Sent' : 'Draft'}
            </span>
          </h1>
          <div className="acc-sub">{pgSub}</div>
        </div>

        <div className="acc-actions">
          {isPlan ? (
            <>
              <button className="acc-btn" onClick={handleExportCsv}>
                <i className="fa-solid fa-file-arrow-down" /> Export
              </button>
              <button className="acc-btn" onClick={handleOpenDecision}>
                <i className="fa-solid fa-clipboard-check" /> Decision
              </button>
              {locked && !manualUnlock && (
                <button className="acc-btn" onClick={handleEditUnlock}>
                  <i className="fa-solid fa-lock-open" /> Edit
                </button>
              )}
              {locked && manualUnlock && (
                <button className="acc-btn" onClick={handleCancelEdit}>
                  <i className="fa-solid fa-xmark" /> Cancel
                </button>
              )}
              {locked && manualUnlock && (
                <button
                  className="acc-btn"
                  style={{ color: 'var(--ok)', borderColor: 'var(--ok)' }}
                  onClick={handleConfirmEdit}
                >
                  <i className="fa-solid fa-check" /> Confirm Edit{dirtyChanges.size ? ` (${dirtyChanges.size})` : ''}
                </button>
              )}
              <button
                className="acc-btn acc-btn-primary"
                style={locked ? { opacity: 0.5, cursor: 'not-allowed', filter: 'grayscale(.4)' } : undefined}
                onClick={handleSend}
                title={locked ? 'Already sent this month' : undefined}
              >
                <i className="fa-solid fa-paper-plane" /> Send to Collection Team
              </button>
            </>
          ) : (
            <>
              <button className="acc-btn" onClick={handleExportAuditCsv}>
                <i className="fa-solid fa-file-arrow-down" /> Export
              </button>
              <button className="acc-btn acc-btn-primary" onClick={reloadAudit}>
                <i className="fa-solid fa-rotate" /> Refresh
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'inline-flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setViewTab('plan')} style={tabButtonStyle(isPlan)}>
          <i className="fa-solid fa-clipboard-list" /> Collection Plan
        </button>
        <button onClick={() => setViewTab('audit')} style={tabButtonStyle(!isPlan)}>
          <i className="fa-solid fa-clock-rotate-left" /> Manual Entry Audit
        </button>
      </div>

      {isPlan ? (
        <div>
          <div className="acc-bar">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--muted)', fontSize: 12.5 }}>
              <i className="fa-solid fa-calendar-days" style={{ color: 'var(--gold)' }} />
              <strong style={{ color: 'var(--brown)' }}>Plan Period:</strong> {planPeriodLabel}
            </span>
            <span style={{ width: 1, height: 20, background: 'var(--line)' }} />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--muted)', fontSize: 12.5 }}>
              <i className="fa-solid fa-bullseye" style={{ color: 'var(--gold)' }} />
              <strong style={{ color: 'var(--brown)' }}>Target Plan:</strong> Total Dues ×
              <input
                type="number"
                min={0}
                step={1}
                value={targetPct}
                onChange={(e) => setTargetPct(isNaN(parseFloat(e.target.value)) ? 100 : parseFloat(e.target.value))}
                onBlur={handleTargetPctBlur}
                style={pctInputStyle(pctSaveState)}
              />
              %
            </span>
            <span style={{ width: 1, height: 20, background: 'var(--line)' }} />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--muted)', fontSize: 12.5 }}>
              <i className="fa-solid fa-clock" style={{ color: 'var(--gold)' }} />
              Last refresh: <strong style={{ color: 'var(--brown)' }}>{lastRefreshLabel}</strong>
            </span>
          </div>

          <KpiCards totals={loading || error ? EMPTY_TOTALS : totals} />

          <div className="tbl-shell">
            <div className="tbl-hdr">
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
            </div>

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
              onRowDoubleClick={handleRowDoubleClick}
            />

            {!loading && !error && (
              <Pagination
                page={currentPage}
                pageSize={pageSize}
                totalRows={filtered.length}
                itemLabel="companies"
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
        <div>
          <AuditKpis kpis={auditKpis} />

          <div className="tbl-shell">
            <div className="tbl-hdr">
              <AuditFilterBar
                search={auditSearch}
                onSearchChange={(v) => {
                  setAuditSearch(v);
                  setAuditPage(1);
                }}
                field={auditField}
                onFieldChange={(v) => {
                  setAuditField(v);
                  setAuditPage(1);
                }}
                user={auditUser}
                onUserChange={(v) => {
                  setAuditUser(v);
                  setAuditPage(1);
                }}
                userOptions={auditUserOptions}
                from={auditFrom}
                onFromChange={(v) => {
                  setAuditFrom(v);
                  setAuditPage(1);
                }}
                to={auditTo}
                onToChange={(v) => {
                  setAuditTo(v);
                  setAuditPage(1);
                }}
                group={auditGroup}
                onGroupChange={(v) => {
                  setAuditGroup(v);
                  setAuditPage(1);
                }}
                onClear={handleClearAuditFilters}
                showing={auditFiltered.length}
                total={auditRows.length}
              />
            </div>

            <AuditView rows={auditDisplayRows} grouped={auditGroup} loading={auditLoading} error={auditError} />

            {!auditGroup && !auditLoading && !auditError && (
              <AuditPagination page={auditCurrentPage} totalRows={auditFiltered.length} onPageChange={setAuditPage} />
            )}
          </div>
        </div>
      )}

      <CreateDecisionDrawer
        open={decisionDrawerOpen}
        submitting={decisionSubmitting}
        onClose={handleCloseDecision}
        onSubmit={handleSubmitDecision}
      />

      <PlanDetailDrawer row={selectedPlanRow} open={planDrawerOpen} targetPct={targetPct} onClose={handleClosePlanDrawer} />

      <ToastRack toasts={toasts} />
    </div>
  );
}
