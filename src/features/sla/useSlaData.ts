import { useCallback, useEffect, useRef, useState } from 'react';
import { Cfm_slasService } from '../../generated/services/Cfm_slasService';
import type { Cfm_slascfm_slatype, Cfm_slascfm_tagename } from '../../generated/models/Cfm_slasModel';
import { normalizeSlaRow } from './normalize';
import type { SlaFormInput, SlaRow } from './types';

// Only SLA rules raised from this app (tagged 'AR') — the shared cfm_slas
// table also carries Collection/AP-owned rules from other apps.
const ACTIVE_FILTER = 'statecode eq 0 and cfm_tagename eq 766340001';

interface UseSlaDataResult {
  rows: SlaRow[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  createSla: (input: SlaFormInput) => Promise<void>;
  updateSla: (id: string, input: SlaFormInput) => Promise<void>;
  deactivateSla: (id: string) => Promise<void>;
}

function toPatch(input: SlaFormInput) {
  return {
    cfm_action: input.action,
    cfm_slatype: input.slaTypeValue == null ? undefined : (input.slaTypeValue as Cfm_slascfm_slatype),
    cfm_slanoofhoursordate: input.slaValue || undefined,
    cfm_escalationrule: input.escalationRule || undefined,
    cfm_department1: input.department1 || undefined,
    cfm_department2: input.department2 || undefined,
    cfm_deduction: input.deduction || undefined,
    ...(input.responsibleId ? { 'cfm_Responsible@odata.bind': `/systemusers(${input.responsibleId})` } : {}),
    ...(input.manager1Id ? { 'cfm_ManagerforDepartment1@odata.bind': `/systemusers(${input.manager1Id})` } : {}),
    ...(input.manager2Id ? { 'cfm_ManagerofDepartment2@odata.bind': `/systemusers(${input.manager2Id})` } : {}),
  };
}

export function useSlaData(): UseSlaDataResult {
  const [rows, setRows] = useState<SlaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reloadToken = useRef(0);

  const load = useCallback(async () => {
    const token = ++reloadToken.current;
    setLoading(true);
    setError(null);
    try {
      const all = [];
      let skipToken: string | undefined;
      do {
        const result = await Cfm_slasService.getAll({
          filter: ACTIVE_FILTER,
          orderBy: ['createdon asc'],
          maxPageSize: 5000,
          skipToken,
        });
        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to load SLA rules.');
        }
        all.push(...(result.data ?? []));
        skipToken = result.skipToken;
      } while (skipToken);

      if (token !== reloadToken.current) return;
      setRows(all.map(normalizeSlaRow));
    } catch (err) {
      if (token !== reloadToken.current) return;
      setError(err instanceof Error ? err.message : 'Unknown error loading SLA rules.');
    } finally {
      if (token === reloadToken.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const createSla = useCallback(
    async (input: SlaFormInput) => {
      const result = await Cfm_slasService.create({
        ...toPatch(input),
        statecode: 0,
        cfm_tagename: 766340001 as Cfm_slascfm_tagename, // 'AR'
      });
      if (!result.success) {
        throw new Error(result.error?.message || 'Could not create the SLA rule.');
      }
      await load();
    },
    [load]
  );

  const updateSla = useCallback(
    async (id: string, input: SlaFormInput) => {
      const result = await Cfm_slasService.update(id, toPatch(input));
      if (!result.success) {
        throw new Error(result.error?.message || 'Could not save the SLA rule.');
      }
      await load();
    },
    [load]
  );

  // Matches ref.html's doDelete(): soft delete (deactivate), not a hard DELETE.
  const deactivateSla = useCallback(
    async (id: string) => {
      const result = await Cfm_slasService.update(id, { statecode: 1, statuscode: 2 });
      if (!result.success) {
        throw new Error(result.error?.message || 'Could not deactivate the SLA rule.');
      }
      await load();
    },
    [load]
  );

  return { rows, loading, error, reload: load, createSla, updateSla, deactivateSla };
}
