import { useCallback, useMemo, useState } from 'react';
import { SlaTable } from './components/SlaTable';
import { SlaFormDrawer } from './components/SlaFormDrawer';
import { Pagination } from '../../shared/components/Pagination';
import { ToastRack } from '../../shared/components/ToastRack';
import { useToasts } from '../../shared/useToasts';
import { useSlaData } from './useSlaData';
import type { SlaFormInput, SlaRow } from './types';
import type { PageSize } from '../../shared/types';

export function SlaPage() {
  const { rows, loading, error, reload, createSla, updateSla, deactivateSla } = useSlaData();
  const { toasts, push } = useToasts();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(15);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<SlaRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resetPage = useCallback(() => setPage(1), []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const haystack = `${r.action} ${r.responsibleName} ${r.escalationRule} ${r.department1} ${r.department2}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, search]);

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

  const handleOpenCreate = useCallback(() => {
    setEditingRow(null);
    setDrawerOpen(true);
  }, []);

  const handleOpenEdit = useCallback((row: SlaRow) => {
    setEditingRow(row);
    setDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => setDrawerOpen(false), []);

  const handleSubmit = useCallback(
    async (input: SlaFormInput) => {
      setSubmitting(true);
      try {
        if (editingRow) {
          await updateSla(editingRow.id, input);
          push('SLA rule updated', `"${input.action}" was saved.`, 'success');
        } else {
          await createSla(input);
          push('SLA rule created', `"${input.action}" was added.`, 'success');
        }
        setDrawerOpen(false);
      } catch (err) {
        push('Could not save SLA rule', err instanceof Error ? err.message : 'Unknown error.', 'alert');
      } finally {
        setSubmitting(false);
      }
    },
    [editingRow, createSla, updateSla, push]
  );

  const handleDelete = useCallback(
    async (row: SlaRow) => {
      if (!window.confirm(`Delete SLA rule "${row.action}"? This deactivates the record.`)) return;
      try {
        await deactivateSla(row.id);
        push('SLA rule deactivated', `"${row.action}" was deactivated.`, 'success');
        setDrawerOpen(false);
      } catch (err) {
        push('Could not deactivate SLA rule', err instanceof Error ? err.message : 'Unknown error.', 'alert');
      }
    },
    [deactivateSla, push]
  );

  const handleExportCsv = useCallback(() => {
    if (!filtered.length) {
      push('Export', 'Nothing to export with current filters.', 'alert');
      return;
    }
    const cols = ['Action', 'Responsible', 'SLA Type', 'SLA', 'Escalation Rule', 'Dept 1', 'Role 1', 'Dept 2', 'Role 2', 'Deduction'];
    const escapeCsv = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [cols.join(',')].concat(
      filtered.map((r) =>
        [r.action, r.responsibleName, r.slaTypeLabel, r.slaValue, r.escalationRule, r.department1, r.manager1Name, r.department2, r.manager2Name, r.deduction]
          .map(escapeCsv)
          .join(',')
      )
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SLA_Rules.csv';
    a.click();
    URL.revokeObjectURL(url);
    push('Exported', `${filtered.length} rows saved to CSV.`, 'success');
  }, [filtered, push]);

  return (
    <div className="acc-wrap">
      <div className="acc-head">
        <div>
          <h1 className="acc-title">SLA</h1>
          <div className="acc-sub">
            SLA rules and escalation actions across Collection Plan execution, Daily Collection, and dispute follow-up.
          </div>
        </div>
        <div className="acc-actions">
          <button className="acc-btn" onClick={reload}>
            <i className="fa-solid fa-rotate" /> Refresh
          </button>
          <button className="acc-btn" onClick={handleExportCsv}>
            <i className="fa-solid fa-file-arrow-down" /> Export SLA
          </button>
          <button className="acc-btn acc-btn-primary" onClick={handleOpenCreate}>
            <i className="fa-solid fa-plus" /> New SLA
          </button>
        </div>
      </div>

      <div className="tbl-shell">
        <div className="tbl-hdr">
          <div className="acc-search">
            <i className="fa-solid fa-magnifying-glass" />
            <input
              placeholder="Search action, responsible, department…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
            />
          </div>
          <span style={{ fontSize: 12.5, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
            Showing <strong style={{ color: 'var(--ink)' }}>{loading || error ? 0 : filtered.length}</strong> of{' '}
            <strong style={{ color: 'var(--ink)' }}>{rows.length}</strong>
          </span>
        </div>

        <SlaTable rows={paged} loading={loading} error={error} onEdit={handleOpenEdit} onDelete={handleDelete} />

        {!loading && !error && (
          <Pagination
            page={currentPage}
            pageSize={pageSize}
            totalRows={filtered.length}
            itemLabel="SLA rules"
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              resetPage();
            }}
          />
        )}
      </div>

      <SlaFormDrawer
        open={drawerOpen}
        editing={editingRow}
        submitting={submitting}
        onClose={handleCloseDrawer}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />

      <ToastRack toasts={toasts} />
    </div>
  );
}
