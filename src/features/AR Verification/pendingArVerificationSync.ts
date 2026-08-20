/**
 * SUBTRACT-ONLY sync of AR Aging's cfm_pendingconfirmation ("Pending AR
 * Verification") column, triggered when a Daily Collection / AR Verification
 * record leaves status 766340000 ("Pending AR Verification") for any other
 * status (766340005 "Awaiting documents" included — treated the same as any
 * other non-pending status, no special-casing).
 *
 * The ADD side (record entering Pending AR Verification) is deliberately NOT
 * implemented here — it belongs exclusively to the Daily Collection creation
 * flow, which doesn't exist in this app yet.
 *
 * Company match uses the Daily Collection row's own cfm_CompanyCode lookup
 * (VerificationRow.companyId) — that lookup already points at the exact
 * cfm_aragings record for that Company Code + BU combination (both fields
 * live on the matched record itself). Rows with no linked AR Aging record
 * (companyId null) are skipped — never creates a new record.
 *
 * Duplicate prevention: this only ever runs from an explicit, one-shot
 * status-transition action (Approve / Reject / Request Bank Statement) —
 * never on a page-load or periodic recompute. Once a row leaves "Pending AR
 * Verification" its action buttons become unavailable (isLocked / no longer
 * listed as selectable), so the same transition can't be re-fired for the
 * same record.
 */
import { Cfm_aragingsService } from '../../generated/services/Cfm_aragingsService';

interface SyncRow {
  companyId: string | null;
  amount: number;
}

export interface PendingArVerificationSyncResult {
  updated: number;
  failed: number;
  firstError: string;
}

/** Rows LEAVING "Pending AR Verification" (previous status was exactly that). */
export async function subtractFromPendingArVerification(rows: SyncRow[]): Promise<PendingArVerificationSyncResult> {
  const totalsByCompany = new Map<string, number>();
  for (const row of rows) {
    if (!row.companyId || !row.amount) continue;
    totalsByCompany.set(row.companyId, (totalsByCompany.get(row.companyId) ?? 0) + row.amount);
  }

  let updated = 0;
  let failed = 0;
  let firstError = '';
  for (const [companyId, total] of totalsByCompany) {
    try {
      const current = await Cfm_aragingsService.get(companyId, { select: ['cfm_pendingconfirmation'] });
      if (!current.success || !current.data) {
        throw new Error(current.error?.message || 'Could not read AR Aging record.');
      }
      const existing = current.data.cfm_pendingconfirmation ?? 0;
      const next = Math.max(0, existing - total);
      const result = await Cfm_aragingsService.update(companyId, { cfm_pendingconfirmation: next });
      if (!result.success) throw new Error(result.error?.message || 'Could not update AR Aging record.');
      updated++;
    } catch (err) {
      failed++;
      if (!firstError) firstError = err instanceof Error ? err.message : 'Unknown error.';
    }
  }
  return { updated, failed, firstError };
}
