import { buildPageList } from '../pageList';
import type { PageSize } from '../types';

const PAGE_SIZE_OPTIONS: PageSize[] = [15, 25, 50, 100, 'all'];

interface PaginationProps {
  page: number;
  pageSize: PageSize;
  totalRows: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSize) => void;
}

export function Pagination({
  page,
  pageSize,
  totalRows,
  itemLabel = 'rows',
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  if (!totalRows) return null;

  const size = pageSize === 'all' ? totalRows : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalRows / size));
  const atFirst = page === 1;
  const atLast = page === totalPages;
  const pages = buildPageList(page, totalPages);

  return (
    <div className="acc-foot">
      <span>
        {totalRows.toLocaleString('en-US')} {itemLabel}
      </span>
      <div className="acc-pg">
        <button disabled={atFirst} onClick={() => onPageChange(page - 1)}>
          ‹
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} style={{ padding: '0 4px' }}>
              …
            </span>
          ) : (
            <button key={p} className={p === page ? 'active' : ''} onClick={() => onPageChange(p)}>
              {p}
            </button>
          )
        )}
        <button disabled={atLast} onClick={() => onPageChange(page + 1)}>
          ›
        </button>
      </div>
      <select
        className="acc-f"
        style={{ minWidth: 90 }}
        value={String(pageSize)}
        onChange={(e) => onPageSizeChange(e.target.value === 'all' ? 'all' : (Number(e.target.value) as PageSize))}
      >
        {PAGE_SIZE_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt === 'all' ? 'All' : opt}
          </option>
        ))}
      </select>
    </div>
  );
}
