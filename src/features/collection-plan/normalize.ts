/**
 * Sourced from the same cfm_aragings table as AR Aging. Unlike AR Aging this
 * page writes back to six "Manual Entry — AR Team" fields (see EDITABLE_FIELDS
 * below) — everything else here is read-only, mirroring ref.html's normalise().
 */
import {
  Cfm_aragingscfm_companytype,
  Cfm_aragingscfm_customerclass,
} from '../../generated/models/Cfm_aragingsModel';
import type { Cfm_aragings, Cfm_aragingsBase } from '../../generated/models/Cfm_aragingsModel';
import { choiceLabel, lookupLabel } from '../../shared/dataverseLabels';
import type { AnnotatedRow } from '../../shared/dataverseLabels';
import type { EditableFieldKey, PlanRow } from './types';

const n = (v: number | undefined | null): number => Number(v ?? 0);

// UI field key -> Dataverse column name, matching ref.html's EDITABLE_FIELDS exactly.
export const EDITABLE_FIELDS: Record<EditableFieldKey, keyof Cfm_aragingsBase> = {
  earlypayment: 'cfm_earlypayment',
  legalissues: 'cfm_legalissues',
  bankruptcy: 'cfm_bankruptcy',
  claimsissue: 'cfm_claimsissue',
  stopped: 'cfm_stopped',
  agreedrecon: 'cfm_agreedrecon',
};

export const EDITABLE_FIELD_LABELS: Record<EditableFieldKey, string> = {
  earlypayment: 'Early Payment',
  legalissues: 'Legal Issues',
  bankruptcy: 'Bankruptcy',
  claimsissue: 'Claims Issue',
  stopped: 'Stopped',
  agreedrecon: 'Agreed Recon.',
};

export function normalizePlanRow(row: Cfm_aragings): PlanRow {
  const r = row as unknown as AnnotatedRow;
  const collected = n(row.cfm_collectedamount);
  const tax = n(row.cfm_tax);
  const rejections = n(row.cfm_rejections);
  return {
    id: row.cfm_aragingid,
    code: row.cfm_companycode?.trim() || '—',
    name: row.cfm_companyname?.trim() || '—',
    customerClass: choiceLabel(r, 'cfm_customerclass', 'cfm_customerclassname', Cfm_aragingscfm_customerclass),
    companyType: choiceLabel(r, 'cfm_companytype', 'cfm_companytypename', Cfm_aragingscfm_companytype),
    bu: lookupLabel(r, 'cfm_typename', '_cfm_type_value'),
    paymentTerm: lookupLabel(r, 'cfm_paymenttermname', '_cfm_paymentterm_value'),
    taskOwner: lookupLabel(r, 'cfm_taskownername', '_cfm_taskowner_value'),
    supervisor: lookupLabel(r, 'cfm_supervisorname', '_cfm_supervisor_value'),
    earlypayment: n(row.cfm_earlypayment),
    legalissues: n(row.cfm_legalissues),
    bankruptcy: n(row.cfm_bankruptcy),
    claimsissue: n(row.cfm_claimsissue),
    stopped: n(row.cfm_stopped),
    agreedrecon: n(row.cfm_agreedrecon),
    totalOutstanding: n(row.cfm_totaloutstanding),
    rejections,
    outstandingRej: n(row.cfm_outstandingrej),
    totalDues: n(row.cfm_totaldues),
    targetPlanDB: n(row.cfm_targetplan),
    achievement: row.cfm_achievement == null ? null : n(row.cfm_achievement),
    collected,
    tax,
    collectedPlus: collected + tax + rejections,
  };
}

export { fmt, fmtTotal } from '../../shared/dataverseLabels';

export const CUSTOMER_CLASS_OPTIONS: string[] = ['A+', 'A', 'B+', 'B', 'C+', 'C'];

export const COMPANY_TYPE_OPTIONS: string[] = Array.from(
  new Set(Object.values(Cfm_aragingscfm_companytype).map((v) => v.trim()))
);

export function achvLevel(pct: number): 'over' | 'mid' | 'low' {
  if (pct >= 100) return 'over';
  if (pct >= 60) return 'mid';
  return 'low';
}

export function achvIcon(pct: number): string {
  if (pct >= 100) return 'fa-check';
  if (pct >= 60) return 'fa-arrow-trend-up';
  return 'fa-arrow-trend-down';
}

export function rowTargetPlan(row: PlanRow, targetPct: number): number {
  return row.totalDues * (targetPct / 100);
}

export function rowAchievement(row: PlanRow, targetPct: number): number {
  if (row.achievement != null) return row.achievement;
  const target = row.targetPlanDB > 0 ? row.targetPlanDB : rowTargetPlan(row, targetPct);
  return target > 0 ? (row.collected / target) * 100 : 0;
}
