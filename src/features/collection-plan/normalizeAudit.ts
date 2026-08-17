/**
 * Audit-trail equivalent of normalize.ts. Sourced from cfm_manualentryaudits.
 * Unlike the Collection Plan, there's no $expand available via IGetAllOptions,
 * so company code/BU are joined locally against the already-loaded Collection
 * Plan rows (see useAuditData's planLookup) rather than fetched a second time.
 */
import type { Cfm_manualentryaudits } from '../../generated/models/Cfm_manualentryauditsModel';
import { Cfm_manualentryauditsService } from '../../generated/services/Cfm_manualentryauditsService';
import { lookupLabel } from '../../shared/dataverseLabels';
import type { AnnotatedRow } from '../../shared/dataverseLabels';
import { EDITABLE_FIELD_LABELS } from './normalize';
import type { AuditRow } from './types';

export const AUDIT_FIELD_OPTIONS: string[] = Object.values(EDITABLE_FIELD_LABELS);

export interface PlanJoinInfo {
  code: string;
  bu: string;
}

export function normalizeAuditRow(row: Cfm_manualentryaudits, planLookup: Map<string, PlanJoinInfo>): AuditRow {
  const r = row as unknown as AnnotatedRow;
  const plan = row._cfm_araging_value ? planLookup.get(row._cfm_araging_value) : undefined;
  return {
    id: row.cfm_manualentryauditid,
    when: row.createdon ?? '',
    field: row.cfm_fieldname?.trim() || '—',
    oldValue: row.cfm_oldvalue ?? null,
    newValue: row.cfm_newvalue ?? null,
    companyName: lookupLabel(r, 'cfm_aragingname', '_cfm_araging_value'),
    companyCode: plan?.code ?? '—',
    type: plan?.bu ?? '—',
    changedBy: lookupLabel(r, 'createdbyname', '_createdby_value'),
  };
}

// Unlike normalize.ts's fmt(), this shows 0 explicitly — in an audit trail
// "changed from 0" is meaningful and shouldn't look the same as "no value".
export const fmtAuditNum = (n: number | null): string => (n == null ? '—' : n.toLocaleString('en-US', { maximumFractionDigits: 0 }));

export function auditInitials(name: string): string {
  if (!name || name === '—') return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export interface AuditKpis {
  total: number;
  companies: number;
  users: number;
  topField: string;
  topFieldCount: number;
}

export function computeAuditKpis(rows: AuditRow[]): AuditKpis {
  if (!rows.length) {
    return { total: 0, companies: 0, users: 0, topField: '—', topFieldCount: 0 };
  }
  const counts = new Map<string, number>();
  rows.forEach((r) => counts.set(r.field, (counts.get(r.field) ?? 0) + 1));
  const [topField, topFieldCount] = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];
  return {
    total: rows.length,
    companies: new Set(rows.map((r) => r.companyName)).size,
    users: new Set(rows.map((r) => r.changedBy)).size,
    topField,
    topFieldCount,
  };
}

function toDateInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function defaultAuditMonthRange(): { from: string; to: string } {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: toDateInputValue(first), to: toDateInputValue(last) };
}

export async function createManualEntryAudit(
  aragingId: string,
  fieldLabel: string,
  oldValue: number,
  newValue: number,
  planPeriodISO: string
): Promise<void> {
  const result = await Cfm_manualentryauditsService.create({
    'cfm_ARAging@odata.bind': `/cfm_aragings(${aragingId})`,
    cfm_fieldname: fieldLabel,
    cfm_oldvalue: oldValue,
    cfm_newvalue: newValue,
    cfm_planperiod: planPeriodISO,
    statecode: 0,
  });
  if (!result.success) {
    throw new Error(result.error?.message || 'Audit log failed.');
  }
}
