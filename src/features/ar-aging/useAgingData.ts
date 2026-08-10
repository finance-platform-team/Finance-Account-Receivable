import { useCallback, useEffect, useRef, useState } from 'react';
import { Cfm_aragingsService } from '../../generated/services/Cfm_aragingsService';
import type { Cfm_aragings } from '../../generated/models/Cfm_aragingsModel';
import { normalizeRow } from './normalize';
import type { AgingRow } from './types';

// Same server-side filter as ref.html: only active aging snapshots.
const ACTIVE_FILTER = 'statecode eq 0';

interface UseAgingDataResult {
  rows: AgingRow[];
  loading: boolean;
  error: string | null;
  lastRefresh: Date | null;
  reload: () => void;
}

export function useAgingData(): UseAgingDataResult {
  const [rows, setRows] = useState<AgingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
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
          throw new Error(result.error?.message || 'Failed to load AR aging records.');
        }
        all.push(...(result.data ?? []));
        skipToken = result.skipToken;
      } while (skipToken && token === reloadToken.current);

      if (token !== reloadToken.current) return;
      setRows(all.map(normalizeRow));
      setLastRefresh(new Date());
    } catch (err) {
      if (token !== reloadToken.current) return;
      setError(err instanceof Error ? err.message : 'Unknown error loading AR aging.');
    } finally {
      if (token === reloadToken.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // This is the standard fetch-on-mount effect (react.dev/learn/synchronizing-with-effects#fetching-data);
    // race conditions across overlapping loads are already guarded via reloadToken above.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return { rows, loading, error, lastRefresh, reload: load };
}
