import { Cfm_tmshandoffscfm_priority } from '../../generated/models/Cfm_tmshandoffsModel';
import type { Cfm_tmshandoffs } from '../../generated/models/Cfm_tmshandoffsModel';
import { choiceLabel, lookupLabel } from '../../shared/dataverseLabels';
import type { AnnotatedRow } from '../../shared/dataverseLabels';
import type { TmsHandoffRow, SlaTone } from './types';

// The generated enum labels carry trailing spaces / a typo straight from
// Dataverse ('In Progress ', 'Submited') — clean display copies live here,
// keyed by the same numeric option-set codes used for filtering.
const STATUS_LABELS: Record<number, string> = {
  123200004: 'New',
  123200005: 'Submitted',
  100000001: 'In Progress',
  100000005: 'On Hold',
  123200002: 'Closed',
  123200003: 'Cancelled',
  931940001: 'Rejected',
};

export interface StatusCardDef {
  key: string;
  label: string;
  sub: string;
  code: number | null;
  cardClass: string;
  badgeClass: string;
}

export const STATUS_CARDS: StatusCardDef[] = [
  { key: 'ALL', label: 'All', sub: 'total handoffs', code: null, cardClass: 'kpi-gold', badgeClass: 'acc-cls-gold' },
  { key: 'NEW', label: 'New', sub: 'new handoffs', code: 123200004, cardClass: 'kpi-warn', badgeClass: 'acc-cls-warn' },
  { key: 'SUBMITTED', label: 'Submitted', sub: 'submitted to TMS', code: 123200005, cardClass: 'kpi-gold', badgeClass: 'acc-cls-gold' },
  { key: 'IN_PROGRESS', label: 'In Progress', sub: 'being processed', code: 100000001, cardClass: 'kpi-info', badgeClass: 'acc-cls-info' },
  { key: 'ON_HOLD', label: 'On Hold', sub: 'temporarily paused', code: 100000005, cardClass: '', badgeClass: 'acc-cls-none' },
  { key: 'CLOSED', label: 'Closed', sub: 'closed & finalised', code: 123200002, cardClass: 'kpi-ok', badgeClass: 'acc-cls-ok' },
  { key: 'CANCELLED', label: 'Cancelled', sub: 'cancelled / voided', code: 123200003, cardClass: '', badgeClass: 'acc-cls-none' },
  { key: 'REJECTED', label: 'Rejected', sub: 'rejected / returned', code: 931940001, cardClass: 'kpi-bad', badgeClass: 'acc-cls-bad' },
];

export function statusLabel(code: number | null): string {
  if (code == null) return '—';
  return STATUS_LABELS[code] ?? '—';
}

export function badgeClassForStatus(code: number | null): string {
  return STATUS_CARDS.find((c) => c.code === code)?.badgeClass ?? 'acc-cls-none';
}

export function slaTone(dueDate: string | null): SlaTone {
  if (!dueDate) return 'ok';
  const due = new Date(dueDate);
  const now = new Date();
  due.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const days = Math.round((due.getTime() - now.getTime()) / 86400000);
  if (days < 0) return 'bad';
  if (days <= 2) return 'warn';
  return 'ok';
}

export function initials(name: string): string {
  if (!name || name === '—') return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

export function normalizeRow(row: Cfm_tmshandoffs): TmsHandoffRow {
  return {
    id: row.cfm_tmshandoffid,
    taskCode: row.cfm_tmscode?.trim() || '—',
    decisionId: row.cfm_decision?.trim() || '—',
    title: row.cfm_tasktitle?.trim() || '—',
    description: row.cfm_taskdescription?.trim() || '',
    typeAction: row.cfm_typeaction?.trim() || '—',
    assignee: lookupLabel(row as unknown as AnnotatedRow, 'cfm_assigneename', '_cfm_assignee_value'),
    priority: choiceLabel(row as unknown as AnnotatedRow, 'cfm_priority', 'cfm_priorityname', Cfm_tmshandoffscfm_priority),
    sla: row.cfm_sla?.trim() || '—',
    dueDate: row.cfm_duedate ?? null,
    statusCode: row.cfm_progress ?? null,
    statusLabel: statusLabel(row.cfm_progress ?? null),
    createdOn: row.createdon ?? null,
  };
}
