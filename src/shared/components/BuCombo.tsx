import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { BusinessunitsService } from '../../generated/services/BusinessunitsService';
import { escODataString } from '../dataverseLabels';

export interface BuOption {
  id: string;
  name: string;
}

interface BuComboProps {
  valueLabel: string;
  onChange: (option: BuOption) => void;
  placeholder?: string;
}

export function BuCombo({ valueLabel, onChange, placeholder }: BuComboProps) {
  const [term, setTerm] = useState(valueLabel);
  const [results, setResults] = useState<BuOption[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [hiIndex, setHiIndex] = useState(-1);
  const searchTimer = useRef<number | undefined>(undefined);
  const skipBlurRef = useRef(false);
  const requestToken = useRef(0);

  // Keep the visible text in sync when the selected value is set externally
  // (e.g. an edit drawer pre-filling the current Business Unit once it resolves).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTerm(valueLabel);
  }, [valueLabel]);

  const runSearch = (q: string) => {
    const token = ++requestToken.current;
    setSearching(true);
    setOpen(true);
    BusinessunitsService.getAll({
      filter: `isdisabled eq false and contains(name,'${escODataString(q)}')`,
      top: 8,
      orderBy: ['name asc'],
    })
      .then((result) => {
        if (token !== requestToken.current) return;
        if (!result.success) {
          setResults([]);
          return;
        }
        setResults((result.data ?? []).map((rec) => ({ id: rec.businessunitid, name: rec.name || '—' })));
        setHiIndex(-1);
      })
      .catch(() => {
        if (token === requestToken.current) setResults([]);
      })
      .finally(() => {
        if (token === requestToken.current) setSearching(false);
      });
  };

  const handleInput = (value: string) => {
    setTerm(value);
    setHiIndex(-1);
    window.clearTimeout(searchTimer.current);
    const q = value.trim();
    if (!q) {
      setResults([]);
      setOpen(false);
      return;
    }
    searchTimer.current = window.setTimeout(() => runSearch(q), 300);
  };

  const pick = (opt: BuOption) => {
    setTerm(opt.name);
    onChange(opt);
    setOpen(false);
    setResults([]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHiIndex((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHiIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && hiIndex >= 0) {
      e.preventDefault();
      pick(results[hiIndex]);
    }
  };

  return (
    <div className="acc-combo">
      <input
        placeholder={placeholder ?? 'Search business unit…'}
        autoComplete="off"
        value={term}
        onChange={(e) => handleInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => term.trim() && setOpen(true)}
        onBlur={() => {
          if (skipBlurRef.current) {
            skipBlurRef.current = false;
            return;
          }
          window.setTimeout(() => setOpen(false), 120);
        }}
      />
      {open && (
        <div className="acc-combo-list">
          {searching ? (
            <div className="acc-combo-empty">
              <i className="fa-solid fa-spinner fa-spin" /> Searching…
            </div>
          ) : results.length === 0 ? (
            <div className="acc-combo-empty">No matches — refine your search.</div>
          ) : (
            results.map((r, i) => (
              <div
                key={r.id}
                className={`acc-combo-item${i === hiIndex ? ' hi' : ''}`}
                onMouseDown={() => {
                  skipBlurRef.current = true;
                  pick(r);
                }}
              >
                {r.name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
