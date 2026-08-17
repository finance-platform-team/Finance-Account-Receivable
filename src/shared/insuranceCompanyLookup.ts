/**
 * Payment Term / Customer Class / Company Type are joined in from
 * cfm_insurancecompanies (matched by company code) instead of read off a
 * cfm_aragings row's own copies of those fields — the Insurance Company
 * record is the authoritative source (it's what Business Partners edits), so
 * any page built on cfm_aragings should reflect it instead of DotCare's
 * possibly-stale snapshot values. Shared by AR Aging and Collection Plan.
 */
import {
  Cfm_insurancecompaniescfm_companytype,
  Cfm_insurancecompaniescfm_customerclass,
} from '../generated/models/Cfm_insurancecompaniesModel';
import type { Cfm_insurancecompanies } from '../generated/models/Cfm_insurancecompaniesModel';
import { choiceLabel, lookupLabel } from './dataverseLabels';
import type { AnnotatedRow } from './dataverseLabels';

export interface InsuranceCompanyInfo {
  paymentTerm: string;
  customerClass: string;
  companyType: string;
}

export type InsuranceCompanyLookup = Map<string, InsuranceCompanyInfo>;

export function buildInsuranceCompanyLookup(companies: Cfm_insurancecompanies[]): InsuranceCompanyLookup {
  const map: InsuranceCompanyLookup = new Map();
  companies.forEach((c) => {
    const code = c.cfm_code?.trim().toUpperCase();
    if (!code) return;
    const r = c as unknown as AnnotatedRow;
    map.set(code, {
      paymentTerm: lookupLabel(r, 'cfm_paymenttermname', '_cfm_paymentterm_value'),
      customerClass: choiceLabel(
        r,
        'cfm_customerclass',
        'cfm_customerclassname',
        Cfm_insurancecompaniescfm_customerclass
      ),
      companyType: choiceLabel(r, 'cfm_companytype', 'cfm_companytypename', Cfm_insurancecompaniescfm_companytype).trim(),
    });
  });
  return map;
}
