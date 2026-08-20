import { useState } from 'react';
import type { CSSProperties } from 'react';
import { AR_REVIEW_OPTIONS, CATEGORY_CHIP_LABELS } from '../normalize';

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  arReview: string;
  onArReviewChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  showing: number;
  total: number;
}

function chipStyle(active: boolean, hovered: boolean): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 44,
    padding: '6px 15px',
    boxSizing: 'border-box',
    borderRadius: 999,
    fontFamily: "'Outfit',sans-serif",
    fontWeight: 600,
    fontSize: 11,
    border: `1px solid ${active ? 'var(--brown)' : hovered ? 'var(--gold)' : 'var(--line)'}`,
    background: active ? 'var(--brown)' : 'var(--card)',
    color: active ? '#fff' : 'var(--ink)',
    cursor: 'pointer',
    transition: '.15s',
  };
}

export function FilterBar({
  search,
  onSearchChange,
  arReview,
  onArReviewChange,
  category,
  onCategoryChange,
  showing,
  total,
}: FilterBarProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <>
      <div className="acc-search">
        <i className="fa-solid fa-magnifying-glass" />
        <input
          type="text"
          placeholder="Search code, company, agreement…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <select className="acc-f" value={arReview} onChange={(e) => onArReviewChange(e.target.value)}>
        <option value="">AR Review: All</option>
        {AR_REVIEW_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.label}>
            {opt.label}
          </option>
        ))}
      </select>
      <span style={{ fontSize: 12.5, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
        Showing <strong style={{ color: 'var(--ink)' }}>{showing}</strong> of{' '}
        <strong style={{ color: 'var(--ink)' }}>{total}</strong>
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', width: '100%' }}>
        <span
          style={{
            fontFamily: "'Outfit',sans-serif",
            fontWeight: 700,
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '.05em',
            color: 'var(--muted)',
            marginRight: 2,
          }}
        >
          Category
        </span>
        {CATEGORY_CHIP_LABELS.map((label) => (
          <button
            key={label}
            style={chipStyle(category === label, hovered === label)}
            onMouseEnter={() => setHovered(label)}
            onMouseLeave={() => setHovered((cur) => (cur === label ? null : cur))}
            onClick={() => onCategoryChange(label)}
          >
            {label}
          </button>
        ))}
      </div>
    </>
  );
}
