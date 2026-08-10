import styles from '../CollectionPlan.module.css';
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
    <div className={styles.tblHdrRow}>
      <div className={styles.filterInlineBar}>
        <div className={styles.filterInlineSearch}>
          <i className="fa-solid fa-magnifying-glass" />
          <input
            type="text"
            placeholder="Search company, code, owner…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className={styles.selectWrap}>
          <i className={`fa-solid fa-building ${styles.selectIcon}`} />
          <select className={styles.fieldInput} value={bu} onChange={(e) => onBuChange(e.target.value)}>
            <option value="">All BUs</option>
            {buOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className={styles.selArrow}>
            <i className="fa-solid fa-chevron-down" />
          </span>
        </div>

        <div className={styles.selectWrap}>
          <i className={`fa-solid fa-calendar-check ${styles.selectIcon}`} />
          <select
            className={styles.fieldInput}
            value={paymentTerm}
            onChange={(e) => onPaymentTermChange(e.target.value)}
          >
            <option value="">All Payments</option>
            {paymentTermOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className={styles.selArrow}>
            <i className="fa-solid fa-chevron-down" />
          </span>
        </div>

        <div className={styles.selectWrap}>
          <i className={`fa-solid fa-tags ${styles.selectIcon}`} />
          <select
            className={styles.fieldInput}
            value={customerClass}
            onChange={(e) => onCustomerClassChange(e.target.value)}
          >
            <option value="">All Classes</option>
            {CUSTOMER_CLASS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className={styles.selArrow}>
            <i className="fa-solid fa-chevron-down" />
          </span>
        </div>

        <div className={styles.selectWrap}>
          <i className={`fa-solid fa-layer-group ${styles.selectIcon}`} />
          <select
            className={styles.fieldInput}
            value={companyType}
            onChange={(e) => onCompanyTypeChange(e.target.value)}
          >
            <option value="">All Company Types</option>
            {COMPANY_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className={styles.selArrow}>
            <i className="fa-solid fa-chevron-down" />
          </span>
        </div>

        <button className={styles.filterClear} onClick={onClear}>
          <i className="fa-solid fa-xmark" /> Clear
        </button>
      </div>

      <div className={styles.tblCount}>
        <i className="fa-solid fa-table" />
        Showing <strong>{showing}</strong> of <strong>{total}</strong> companies
      </div>
    </div>
  );
}
