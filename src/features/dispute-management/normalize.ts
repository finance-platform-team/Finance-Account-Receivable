/**
 * Ported 1:1 from ref.html's Dispute Management Dataverse web resource.
 * Sourced from ar_disputemanagement, joined to cfm_insurancecompany (for the
 * AUTO tag / lookup fallback name) and cfm_disputemanagementupdateses (history).
 */
import {
  Ar_disputemanagementsar_category,
  Ar_disputemanagementscfm_arreview,
} from '../../generated/models/Ar_disputemanagementsModel';
import type { Ar_disputemanagements } from '../../generated/models/Ar_disputemanagementsModel';
import { Cfm_disputemanagementupdatesescfm_updatetype } from '../../generated/models/Cfm_disputemanagementupdatesesModel';
import type { Cfm_disputemanagementupdateses } from '../../generated/models/Cfm_disputemanagementupdatesesModel';
import { choiceLabel, lookupLabel } from '../../shared/dataverseLabels';
import type { AnnotatedRow } from '../../shared/dataverseLabels';
import { buildDisputeDocsFolder } from './proofFiles';
import type { DisputeHistoryRow, DisputeRow } from './types';

const n = (v: number | undefined | null): number => Number(v ?? 0);

export function normalizeDisputeRow(row: Ar_disputemanagements): DisputeRow {
  const r = row as unknown as AnnotatedRow;
  return {
    id: row.ar_disputemanagementid,
    code: row.ar_code?.trim() || '—',
    name: row.cfm_companyname?.trim() || lookupLabel(r, 'cfm_companycodename', '_cfm_companycode_value'),
    auto: Boolean(row._cfm_companycode_value),
    companyId: row._cfm_companycode_value || null,
    amount: n(row.ar_amount),
    totalClaim: n(row.ar_totalclaim),
    rejPct: row.ar_rejection == null ? null : Number(row.ar_rejection),
    due: fmtDue(row.ar_due),
    dueRaw: row.ar_due ?? null,
    category: choiceLabel(r, 'ar_category', 'ar_categoryname', Ar_disputemanagementsar_category).trim(),
    categoryValue: row.ar_category == null ? null : Number(row.ar_category),
    arReview: choiceLabel(r, 'cfm_arreview', 'cfm_arreviewname', Ar_disputemanagementscfm_arreview).trim(),
    arReviewValue: row.cfm_arreview == null ? null : Number(row.cfm_arreview),
    // Owner = Created By: Dataverse sets this automatically on every record (no
    // create-time binding needed), unlike the custom cfm_owner lookup which
    // ref.html set explicitly and which was often left blank.
    owner: lookupLabel(r, 'createdbyname', '_createdby_value'),
    agreement: row.ar_agreement ?? '',
    proof: row.cfm_proof ?? '',
    docsFolder: buildDisputeDocsFolder(
      row.cfm_companyname?.trim() || lookupLabel(r, 'cfm_companycodename', '_cfm_companycode_value'),
      row.ar_code?.trim() || '',
      row.ar_code?.trim() || ''
    ),
  };
}

export function normalizeHistoryRow(row: Cfm_disputemanagementupdateses): DisputeHistoryRow {
  const r = row as unknown as AnnotatedRow;
  return {
    id: row.cfm_disputemanagementupdatesid,
    typeLabel: choiceLabel(r, 'cfm_updatetype', 'cfm_updatetypename', Cfm_disputemanagementupdatesescfm_updatetype),
    typeValue: row.cfm_updatetype == null ? null : Number(row.cfm_updatetype),
    note: row.cfm_description ?? '',
    date: row.cfm_updatedate || row.createdon || '',
  };
}

export const fmtEGP = (v: number): string => `EGP ${Number(v || 0).toLocaleString('en-US')}`;

export function fmtDue(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// Select order for the New Dispute form's Category field — matches ref.html's <select> exactly.
const CATEGORY_SELECT_ORDER = [0, 1, 2, 3, 4] as const;
export const CATEGORY_OPTIONS = CATEGORY_SELECT_ORDER.map((value) => ({
  value,
  label: Ar_disputemanagementsar_category[value].trim(),
}));

// Chip order for the category filter row — matches ref.html's chip buttons exactly
// (deliberately not the same order as CATEGORY_OPTIONS above).
export const CATEGORY_CHIP_LABELS = ['All', 'Rejected', 'Legal Issues', 'Bankruptcy', 'Claims Issue', 'Stopped'];

// Select order for the AR Review filter + inline cell select — matches ref.html exactly.
const AR_REVIEW_SELECT_ORDER = [1, 2, 0] as const;
export const AR_REVIEW_OPTIONS = AR_REVIEW_SELECT_ORDER.map((value) => ({
  value,
  label: Ar_disputemanagementscfm_arreview[value].trim(),
}));

export const UPDATE_TYPE_OPTIONS = Object.entries(Cfm_disputemanagementupdatesescfm_updatetype).map(
  ([value, label]) => ({ value: Number(value), label })
);

export { escODataString } from '../../shared/dataverseLabels';
