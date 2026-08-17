/**
 * cfm_aragings is a read-only aging snapshot from DotCare (see ref.html header
 * comment) — every bracket/metadata field here is display-only. cfm_notesvisits
 * ("Notes") is the one exception: AR can attach a short note per company, saved
 * back via useAgingData's updateRow. Label resolution (choice/lookup fallback
 * chain) lives in shared/dataverseLabels.
 *
 * Payment Term / Customer Class / Company Type are joined in from
 * cfm_insurancecompanies (matched by company code) rather than read off
 * cfm_aragings' own copies of those fields — the Insurance Company record is
 * the authoritative source (it's what Business Partners edits), so AR Aging
 * should reflect it instead of DotCare's possibly-stale snapshot values. Falls
 * back to cfm_aragings' own fields when no matching company code is found.
 */
import {
  Cfm_aragingscfm_companytype,
  Cfm_aragingscfm_customerclass,
} from '../../generated/models/Cfm_aragingsModel';
import type { Cfm_aragings } from '../../generated/models/Cfm_aragingsModel';
import { choiceLabel, lookupLabel } from '../../shared/dataverseLabels';
import type { AnnotatedRow } from '../../shared/dataverseLabels';
import { buildInsuranceCompanyLookup } from '../../shared/insuranceCompanyLookup';
import type { InsuranceCompanyInfo, InsuranceCompanyLookup } from '../../shared/insuranceCompanyLookup';
import type { AgingRow } from './types';

const n = (v: number | undefined | null): number => Number(v ?? 0);

export { buildInsuranceCompanyLookup };
export type { InsuranceCompanyInfo, InsuranceCompanyLookup };

export function normalizeRow(row: Cfm_aragings, companyByCode: InsuranceCompanyLookup): AgingRow {
  const r = row as unknown as AnnotatedRow;
  const code = row.cfm_companycode?.trim() || '—';
  const matched = code !== '—' ? companyByCode.get(code.toUpperCase()) : undefined;
  return {
    id: row.cfm_aragingid,
    code,
    name: row.cfm_companyname?.trim() || '—',
    customerClass:
      matched?.customerClass ?? choiceLabel(r, 'cfm_customerclass', 'cfm_customerclassname', Cfm_aragingscfm_customerclass),
    companyType:
      matched?.companyType ?? choiceLabel(r, 'cfm_companytype', 'cfm_companytypename', Cfm_aragingscfm_companytype),
    type: lookupLabel(r, 'cfm_typename', '_cfm_type_value'),
    typeId: row._cfm_type_value || null,
    paymentTerm: matched?.paymentTerm ?? lookupLabel(r, 'cfm_paymenttermname', '_cfm_paymentterm_value'),
    taskOwner: lookupLabel(r, 'cfm_taskownername', '_cfm_taskowner_value'),
    supervisor: lookupLabel(r, 'cfm_supervisorname', '_cfm_supervisor_value'),
    notDue: n(row.cfm_notdue),
    lt30: n(row.cfm_greaterthan30),
    b3160: n(row.cfm_31to60),
    b6190: n(row.cfm_61to90),
    b91120: n(row.cfm_91to120),
    gt120: n(row.cfm_121to150) + n(row.cfm_150days),
    notes: row.cfm_notesvisits ?? '',
  };
}

export const NOTES_MAX_LENGTH = 100;

export { fmt, fmtTotal } from '../../shared/dataverseLabels';

// Fixed, deterministic order for the Customer Class filter (Dataverse enum order is A+, A, B, B+, C+, C).
export const CUSTOMER_CLASS_OPTIONS: string[] = ['A+', 'A', 'B+', 'B', 'C+', 'C'];

// Driven by the real Dataverse choice metadata instead of ref.html's hardcoded 5-option guess.
export const COMPANY_TYPE_OPTIONS: string[] = Array.from(
  new Set(Object.values(Cfm_aragingscfm_companytype).map((v) => v.trim()))
);
