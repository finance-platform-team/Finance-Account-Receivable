import { useCallback, useEffect, useMemo, useState } from 'react';
import { FilterBar } from './components/FilterBar';
import { PartnersTable } from './components/PartnersTable';
import { PartnerFormModal } from './components/PartnerFormModal';
import { BulkEditModal } from './components/BulkEditModal';
import { Pagination } from '../../shared/components/Pagination';
import { useToasts } from '../../shared/useToasts';
import { ToastRack } from '../../shared/components/ToastRack';
import { useBusinessPartnersData } from './useBusinessPartnersData';
import { usePaymentTermsData } from '../payment-terms/usePaymentTermsData';
import type { PageSize } from '../../shared/types';
import type { BulkEditInput, BusinessPartnerRow, PartnerFormInput } from './types';

export function BusinessPartnersPage() {
  const { rows, loading, error, reload, createPartner, updatePartner, bulkUpdatePartners } =
    useBusinessPartnersData();
  const { rows: paymentTermRows } = usePaymentTermsData();
  const { toasts, push } = useToasts();

  const [search, setSearch] = useState('');
  const [bu, setBu] = useState('');
  const [companyType, setCompanyType] = useState('');
  const [customerClass, setCustomerClass] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(25);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<BusinessPartnerRow | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const paymentTermOptions = useMemo(
    () => paymentTermRows.map((r) => ({ id: r.id, name: r.name })),
    [paymentTermRows]
  );

  const buOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.bu).filter((v) => v && v !== '—'))).sort(),
    [rows]
  );

  const resetPage = useCallback(() => setPage(1), []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (bu && r.bu !== bu) return false;
      if (companyType && r.companyType !== companyType) return false;
      if (customerClass && r.customerClass !== customerClass) return false;
      if (q) {
        const haystack = `${r.name} ${r.companyCode} ${r.createdBy}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, bu, companyType, customerClass, search]);

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

  // A row dropped from the loaded set (filtered out, or reloaded away) shouldn't
  // linger in the selection.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected((prev) => {
      let changed = false;
      const next = new Set<string>();
      prev.forEach((id) => {
        if (rows.some((r) => r.id === id)) next.add(id);
        else changed = true;
      });
      return changed ? next : prev;
    });
  }, [rows]);

  const handleClear = useCallback(() => {
    setSearch('');
    setBu('');
    setCompanyType('');
    setCustomerClass('');
    resetPage();
  }, [resetPage]);

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
        paged.forEach((r) => {
          if (checked) next.add(r.id);
          else next.delete(r.id);
        });
        return next;
      });
    },
    [paged]
  );

  const handleOpenCreate = useCallback(() => {
    setEditingRow(null);
    setFormOpen(true);
  }, []);

  const handleOpenEdit = useCallback((row: BusinessPartnerRow) => {
    setEditingRow(row);
    setFormOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => setFormOpen(false), []);

  const handleSubmitForm = useCallback(
    async (input: PartnerFormInput) => {
      setSubmitting(true);
      try {
        if (editingRow) {
          await updatePartner(editingRow.id, input);
          push('Business partner updated', `"${input.name}" was saved.`, 'success');
        } else {
          await createPartner(input);
          push('Business partner created', `"${input.name}" was added.`, 'success');
        }
        setFormOpen(false);
      } catch (err) {
        push('Could not save business partner', err instanceof Error ? err.message : 'Unknown error.', 'alert');
      } finally {
        setSubmitting(false);
      }
    },
    [editingRow, createPartner, updatePartner, push]
  );

  const handleBulkSubmit = useCallback(
    async (input: BulkEditInput) => {
      const ids = Array.from(selected);
      setSubmitting(true);
      try {
        const { ok, fail, firstError } = await bulkUpdatePartners(ids, input);
        if (fail === 0) {
          push('Bulk edit applied', `${ok} business partner${ok === 1 ? '' : 's'} updated.`, 'success');
          setSelected(new Set());
          setBulkOpen(false);
        } else {
          push(`Bulk edit: saved ${ok}, failed ${fail}`, firstError, 'alert');
        }
      } finally {
        setSubmitting(false);
      }
    },
    [selected, bulkUpdatePartners, push]
  );

  const handleClearSelection = useCallback(() => setSelected(new Set()), []);
  const handleOpenBulk = useCallback(() => setBulkOpen(true), []);

  return (
    <div className="acc-wrap">
      <div className="acc-head">
        <div>
          <h1 className="acc-title">Business Partners</h1>
          <div className="acc-sub">
            Active insurance companies — company code, classification, business unit and payment term.
          </div>
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

      {selected.size > 0 && (
        <div className="acc-bulkbar">
          <span>
            <strong>{selected.size}</strong> business partner{selected.size !== 1 ? 's' : ''} selected
          </span>
          <div className="acc-bulkbar-actions">
            <button className="acc-btn" onClick={handleClearSelection}>
              Clear
            </button>
            <button className="acc-btn acc-btn-primary" onClick={handleOpenBulk}>
              <i className="fa-solid fa-layer-group" /> Bulk Edit
            </button>
          </div>
        </div>
      )}

      <div className="tbl-shell">
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
          companyType={companyType}
          onCompanyTypeChange={(v) => {
            setCompanyType(v);
            resetPage();
          }}
          customerClass={customerClass}
          onCustomerClassChange={(v) => {
            setCustomerClass(v);
            resetPage();
          }}
          onClear={handleClear}
          showing={loading || error ? 0 : filtered.length}
          total={rows.length}
        />

        <PartnersTable
          rows={paged}
          loading={loading}
          error={error}
          selected={selected}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onEdit={handleOpenEdit}
        />

        {!loading && !error && (
          <Pagination
            page={currentPage}
            pageSize={pageSize}
            totalRows={filtered.length}
            itemLabel="business partners"
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              resetPage();
            }}
          />
        )}
      </div>

      <PartnerFormModal
        open={formOpen}
        editing={editingRow}
        submitting={submitting}
        paymentTermOptions={paymentTermOptions}
        onClose={handleCloseForm}
        onSubmit={handleSubmitForm}
      />

      <BulkEditModal
        open={bulkOpen}
        count={selected.size}
        submitting={submitting}
        paymentTermOptions={paymentTermOptions}
        onClose={() => setBulkOpen(false)}
        onSubmit={handleBulkSubmit}
      />

      <ToastRack toasts={toasts} />
    </div>
  );
}
