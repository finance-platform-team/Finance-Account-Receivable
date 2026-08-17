import { useCallback, useMemo, useState } from 'react';
import { StatusCards } from './components/StatusCards';
import { TmsHandoffTable } from './components/TmsHandoffTable';
import { TmsHandoffDrawer } from './components/TmsHandoffDrawer';
import { Pagination } from '../../shared/components/Pagination';
import { ToastRack } from '../../shared/components/ToastRack';
import { useToasts } from '../../shared/useToasts';
import { useTmsHandoffData } from './useTmsHandoffData';
import { STATUS_CARDS } from './normalize';
import type { TmsHandoffRow } from './types';
import type { PageSize } from '../../shared/types';

function toDateOnly(value: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
}

export function TmsHandoffPage() {
  const { rows, loading, error, lastRefresh, reload } = useTmsHandoffData();
  const { toasts, push } = useToasts();

  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [search, setSearch] = useState('');
  const [statusKey, setStatusKey] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(15);
  const [selectedRow, setSelectedRow] = useState<TmsHandoffRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const resetPage = useCallback(() => setPage(1), []);

  // Mirrors ref.html: date filters scope the whole dataset (and the status-card
  // counts); the active status card and the search box further narrow the table.
  const dateFiltered = useMemo(() => {
    return rows.filter((r) => {
      if (startDate && toDateOnly(r.createdOn) < startDate) return false;
      if (dueDate && toDateOnly(r.dueDate) !== dueDate) return false;
      return true;
    });
  }, [rows, startDate, dueDate]);

  const counts = useMemo(() => {
    const result: Record<string, number> = { ALL: dateFiltered.length };
    for (const card of STATUS_CARDS) {
      if (card.code == null) continue;
      result[card.key] = 0;
    }
    for (const r of dateFiltered) {
      const card = STATUS_CARDS.find((c) => c.code === r.statusCode);
      if (card) result[card.key] = (result[card.key] ?? 0) + 1;
    }
    return result;
  }, [dateFiltered]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const activeCode = STATUS_CARDS.find((c) => c.key === statusKey)?.code ?? null;
    return dateFiltered.filter((r) => {
      if (statusKey !== 'ALL' && r.statusCode !== activeCode) return false;
      if (q) {
        const haystack = `${r.title} ${r.decisionId} ${r.typeAction} ${r.assignee}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [dateFiltered, statusKey, search]);

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

  const handleSelectStatus = useCallback(
    (key: string) => {
      setStatusKey(key);
      resetPage();
    },
    [resetPage]
  );

  const handleReload = useCallback(() => {
    reload();
    push('Refreshed', 'TMS handoff tasks reloaded.', 'success');
  }, [reload, push]);

  const handleView = useCallback((row: TmsHandoffRow) => {
    setSelectedRow(row);
    setDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => setDrawerOpen(false), []);

  const lastRefreshLabel = lastRefresh
    ? lastRefresh.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    : '—';

  return (
    <div className="acc-wrap">
      <div className="acc-head">
        <div>
          <h1 className="acc-title">TMS Hand Off</h1>
        </div>
        <div className="acc-actions">
          <button className="acc-btn" onClick={handleReload}>
            <i className="fa-solid fa-arrows-rotate" /> Refresh Data
          </button>
        </div>
      </div>

      <div className="acc-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>
            <i className="fa-solid fa-clock" style={{ color: 'var(--gold)' }} />
            Last refresh: <strong style={{ color: 'var(--ink)' }}>{lastRefreshLabel}</strong>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginLeft: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted)' }}>
              Start Date
            </span>
            <input
              type="date"
              className="acc-date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                resetPage();
              }}
            />
          </div>
          <span style={{ width: 1, height: 22, background: 'var(--line)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted)' }}>
              Due Date
            </span>
            <input
              type="date"
              className="acc-date"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                resetPage();
              }}
            />
          </div>
          <div className="acc-search" style={{ minWidth: 200, flex: 'none' }}>
            <i className="fa-solid fa-magnifying-glass" />
            <input
              type="text"
              placeholder="Search tasks…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
            />
          </div>
        </div>
      </div>

      <StatusCards counts={loading || error ? {} : counts} activeKey={statusKey} onSelect={handleSelectStatus} />

      <div className="tbl-shell">
        <TmsHandoffTable rows={paged} loading={loading} error={error} onView={handleView} />

        {!loading && !error && (
          <Pagination
            page={currentPage}
            pageSize={pageSize}
            totalRows={filtered.length}
            itemLabel="tasks"
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              resetPage();
            }}
          />
        )}
      </div>

      <TmsHandoffDrawer row={selectedRow} open={drawerOpen} onClose={handleCloseDrawer} />

      <ToastRack toasts={toasts} />
    </div>
  );
}
