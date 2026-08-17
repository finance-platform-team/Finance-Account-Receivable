/**
 * Label-resolution helpers shared by every feature that reads Dataverse choice
 * lookup columns. Resolution order:
 *   1. the generated "<field>name" property (populated by the platform for the
 *      lookups/choices selected on the table)
 *   2. the raw `@OData.Community.Display.V1.FormattedValue` annotation, in case a
 *      given deployment doesn't surface the "<field>name" property
 *   3. for choice fields, an authoritative enum from the generated model, passed
 *      in by the caller (never a hardcoded guess)
 */

export type AnnotatedRow = Record<string, unknown>;

export function annotatedValue(row: AnnotatedRow, valueField: string): string | undefined {
  const raw = row[`${valueField}@OData.Community.Display.V1.FormattedValue`];
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

export function namedValue(row: AnnotatedRow, nameField: string): string | undefined {
  const raw = row[nameField];
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

export function choiceLabel(
  row: AnnotatedRow,
  field: string,
  nameField: string,
  enumMap: Record<string, string>
): string {
  const named = namedValue(row, nameField);
  if (named) return named;

  const annotated = annotatedValue(row, field);
  if (annotated) return annotated;

  const raw = row[field];
  if (typeof raw === 'number' || typeof raw === 'string') {
    const label = enumMap[String(raw)];
    if (label) return label.trim();
  }
  return '—';
}

export function lookupLabel(row: AnnotatedRow, nameField: string, valueField: string): string {
  return namedValue(row, nameField) ?? annotatedValue(row, valueField) ?? '—';
}

export const fmt = (v: number): string => (v ? v.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—');
export const fmtTotal = (v: number): string => v.toLocaleString('en-US', { maximumFractionDigits: 0 });

export function escODataString(value: string): string {
  return value.replace(/'/g, "''");
}
