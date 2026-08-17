import { buildPageList } from '../../../shared/pageList';

export const AUDIT_PAGE_SIZE = 25;

interface AuditPaginationProps {
  page: number;
  totalRows: number;
  onPageChange: (page: number) => void;
}

// The Audit tab's page size is fixed (no page-size selector, unlike the Plan
// tab's shared Pagination component), and pagination is hidden entirely in
// grouped view — so this stays a small bespoke component, hand-restyled to
// the same .acc-foot/.acc-pg shape as shared/components/Pagination.tsx.
export function AuditPagination({ page, totalRows, onPageChange }: AuditPaginationProps) {
  if (!totalRows) return null;

  const totalPages = Math.max(1, Math.ceil(totalRows / AUDIT_PAGE_SIZE));
  const atFirst = page === 1;
  const atLast = page === totalPages;
  const pages = buildPageList(page, totalPages);

  return (
    <div className="acc-foot">
      <span>{totalRows.toLocaleString('en-US')} changes</span>
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
    </div>
  );
}
