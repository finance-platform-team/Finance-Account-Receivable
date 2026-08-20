import { useCallback, useMemo, useState } from 'react';
import { TreasuryTable } from './components/TreasuryTable';
import { Pagination } from '../../shared/components/Pagination';
import { ToastRack } from '../../shared/components/ToastRack';
import { ProofFilesDrawer } from '../../shared/components/ProofFilesDrawer';
import type { ProofFilesTarget } from '../../shared/components/ProofFilesDrawer';
import { useVerificationData } from '../AR Verification/useVerificationData';
import { AR_STATUS } from '../AR Verification/normalize';
import { fetchProofFiles, uploadProofFile, deleteProofFile } from '../AR Verification/proofFiles';
import type { VerificationRow } from '../AR Verification/types';
import { Cfm_dailycollectionsService } from '../../generated/services/Cfm_dailycollectionsService';
import { useToasts } from '../../shared/useToasts';
import { useRegion } from '../../shared/regionContext';
import { regionForBu } from '../../shared/region';
import type { PageSize } from '../../shared/types';

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter((v) => v && v !== '—'))).sort();
}

export function TreasuryWorkflowPage() {
  const { rows: allRows, loading, error, reload } = useVerificationData();
  const { toasts, push } = useToasts();
  const { region } = useRegion();

  const [search, setSearch] = useState('');
  const [entity, setEntity] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(15);
  const [proofTarget, setProofTarget] = useState<ProofFilesTarget | null>(null);

  // Only Daily Collection entries currently awaiting a bank statement — this
  // is the AR-side handoff into Treasury's workflow.
  const pendingBankRows = useMemo(() => allRows.filter((r) => r.status === AR_STATUS.PENDING_BANK), [allRows]);

  const rows = useMemo(
    () => (region ? pendingBankRows.filter((r) => regionForBu(r.entity) === region) : pendingBankRows),
    [pendingBankRows, region]
  );

  const entityOptions = useMemo(() => uniqueSorted(rows.map((r) => r.entity)), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (entity && r.entity !== entity) return false;
      if (q) {
        const haystack = `${r.ref} ${r.companyCode} ${r.companyName}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, entity, search]);

  const resetPage = useCallback(() => setPage(1), []);

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

  const handleOpenProofFiles = useCallback((row: VerificationRow) => {
    setProofTarget({ title: row.ref, folder: row.docsFolder, proofUrl: row.proof, recordId: row.id, recordRef: row.ref });
  }, []);

  // Treasury's part of the handoff: once the bank statement is uploaded here,
  // the entry is done waiting on Treasury and goes back to Pending AR
  // Verification so AR can complete matching/allocation.
  const handleUploadBankStatement = useCallback(
    async (target: ProofFilesTarget, file: File) => {
      try {
        await uploadProofFile(target, file);
      } catch (err) {
        const message = err instanceof Error ? err.message : '';
        // A gateway timeout (502/NoResponse) doesn't mean the upload failed —
        // the flow is usually still running server-side. Proceed to mark the
        // record Done anyway (ProofFilesDrawer's own retry loop separately
        // confirms the file shows up in the list). Any other error is real —
        // re-throw so the drawer surfaces it and the status stays put.
        if (!/502|no response|timeout|gateway/i.test(message)) throw err;
      }
      if (!target.recordId) return;
      const result = await Cfm_dailycollectionsService.update(target.recordId, {
        cfm_statusaction: AR_STATUS.PENDING_VERIFY,
      });
      if (!result.success) {
        throw new Error(result.error?.message || 'Uploaded, but could not update the status.');
      }
      // NOTE: entering Pending AR Verification here does NOT add to AR
      // Aging's pending-confirmation total — that ADD logic belongs
      // exclusively to the Daily Collection creation flow (not built yet),
      // not to this Treasury handoff. See AR Verification/pendingArVerificationSync.ts.
      push('Done', `"${target.recordRef}" bank statement uploaded — sent back to AR for matching.`, 'success');
      reload();
    },
    [push, reload]
  );

  const handleExportCsv = useCallback(() => {
    if (!filtered.length) {
      push('Export', 'Nothing to export with current filters.', 'alert');
      return;
    }
    const cols = ['Ref', 'Entity', 'Company Code', 'Company Name', 'Collection Date', 'Bank Account', 'Collected (Net)', 'Allocate To Months', 'Proof', 'Status'];
    const escapeCsv = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [cols.join(',')].concat(
      filtered.map((r) =>
        [r.ref, r.entity, r.companyCode, r.companyName, r.date.slice(0, 10), r.bankAccount, String(r.net), r.monthsLabel, r.proof || '—', 'Pending Bank Statement']
          .map(escapeCsv)
          .join(',')
      )
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `treasury_workflow_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    push('Exported', `${filtered.length} rows saved to CSV.`, 'success');
  }, [filtered, push]);

  return (
    <div className="acc-wrap">
      <div className="acc-head">
        <div>
          <h1 className="acc-title">Treasury Workflow</h1>
          <div className="acc-sub">Collections awaiting the bank statement before they can be matched and allocated.</div>
        </div>
        <div className="acc-actions">
          <button className="acc-btn" onClick={reload}>
            <i className="fa-solid fa-rotate" /> Refresh Data
          </button>
          <button className="acc-btn" onClick={handleExportCsv}>
            <i className="fa-solid fa-file-excel" /> Export
          </button>
        </div>
      </div>

      <div className="tbl-shell">
        <div className="tbl-hdr">
          <div className="acc-search">
            <i className="fa-solid fa-magnifying-glass" />
            <input
              type="text"
              placeholder="Search company, code, ref…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
            />
          </div>

          <select
            className="acc-f"
            value={entity}
            onChange={(e) => {
              setEntity(e.target.value);
              resetPage();
            }}
          >
            <option value="">All Entities</option>
            {entityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 12.5, whiteSpace: 'nowrap' }}>
            Showing <strong style={{ color: 'var(--ink)' }}>{loading || error ? 0 : filtered.length}</strong> of{' '}
            <strong style={{ color: 'var(--ink)' }}>{rows.length}</strong> collections
          </span>
        </div>

        <TreasuryTable rows={paged} loading={loading} error={error} onOpenProofFiles={handleOpenProofFiles} />

        {!loading && !error && (
          <Pagination
            page={currentPage}
            pageSize={pageSize}
            totalRows={filtered.length}
            itemLabel="collections"
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              resetPage();
            }}
          />
        )}
      </div>

      <ProofFilesDrawer
        target={proofTarget}
        onClose={() => setProofTarget(null)}
        fetchFiles={fetchProofFiles}
        uploadFile={handleUploadBankStatement}
        deleteFile={deleteProofFile}
      />

      <ToastRack toasts={toasts} />
    </div>
  );
}
