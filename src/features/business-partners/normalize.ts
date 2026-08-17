/**
 * Read-only listing of cfm_insurancecompanies ("Active Insurance Companies" /
 * Business Partners), mirroring the Dataverse grid view: Name, Company Code,
 * Company Type, Payment Term, Customer Class, BU, Created By, Created On.
 */
import {
  Cfm_insurancecompaniescfm_companytype,
  Cfm_insurancecompaniescfm_customerclass,
} from '../../generated/models/Cfm_insurancecompaniesModel';
import type { Cfm_insurancecompanies } from '../../generated/models/Cfm_insurancecompaniesModel';
import { choiceLabel, lookupLabel } from '../../shared/dataverseLabels';
import type { AnnotatedRow } from '../../shared/dataverseLabels';
import type { BusinessPartnerRow } from './types';

export function normalizeRow(row: Cfm_insurancecompanies): BusinessPartnerRow {
  const r = row as unknown as AnnotatedRow;
  return {
    id: row.cfm_insurancecompanyid,
    name: row.cfm_name?.trim() || row.cfm_companyname?.trim() || '—',
    companyCode: row.cfm_code?.trim() || '—',
    companyType: choiceLabel(r, 'cfm_companytype', 'cfm_companytypename', Cfm_insurancecompaniescfm_companytype).trim(),
    companyTypeValue: row.cfm_companytype == null ? null : Number(row.cfm_companytype),
    paymentTerm: lookupLabel(r, 'cfm_paymenttermname', '_cfm_paymentterm_value'),
    paymentTermId: row._cfm_paymentterm_value || null,
    customerClass: choiceLabel(
      r,
      'cfm_customerclass',
      'cfm_customerclassname',
      Cfm_insurancecompaniescfm_customerclass
    ),
    customerClassValue: row.cfm_customerclass == null ? null : Number(row.cfm_customerclass),
    bu: lookupLabel(r, 'cfm_buname', '_cfm_bu_value'),
    buId: row._cfm_bu_value || null,
    createdBy: lookupLabel(r, 'createdbyname', '_createdby_value'),
    createdOn: row.createdon || '',
  };
}

export function fmtCreatedOn(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Fixed, deterministic order (Dataverse enum order is A+, A, B, B+, C+, C).
export const CUSTOMER_CLASS_OPTIONS: string[] = ['A+', 'A', 'B', 'B+', 'C+', 'C'];

export const COMPANY_TYPE_OPTIONS: string[] = Array.from(
  new Set(Object.values(Cfm_insurancecompaniescfm_companytype).map((v) => v.trim()))
);

// value+label pairs for the create/edit/bulk-edit forms, in the generated enum's own order.
export const COMPANY_TYPE_VALUE_OPTIONS = Object.keys(Cfm_insurancecompaniescfm_companytype).map((key) => {
  const value = Number(key) as Cfm_insurancecompaniescfm_companytype;
  return { value, label: Cfm_insurancecompaniescfm_companytype[value].trim() };
});

export const CUSTOMER_CLASS_VALUE_OPTIONS = Object.keys(Cfm_insurancecompaniescfm_customerclass).map((key) => {
  const value = Number(key) as Cfm_insurancecompaniescfm_customerclass;
  return { value, label: Cfm_insurancecompaniescfm_customerclass[value].trim() };
});
