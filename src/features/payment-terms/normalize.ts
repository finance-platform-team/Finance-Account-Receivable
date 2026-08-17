/**
 * Read-only listing of cfm_paymentterms ("Active Payment Terms"), mirroring the
 * Dataverse grid view: Name, NumberOfDays, Created On.
 */
import { lookupLabel } from '../../shared/dataverseLabels';
import type { AnnotatedRow } from '../../shared/dataverseLabels';
import type { Cfm_paymentterms } from '../../generated/models/Cfm_paymenttermsModel';
import type { PaymentTermRow } from './types';

export function normalizeRow(row: Cfm_paymentterms): PaymentTermRow {
  const r = row as unknown as AnnotatedRow;
  return {
    id: row.cfm_paymenttermid,
    name: row.cfm_name?.trim() || '—',
    numberOfDays: Number(row.cfm_numberofdays ?? 0),
    createdBy: lookupLabel(r, 'createdbyname', '_createdby_value'),
    createdOn: row.createdon || '',
  };
}

export function fmtCreatedOn(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
