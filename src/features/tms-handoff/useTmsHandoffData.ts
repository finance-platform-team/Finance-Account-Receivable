import { useCallback, useEffect, useRef, useState } from 'react';
import { Cfm_tmshandoffsService } from '../../generated/services/Cfm_tmshandoffsService';
import { normalizeRow } from './normalize';
import type { TmsHandoffRow } from './types';

// Only handoffs raised from this app (tagged 'Collection') — the shared
// cfm_tmshandoffs table also carries AR/AP treasury handoffs from other apps.
const ACTIVE_FILTER = 'statecode eq 0 and cfm_tagename eq 766340000';

interface UseTmsHandoffDataResult {
  rows: TmsHandoffRow[];
  loading: boolean;
  error: string | null;
  lastRefresh: Date | null;
  reload: () => void;
}

export function useTmsHandoffData(): UseTmsHandoffDataResult {
  const [rows, setRows] = useState<TmsHandoffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const reloadToken = useRef(0);

  const load = useCallback(async () => {
    const token = ++reloadToken.current;
    setLoading(true);
    setError(null);
    try {
      const all = [];
      let skipToken: string | undefined;
      do {
        const result = await Cfm_tmshandoffsService.getAll({
          filter: ACTIVE_FILTER,
          orderBy: ['createdon desc'],
          maxPageSize: 5000,
          skipToken,
        });
        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to load TMS handoff tasks.');
        }
        all.push(...(result.data ?? []));
        skipToken = result.skipToken;
      } while (skipToken);

      if (token !== reloadToken.current) return;
      setRows(all.map(normalizeRow));
      setLastRefresh(new Date());
    } catch (err) {
      if (token !== reloadToken.current) return;
      setError(err instanceof Error ? err.message : 'Unknown error loading TMS handoff tasks.');
    } finally {
      if (token === reloadToken.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return { rows, loading, error, lastRefresh, reload: load };
}
