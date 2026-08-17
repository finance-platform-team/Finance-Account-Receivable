/**
 * Ported 1:1 from the "CFM · AR Verification" Dataverse web resource
 * (src/features/AR Verification/_ref-partial.html) — same formulas, same
 * fallback chains, same defaults. Sourced from cfm_dailycollections (parent)
 * + cfm_collectionmonthallocations (children) + cfm_aragings (companies).
 */
import {
  Cfm_dailycollectionscfm_paymentmethod,
  Cfm_dailycollectionscfm_statusaction,
} from '../../generated/models/Cfm_dailycollectionsModel';
import type { Cfm_dailycollections } from '../../generated/models/Cfm_dailycollectionsModel';
import type { Cfm_collectionmonthallocations } from '../../generated/models/Cfm_collectionmonthallocationsModel';
import type { Cfm_aragings } from '../../generated/models/Cfm_aragingsModel';
import { choiceLabel, lookupLabel } from '../../shared/dataverseLabels';
import type { AnnotatedRow } from '../../shared/dataverseLabels';
import type { AllocationRow, VerificationRow } from './types';

export const AR_STATUS = {
  PENDING_VERIFY: 766340000,
  REJECTED: 766340001,
  APPROVED: 766340002,
  ALLOCATED: 766340003,
  PENDING_BANK: 766340004,
} as const;

export const PAYMENT_METHOD = {
  CHEQUE: 766340000,
  BANK_TRANSFER: 766340001,
} as const;

const n = (v: number | undefined | null): number => Number(v ?? 0);

export function isLocked(status: number | null): boolean {
  if (status == null) return false;
  return status === AR_STATUS.APPROVED || status === AR_STATUS.ALLOCATED || status === AR_STATUS.PENDING_BANK;
}

export function statusPillClass(status: number | null): string {
  switch (status) {
    case AR_STATUS.APPROVED:
      return 'linked';
    case AR_STATUS.REJECTED:
      return 'rejected';
    case AR_STATUS.ALLOCATED:
      return 'allocated';
    case AR_STATUS.PENDING_BANK:
      return 'bank';
    default:
      return 'method';
  }
}

export function statusIcon(status: number | null): string {
  switch (status) {
    case AR_STATUS.APPROVED:
      return 'fa-circle-check';
    case AR_STATUS.REJECTED:
      return 'fa-circle-xmark';
    case AR_STATUS.ALLOCATED:
      return 'fa-layer-group';
    case AR_STATUS.PENDING_BANK:
      return 'fa-building-columns';
    default:
      return 'fa-clock';
  }
}

// Unlike Collection Plan's fmt(), 0 and null both render as '—' here — matches
// the reference exactly (this page never needs to distinguish "zero" from "none").
export const fmt = (v: number | null | undefined): string =>
  !v ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 });

export const fmtSAR = (v: number | null | undefined): string => (!v ? '—' : `SAR ${Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 })}`);

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : d.toISOString().slice(0, 10);
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  let hh = d.getHours();
  const min = String(d.getMinutes()).padStart(2, '0');
  const ap = hh >= 12 ? 'PM' : 'AM';
  hh = hh % 12 || 12;
  return `${dd}-${mm}-${yyyy} ${hh}:${min} ${ap}`;
}

/* Folder name must MATCH the Daily Collection screen exactly:
   "CompanyName - Code - dd-mm-yyyy - (Ref)"  (SharePoint-forbidden chars stripped) */
export function buildDocsFolder(ref: string, companyName: string, companyCode: string, dateIso: string): string {
  const strip = (s: string | null | undefined) =>
    String(s ?? '')
      .replace(/["*:<>?/\\|]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  const name = strip(companyName) || 'Company';
  const code = strip(companyCode) || 'NA';
  let dateStr = 'NODATE';
  if (dateIso) {
    const d = new Date(dateIso);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      dateStr = `${dd}-${mm}-${d.getFullYear()}`;
    }
  }
  const refP = strip(ref) || 'REF';
  return `${name} - ${code} - ${dateStr} - (${refP})`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function monthShort(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function monthRange(allocs: AllocationRow[]): string {
  const ms = allocs
    .map((a) => a.month)
    .filter((m): m is string => Boolean(m))
    .map((label) => label);
  if (!ms.length) return '—';
  return ms[0] === ms[ms.length - 1] ? ms[0] : `${ms[0]} – ${ms[ms.length - 1]}`;
}

export function claimLabel(allocs: AllocationRow[]): string {
  const claims = allocs.map((a) => a.claim).filter((v) => v > 0);
  if (!claims.length) return '—';
  if (claims.length === 1) return fmt(claims[0]);
  return `${fmt(claims[0])} +${claims.length - 1}`;
}

export function normalizeAllocation(row: Cfm_collectionmonthallocations): AllocationRow {
  return {
    id: row.cfm_collectionmonthallocationid,
    month: monthShort(row.cfm_allocatetomonth),
    claim: n(row.cfm_allocatetoclaim),
    amount: n(row.cfm_allocationamount),
    tax: n(row.cfm_tax),
    volumeDiscount: n(row.cfm_volumediscount),
    earlyDiscount: n(row.cfm_earlypaymentdisc),
    admin: n(row.cfm_adminfees),
    rejection: n(row.cfm_rejection),
    gross: n(row.cfm_grossamount),
  };
}

export function normalizeEntry(
  row: Cfm_dailycollections,
  allocsForRow: AllocationRow[],
  companies: Cfm_aragings[]
): VerificationRow {
  const r = row as unknown as AnnotatedRow;
  const coId = row._cfm_companycode_value || '';
  const co = coId ? companies.find((c) => c.cfm_aragingid === coId) : undefined;
  const coAnnotated = co as unknown as AnnotatedRow | undefined;

  const code = co ? co.cfm_companycode?.trim() || '—' : '—';
  const name = co ? co.cfm_companyname?.trim() || '—' : row.cfm_companynamefx?.trim() || '—';
  const entity = co ? lookupLabel(coAnnotated as AnnotatedRow, 'cfm_typename', '_cfm_type_value') : row.cfm_entityfx?.trim() || '—';

  const status = row.cfm_statusaction == null ? null : Number(row.cfm_statusaction);
  const method = row.cfm_paymentmethod == null ? null : Number(row.cfm_paymentmethod);
  const methodLabel = choiceLabel(r, 'cfm_paymentmethod', 'cfm_paymentmethodname', Cfm_dailycollectionscfm_paymentmethod);
  const statusLabel =
    status == null
      ? 'Pending AR Verification'
      : choiceLabel(r, 'cfm_statusaction', 'cfm_statusactionname', Cfm_dailycollectionscfm_statusaction);

  const sum = (key: keyof AllocationRow) => allocsForRow.reduce((t, a) => t + (a[key] as number), 0);

  return {
    id: row.cfm_dailycollectionid,
    ref: row.cfm_name?.trim() || '—',
    entity,
    companyCode: code,
    companyName: name,
    date: row.cfm_collectiondate || '',
    method,
    methodLabel,
    bankAccount: '—',
    net: n(row.cfm_collectedamountnet),
    proof: row.cfm_proof || '',
    // cfm_arcomments is the AR reviewer's note from the approve/reject dialog
    // (ConfirmModal) — it must win over the Collection team's original
    // submission note (cfm_note) once AR has actioned the entry, otherwise the
    // reject reason the reviewer typed never becomes visible anywhere.
    note: row.cfm_arcomments?.trim() || row.cfm_note?.trim() || '',
    paymentReference: row.cfm_paymentreference || '',
    status,
    statusLabel,
    actionBy: lookupLabel(r, 'cfm_actionbyname', '_cfm_actionby_value'),
    actionOn: row.cfm_actionon || '',
    docsFolder: buildDocsFolder(row.cfm_name || '', name, code, row.cfm_collectiondate || ''),
    monthsLabel: monthRange(allocsForRow),
    claimsLabel: claimLabel(allocsForRow),
    tax: sum('tax'),
    vol: sum('volumeDiscount'),
    early: sum('earlyDiscount'),
    admin: sum('admin'),
    reject: sum('rejection'),
    gross: sum('gross'),
    allocs: allocsForRow.slice(),
  };
}
