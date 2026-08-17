import { MutedDash } from '../../../shared/components/MutedDash';
import { fmtCreatedOn } from '../normalize';
import type { BusinessPartnerRow } from '../types';

const COLUMN_COUNT = 9;

interface PartnersTableProps {
  rows: BusinessPartnerRow[];
  loading: boolean;
  error: string | null;
  selected: Set<string>;
  onToggleSelect: (id: string, checked: boolean) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onEdit: (row: BusinessPartnerRow) => void;
}

export function PartnersTable({
  rows,
  loading,
  error,
  selected,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
}: PartnersTableProps) {
  const allSelectedOnPage = rows.length > 0 && rows.every((r) => selected.has(r.id));

  return (
    <div className="acc-tablewrap">
      <table>
        <thead>
          <tr>
            <th className="acc-check">
              <input
                type="checkbox"
                checked={allSelectedOnPage}
                onChange={(e) => onToggleSelectAll(e.target.checked)}
                aria-label="Select all"
              />
            </th>
            <th>Name</th>
            <th>Company Code</th>
            <th>Company Type</th>
            <th>Payment Term</th>
            <th>Customer Class</th>
            <th>BU</th>
            <th>Created By</th>
            <th>Created On</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: COLUMN_COUNT }).map((__, j) => (
                  <td key={j}>
                    <div className="acc-skel" />
                  </td>
                ))}
              </tr>
            ))
          ) : error ? (
            <tr>
              <td colSpan={COLUMN_COUNT}>
                <div className="acc-state">
                  <i className="fa-solid fa-triangle-exclamation" />
                  Couldn&apos;t load business partners.
                  <br />
                  <small>{error}</small>
                </div>
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={COLUMN_COUNT}>
                <div className="acc-state">
                  <i className="fa-solid fa-handshake" />
                  No business partners to show.
                </div>
              </td>
            </tr>
          ) : (
            rows.map((r) => {
              const isSelected = selected.has(r.id);
              return (
                <tr key={r.id} className="acc-row" onClick={() => onEdit(r)}>
                  <td className="acc-check" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => onToggleSelect(r.id, e.target.checked)}
                      aria-label={`Select ${r.name}`}
                    />
                  </td>
                  <td className="acc-name" dir="auto">
                    {r.name}
                  </td>
                  <td className="acc-code">
                    <MutedDash value={r.companyCode} />
                  </td>
                  <td>
                    <MutedDash value={r.companyType} />
                  </td>
                  <td>
                    <MutedDash value={r.paymentTerm} />
                  </td>
                  <td>
                    <MutedDash value={r.customerClass} />
                  </td>
                  <td>
                    <MutedDash value={r.bu} />
                  </td>
                  <td>
                    <MutedDash value={r.createdBy} />
                  </td>
                  <td>
                    <MutedDash value={fmtCreatedOn(r.createdOn)} />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
