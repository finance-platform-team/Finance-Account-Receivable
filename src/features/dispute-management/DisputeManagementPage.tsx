import { useCallback, useMemo, useState } from 'react';
import { KpiCards } from './components/KpiCards';
import { AlertBanner } from './components/AlertBanner';
import { FilterBar } from './components/FilterBar';
import { DisputeTable } from './components/DisputeTable';
import { NewDisputeDrawer } from './components/NewDisputeDrawer';
import { DetailModal } from './components/DetailModal';
import { useDisputeManagementData } from './useDisputeManagementData';
import { useToasts } from '../../shared/useToasts';
import { ToastRack } from '../../shared/components/ToastRack';
import { CreateDecisionDrawer } from '../../shared/components/CreateDecisionDrawer';
import type { DecisionFormInput } from '../../shared/components/CreateDecisionDrawer';
import { ProofFilesDrawer } from '../../shared/components/ProofFilesDrawer';
import type { ProofFilesTarget } from '../../shared/components/ProofFilesDrawer';
import { deleteDisputeProofFile, fetchDisputeProofFiles, uploadDisputeProofFile } from './proofFiles';
import { Cfm_tmshandoffsService } from '../../generated/services/Cfm_tmshandoffsService';
import type {
  Cfm_tmshandoffscfm_decisionfromwhere,
  Cfm_tmshandoffscfm_priority,
  Cfm_tmshandoffscfm_progress,
  Cfm_tmshandoffscfm_tagename,
} from '../../generated/models/Cfm_tmshandoffsModel';
import type {
  Ar_disputemanagementsar_category,
  Ar_disputemanagementscfm_arreview,
} from '../../generated/models/Ar_disputemanagementsModel';
import type { DisputeRow, NewDisputeInput } from './types';

export function DisputeManagementPage() {
  const { rows, loading, error, createDispute, updateRow } = useDisputeManagementData();
  const { toasts, push } = useToasts();

  const [search, setSearch] = useState('');
  const [arReviewFilter, setArReviewFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [decisionDrawerOpen, setDecisionDrawerOpen] = useState(false);
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);
  const [proofTarget, setProofTarget] = useState<ProofFilesTarget | null>(null);

  const pendingRows = useMemo(() => rows.filter((r) => r.arReview === 'Pending'), [rows]);
  const totals = useMemo(
    () => ({
      total: rows.length,
      amount: rows.reduce((sum, r) => sum + r.amount, 0),
      pending: pendingRows.length,
      approved: rows.filter((r) => r.arReview === 'Approved').length,
    }),
    [rows, pendingRows]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (categoryFilter !== 'All' && r.category.toLowerCase() !== categoryFilter.toLowerCase()) return false;
      if (arReviewFilter && r.arReview.toLowerCase() !== arReviewFilter.toLowerCase()) return false;
      if (q) {
        const haystack = `${r.code} ${r.name} ${r.owner} ${r.agreement}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, categoryFilter, arReviewFilter, search]);

  const detailRow = useMemo(() => rows.find((r) => r.id === detailId) ?? null, [rows, detailId]);

  const handleSaveAgreement = useCallback(
    async (id: string, value: string) => {
      try {
        await updateRow(id, { ar_agreement: value });
        push('Saved', 'Agreement saved.', 'success');
      } catch (err) {
        push('Could not save agreement', err instanceof Error ? err.message : 'Unknown error.', 'alert');
      }
    },
    [updateRow, push]
  );

  const handleSaveArReview = useCallback(
    async (id: string, value: number) => {
      try {
        await updateRow(id, { cfm_arreview: value as Ar_disputemanagementscfm_arreview });
        push('Saved', 'AR Review status updated.', 'success');
      } catch (err) {
        push('Could not update AR Review status', err instanceof Error ? err.message : 'Unknown error.', 'alert');
      }
    },
    [updateRow, push]
  );

  const handleCreateDispute = useCallback(
    async (input: NewDisputeInput) => {
      if (!input.code || !input.companyName) {
        push('Missing selection', 'Search and select a company from the list.', 'alert');
        return;
      }
      setCreating(true);
      try {
        await createDispute({
          ar_code: input.code,
          cfm_companyname: input.companyName,
          ar_amount: input.amount ?? undefined,
          ar_category: input.categoryValue as Ar_disputemanagementsar_category,
          cfm_arreview: 1 as Ar_disputemanagementscfm_arreview,
          ar_due: input.dueMonth ? new Date(`${input.dueMonth}-01`).toISOString() : undefined,
          statecode: 0,
          ...(input.companyId ? { 'cfm_CompanyCode@odata.bind': `/cfm_insurancecompanies(${input.companyId})` } : {}),
        });
        push('Dispute created', 'Dispute created — AR Verification triggered.', 'success');
        setDrawerOpen(false);
      } catch (err) {
        push('Could not save dispute', err instanceof Error ? err.message : 'Unknown error.', 'alert');
      } finally {
        setCreating(false);
      }
    },
    [createDispute, push]
  );

  const handleOpenProofFiles = useCallback((row: DisputeRow) => {
    setProofTarget({ title: row.code, folder: row.docsFolder, proofUrl: row.proof });
  }, []);

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

  return (
    <div className="acc-wrap">
      <div className="acc-head">
        <div>
          <h1 className="acc-title">Dispute Management</h1>
          <div className="acc-sub">
            Collection plan execution, Daily Collection entries, AR decision feedback, follow-up and dispute
            operations.
          </div>
        </div>
        <div className="acc-actions">
          <button className="acc-btn" onClick={handleOpenDecision}>
            <i className="fa-solid fa-clipboard-check" /> Create Decision
          </button>
          <button className="acc-btn acc-btn-primary" onClick={() => setDrawerOpen(true)}>
            <i className="fa-solid fa-plus" /> Create Dispute Case
          </button>
        </div>
      </div>

      <KpiCards total={totals.total} amount={totals.amount} pending={totals.pending} approved={totals.approved} />

      <AlertBanner pending={pendingRows} onOpen={setDetailId} />

      <div className="tbl-shell">
        <div className="tbl-hdr">
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            arReview={arReviewFilter}
            onArReviewChange={setArReviewFilter}
            category={categoryFilter}
            onCategoryChange={setCategoryFilter}
            showing={loading || error ? 0 : filtered.length}
            total={rows.length}
          />
        </div>

        <DisputeTable
          rows={filtered}
          loading={loading}
          error={error}
          onOpenDetail={setDetailId}
          onOpenProofFiles={handleOpenProofFiles}
          onSaveAgreement={handleSaveAgreement}
          onSaveArReview={handleSaveArReview}
        />
      </div>

      <NewDisputeDrawer
        open={drawerOpen}
        submitting={creating}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleCreateDispute}
      />

      <DetailModal row={detailRow} onClose={() => setDetailId(null)} onToast={push} />

      <ProofFilesDrawer
        target={proofTarget}
        onClose={() => setProofTarget(null)}
        fetchFiles={fetchDisputeProofFiles}
        uploadFile={uploadDisputeProofFile}
        deleteFile={deleteDisputeProofFile}
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
