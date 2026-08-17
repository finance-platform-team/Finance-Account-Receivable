interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  entity: string;
  onEntityChange: (value: string) => void;
  entityOptions: string[];
  method: string;
  onMethodChange: (value: string) => void;
  methodOptions: string[];
  status: string;
  onStatusChange: (value: string) => void;
  statusOptions: string[];
  onClear: () => void;
  onReload: () => void;
  showing: number;
  total: number;
}

export function FilterBar({
  search,
  onSearchChange,
  entity,
  onEntityChange,
  entityOptions,
  method,
  onMethodChange,
  methodOptions,
  status,
  onStatusChange,
  statusOptions,
  onClear,
  onReload,
  showing,
  total,
}: FilterBarProps) {
  return (
    <div className="tbl-hdr">
      <div className="acc-search">
        <i className="fa-solid fa-magnifying-glass" />
        <input
          type="text"
          placeholder="Search company, code, ref…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <select className="acc-f" value={entity} onChange={(e) => onEntityChange(e.target.value)}>
        <option value="">All Entities</option>
        {entityOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <select className="acc-f" value={method} onChange={(e) => onMethodChange(e.target.value)}>
        <option value="">All Methods</option>
        {methodOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <select className="acc-f" value={status} onChange={(e) => onStatusChange(e.target.value)}>
        <option value="">All Statuses</option>
        {statusOptions.map((option) => (
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
        <strong style={{ color: 'var(--brown)' }}>{total}</strong> entries
      </span>

      <button className="acc-btn" onClick={onReload}>
        <i className="fa-solid fa-rotate" /> Reload
      </button>
    </div>
  );
}
