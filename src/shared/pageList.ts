export type PageToken = number | '...';

export function buildPageList(current: number, totalPages: number): PageToken[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: PageToken[] = [1];
  if (current > 4) pages.push('...');
  const from = Math.max(2, current - 1);
  const to = Math.min(totalPages - 1, current + 1);
  for (let i = from; i <= to; i++) pages.push(i);
  if (current < totalPages - 3) pages.push('...');
  pages.push(totalPages);
  return pages;
}
