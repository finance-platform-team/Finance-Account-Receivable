import { COMPANY_TYPE_OPTIONS, CUSTOMER_CLASS_OPTIONS } from '../normalize';

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  bu: string;
  onBuChange: (value: string) => void;
  buOptions: string[];
  paymentTerm: string;
  onPaymentTermChange: (value: string) => void;
  paymentTermOptions: string[];
  customerClass: string;
  onCustomerClassChange: (value: string) => void;
  companyType: string;
  onCompanyTypeChange: (value: string) => void;
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
  paymentTerm,
  onPaymentTermChange,
  paymentTermOptions,
  customerClass,
  onCustomerClassChange,
  companyType,
  onCompanyTypeChange,
  onClear,
  showing,
  total,
}: FilterBarProps) {
  return (
    <>
      <div className="acc-search">
        <i className="fa-solid fa-magnifying-glass" />
        <input
          placeholder="Search company, code, owner…"
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

      <select className="acc-f" value={paymentTerm} onChange={(e) => onPaymentTermChange(e.target.value)}>
        <option value="">All Payments</option>
        {paymentTermOptions.map((option) => (
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

      <select className="acc-f" value={companyType} onChange={(e) => onCompanyTypeChange(e.target.value)}>
        <option value="">All Company Types</option>
        {COMPANY_TYPE_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <button className="acc-btn acc-btn-ghost" onClick={onClear}>
        <i className="fa-solid fa-xmark" /> Clear
      </button>

      <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 12.5, whiteSpace: 'nowrap' }}>
        Showing <strong style={{ color: 'var(--brown)' }}>{showing}</strong> of{' '}
        <strong style={{ color: 'var(--brown)' }}>{total}</strong> companies
      </span>
    </>
  );
}
