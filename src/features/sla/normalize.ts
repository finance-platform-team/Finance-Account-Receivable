/**
 * Ported from the "SLA — Andalusia Pulse" Dataverse web resource (ref.html).
 * Two corrections against that reference, verified from the real generated
 * model/schema instead of guessing:
 *  - cfm_slatype only has two real options (date/hours) — ref.html's 5-option
 *    list was itself flagged there as unconfirmed guesswork.
 *  - cfm_department1/cfm_department2 are plain text fields, not lookups to a
 *    Teams table — ref.html assumed a "teams" lookup that isn't actually there.
 */
import { Cfm_slascfm_slatype } from '../../generated/models/Cfm_slasModel';
import type { Cfm_slas } from '../../generated/models/Cfm_slasModel';
import { lookupLabel } from '../../shared/dataverseLabels';
import type { AnnotatedRow } from '../../shared/dataverseLabels';
import type { SlaRow } from './types';

export const SLA_TYPE_OPTIONS = Object.entries(Cfm_slascfm_slatype).map(([value, label]) => ({
  value: Number(value),
  label,
}));

export function slaTypeLabel(value: number | null): string {
  if (value == null) return '—';
  return Cfm_slascfm_slatype[value as keyof typeof Cfm_slascfm_slatype] ?? '—';
}

export function normalizeSlaRow(row: Cfm_slas): SlaRow {
  const r = row as unknown as AnnotatedRow;
  return {
    id: row.cfm_slaid,
    action: row.cfm_action?.trim() || '—',
    slaTypeValue: row.cfm_slatype ?? null,
    slaTypeLabel: slaTypeLabel(row.cfm_slatype ?? null),
    slaValue: row.cfm_slanoofhoursordate?.trim() || '',
    responsibleId: row._cfm_responsible_value || null,
    responsibleName: lookupLabel(r, 'cfm_responsiblename', '_cfm_responsible_value'),
    escalationRule: row.cfm_escalationrule?.trim() || '',
    department1: row.cfm_department1?.trim() || '',
    manager1Id: row._cfm_managerfordepartment1_value || null,
    manager1Name: lookupLabel(r, 'cfm_managerfordepartment1name', '_cfm_managerfordepartment1_value'),
    department2: row.cfm_department2?.trim() || '',
    manager2Id: row._cfm_managerofdepartment2_value || null,
    manager2Name: lookupLabel(r, 'cfm_managerofdepartment2name', '_cfm_managerofdepartment2_value'),
    deduction: row.cfm_deduction?.trim() || '',
  };
}
