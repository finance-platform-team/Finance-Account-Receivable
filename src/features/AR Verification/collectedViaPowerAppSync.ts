/**
 * When an AR Verification entry is Approved, its Collected (Net) amount
 * (VerificationRow.net) gets added to the matching AR Aging record's
 * cfm_collectedviapowerapp column — mirrors rejectionSync.ts's handling of
 * cfm_rejections exactly, just for a different column. Company match uses
 * the Daily Collection row's own cfm_CompanyCode lookup (VerificationRow.companyId).
 */
import { Cfm_aragingsService } from '../../generated/services/Cfm_aragingsService';

interface CollectedRow {
  companyId: string | null;
  net: number;
}

export interface CollectedViaPowerAppSyncResult {
  updated: number;
  failed: number;
  firstError: string;
}

/** Adds each row's collected amount to its AR Aging record's
 * cfm_collectedviapowerapp total (grouped so each record is read+written once
 * even if multiple approved entries share the same company). Best-effort:
 * failures here don't roll back the Daily Collection status change that
 * already succeeded. */
export async function addCollectedToAging(rows: CollectedRow[]): Promise<CollectedViaPowerAppSyncResult> {
  const totalsByCompany = new Map<string, number>();
  for (const row of rows) {
    if (!row.companyId || !row.net) continue;
    totalsByCompany.set(row.companyId, (totalsByCompany.get(row.companyId) ?? 0) + row.net);
  }

  let updated = 0;
  let failed = 0;
  let firstError = '';
  for (const [companyId, totalNet] of totalsByCompany) {
    try {
      const current = await Cfm_aragingsService.get(companyId, { select: ['cfm_collectedviapowerapp'] });
      if (!current.success || !current.data) {
        throw new Error(current.error?.message || 'Could not read AR Aging record.');
      }
      const existing = current.data.cfm_collectedviapowerapp ?? 0;
      const result = await Cfm_aragingsService.update(companyId, { cfm_collectedviapowerapp: existing + totalNet });
      if (!result.success) throw new Error(result.error?.message || 'Could not update AR Aging record.');
      updated++;
    } catch (err) {
      failed++;
      if (!firstError) firstError = err instanceof Error ? err.message : 'Unknown error.';
    }
  }
  return { updated, failed, firstError };
}
