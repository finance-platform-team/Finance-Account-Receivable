import { COMPANY_TYPE_OPTIONS, CUSTOMER_CLASS_OPTIONS } from '../normalize';

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  bu: string;
  onBuChange: (value: string) => void;
  buOptions: string[];
  companyType: string;
  onCompanyTypeChange: (value: string) => void;
  customerClass: string;
  onCustomerClassChange: (value: string) => void;
  onClear: () => void;
  showing: number;
  total: number;
}

export function FilterBar({
  search,
  onSearchChange,
  bu,
  onBuChange,
  buOptions,
  companyType,
  onCompanyTypeChange,
  customerClass,
  onCustomerClassChange,
  onClear,
  showing,
  total,
}: FilterBarProps) {
  return (
    <div className="tbl-hdr">
      <div className="acc-search">
        <i className="fa-solid fa-magnifying-glass" />
        <input
          placeholder="Filter by keyword…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <select className="acc-f" value={bu} onChange={(e) => onBuChange(e.target.value)}>
        <option value="">All BUs</option>
        {buOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <select className="acc-f" value={companyType} onChange={(e) => onCompanyTypeChange(e.target.value)}>
        <option value="">All Company Types</option>
        {COMPANY_TYPE_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <select className="acc-f" value={customerClass} onChange={(e) => onCustomerClassChange(e.target.value)}>
        <option value="">All Classes</option>
        {CUSTOMER_CLASS_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <button className="acc-btn" onClick={onClear}>
        <i className="fa-solid fa-xmark" /> Clear
      </button>

      <span style={{ fontSize: 12.5, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
        Showing <strong style={{ color: 'var(--ink)' }}>{showing}</strong> of{' '}
        <strong style={{ color: 'var(--ink)' }}>{total}</strong>
      </span>
    </div>
  );
}
