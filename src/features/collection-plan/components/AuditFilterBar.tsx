import type { CSSProperties } from 'react';
import { AUDIT_FIELD_OPTIONS } from '../normalizeAudit';

interface AuditFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  field: string;
  onFieldChange: (value: string) => void;
  user: string;
  onUserChange: (value: string) => void;
  userOptions: string[];
  from: string;
  onFromChange: (value: string) => void;
  to: string;
  onToChange: (value: string) => void;
  group: boolean;
  onGroupChange: (value: boolean) => void;
  onClear: () => void;
  showing: number;
  total: number;
}

// No theme.css class targets a bare <input type="date"> or a checkbox pill,
// so these two match select.acc-f's look by hand, in tokens only.
const dateInputStyle: CSSProperties = {
  padding: '9px 12px',
  border: '1px solid var(--line)',
  borderRadius: 9,
  fontFamily: 'Inter',
  fontSize: 13,
  background: 'var(--card)',
  color: 'var(--ink)',
  cursor: 'pointer',
};

const groupToggleStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--ink)',
  cursor: 'pointer',
  padding: '9px 14px',
  border: '1px solid var(--line)',
  borderRadius: 9,
  background: 'var(--card)',
  whiteSpace: 'nowrap',
};

export function AuditFilterBar({
  search,
  onSearchChange,
  field,
  onFieldChange,
  user,
  onUserChange,
  userOptions,
  from,
  onFromChange,
  to,
  onToChange,
  group,
  onGroupChange,
  onClear,
  showing,
  total,
}: AuditFilterBarProps) {
  return (
    <>
      <div className="acc-search">
        <i className="fa-solid fa-magnifying-glass" />
        <input
          placeholder="Search company, code, or user…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <select className="acc-f" value={field} onChange={(e) => onFieldChange(e.target.value)}>
        <option value="">All Fields</option>
        {AUDIT_FIELD_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <select className="acc-f" value={user} onChange={(e) => onUserChange(e.target.value)}>
        <option value="">All Users</option>
        {userOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <input type="date" style={dateInputStyle} title="From date" value={from} onChange={(e) => onFromChange(e.target.value)} />
      <input type="date" style={dateInputStyle} title="To date" value={to} onChange={(e) => onToChange(e.target.value)} />

      <label style={groupToggleStyle}>
        <input
          type="checkbox"
          checked={group}
          onChange={(e) => onGroupChange(e.target.checked)}
          style={{ accentColor: 'var(--brown)', cursor: 'pointer' }}
        />
        Group by Company
      </label>

      <button className="acc-btn acc-btn-ghost" onClick={onClear}>
        <i className="fa-solid fa-xmark" /> Clear
      </button>

      <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 12.5, whiteSpace: 'nowrap' }}>
        Showing <strong style={{ color: 'var(--brown)' }}>{showing}</strong> of{' '}
        <strong style={{ color: 'var(--brown)' }}>{total}</strong> changes
      </span>
    </>
  );
}
