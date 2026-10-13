/**
 * Additive: flags Collection Plan's Legal Issues / Bankruptcy / Claims Issue /
 * Stopped cells when the company has a matching OPEN case in
 * ar_disputemanagement.
 *
 * The dispute's own cfm_CompanyCode lookup does NOT point at cfm_aragings —
 * confirmed via dispute-management/DisputeManagementPage.tsx's create call,
 * which binds 'cfm_CompanyCode@odata.bind' to /cfm_insurancecompanies(...).
 * So a dispute is joined to a Collection Plan row via the business key
 * (Company Code + BU) both sides can produce, not by comparing GUIDs:
 *   - dispute -> resolve _cfm_companycode_value through the insurance-company
 *     list to read that record's own cfm_code + cfm_butext (falling back to
 *     the dispute's own typed ar_code text when the lookup is missing — see
 *     dispute-management/normalize.ts's `auto` flag for why that happens).
 *   - Collection Plan row -> its own `code` + `bu` (PlanRow, from cfm_aragings).
 */
import { Ar_disputemanagementsService } from '../../generated/services/Ar_disputemanagementsService';
import type { Ar_disputemanagements } from '../../generated/models/Ar_disputemanagementsModel';
import type { Cfm_insurancecompanies } from '../../generated/models/Cfm_insurancecompaniesModel';
import type { EditableFieldKey } from './types';

// Off by default. Flip to true to also require the dispute's AR Review to be
// "Approved" (cfm_arreview = 2) before it counts as an open flag.
const REQUIRE_AR_REVIEW_APPROVED = false;

// ar_category -> Collection Plan column. 0 ('Rejected ') has no column and is
// intentionally left unmapped.
const CATEGORY_TO_FIELD: Record<number, EditableFieldKey> = {
  1: 'legalissues',
  2: 'claimsissue',
  3: 'bankruptcy',
  4: 'stopped',
};

export const FLAG_COLORS: Partial<Record<EditableFieldKey, string>> = {
  legalissues: '#3a6b7d',
  bankruptcy: '#9a6b25',
  claimsissue: '#3f7d54',
  stopped: '#7a7266',
};

function norm(v: string | null | undefined): string {
  return (v ?? '').trim().toUpperCase();
}

function flagKey(code: string, bu: string, field: EditableFieldKey): string {
  return `${norm(code)}|${norm(bu)}|${field}`;
}

export function hasDisputeFlag(flagSet: Set<string>, code: string, bu: string, field: EditableFieldKey): boolean {
  return flagSet.has(flagKey(code, bu, field));
}

async function loadOpenDisputes(): Promise<Ar_disputemanagements[]> {
  const filter = REQUIRE_AR_REVIEW_APPROVED
    ? 'statecode eq 0 and cfm_arreview eq 2'
    : 'statecode eq 0';

  const all: Ar_disputemanagements[] = [];
  let skipToken: string | undefined;
  do {
    const result = await Ar_disputemanagementsService.getAll({
      select: ['ar_category', 'ar_code', '_cfm_companycode_value'],
      filter,
      maxPageSize: 5000,
      skipToken,
    });
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to load dispute flags.');
    }
    all.push(...(result.data ?? []));
    skipToken = result.skipToken;
  } while (skipToken);
  return all;
}

/** One dispute query per Collection Plan load (paginated like every other
 * loader here); `companies` is the insurance-company list Collection Plan
 * already loads for its Payment Term/Customer Class/Company Type join, reused
 * here to resolve each dispute's Company Code + BU. */
export async function loadDisputeFlagSet(companies: Cfm_insurancecompanies[]): Promise<Set<string>> {
  const byId = new Map<string, { code: string; bu: string }>();
  const byCode = new Map<string, { code: string; bu: string }>();
  companies.forEach((c) => {
    const code = c.cfm_code?.trim();
    if (!code) return;
    const info = { code, bu: c.cfm_butext?.trim() || '' };
    byId.set(c.cfm_insurancecompanyid, info);
    byCode.set(code.toUpperCase(), info);
  });

  const disputes = await loadOpenDisputes();
  const flagSet = new Set<string>();
  disputes.forEach((d) => {
    const field = d.ar_category == null ? undefined : CATEGORY_TO_FIELD[Number(d.ar_category)];
    if (!field) return;
    const companyId = d._cfm_companycode_value;
    const info = (companyId && byId.get(companyId)) || (d.ar_code && byCode.get(d.ar_code.trim().toUpperCase()));
    if (!info) return;
    flagSet.add(flagKey(info.code, info.bu, field));
  });
  return flagSet;
}
