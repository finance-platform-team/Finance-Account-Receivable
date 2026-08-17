import { useEffect, useState } from 'react';
import { BuCombo } from '../../../shared/components/BuCombo';
import { COMPANY_TYPE_VALUE_OPTIONS, CUSTOMER_CLASS_VALUE_OPTIONS } from '../normalize';
import type { BulkEditInput, BuOption } from '../types';

interface PaymentTermOption {
  id: string;
  name: string;
}

interface BulkEditModalProps {
  open: boolean;
  count: number;
  submitting: boolean;
  paymentTermOptions: PaymentTermOption[];
  onClose: () => void;
  onSubmit: (input: BulkEditInput) => Promise<void>;
}

export function BulkEditModal({ open, count, submitting, paymentTermOptions, onClose, onSubmit }: BulkEditModalProps) {
  const [companyTypeOn, setCompanyTypeOn] = useState(false);
  const [companyTypeValue, setCompanyTypeValue] = useState('');
  const [customerClassOn, setCustomerClassOn] = useState(false);
  const [customerClassValue, setCustomerClassValue] = useState('');
  const [paymentTermOn, setPaymentTermOn] = useState(false);
  const [paymentTermId, setPaymentTermId] = useState('');
  const [buOn, setBuOn] = useState(false);
  const [bu, setBu] = useState<BuOption | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCompanyTypeOn(false);
      setCompanyTypeValue('');
      setCustomerClassOn(false);
      setCustomerClassValue('');
      setPaymentTermOn(false);
      setPaymentTermId('');
      setBuOn(false);
      setBu(null);
      setError('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleSubmit = async () => {
    if (!companyTypeOn && !customerClassOn && !paymentTermOn && !buOn) {
      setError('Turn on at least one field to change.');
      return;
    }
    if (buOn && !bu) {
      setError('Search and select a Business Unit, or turn that field off.');
      return;
    }
    setError('');
    const input: BulkEditInput = {};
    if (companyTypeOn) input.companyTypeValue = companyTypeValue === '' ? null : Number(companyTypeValue);
    if (customerClassOn) input.customerClassValue = customerClassValue === '' ? null : Number(customerClassValue);
    if (paymentTermOn) input.paymentTermId = paymentTermId === '' ? null : paymentTermId;
    if (buOn && bu) {
      input.buId = bu.id;
      input.buName = bu.name;
    }
    await onSubmit(input);
  };

  return (
    <>
      <div className={`acc-scrim${open ? ' on' : ''}`} onClick={onClose} />
      <aside className={`acc-drawer${open ? ' on' : ''}`}>
        <div className="acc-dhead">
          <h2>
            <i className="fa-solid fa-layer-group" style={{ color: 'var(--gold)', fontSize: 16 }} />
            Bulk Edit
          </h2>
          <button className="acc-dclose" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="acc-dbody">
          <div className={`acc-err${error ? ' on' : ''}`}>{error}</div>

          <div className="acc-hint" style={{ marginBottom: 16 }}>
            Applies to <b>{count}</b> selected business partner{count === 1 ? '' : 's'}. Turn on only the fields you
            want to change.
          </div>

          <div className="acc-fld">
            <label>
              <input
                type="checkbox"
                checked={companyTypeOn}
                onChange={(e) => setCompanyTypeOn(e.target.checked)}
                style={{ accentColor: 'var(--brown)', marginRight: 6 }}
              />
              Company Type
            </label>
            <select
              value={companyTypeValue}
              disabled={!companyTypeOn}
              onChange={(e) => setCompanyTypeValue(e.target.value)}
            >
              <option value="">— (clear)</option>
              {COMPANY_TYPE_VALUE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="acc-fld">
            <label>
              <input
                type="checkbox"
                checked={customerClassOn}
                onChange={(e) => setCustomerClassOn(e.target.checked)}
                style={{ accentColor: 'var(--brown)', marginRight: 6 }}
              />
              Customer Class
            </label>
            <select
              value={customerClassValue}
              disabled={!customerClassOn}
              onChange={(e) => setCustomerClassValue(e.target.value)}
            >
              <option value="">— (clear)</option>
              {CUSTOMER_CLASS_VALUE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="acc-fld">
            <label>
              <input
                type="checkbox"
                checked={paymentTermOn}
                onChange={(e) => setPaymentTermOn(e.target.checked)}
                style={{ accentColor: 'var(--brown)', marginRight: 6 }}
              />
              Payment Term
            </label>
            <select
              value={paymentTermId}
              disabled={!paymentTermOn}
              onChange={(e) => setPaymentTermId(e.target.value)}
            >
              <option value="">— (clear)</option>
              {paymentTermOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          <div className="acc-fld">
            <label>
              <input
                type="checkbox"
                checked={buOn}
                onChange={(e) => setBuOn(e.target.checked)}
                style={{ accentColor: 'var(--brown)', marginRight: 6 }}
              />
              Business Unit
            </label>
            {buOn ? (
              <BuCombo valueLabel={bu?.name ?? ''} onChange={setBu} />
            ) : (
              <input value="" disabled placeholder="Off" />
            )}
          </div>
        </div>
        <div className="acc-dfoot">
          <button className="acc-btn acc-btn-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="acc-btn acc-btn-primary" disabled={submitting} onClick={handleSubmit}>
            {submitting ? 'Updating…' : `Apply to ${count}`}
          </button>
        </div>
      </aside>
    </>
  );
}
