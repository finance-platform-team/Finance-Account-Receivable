import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Cfm_manualentryauditsService } from '../../generated/services/Cfm_manualentryauditsService';
import type { Cfm_manualentryaudits } from '../../generated/models/Cfm_manualentryauditsModel';
import { normalizeAuditRow } from './normalizeAudit';
import type { AuditRow } from './types';
import type { PlanRow } from './types';

interface UseAuditDataResult {
  auditRows: AuditRow[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useAuditData(planRows: PlanRow[], enabled: boolean): UseAuditDataResult {
  const [auditRows, setAuditRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reloadToken = useRef(0);
  const hasLoadedRef = useRef(false);

  const planLookup = useMemo(
    () => new Map(planRows.map((r) => [r.id, { code: r.code, bu: r.bu }])),
    [planRows]
  );

  const load = useCallback(async () => {
    const token = ++reloadToken.current;
    setLoading(true);
    setError(null);
    try {
      const all: Cfm_manualentryaudits[] = [];
      let skipToken: string | undefined;
      do {
        const result = await Cfm_manualentryauditsService.getAll({
          orderBy: ['createdon desc'],
          maxPageSize: 5000,
          skipToken,
        });
        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to load the audit trail.');
        }
        all.push(...(result.data ?? []));
        skipToken = result.skipToken;
      } while (skipToken && token === reloadToken.current);

      if (token !== reloadToken.current) return;
      setAuditRows(all.map((row) => normalizeAuditRow(row, planLookup)));
    } catch (err) {
      if (token !== reloadToken.current) return;
      setError(err instanceof Error ? err.message : 'Unknown error loading the audit trail.');
    } finally {
      if (token === reloadToken.current) setLoading(false);
    }
  }, [planLookup]);

  useEffect(() => {
    if (enabled && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      void load();
    }
  }, [enabled, load]);

  return { auditRows, loading, error, reload: load };
}
