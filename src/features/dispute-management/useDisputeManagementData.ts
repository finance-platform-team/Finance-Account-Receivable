import { useCallback, useEffect, useRef, useState } from 'react';
import { Ar_disputemanagementsService } from '../../generated/services/Ar_disputemanagementsService';
import type { Ar_disputemanagements, Ar_disputemanagementsBase } from '../../generated/models/Ar_disputemanagementsModel';
import { normalizeDisputeRow } from './normalize';
import type { DisputeRow } from './types';

const ACTIVE_FILTER = 'statecode eq 0';

interface UseDisputeManagementDataResult {
  rows: DisputeRow[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  createDispute: (record: Omit<Ar_disputemanagementsBase, 'ar_disputemanagementid'>) => Promise<void>;
  updateRow: (id: string, patch: Partial<Omit<Ar_disputemanagementsBase, 'ar_disputemanagementid'>>) => Promise<void>;
}

export function useDisputeManagementData(): UseDisputeManagementDataResult {
  const [rows, setRows] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reloadToken = useRef(0);

  const load = useCallback(async () => {
    const token = ++reloadToken.current;
    setLoading(true);
    setError(null);
    try {
      const all: Ar_disputemanagements[] = [];
      let skipToken: string | undefined;
      do {
        const result = await Ar_disputemanagementsService.getAll({
          filter: ACTIVE_FILTER,
          orderBy: ['createdon desc'],
          maxPageSize: 5000,
          skipToken,
        });
        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to load disputes.');
        }
        all.push(...(result.data ?? []));
        skipToken = result.skipToken;
      } while (skipToken && token === reloadToken.current);

      if (token !== reloadToken.current) return;
      setRows(all.map(normalizeDisputeRow));
    } catch (err) {
      if (token !== reloadToken.current) return;
      setError(err instanceof Error ? err.message : 'Unknown error loading disputes.');
    } finally {
      if (token === reloadToken.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const createDispute = useCallback(async (record: Omit<Ar_disputemanagementsBase, 'ar_disputemanagementid'>) => {
    const result = await Ar_disputemanagementsService.create(record);
    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Could not save dispute.');
    }
    const created = result.data;
    setRows((prev) => [normalizeDisputeRow(created), ...prev]);
  }, []);

  const updateRow = useCallback(
    async (id: string, patch: Partial<Omit<Ar_disputemanagementsBase, 'ar_disputemanagementid'>>) => {
      const result = await Ar_disputemanagementsService.update(id, patch);
      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Save failed.');
      }
      const updated = normalizeDisputeRow(result.data);
      setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
    },
    []
  );

  return { rows, loading, error, reload: load, createDispute, updateRow };
}
