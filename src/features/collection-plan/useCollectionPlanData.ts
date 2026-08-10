import { useCallback, useEffect, useRef, useState } from 'react';
import { Cfm_aragingsService } from '../../generated/services/Cfm_aragingsService';
import type { Cfm_aragings, Cfm_aragingsBase } from '../../generated/models/Cfm_aragingsModel';
import { normalizePlanRow } from './normalize';
import type { PlanRow } from './types';

const ACTIVE_FILTER = 'statecode eq 0';

interface UseCollectionPlanDataResult {
  rows: PlanRow[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  updateRow: (id: string, patch: Partial<Omit<Cfm_aragingsBase, 'cfm_aragingid'>>) => Promise<void>;
}

export function useCollectionPlanData(): UseCollectionPlanDataResult {
  const [rows, setRows] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reloadToken = useRef(0);

  const load = useCallback(async () => {
    const token = ++reloadToken.current;
    setLoading(true);
    setError(null);
    try {
      const all: Cfm_aragings[] = [];
      let skipToken: string | undefined;
      do {
        const result = await Cfm_aragingsService.getAll({
          filter: ACTIVE_FILTER,
          maxPageSize: 5000,
          skipToken,
        });
        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to load Collection Plan records.');
        }
        all.push(...(result.data ?? []));
        skipToken = result.skipToken;
      } while (skipToken && token === reloadToken.current);

      if (token !== reloadToken.current) return;
      setRows(all.map(normalizePlanRow));
    } catch (err) {
      if (token !== reloadToken.current) return;
      setError(err instanceof Error ? err.message : 'Unknown error loading the Collection Plan.');
    } finally {
      if (token === reloadToken.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Standard fetch-on-mount effect; race conditions across overlapping loads
    // are already guarded via reloadToken above.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const updateRow = useCallback(async (id: string, patch: Partial<Omit<Cfm_aragingsBase, 'cfm_aragingid'>>) => {
    const result = await Cfm_aragingsService.update(id, patch);
    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Save failed.');
    }
    const updated = normalizePlanRow(result.data);
    setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
  }, []);

  return { rows, loading, error, reload: load, updateRow };
}
