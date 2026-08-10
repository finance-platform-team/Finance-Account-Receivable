import { useCallback, useMemo, useState } from 'react';
import styles from './ArAging.module.css';
import { AgingDrawer } from './components/AgingDrawer';
import { AgingTable } from './components/AgingTable';
import { FilterBar } from './components/FilterBar';
import { KpiCards } from './components/KpiCards';
import { Pagination } from '../../shared/components/Pagination';
import { ToastRack } from '../../shared/components/ToastRack';
import { useAgingData } from './useAgingData';
import { useToasts } from '../../shared/useToasts';
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
  const { rows, loading, error, lastRefresh } = useAgingData();
  const { toasts, push } = useToasts();

  const [dataset, setDataset] = useState<DatasetKey>('core');
  const [search, setSearch] = useState('');
  const [bu, setBu] = useState('');
  const [customerClass, setCustomerClass] = useState('');
  const [companyType, setCompanyType] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(15);
  const [selectedRow, setSelectedRow] = useState<AgingRow | null>(null);

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

  const handleOpenDecision = useCallback(() => {
    // Decision modal / Power Automate flow (creates a decision record, routes via TMS)
    // is not wired up in the source view yet — this mirrors ref.html's placeholder.
    push('Create Task Decision', 'Decision modal not yet wired. Will open the Task Decision form and route via TMS.', 'info');
  }, [push]);

  const handleRowClick = useCallback((row: AgingRow) => {
    setSelectedRow((current) => (current?.id === row.id ? null : row));
  }, []);

  const handleCloseDrawer = useCallback(() => setSelectedRow(null), []);

  const handleSubmitDecision = useCallback(
    (row: AgingRow, decisionType: string) => {
      // Same "not wired" business rule as the header Decision button — no real
      // Task Decision entity/TMS flow is exposed to this app yet.
      push('Decision Submitted', `"${decisionType}" for ${row.name} will route via TMS once that flow is wired up.`, 'info');
      setSelectedRow(null);
    },
    [push]
  );

  const lastRefreshLabel = lastRefresh
    ? lastRefresh.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    : '—';

  return (
    <div className={styles.page}>
      <div className={styles.pgHdr}>
        <div>
          <div className={styles.pgEyebrow}>
            <i className="fa-solid fa-chart-simple" /> AR Planning · Aging &amp; Reconciliation
          </div>
          <h1 className={styles.pgTitle}>
            AR Aging &amp; Recon.
            <span className={styles.statusChip}>
              <i className="fa-solid fa-circle" /> Live from DotCare
            </span>
          </h1>
          <div className={styles.pgSub}>
            Aging brackets auto-populated from DotCare, per bracket and per insurance company. Read-only snapshot for
            AR planning.
          </div>
        </div>
        <div className={styles.hdrActions}>
          <button className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={handleExportCsv}>
            <i className="fa-solid fa-file-arrow-down" /> Export
          </button>
          <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`} onClick={handleOpenDecision}>
            <i className="fa-solid fa-clipboard-check" /> Decision
          </button>
        </div>
      </div>

      <div className={styles.metaBar}>
        <div className={styles.metaBarLeft}>
          <div className={styles.metaGroup}>
            <i className="fa-solid fa-database" />
            <span>
              Source: <strong>DotCare</strong>
            </span>
          </div>
          <div className={styles.metaSep} />
          <div className={styles.metaGroup}>
            <i className="fa-solid fa-clock" />
            <span>
              Last refresh: <strong>{lastRefreshLabel}</strong>
            </span>
          </div>
        </div>
        <div className={styles.dsWrap}>
          <button
            className={`${styles.dsTab} ${dataset === 'core' ? styles.dsTabActive : ''}`}
            onClick={() => handleSetDataset('core')}
          >
            <i className="fa-solid fa-scale-balanced" /> AR Aging
          </button>
          <button
            className={`${styles.dsTab} ${dataset === 'africa' ? styles.dsTabActive : ''}`}
            onClick={() => handleSetDataset('africa')}
          >
            <i className="fa-solid fa-globe" /> Africa
          </button>
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
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              resetPage();
            }}
          />
        )}
      </div>

      <ToastRack toasts={toasts} />

      {selectedRow && (
        <AgingDrawer
          key={selectedRow.id}
          row={selectedRow}
          onClose={handleCloseDrawer}
          onSubmitDecision={handleSubmitDecision}
        />
      )}
    </div>
  );
}
