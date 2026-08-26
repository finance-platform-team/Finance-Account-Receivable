// Shared CSV export helper. A UTF-8 BOM is required or Excel misreads the
// file as ANSI, mangling both the "—" placeholder and any Arabic text into
// mojibake (e.g. "â€"" ). Blank/placeholder cells are written as empty
// rather than as the "—" the UI shows for missing data.

function csvCell(value: string | number | null | undefined): string {
  if (value == null) return '';
  const s = String(value).trim();
  if (!s || s === '—') return '';
  return `"${s.replace(/"/g, '""')}"`;
}

const UTF8_BOM = String.fromCharCode(0xfeff);

export function downloadCsv(filename: string, columns: string[], rows: (string | number | null | undefined)[][]): void {
  const lines = [columns.map(csvCell).join(',')].concat(rows.map((row) => row.map(csvCell).join(',')));
  const blob = new Blob([UTF8_BOM + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
