import styles from '../shared.module.css';
import type { PageSize } from '../types';

const PAGE_SIZE_OPTIONS: PageSize[] = [15, 25, 50, 100, 'all'];

interface PaginationProps {
  page: number;
  pageSize: PageSize;
  totalRows: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSize) => void;
}

type PageToken = number | '...';

function buildPageList(current: number, totalPages: number): PageToken[] {
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

export function Pagination({ page, pageSize, totalRows, onPageChange, onPageSizeChange }: PaginationProps) {
  if (!totalRows) return null;

  const size = pageSize === 'all' ? totalRows : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalRows / size));
  const startIdx = (page - 1) * size + 1;
  const endIdx = Math.min(page * size, totalRows);
  const atFirst = page === 1;
  const atLast = page === totalPages;
  const pages = buildPageList(page, totalPages);

  return (
    <div className={styles.tblPagination}>
      <div className={styles.pageSizeGroup}>
        <span>Rows per page:</span>
        <span className={styles.pageSizeWrap}>
          <select
            className={styles.pageSizeSelect}
            value={String(pageSize)}
            onChange={(e) => onPageSizeChange(e.target.value === 'all' ? 'all' : (Number(e.target.value) as PageSize))}
          >
            {PAGE_SIZE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt === 'all' ? 'All' : opt}
              </option>
            ))}
          </select>
        </span>
      </div>

      <div className={styles.pageInfo}>
        Showing <strong>{startIdx}</strong>–<strong>{endIdx}</strong> of <strong>{totalRows}</strong>
      </div>

      <div className={styles.pageNav}>
        <button className={styles.pageBtn} disabled={atFirst} title="First page" onClick={() => onPageChange(1)}>
          <i className="fa-solid fa-angles-left" />
        </button>
        <button
          className={styles.pageBtn}
          disabled={atFirst}
          title="Previous"
          onClick={() => onPageChange(page - 1)}
        >
          <i className="fa-solid fa-angle-left" />
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className={`${styles.pageBtn} ${styles.pageBtnEllipsis}`}>
              …
            </span>
          ) : (
            <button
              key={p}
              className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          )
        )}
        <button className={styles.pageBtn} disabled={atLast} title="Next" onClick={() => onPageChange(page + 1)}>
          <i className="fa-solid fa-angle-right" />
        </button>
        <button
          className={styles.pageBtn}
          disabled={atLast}
          title="Last page"
          onClick={() => onPageChange(totalPages)}
        >
          <i className="fa-solid fa-angles-right" />
        </button>
      </div>
    </div>
  );
}
