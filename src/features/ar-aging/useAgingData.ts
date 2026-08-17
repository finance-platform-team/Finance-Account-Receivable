import { useCallback, useEffect, useRef, useState } from 'react';
import { Cfm_aragingsService } from '../../generated/services/Cfm_aragingsService';
import { Cfm_insurancecompaniesService } from '../../generated/services/Cfm_insurancecompaniesService';
import type { Cfm_aragings, Cfm_aragingsBase } from '../../generated/models/Cfm_aragingsModel';
import type { Cfm_insurancecompanies } from '../../generated/models/Cfm_insurancecompaniesModel';
import { buildInsuranceCompanyLookup, normalizeRow } from './normalize';
import type { InsuranceCompanyLookup } from './normalize';
import type { AgingRow } from './types';

// Same server-side filter as ref.html: only active aging snapshots.
const ACTIVE_FILTER = 'statecode eq 0';

interface UseAgingDataResult {
  rows: AgingRow[];
  loading: boolean;
  error: string | null;
  lastRefresh: Date | null;
  reload: () => void;
  updateRow: (id: string, patch: Partial<Omit<Cfm_aragingsBase, 'cfm_aragingid'>>) => Promise<void>;
}

async function loadAragings(): Promise<Cfm_aragings[]> {
  const all: Cfm_aragings[] = [];
  let skipToken: string | undefined;
  do {
    const result = await Cfm_aragingsService.getAll({ filter: ACTIVE_FILTER, maxPageSize: 5000, skipToken });
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to load AR aging records.');
    }
    all.push(...(result.data ?? []));
    skipToken = result.skipToken;
  } while (skipToken);
  return all;
}

async function loadCompanies(): Promise<Cfm_insurancecompanies[]> {
  const all: Cfm_insurancecompanies[] = [];
  let skipToken: string | undefined;
  do {
    const result = await Cfm_insurancecompaniesService.getAll({ filter: ACTIVE_FILTER, maxPageSize: 5000, skipToken });
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to load insurance companies.');
    }
    all.push(...(result.data ?? []));
    skipToken = result.skipToken;
  } while (skipToken);
  return all;
}

export function useAgingData(): UseAgingDataResult {
  const [rows, setRows] = useState<AgingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const reloadToken = useRef(0);
  // Kept alongside `rows` so updateRow can re-normalize a single saved record
  // without re-fetching every insurance company again.
  const companyByCodeRef = useRef<InsuranceCompanyLookup>(new Map());

  const load = useCallback(async () => {
    const token = ++reloadToken.current;
    setLoading(true);
    setError(null);
    try {
      const [aragings, companies] = await Promise.all([loadAragings(), loadCompanies()]);
      if (token !== reloadToken.current) return;

      const companyByCode = buildInsuranceCompanyLookup(companies);
      companyByCodeRef.current = companyByCode;
      setRows(aragings.map((row) => normalizeRow(row, companyByCode)));
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

  const updateRow = useCallback(async (id: string, patch: Partial<Omit<Cfm_aragingsBase, 'cfm_aragingid'>>) => {
    const result = await Cfm_aragingsService.update(id, patch);
    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Save failed.');
    }
    const updated = normalizeRow(result.data, companyByCodeRef.current);
    setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
  }, []);

  return { rows, loading, error, lastRefresh, reload: load, updateRow };
}
