interface MutedDashProps {
  value: string | number | null | undefined;
}

/** Renders a value, or a muted em dash when it's empty/missing — never a blank cell. */
export function MutedDash({ value }: MutedDashProps) {
  if (value === null || value === undefined || value === '' || value === '—') {
    return <span style={{ color: 'var(--muted)' }}>—</span>;
  }
  return <>{value}</>;
}
