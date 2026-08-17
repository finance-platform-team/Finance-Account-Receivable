// TODO CONFIRM: cfm_id is cfm_disputemanagementupdateses' required primary-name
// (title) text field (x-ms-dataverse-primary-name in the Dataverse schema).
// ref.html's create() call never set it, so the source page either relies on a
// server-side default/plugin, or was tested against a lenient environment. Since
// the generated model marks it required, this hook auto-generates a readable
// "<update type> — <date>" label so create() type-checks and the record has a
// sensible name in views/quick-find. Confirm with the table owner whether a
// specific naming convention is expected instead.
import { useCallback, useEffect, useState } from 'react';
import { Cfm_disputemanagementupdatesesService } from '../../generated/services/Cfm_disputemanagementupdatesesService';
import { Cfm_disputemanagementupdatesescfm_updatetype } from '../../generated/models/Cfm_disputemanagementupdatesesModel';
import { normalizeHistoryRow } from './normalize';
import type { DisputeHistoryRow } from './types';

interface AddUpdateInput {
  typeValue: number;
  note: string;
  dateIso: string | null;
}

interface UseDisputeHistoryResult {
  history: DisputeHistoryRow[];
  loading: boolean;
  error: string | null;
  addUpdate: (input: AddUpdateInput) => Promise<void>;
}

export function useDisputeHistory(disputeId: string | null): UseDisputeHistoryResult {
  const [history, setHistory] = useState<DisputeHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!disputeId) {
      setHistory([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await Cfm_disputemanagementupdatesesService.getAll({
        filter: `_cfm_disputemanagement_value eq ${disputeId}`,
        orderBy: ['cfm_updatedate desc', 'createdon desc'],
      });
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to load history.');
      }
      setHistory((result.data ?? []).map(normalizeHistoryRow));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'History unavailable.');
    } finally {
      setLoading(false);
    }
  }, [disputeId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const addUpdate = useCallback(
    async ({ typeValue, note, dateIso }: AddUpdateInput) => {
      if (!disputeId) return;
      const typeKey = typeValue as Cfm_disputemanagementupdatesescfm_updatetype;
      const typeLabel = (Cfm_disputemanagementupdatesescfm_updatetype[typeKey] ?? 'Update').trim();
      const dateLabel = (dateIso ?? new Date().toISOString()).slice(0, 10);
      const result = await Cfm_disputemanagementupdatesesService.create({
        cfm_id: `${typeLabel} — ${dateLabel}`,
        cfm_updatetype: typeKey,
        cfm_description: note,
        ...(dateIso ? { cfm_updatedate: dateIso } : {}),
        'cfm_DisputeManagement@odata.bind': `/ar_disputemanagements(${disputeId})`,
        statecode: 0,
      });
      if (!result.success) {
        throw new Error(result.error?.message || 'Could not add update.');
      }
      await load();
    },
    [disputeId, load]
  );

  return { history, loading, error, addUpdate };
}
