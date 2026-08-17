import { useCallback, useEffect, useRef, useState } from 'react';
import { Cfm_dailycollectionsService } from '../../generated/services/Cfm_dailycollectionsService';
import { Cfm_collectionmonthallocationsService } from '../../generated/services/Cfm_collectionmonthallocationsService';
import { Cfm_aragingsService } from '../../generated/services/Cfm_aragingsService';
import type { Cfm_dailycollections } from '../../generated/models/Cfm_dailycollectionsModel';
import type { Cfm_collectionmonthallocations } from '../../generated/models/Cfm_collectionmonthallocationsModel';
import type { Cfm_aragings } from '../../generated/models/Cfm_aragingsModel';
import { normalizeAllocation, normalizeEntry } from './normalize';
import type { VerificationRow } from './types';

const ACTIVE_FILTER = 'statecode eq 0';

interface UseVerificationDataResult {
  rows: VerificationRow[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

async function loadEntries(): Promise<Cfm_dailycollections[]> {
  const all: Cfm_dailycollections[] = [];
  let skipToken: string | undefined;
  do {
    const result = await Cfm_dailycollectionsService.getAll({ filter: ACTIVE_FILTER, maxPageSize: 5000, skipToken });
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to load Daily Collection entries.');
    }
    all.push(...(result.data ?? []));
    skipToken = result.skipToken;
  } while (skipToken);
  return all;
}

async function loadAllocations(): Promise<Cfm_collectionmonthallocations[]> {
  const all: Cfm_collectionmonthallocations[] = [];
  let skipToken: string | undefined;
  do {
    const result = await Cfm_collectionmonthallocationsService.getAll({
      filter: ACTIVE_FILTER,
      maxPageSize: 5000,
      skipToken,
    });
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to load month allocations.');
    }
    all.push(...(result.data ?? []));
    skipToken = result.skipToken;
  } while (skipToken);
  return all;
}

async function loadCompanies(): Promise<Cfm_aragings[]> {
  const all: Cfm_aragings[] = [];
  let skipToken: string | undefined;
  do {
    const result = await Cfm_aragingsService.getAll({ filter: ACTIVE_FILTER, maxPageSize: 5000, skipToken });
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to load companies.');
    }
    all.push(...(result.data ?? []));
    skipToken = result.skipToken;
  } while (skipToken);
  return all;
}

export function useVerificationData(): UseVerificationDataResult {
  const [rows, setRows] = useState<VerificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reloadToken = useRef(0);

  const load = useCallback(async () => {
    const token = ++reloadToken.current;
    setLoading(true);
    setError(null);
    try {
      const [entries, allocations, companies] = await Promise.all([
        loadEntries(),
        loadAllocations(),
        loadCompanies(),
      ]);
      if (token !== reloadToken.current) return;

      const allocsByEntry = new Map<string, Cfm_collectionmonthallocations[]>();
      allocations.forEach((a) => {
        const key = a._cfm_dailycollection_value;
        if (!key) return;
        const list = allocsByEntry.get(key);
        if (list) list.push(a);
        else allocsByEntry.set(key, [a]);
      });

      // Newest-first, matching the reference's $orderby=createdon desc.
      const sorted = entries
        .slice()
        .sort((a, b) => new Date(b.createdon ?? 0).getTime() - new Date(a.createdon ?? 0).getTime());

      const normalized = sorted.map((entry) => {
        const allocs = (allocsByEntry.get(entry.cfm_dailycollectionid) ?? [])
          .slice()
          .sort(
            (a, b) => new Date(a.cfm_allocatetomonth ?? 0).getTime() - new Date(b.cfm_allocatetomonth ?? 0).getTime()
          )
          .map(normalizeAllocation);
        return normalizeEntry(entry, allocs, companies);
      });

      setRows(normalized);
    } catch (err) {
      if (token !== reloadToken.current) return;
      setError(err instanceof Error ? err.message : 'Unknown error loading AR Verification entries.');
    } finally {
      if (token === reloadToken.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return { rows, loading, error, reload: load };
}
