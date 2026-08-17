import { useEffect } from 'react';
import { useRegion } from '../../shared/regionContext';
import { REGION_OPTIONS } from '../../shared/region';

export function RegionPickerModal() {
  const { region, pickerOpen, setRegion, closePicker } = useRegion();
  // Once a region is already stored, reopening the picker (from a page's
  // acc-actions) is a dismissable reselection; the very first, forced choice
  // has no way out.
  const dismissable = region !== null;

  useEffect(() => {
    if (!pickerOpen || !dismissable) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePicker();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [pickerOpen, dismissable, closePicker]);

  return (
    <>
      <div className={`acc-scrim${pickerOpen ? ' on' : ''}`} onClick={dismissable ? closePicker : undefined} />
      <aside className={`acc-drawer${pickerOpen ? ' on' : ''}`}>
        <div className="acc-dhead">
          <h2>
            <i className="fa-solid fa-globe" style={{ color: 'var(--gold)', fontSize: 16 }} /> Select Your Region
          </h2>
          {dismissable && (
            <button className="acc-dclose" onClick={closePicker} aria-label="Close">
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>
        <div className="acc-dbody">
          <div className="acc-hint" style={{ marginBottom: 16 }}>
            This sets your default region across the app. You can change it anytime from the region button on any
            page.
          </div>
          {REGION_OPTIONS.map((opt) => {
            const active = region === opt.region;
            return (
              <button
                key={opt.region}
                onClick={() => setRegion(opt.region)}
                className="acc-btn"
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  padding: '14px 16px',
                  marginBottom: 10,
                  gap: 12,
                  ...(active ? { borderColor: 'var(--gold)', background: 'var(--goldbg)' } : {}),
                }}
              >
                <span
                  className={`acc-cls ${opt.region === 'KSA' ? 'acc-cls-gold' : 'acc-cls-info'}`}
                  style={{ width: 36, height: 36, borderRadius: 9, fontSize: 11, flexShrink: 0 }}
                >
                  {opt.code}
                </span>
                <span style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                  <div className="acc-name">{opt.name}</div>
                  <small
                    style={{
                      color: 'var(--muted)',
                      fontFamily: "'JetBrains Mono',monospace",
                      display: 'block',
                      marginTop: 2,
                    }}
                  >
                    {opt.sub}
                  </small>
                </span>
                <i className="fa-solid fa-chevron-right" style={{ color: 'var(--muted)' }} />
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
}
