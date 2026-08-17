import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { SystemusersService } from '../../generated/services/SystemusersService';
import { escODataString } from '../dataverseLabels';

export interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface UserComboProps {
  valueLabel: string;
  onChange: (option: UserOption) => void;
  placeholder?: string;
}

export function UserCombo({ valueLabel, onChange, placeholder }: UserComboProps) {
  const [term, setTerm] = useState(valueLabel);
  const [results, setResults] = useState<UserOption[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [hiIndex, setHiIndex] = useState(-1);
  const searchTimer = useRef<number | undefined>(undefined);
  const skipBlurRef = useRef(false);
  const requestToken = useRef(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTerm(valueLabel);
  }, [valueLabel]);

  const runSearch = (q: string) => {
    const token = ++requestToken.current;
    setSearching(true);
    setOpen(true);
    // `fullname` is a calculated column on systemuser and isn't filterable/sortable
    // via OData in most Dataverse orgs — search/sort on the real stored fields instead.
    const esc = escODataString(q);
    SystemusersService.getAll({
      filter: `isdisabled eq false and (contains(firstname,'${esc}') or contains(lastname,'${esc}') or contains(internalemailaddress,'${esc}'))`,
      top: 8,
      orderBy: ['firstname asc', 'lastname asc'],
    })
      .then((result) => {
        if (token !== requestToken.current) return;
        if (!result.success) {
          console.error('UserCombo: systemusers search failed', result.error);
          setResults([]);
          return;
        }
        setResults(
          (result.data ?? []).map((rec) => ({
            id: rec.systemuserid,
            name: rec.fullname || `${rec.firstname ?? ''} ${rec.lastname ?? ''}`.trim() || '—',
            email: rec.internalemailaddress || '',
          }))
        );
        setHiIndex(-1);
      })
      .catch((err) => {
        console.error('UserCombo: systemusers search threw', err);
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

  const pick = (opt: UserOption) => {
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
        placeholder={placeholder ?? 'Search for a user…'}
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
                {r.email && <small>{r.email}</small>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
