import { useEffect, useRef, useState } from 'react';
import { CATEGORY_OPTIONS, escODataString } from '../normalize';
import { Cfm_insurancecompaniesService } from '../../../generated/services/Cfm_insurancecompaniesService';
import type { CompanySearchResult, NewDisputeInput } from '../types';

interface NewDisputeDrawerProps {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (input: NewDisputeInput) => Promise<void>;
}

function currentMonthValue(): string {
  return new Date().toISOString().slice(0, 7);
}

export function NewDisputeDrawer({ open, submitting, onClose, onSubmit }: NewDisputeDrawerProps) {
  const [code, setCode] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [matchedCompanyId, setMatchedCompanyId] = useState<string | null>(null);
  const [category, setCategory] = useState<number>(2);
  const [amount, setAmount] = useState('');
  const [dueMonth, setDueMonth] = useState(currentMonthValue());
  const [results, setResults] = useState<CompanySearchResult[]>([]);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<number | undefined>(undefined);
  const skipBlurRef = useRef(false);
  const requestToken = useRef(0);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCode('');
      setCompanyName('');
      setMatchedCompanyId(null);
      setCategory(2);
      setAmount('');
      setDueMonth(currentMonthValue());
      setResults([]);
      setResultsOpen(false);
    }
  }, [open]);

  const runSearch = (term: string) => {
    const token = ++requestToken.current;
    setSearching(true);
    setResultsOpen(true);
    Cfm_insurancecompaniesService.getAll({
      filter: `startswith(cfm_code,'${escODataString(term)}')`,
      top: 8,
    })
      .then((result) => {
        if (token !== requestToken.current) return;
        if (!result.success) {
          setResults([]);
          return;
        }
        setResults(
          (result.data ?? []).map((rec) => ({
            id: rec.cfm_insurancecompanyid,
            code: rec.cfm_code || '—',
            name: rec.cfm_name || rec.cfm_companyname || '',
            cls: rec.cfm_butext || '',
          }))
        );
      })
      .catch(() => {
        if (token === requestToken.current) setResults([]);
      })
      .finally(() => {
        if (token === requestToken.current) setSearching(false);
      });
  };

  const handleCodeInput = (value: string) => {
    setCode(value);
    setMatchedCompanyId(null);
    setCompanyName('');
    window.clearTimeout(searchTimer.current);
    const term = value.trim();
    if (!term) {
      setResults([]);
      setResultsOpen(false);
      return;
    }
    searchTimer.current = window.setTimeout(() => runSearch(term), 300);
  };

  const pickCompany = (r: CompanySearchResult) => {
    setCode(r.code);
    setCompanyName(r.name);
    setMatchedCompanyId(r.id);
    setResultsOpen(false);
    setResults([]);
  };

  const handleSubmit = async () => {
    await onSubmit({
      code: code.trim(),
      companyName: companyName.trim(),
      companyId: matchedCompanyId,
      categoryValue: category,
      amount: amount === '' ? null : Number(amount),
      dueMonth,
    });
  };

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <>
      <div className={`acc-scrim${open ? ' on' : ''}`} onClick={onClose} />
      <aside className={`acc-drawer${open ? ' on' : ''}`}>
        <div className="acc-dhead">
          <h2>
            <i className="fa-solid fa-plus" style={{ color: 'var(--gold)', fontSize: 16 }} />
            New Dispute
          </h2>
          <button className="acc-dclose" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="acc-dbody">
          <div className="acc-fld">
            <label>
              Code <span style={{ fontWeight: 400, color: 'var(--muted)', textTransform: 'none' }}>— type a code to search</span>
            </label>
            <div className="acc-combo">
              <input
                placeholder="Type a company code…"
                autoComplete="off"
                value={code}
                onChange={(e) => handleCodeInput(e.target.value)}
                onFocus={() => code.trim() && setResultsOpen(true)}
                onBlur={() => {
                  if (skipBlurRef.current) {
                    skipBlurRef.current = false;
                    return;
                  }
                  window.setTimeout(() => setResultsOpen(false), 120);
                }}
              />
              {resultsOpen && (
                <div className="acc-combo-list">
                  {searching ? (
                    <div className="acc-combo-empty">
                      <i className="fa-solid fa-spinner fa-spin" /> Searching…
                    </div>
                  ) : results.length === 0 ? (
                    <div className="acc-combo-empty">No matches — refine your search.</div>
                  ) : (
                    results.map((r) => (
                      <div
                        key={r.id}
                        className="acc-combo-item"
                        onMouseDown={() => {
                          skipBlurRef.current = true;
                          pickCompany(r);
                        }}
                      >
                        <span className="acc-code">{r.code}</span> <span dir="auto">{r.name}</span>
                        {r.cls && <small>{r.cls}</small>}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="acc-fld">
            <label>Company</label>
            <div className="acc-ro-wrap">
              <div className="acc-ro-label">Auto-filled from selection</div>
              <div className="acc-ro-value">{companyName || '—'}</div>
            </div>
          </div>

          <div className="acc-fld">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(Number(e.target.value))}>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="acc-fld">
            <label>Amount</label>
            <input type="number" placeholder="100000" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>

          <div className="acc-fld">
            <label>Due (Month / Year)</label>
            <input type="month" value={dueMonth} onChange={(e) => setDueMonth(e.target.value)} />
          </div>

          <div className="acc-hint">
            <i className="fa-solid fa-circle-info" /> Saving triggers AR Verification &amp; confirmation.
          </div>
        </div>
        <div className="acc-dfoot">
          <button className="acc-btn acc-btn-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="acc-btn acc-btn-primary" disabled={submitting} onClick={handleSubmit}>
            {submitting ? (
              'Saving…'
            ) : (
              <>
                <i className="fa-solid fa-circle-check" /> Create &amp; Trigger AR
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
