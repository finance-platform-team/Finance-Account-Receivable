import { useEffect, useState } from 'react';
import { BuCombo } from '../../../shared/components/BuCombo';
import { COMPANY_TYPE_VALUE_OPTIONS, CUSTOMER_CLASS_VALUE_OPTIONS } from '../normalize';
import type { BuOption, BusinessPartnerRow, PartnerFormInput } from '../types';

interface PaymentTermOption {
  id: string;
  name: string;
}

interface PartnerFormModalProps {
  open: boolean;
  editing: BusinessPartnerRow | null;
  submitting: boolean;
  paymentTermOptions: PaymentTermOption[];
  onClose: () => void;
  onSubmit: (input: PartnerFormInput) => Promise<void>;
}

export function PartnerFormModal({
  open,
  editing,
  submitting,
  paymentTermOptions,
  onClose,
  onSubmit,
}: PartnerFormModalProps) {
  const [name, setName] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [companyTypeValue, setCompanyTypeValue] = useState('');
  const [customerClassValue, setCustomerClassValue] = useState('');
  const [paymentTermId, setPaymentTermId] = useState('');
  const [bu, setBu] = useState<BuOption | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(editing?.name ?? '');
      setCompanyCode(editing?.companyCode === '—' ? '' : (editing?.companyCode ?? ''));
      setCompanyTypeValue(editing?.companyTypeValue != null ? String(editing.companyTypeValue) : '');
      setCustomerClassValue(editing?.customerClassValue != null ? String(editing.customerClassValue) : '');
      setPaymentTermId(editing?.paymentTermId ?? '');
      setBu(editing?.buId ? { id: editing.buId, name: editing.bu } : null);
      setError('');
    }
  }, [open, editing]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const isEdit = editing !== null;

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedCode = companyCode.trim();
    if (!trimmedName) {
      setError('Enter a name.');
      return;
    }
    if (!trimmedCode) {
      setError('Enter a company code.');
      return;
    }
    if (!bu) {
      setError('Search and select a Business Unit.');
      return;
    }
    setError('');
    await onSubmit({
      name: trimmedName,
      companyCode: trimmedCode,
      companyTypeValue: companyTypeValue === '' ? null : Number(companyTypeValue),
      customerClassValue: customerClassValue === '' ? null : Number(customerClassValue),
      paymentTermId: paymentTermId === '' ? null : paymentTermId,
      buId: bu.id,
      buName: bu.name,
    });
  };

  return (
    <>
      <div className={`acc-scrim${open ? ' on' : ''}`} onClick={onClose} />
      <aside className={`acc-drawer${open ? ' on' : ''}`}>
        <div className="acc-dhead">
          <h2>
            <i
              className={`fa-solid ${isEdit ? 'fa-pen' : 'fa-plus'}`}
              style={{ color: 'var(--gold)', fontSize: 16 }}
            />
            {isEdit ? 'Edit Business Partner' : 'New Business Partner'}
          </h2>
          <button className="acc-dclose" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="acc-dbody">
          <div className={`acc-err${error ? ' on' : ''}`}>{error}</div>

          <div className="acc-fld">
            <label>Name</label>
            <input placeholder="Company name" value={name} onChange={(e) => setName(e.target.value)} dir="auto" />
          </div>

          <div className="acc-fld">
            <label>Company Code</label>
            <input placeholder="e.g. 116" value={companyCode} onChange={(e) => setCompanyCode(e.target.value)} />
          </div>

          <div className="acc-fld">
            <label>Company Type</label>
            <select value={companyTypeValue} onChange={(e) => setCompanyTypeValue(e.target.value)}>
              <option value="">—</option>
              {COMPANY_TYPE_VALUE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="acc-fld">
            <label>Customer Class</label>
            <select value={customerClassValue} onChange={(e) => setCustomerClassValue(e.target.value)}>
              <option value="">—</option>
              {CUSTOMER_CLASS_VALUE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="acc-fld">
            <label>Payment Term</label>
            <select value={paymentTermId} onChange={(e) => setPaymentTermId(e.target.value)}>
              <option value="">—</option>
              {paymentTermOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          <div className="acc-fld">
            <label>Business Unit</label>
            <BuCombo valueLabel={bu?.name ?? ''} onChange={setBu} />
          </div>
        </div>
        <div className="acc-dfoot">
          <button className="acc-btn acc-btn-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="acc-btn acc-btn-primary" disabled={submitting} onClick={handleSubmit}>
            {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create'}
          </button>
        </div>
      </aside>
    </>
  );
}
