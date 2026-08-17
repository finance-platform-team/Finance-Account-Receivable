import { useCallback, useMemo, useState } from 'react';
import { PaymentTermsTable } from './components/PaymentTermsTable';
import { PaymentTermFormModal } from './components/PaymentTermFormModal';
import { Pagination } from '../../shared/components/Pagination';
import { useToasts } from '../../shared/useToasts';
import { ToastRack } from '../../shared/components/ToastRack';
import { usePaymentTermsData } from './usePaymentTermsData';
import type { PageSize } from '../../shared/types';
import type { PaymentTermRow } from './types';

export function PaymentTermsPage() {
  const { rows, loading, error, reload, createTerm, updateTerm } = usePaymentTermsData();
  const { toasts, push } = useToasts();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(25);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<PaymentTermRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resetPage = useCallback(() => setPage(1), []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q));
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
    setFormOpen(true);
  }, []);

  const handleOpenEdit = useCallback((row: PaymentTermRow) => {
    setEditingRow(row);
    setFormOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => setFormOpen(false), []);

  const handleSubmitForm = useCallback(
    async (input: { name: string; numberOfDays: number }) => {
      setSubmitting(true);
      try {
        if (editingRow) {
          await updateTerm(editingRow.id, input);
          push('Payment term updated', `"${input.name}" was saved.`, 'success');
        } else {
          await createTerm(input);
          push('Payment term created', `"${input.name}" was added.`, 'success');
        }
        setFormOpen(false);
      } catch (err) {
        push('Could not save payment term', err instanceof Error ? err.message : 'Unknown error.', 'alert');
      } finally {
        setSubmitting(false);
      }
    },
    [editingRow, createTerm, updateTerm, push]
  );

  return (
    <div className="acc-wrap">
      <div className="acc-head">
        <div>
          <h1 className="acc-title">Payment Term</h1>
          <div className="acc-sub">Active payment terms — name and number of days.</div>
        </div>
        <div className="acc-actions">
          <button className="acc-btn" onClick={reload}>
            <i className="fa-solid fa-rotate" /> Reload
          </button>
          <button className="acc-btn acc-btn-primary" onClick={handleOpenCreate}>
            <i className="fa-solid fa-plus" /> New
          </button>
        </div>
      </div>

      <div className="tbl-shell">
        <div className="tbl-hdr">
          <div className="acc-search">
            <i className="fa-solid fa-magnifying-glass" />
            <input
              placeholder="Search name…"
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

        <PaymentTermsTable rows={paged} loading={loading} error={error} onEdit={handleOpenEdit} />

        <Pagination
          page={currentPage}
          pageSize={pageSize}
          totalRows={filtered.length}
          itemLabel="payment terms"
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            resetPage();
          }}
        />
      </div>

      <PaymentTermFormModal
        open={formOpen}
        editing={editingRow}
        submitting={submitting}
        onClose={handleCloseForm}
        onSubmit={handleSubmitForm}
      />

      <ToastRack toasts={toasts} />
    </div>
  );
}
