import { useCallback, useMemo, useState } from 'react';
import { AgingDrawer } from './components/AgingDrawer';
import { AgingTable } from './components/AgingTable';
import { FilterBar } from './components/FilterBar';
import { KpiCards } from './components/KpiCards';
import { Pagination } from '../../shared/components/Pagination';
import { ToastRack } from '../../shared/components/ToastRack';
import { CreateDecisionDrawer } from '../../shared/components/CreateDecisionDrawer';
import type { DecisionFormInput } from '../../shared/components/CreateDecisionDrawer';
import { useAgingData } from './useAgingData';
import { useToasts } from '../../shared/useToasts';
import { useRegion } from '../../shared/regionContext';
import { regionForBu } from '../../shared/region';
import { Cfm_tmshandoffsService } from '../../generated/services/Cfm_tmshandoffsService';
import type {
  Cfm_tmshandoffscfm_decisionfromwhere,
  Cfm_tmshandoffscfm_priority,
  Cfm_tmshandoffscfm_progress,
  Cfm_tmshandoffscfm_tagename,
} from '../../generated/models/Cfm_tmshandoffsModel';
import type { AgingRow, AgingTotals, DatasetKey } from './types';
import type { PageSize } from '../../shared/types';

const EMPTY_TOTALS: AgingTotals = { notDue: 0, lt30: 0, b3160: 0, b6190: 0, b91120: 0, gt120: 0 };

const CSV_COLUMNS = [
  'Payment Term',
  'Customer Class',
  'Company Type',
  'Type',
  'Task Owner',
  'Supervisor',
  'Company Code',
  'Company Name',
  'Not Due',
  '< 30 Days',
  '31-60',
  '61-90',
  '91-120',
  '> 120 Days',
];

function escapeCsv(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function toCsvRow(r: AgingRow): string {
  return [
    r.paymentTerm,
    r.customerClass,
    r.companyType,
    r.type,
    r.taskOwner,
    r.supervisor,
    r.code,
    r.name,
    r.notDue,
    r.lt30,
    r.b3160,
    r.b6190,
    r.b91120,
    r.gt120,
  ]
    .map(escapeCsv)
    .join(',');
}

export function ArAgingPage() {
  const { rows: allRows, loading, error, lastRefresh, updateRow } = useAgingData();
  const { toasts, push } = useToasts();
  const { region } = useRegion();

  const [dataset, setDataset] = useState<DatasetKey>('core');
  const [search, setSearch] = useState('');
  const [bu, setBu] = useState('');
  const [customerClass, setCustomerClass] = useState('');
  const [companyType, setCompanyType] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(15);
  const [selectedRow, setSelectedRow] = useState<AgingRow | null>(null);
  const [decisionDrawerOpen, setDecisionDrawerOpen] = useState(false);
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);

  // Scope every company on this page to the selected region's BU list before
  // any other filter runs. `region` is null only while the (blocking) picker
  // hasn't been answered yet — show everything rather than guess in that window.
  const rows = useMemo(
    () => (region ? allRows.filter((r) => regionForBu(r.type) === region) : allRows),
    [allRows, region]
  );

  const buOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.type).filter((t) => t && t !== '—'))).sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      // Dataset split by tab: Africa tab shows companyType === 'Africa'; core shows the rest.
      if (dataset === 'africa' && r.companyType !== 'Africa') return false;
      if (dataset === 'core' && r.companyType === 'Africa') return false;

      if (bu && r.type !== bu) return false;
      if (customerClass && r.customerClass !== customerClass) return false;
      if (companyType && r.companyType !== companyType) return false;

      if (q) {
        const haystack = `${r.code} ${r.name} ${r.taskOwner} ${r.supervisor}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, dataset, bu, customerClass, companyType, search]);

  const totals = useMemo<AgingTotals>(() => {
    return filtered.reduce(
      (acc, r) => ({
        notDue: acc.notDue + r.notDue,
        lt30: acc.lt30 + r.lt30,
        b3160: acc.b3160 + r.b3160,
        b6190: acc.b6190 + r.b6190,
        b91120: acc.b91120 + r.b91120,
        gt120: acc.gt120 + r.gt120,
      }),
      { ...EMPTY_TOTALS }
    );
  }, [filtered]);

  // Derived at render time (not via an effect+setState) so a shrinking filtered
  // set or page-size change clamps immediately, with no extra render pass.
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

  const handleSetDataset = useCallback(
    (key: DatasetKey) => {
      setDataset(key);
      resetPage();
    },
    [resetPage]
  );

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setBu('');
    setCustomerClass('');
    setCompanyType('');
    resetPage();
  }, [resetPage]);

  const handleExportCsv = useCallback(() => {
    if (!filtered.length) {
      push('Export', 'Nothing to export with current filters.', 'alert');
      return;
    }
    const lines = [CSV_COLUMNS.join(',')].concat(filtered.map(toCsvRow));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ar_aging_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    push('Exported', `${filtered.length} rows saved to CSV.`, 'success');
  }, [filtered, push]);

  const handleRowClick = useCallback((row: AgingRow) => {
    setSelectedRow((current) => (current?.id === row.id ? null : row));
  }, []);

  const handleCloseDrawer = useCallback(() => setSelectedRow(null), []);

  const handleSaveNote = useCallback(
    async (row: AgingRow, note: string) => {
      try {
        await updateRow(row.id, { cfm_notesvisits: note });
        setSelectedRow((current) => (current && current.id === row.id ? { ...current, notes: note } : current));
        push('Saved', 'Note saved.', 'success');
      } catch (err) {
        push('Could not save note', err instanceof Error ? err.message : 'Unknown error.', 'alert');
      }
    },
    [updateRow, push]
  );

  const handleSaveType = useCallback(
    async (row: AgingRow, buId: string, buName: string) => {
      try {
        await updateRow(row.id, { 'cfm_type@odata.bind': `/businessunits(${buId})` });
        setSelectedRow((current) =>
          (current && current.id === row.id ? { ...current, type: buName, typeId: buId } : current)
        );
        push('Saved', 'Type (BU) updated.', 'success');
      } catch (err) {
        push('Could not update Type (BU)', err instanceof Error ? err.message : 'Unknown error.', 'alert');
      }
    },
    [updateRow, push]
  );

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

  const lastRefreshLabel = lastRefresh
    ? lastRefresh.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    : '—';

  return (
    <div className="acc-wrap">
      <div className="acc-head">
        <div>
          <h1 className="acc-title">AR Aging</h1>
        </div>
        <div className="acc-actions">
          <button className="acc-btn" onClick={handleExportCsv}>
            <i className="fa-solid fa-file-arrow-down" /> Export
          </button>
          <button className="acc-btn acc-btn-primary" onClick={handleOpenDecision}>
            <i className="fa-solid fa-clipboard-check" /> Create Decision
          </button>
        </div>
      </div>

      <div className="acc-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>
            <i className="fa-solid fa-database" style={{ color: 'var(--gold)' }} />
            Source: <strong style={{ color: 'var(--ink)' }}>DotCare</strong>
          </span>
          <span style={{ width: 1, height: 22, background: 'var(--line)' }} />
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>
            <i className="fa-solid fa-clock" style={{ color: 'var(--gold)' }} />
            Last refresh: <strong style={{ color: 'var(--ink)' }}>{lastRefreshLabel}</strong>
          </span>
        </div>
        <div style={{ display: 'inline-flex', gap: 6, marginLeft: 'auto' }}>
          <button
            className={`acc-btn${dataset === 'core' ? ' acc-btn-primary' : ''}`}
            onClick={() => handleSetDataset('core')}
          >
            <i className="fa-solid fa-scale-balanced" /> AR Aging
          </button>
          <button
            className={`acc-btn${dataset === 'africa' ? ' acc-btn-primary' : ''}`}
            onClick={() => handleSetDataset('africa')}
          >
            <i className="fa-solid fa-globe" /> Africa
          </button>
        </div>
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

        <AgingTable
          rows={paged}
          filteredCount={filtered.length}
          totals={totals}
          loading={loading}
          error={error}
          selectedId={selectedRow?.id ?? null}
          onRowClick={handleRowClick}
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

      <AgingDrawer
        row={selectedRow}
        open={selectedRow !== null}
        onClose={handleCloseDrawer}
        onSaveNote={handleSaveNote}
        onSaveType={handleSaveType}
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
