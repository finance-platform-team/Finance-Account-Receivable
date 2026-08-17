import { useCallback, useEffect, useMemo, useState } from 'react';
import { FilterBar } from './components/FilterBar';
import { VerificationTable } from './components/VerificationTable';
import { ConfirmModal } from './components/ConfirmModal';
import type { ConfirmModalConfig } from './components/ConfirmModal';
import { ProofFilesDrawer } from '../../shared/components/ProofFilesDrawer';
import type { ProofFilesTarget } from '../../shared/components/ProofFilesDrawer';
import { deleteProofFile, fetchProofFiles, uploadProofFile } from './proofFiles';
import { Pagination } from '../../shared/components/Pagination';
import { useVerificationData } from './useVerificationData';
import { AR_STATUS, PAYMENT_METHOD, isLocked } from './normalize';
import { Cfm_dailycollectionsService } from '../../generated/services/Cfm_dailycollectionsService';
import { useToasts } from '../../shared/useToasts';
import { ToastRack } from '../../shared/components/ToastRack';
import { CreateDecisionDrawer } from '../../shared/components/CreateDecisionDrawer';
import type { DecisionFormInput } from '../../shared/components/CreateDecisionDrawer';
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
import type { VerificationRow } from './types';

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter((v) => v && v !== '—'))).sort();
}

export function ArVerificationPage() {
  const { rows: allRows, loading, error, reload } = useVerificationData();
  const { toasts, push } = useToasts();
  const { region } = useRegion();

  // Scope every entry on this page to the selected region's BU list before any
  // other filter runs. `region` is null only while the (blocking) picker hasn't
  // been answered yet — show everything rather than guess in that window.
  const rows = useMemo(
    () => (region ? allRows.filter((r) => regionForBu(r.entity) === region) : allRows),
    [allRows, region]
  );

  const [search, setSearch] = useState('');
  const [entity, setEntity] = useState('');
  const [method, setMethod] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(25);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [confirmConfig, setConfirmConfig] = useState<ConfirmModalConfig | null>(null);
  const [proofTarget, setProofTarget] = useState<ProofFilesTarget | null>(null);
  const [decisionDrawerOpen, setDecisionDrawerOpen] = useState(false);
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);

  // AR can only verify entries that already have a proof of payment attached
  // — this is an unconditional business rule, not a UI filter toggle.
  const proofRows = useMemo(() => rows.filter((r) => r.proof && r.proof.trim()), [rows]);

  // Matches the reference exactly: filter dropdown options are built from ALL
  // loaded active entries, not just the proof-attached subset shown in the table.
  const entityOptions = useMemo(() => uniqueSorted(rows.map((r) => r.entity)), [rows]);
  const methodOptions = useMemo(() => uniqueSorted(rows.map((r) => r.methodLabel)), [rows]);
  const statusOptions = useMemo(() => uniqueSorted(rows.map((r) => r.statusLabel)), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return proofRows.filter((r) => {
      if (entity && r.entity !== entity) return false;
      if (method && r.methodLabel !== method) return false;
      if (status && r.statusLabel !== status) return false;
      if (q) {
        const haystack = `${r.ref} ${r.companyCode} ${r.companyName} ${r.paymentReference}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [proofRows, entity, method, status, search]);

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
    setEntity('');
    setMethod('');
    setStatus('');
    resetPage();
  }, [resetPage]);

  // Mirrors the reference's self-pruning of SELECTED — a row dropped from
  // SELECTED the moment it becomes locked or disappears from the loaded set.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected((prev) => {
      let changed = false;
      const next = new Set<string>();
      prev.forEach((id) => {
        const r = rows.find((x) => x.id === id);
        if (r && !isLocked(r.status)) next.add(id);
        else changed = true;
      });
      return changed ? next : prev;
    });
  }, [rows]);

  const selectedRows = useMemo(
    () => rows.filter((r) => selected.has(r.id) && !isLocked(r.status)),
    [rows, selected]
  );

  const handleToggleSelect = useCallback((id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const handleToggleSelectAll = useCallback(
    (checked: boolean) => {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((r) => {
          if (isLocked(r.status)) return;
          if (checked) next.add(r.id);
          else next.delete(r.id);
        });
        return next;
      });
    },
    [filtered]
  );

  const handleToggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleOpenProofFiles = useCallback((row: VerificationRow) => {
    setProofTarget({ title: row.ref, folder: row.docsFolder, proofUrl: row.proof, recordId: row.id, recordRef: row.ref });
  }, []);

  const promptDecision = useCallback(
    (action: 'approve' | 'reject') => {
      const sel = selectedRows;
      if (!sel.length) return;
      const isReject = action === 'reject';
      const statusValue = isReject ? AR_STATUS.REJECTED : AR_STATUS.APPROVED;
      const label = isReject ? 'Reject' : 'Approve';
      const refs = sel.map((e) => e.ref).slice(0, 4).join(', ') + (sel.length > 4 ? ` + ${sel.length - 4} more` : '');

      setConfirmConfig({
        title: `${label} ${sel.length} entr${sel.length === 1 ? 'y' : 'ies'}?`,
        titleIcon: isReject ? 'fa-circle-xmark' : 'fa-circle-check',
        titleColor: isReject ? 'var(--bad)' : 'var(--ok)',
        body: (
          <>
            You are about to mark <strong>{refs}</strong> as <strong>{label}</strong>.
            <br />
            <br />
            {isReject
              ? 'The Collection team will see your comment and be able to correct the entry.'
              : 'The entry will be locked. Add a comment if you want to note something for the record.'}
          </>
        ),
        commentRequired: isReject,
        commentPlaceholder: isReject ? 'Explain why this entry is being rejected…' : 'Optional note for the record…',
        confirmLabel: label,
        confirmVariant: isReject ? 'reject' : 'primary',
        confirmIcon: isReject ? 'fa-circle-xmark' : 'fa-circle-check',
        onOk: async (comment) => {
          let ok = 0;
          let fail = 0;
          let firstErr = '';
          for (const e of sel) {
            try {
              const result = await Cfm_dailycollectionsService.update(e.id, {
                cfm_statusaction: statusValue,
                ...(comment ? { cfm_arcomments: comment } : {}),
              });
              if (!result.success) throw new Error(result.error?.message || 'Update failed.');
              ok++;
            } catch (err) {
              fail++;
              if (!firstErr) firstErr = err instanceof Error ? err.message : 'Update failed.';
            }
          }
          setSelected(new Set());
          if (fail === 0) {
            push(`${label} applied`, `${ok} entr${ok === 1 ? 'y' : 'ies'} updated.`, 'success');
          } else {
            push(`Partial: ${ok} ok, ${fail} failed`, firstErr, 'alert');
          }
          reload();
        },
      });
    },
    [selectedRows, push, reload]
  );

  const handleRequestBankStatement = useCallback(() => {
    const sel = selectedRows;
    if (!sel.length) return;
    const nonBank = sel.filter((e) => e.method !== PAYMENT_METHOD.BANK_TRANSFER);
    if (nonBank.length) {
      push(
        'Bank Transfer only',
        'Only entries with Bank Transfer payment method can request a bank statement.',
        'alert'
      );
      return;
    }
    const refs = sel.map((e) => e.ref).slice(0, 4).join(', ') + (sel.length > 4 ? ` + ${sel.length - 4} more` : '');

    setConfirmConfig({
      title: `Send ${sel.length} entr${sel.length === 1 ? 'y' : 'ies'} to Treasury?`,
      titleIcon: 'fa-paper-plane',
      body: (
        <>
          <strong>{refs}</strong> will be marked as <strong>Pending Bank Statement</strong> and Treasury will be
          notified automatically (Power Automate flow).
        </>
      ),
      confirmLabel: 'Send',
      confirmVariant: 'primary',
      confirmIcon: 'fa-paper-plane',
      onOk: async () => {
        let ok = 0;
        let fail = 0;
        let firstErr = '';
        for (const e of sel) {
          try {
            const result = await Cfm_dailycollectionsService.update(e.id, { cfm_statusaction: AR_STATUS.PENDING_BANK });
            if (!result.success) throw new Error(result.error?.message || 'Update failed.');
            ok++;
          } catch (err) {
            fail++;
            if (!firstErr) firstErr = err instanceof Error ? err.message : 'Update failed.';
          }
        }
        setSelected(new Set());
        if (fail === 0) {
          push('Sent to Treasury', `${ok} entr${ok === 1 ? 'y' : 'ies'} now Pending Bank Statement.`, 'success');
        } else {
          push(`Partial: ${ok} ok, ${fail} failed`, firstErr, 'alert');
        }
        reload();
      },
    });
  }, [selectedRows, push, reload]);

  const handleOpenDecision = useCallback(() => setDecisionDrawerOpen(true), []);
  const handleCloseDecision = useCallback(() => setDecisionDrawerOpen(false), []);

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
          cfm_decisionfromwhere: 5 as Cfm_tmshandoffscfm_decisionfromwhere, // 'AR'
          cfm_tagename: 766340000 as Cfm_tmshandoffscfm_tagename, // 'Collection'
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

  const selCount = selectedRows.length;
  const allBank = selCount > 0 && selectedRows.every((e) => e.method === PAYMENT_METHOD.BANK_TRANSFER);
  const bankTitle = selCount === 0 ? 'Select entries first' : !allBank ? 'Only Bank Transfer entries can request a bank statement' : undefined;

  return (
    <div className="acc-wrap">
      <div className="acc-head">
        <div>
          <h1 className="acc-title">AR Verification</h1>
          <div className="acc-sub">
            Match each collection against DotCare claims and the bank statement, then approve or reject the
            transaction.
          </div>
        </div>
        <div className="acc-actions">
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 999,
              background: 'var(--goldbg)',
              color: 'var(--brown)',
              fontWeight: 700,
              fontSize: 12,
              opacity: selCount === 0 ? 0 : 1,
              pointerEvents: 'none',
              transition: '.15s',
            }}
          >
            <i className="fa-solid fa-check-double" /> {selCount} selected
          </span>
          <button className="acc-btn" onClick={handleOpenDecision}>
            <i className="fa-solid fa-clipboard-check" /> Create Decision
          </button>
          <button className="acc-btn" onClick={handleRequestBankStatement} disabled={!allBank} title={bankTitle}>
            <i className="fa-solid fa-paper-plane" /> Request Bank Statement
          </button>
          <button
            className="acc-btn"
            style={{ background: 'var(--badbg)', borderColor: 'var(--bad)', color: 'var(--bad)' }}
            onClick={() => promptDecision('reject')}
            disabled={selCount === 0}
          >
            <i className="fa-solid fa-circle-xmark" /> Reject
          </button>
          <button
            className="acc-btn acc-btn-primary"
            onClick={() => promptDecision('approve')}
            disabled={selCount === 0}
          >
            <i className="fa-solid fa-circle-check" /> Approve
          </button>
        </div>
      </div>

      <div className="tbl-shell">
        <FilterBar
          search={search}
          onSearchChange={(v) => {
            setSearch(v);
            resetPage();
          }}
          entity={entity}
          onEntityChange={(v) => {
            setEntity(v);
            resetPage();
          }}
          entityOptions={entityOptions}
          method={method}
          onMethodChange={(v) => {
            setMethod(v);
            resetPage();
          }}
          methodOptions={methodOptions}
          status={status}
          onStatusChange={(v) => {
            setStatus(v);
            resetPage();
          }}
          statusOptions={statusOptions}
          onClear={handleClearFilters}
          onReload={reload}
          showing={loading || error ? 0 : filtered.length}
          total={loading || error ? 0 : proofRows.length}
        />

        <VerificationTable
          rows={paged}
          loading={loading}
          error={error}
          selected={selected}
          expanded={expanded}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onToggleExpand={handleToggleExpand}
          onOpenProofFiles={handleOpenProofFiles}
        />

        {!loading && !error && (
          <Pagination
            page={currentPage}
            pageSize={pageSize}
            totalRows={filtered.length}
            itemLabel="entries"
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              resetPage();
            }}
          />
        )}
      </div>

      <ConfirmModal config={confirmConfig} onClose={() => setConfirmConfig(null)} />
      <ProofFilesDrawer
        target={proofTarget}
        onClose={() => setProofTarget(null)}
        fetchFiles={fetchProofFiles}
        uploadFile={uploadProofFile}
        deleteFile={deleteProofFile}
      />

      <CreateDecisionDrawer
        open={decisionDrawerOpen}
        submitting={decisionSubmitting}
        onClose={handleCloseDecision}
        onSubmit={handleSubmitDecision}
      />

      <ToastRack toasts={toasts} />
    </div>
  );
}
