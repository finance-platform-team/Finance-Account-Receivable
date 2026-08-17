import { useCallback, useEffect, useRef, useState } from 'react';
import { Cfm_insurancecompaniesService } from '../../generated/services/Cfm_insurancecompaniesService';
import type {
  Cfm_insurancecompanies,
  Cfm_insurancecompaniesBase,
  Cfm_insurancecompaniescfm_companytype,
  Cfm_insurancecompaniescfm_customerclass,
} from '../../generated/models/Cfm_insurancecompaniesModel';
import { normalizeRow } from './normalize';
import type { BulkEditInput, BusinessPartnerRow, PartnerFormInput } from './types';

const ACTIVE_FILTER = 'statecode eq 0';

type PartnerPatch = Partial<Omit<Cfm_insurancecompaniesBase, 'cfm_insurancecompanyid'>>;

interface BulkUpdateSummary {
  ok: number;
  fail: number;
  firstError: string;
}

interface UseBusinessPartnersDataResult {
  rows: BusinessPartnerRow[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  createPartner: (input: PartnerFormInput) => Promise<void>;
  updatePartner: (id: string, input: PartnerFormInput) => Promise<void>;
  bulkUpdatePartners: (ids: string[], input: BulkEditInput) => Promise<BulkUpdateSummary>;
}

function buildPatch(input: PartnerFormInput | BulkEditInput): PartnerPatch {
  const patch: PartnerPatch = {};
  if ('name' in input) patch.cfm_name = input.name;
  if ('companyCode' in input) patch.cfm_code = input.companyCode;
  if (input.companyTypeValue !== undefined) {
    patch.cfm_companytype =
      input.companyTypeValue == null ? undefined : (input.companyTypeValue as Cfm_insurancecompaniescfm_companytype);
  }
  if (input.customerClassValue !== undefined) {
    patch.cfm_customerclass =
      input.customerClassValue == null
        ? undefined
        : (input.customerClassValue as Cfm_insurancecompaniescfm_customerclass);
  }
  if (input.paymentTermId !== undefined) {
    patch['cfm_PaymentTerm@odata.bind'] = input.paymentTermId ? `/cfm_paymentterms(${input.paymentTermId})` : undefined;
  }
  if (input.buId) {
    patch['cfm_BU@odata.bind'] = `/businessunits(${input.buId})`;
  }
  return patch;
}

export function useBusinessPartnersData(): UseBusinessPartnersDataResult {
  const [rows, setRows] = useState<BusinessPartnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reloadToken = useRef(0);

  const load = useCallback(async () => {
    const token = ++reloadToken.current;
    setLoading(true);
    setError(null);
    try {
      const all: Cfm_insurancecompanies[] = [];
      let skipToken: string | undefined;
      do {
        const result = await Cfm_insurancecompaniesService.getAll({
          filter: ACTIVE_FILTER,
          orderBy: ['createdon desc'],
          maxPageSize: 5000,
          skipToken,
        });
        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to load business partners.');
        }
        all.push(...(result.data ?? []));
        skipToken = result.skipToken;
      } while (skipToken && token === reloadToken.current);

      if (token !== reloadToken.current) return;
      setRows(all.map(normalizeRow));
    } catch (err) {
      if (token !== reloadToken.current) return;
      setError(err instanceof Error ? err.message : 'Unknown error loading business partners.');
    } finally {
      if (token === reloadToken.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const createPartner = useCallback(async (input: PartnerFormInput) => {
    const result = await Cfm_insurancecompaniesService.create({
      ...buildPatch(input),
      cfm_name: input.name,
      cfm_code: input.companyCode,
      'cfm_BU@odata.bind': `/businessunits(${input.buId})`,
      statecode: 0,
    });
    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Could not save business partner.');
    }
    const created = normalizeRow(result.data);
    setRows((prev) => [created, ...prev]);
  }, []);

  const updatePartner = useCallback(async (id: string, input: PartnerFormInput) => {
    const result = await Cfm_insurancecompaniesService.update(id, buildPatch(input));
    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Could not save business partner.');
    }
    const updated = normalizeRow(result.data);
    setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
  }, []);

  const bulkUpdatePartners = useCallback(async (ids: string[], input: BulkEditInput) => {
    const patch = buildPatch(input);
    let ok = 0;
    let fail = 0;
    let firstError = '';
    for (const id of ids) {
      try {
        const result = await Cfm_insurancecompaniesService.update(id, patch);
        if (!result.success || !result.data) {
          throw new Error(result.error?.message || 'Update failed.');
        }
        const updated = normalizeRow(result.data);
        setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
        ok++;
      } catch (err) {
        fail++;
        if (!firstError) firstError = err instanceof Error ? err.message : 'Update failed.';
      }
    }
    return { ok, fail, firstError };
  }, []);

  return { rows, loading, error, reload: load, createPartner, updatePartner, bulkUpdatePartners };
}
