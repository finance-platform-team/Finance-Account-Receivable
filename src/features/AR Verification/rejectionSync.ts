/**
 * When an AR Verification entry is Approved and it carries a rejection
 * amount (cfm_rejection summed across its month allocations — the
 * VerificationRow.reject field), that amount gets added to the matching AR
 * Aging record's cfm_rejections column. Company match uses the Daily
 * Collection row's own cfm_CompanyCode lookup (VerificationRow.companyId) —
 * that lookup already points at the exact cfm_aragings record, no separate
 * text-based Company Code + BU matching needed.
 */
import { Cfm_aragingsService } from '../../generated/services/Cfm_aragingsService';

interface RejectedRow {
  companyId: string | null;
  reject: number;
}

export interface RejectionSyncResult {
  updated: number;
  failed: number;
  firstError: string;
}

/** Adds each row's rejection amount to its AR Aging record's cfm_rejections
 * total (grouped so each record is read+written once even if multiple
 * approved entries share the same company). Best-effort: failures here don't
 * roll back the Daily Collection status change that already succeeded. */
export async function addRejectionsToAging(rows: RejectedRow[]): Promise<RejectionSyncResult> {
  const totalsByCompany = new Map<string, number>();
  for (const row of rows) {
    if (!row.companyId || !row.reject) continue;
    totalsByCompany.set(row.companyId, (totalsByCompany.get(row.companyId) ?? 0) + row.reject);
  }

  let updated = 0;
  let failed = 0;
  let firstError = '';
  for (const [companyId, totalReject] of totalsByCompany) {
    try {
      const current = await Cfm_aragingsService.get(companyId, { select: ['cfm_rejections'] });
      if (!current.success || !current.data) {
        throw new Error(current.error?.message || 'Could not read AR Aging record.');
      }
      const existing = current.data.cfm_rejections ?? 0;
      const result = await Cfm_aragingsService.update(companyId, { cfm_rejections: existing + totalReject });
      if (!result.success) throw new Error(result.error?.message || 'Could not update AR Aging record.');
      updated++;
    } catch (err) {
      failed++;
      if (!firstError) firstError = err instanceof Error ? err.message : 'Unknown error.';
    }
  }
  return { updated, failed, firstError };
}
