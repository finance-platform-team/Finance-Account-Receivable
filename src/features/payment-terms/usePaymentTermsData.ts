import { useCallback, useEffect, useRef, useState } from 'react';
import { Cfm_paymenttermsService } from '../../generated/services/Cfm_paymenttermsService';
import type { Cfm_paymentterms } from '../../generated/models/Cfm_paymenttermsModel';
import { normalizeRow } from './normalize';
import type { PaymentTermRow } from './types';

const ACTIVE_FILTER = 'statecode eq 0';

interface NewPaymentTermInput {
  name: string;
  numberOfDays: number;
}

interface UsePaymentTermsDataResult {
  rows: PaymentTermRow[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  createTerm: (input: NewPaymentTermInput) => Promise<void>;
  updateTerm: (id: string, input: NewPaymentTermInput) => Promise<void>;
}

export function usePaymentTermsData(): UsePaymentTermsDataResult {
  const [rows, setRows] = useState<PaymentTermRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reloadToken = useRef(0);

  const load = useCallback(async () => {
    const token = ++reloadToken.current;
    setLoading(true);
    setError(null);
    try {
      const all: Cfm_paymentterms[] = [];
      let skipToken: string | undefined;
      do {
        const result = await Cfm_paymenttermsService.getAll({
          filter: ACTIVE_FILTER,
          orderBy: ['cfm_numberofdays asc'],
          maxPageSize: 5000,
          skipToken,
        });
        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to load payment terms.');
        }
        all.push(...(result.data ?? []));
        skipToken = result.skipToken;
      } while (skipToken && token === reloadToken.current);

      if (token !== reloadToken.current) return;
      setRows(all.map(normalizeRow));
    } catch (err) {
      if (token !== reloadToken.current) return;
      setError(err instanceof Error ? err.message : 'Unknown error loading payment terms.');
    } finally {
      if (token === reloadToken.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const createTerm = useCallback(async ({ name, numberOfDays }: NewPaymentTermInput) => {
    const result = await Cfm_paymenttermsService.create({
      cfm_name: name,
      cfm_numberofdays: numberOfDays,
      statecode: 0,
    });
    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Could not save payment term.');
    }
    const created = normalizeRow(result.data);
    setRows((prev) => [created, ...prev]);
  }, []);

  const updateTerm = useCallback(async (id: string, { name, numberOfDays }: NewPaymentTermInput) => {
    const result = await Cfm_paymenttermsService.update(id, {
      cfm_name: name,
      cfm_numberofdays: numberOfDays,
    });
    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Could not save payment term.');
    }
    const updated = normalizeRow(result.data);
    setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
  }, []);

  return { rows, loading, error, reload: load, createTerm, updateTerm };
}
