import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CSSProperties } from 'react';
import { MutedDash } from '../../../shared/components/MutedDash';
import { AR_REVIEW_OPTIONS, fmtEGP } from '../normalize';
import type { DisputeRow } from '../types';
import { Icon } from '../../../shared/components/Icon';

const COLUMN_COUNT = 10;

interface DisputeTableProps {
  rows: DisputeRow[];
  loading: boolean;
  error: string | null;
  onOpenDetail: (id: string) => void;
  onOpenProofFiles: (row: DisputeRow) => void;
  onSaveAgreement: (id: string, value: string) => Promise<void>;
  onSaveArReview: (id: string, value: number) => Promise<void>;
}

const cellControlStyle: CSSProperties = {
  width: '100%',
  minWidth: 110,
  padding: '5px 8px',
  border: '1px solid var(--line)',
  borderRadius: 7,
  fontSize: 12,
  fontFamily: 'Inter',
  background: 'var(--field-bg)',
  color: 'var(--ink)',
  boxSizing: 'border-box',
};

// Semantic tint per AR Review state — Pending/Approved/Rejected each get their
// own color pair instead of only Pending being highlighted and everything
// else falling back to the plain (harder-to-read) default control style.
const AR_REVIEW_TONE: Record<string, CSSProperties> = {
  Pending: { color: 'var(--warn)', background: 'var(--warnbg)', borderColor: 'var(--warn)' },
  Approved: { color: 'var(--ok)', background: 'var(--okbg)', borderColor: 'var(--ok)' },
  // normalize.ts trims the raw enum label ("Rejected " -> "Rejected") before it reaches this component.
  Rejected: { color: 'var(--bad)', background: 'var(--badbg)', borderColor: 'var(--bad)' },
  Reconciled: { color: 'var(--info)', background: 'var(--infobg)', borderColor: 'var(--info)' },
};

// Native <option> popups render outside the page's own dark/light theming —
// the dark-mode tint tokens above are semi-transparent and rely on
// compositing over our own dark surface, which doesn't happen inside a
// browser's native dropdown layer, so they wash out to near-unreadable.
// Options get fixed, fully-opaque colors instead (the light-mode palette,
// which reads fine as a dropdown regardless of the app's active theme).
const AR_REVIEW_OPTION_TONE: Record<string, CSSProperties> = {
  Pending: { background: '#fbeede', color: '#b06a1f' },
  Approved: { background: '#e6f3ec', color: '#2f7d5b' },
  Rejected: { background: '#f8e6e6', color: '#b03636' },
  Reconciled: { background: '#e6eef3', color: '#2f5d7d' },
};

function AgreementCell({
  row,
  onSave,
}: {
  row: DisputeRow;
  onSave: (id: string, value: string) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleBlur = () => {
    const value = inputRef.current?.value ?? '';
    if (value === row.agreement) return;
    void onSave(row.id, value);
  };

  return (
    <input
      ref={inputRef}
      style={cellControlStyle}
      placeholder="Agreement..."
      defaultValue={row.agreement}
      onClick={(e) => e.stopPropagation()}
      onBlur={handleBlur}
    />
  );
}

// Custom dropdown replacing the native <select> — native <option> popups
// can't be fully styled (the browser's own OS hover/focus highlight always
// wins over any CSS we set on the option), which reads as an inconsistent,
// unpolished flash of gray inside an otherwise color-coded control. This
// renders its menu through a portal (not absolutely positioned in-place) so
// it isn't clipped by the table's horizontal-scroll container, and floats
// above the row it belongs to via a fixed-position rect computed from the
// trigger button.
function ArReviewCell({
  row,
  onSave,
}: {
  row: DisputeRow;
  onSave: (id: string, value: number) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const tone = AR_REVIEW_TONE[row.arReview];

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    // Any scroll (the table's own horizontal scroll, or the page) or resize
    // would leave a stale menu position behind — simplest correct behavior
    // is to just close it, same as most native/portal dropdowns do.
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleKeyDown);
    const handlePointerDown = (e: MouseEvent) => {
      // The menu itself is portaled into document.body, so it's not a DOM
      // descendant of the trigger — it must be checked separately, or a
      // mousedown on an option closes the menu (unmounting it) before the
      // option's own click handler ever fires, silently dropping the pick.
      if (triggerRef.current?.contains(e.target as Node)) return;
      if (menuRef.current?.contains(e.target as Node)) return;
      close();
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [open]);

  const handleToggle = () => {
    if (saving) return;
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuRect({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 140) });
    }
    setOpen((v) => !v);
  };

  const handlePick = async (value: number) => {
    setOpen(false);
    if (value === row.arReviewValue) return;
    setSaving(true);
    try {
      await onSave(row.id, value);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={saving}
        onClick={(e) => {
          e.stopPropagation();
          handleToggle();
        }}
        style={{
          ...cellControlStyle,
          minWidth: 92,
          cursor: saving ? 'default' : 'pointer',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
          opacity: saving ? 0.6 : 1,
          ...tone,
        }}
      >
        {row.arReview}
        <i
          className="fa-solid fa-chevron-down"
          style={{ fontSize: 9, opacity: 0.75, transition: 'transform .15s', transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>
      {open &&
        menuRect &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: menuRect.top,
              left: menuRect.left,
              width: menuRect.width,
              background: 'var(--card)',
              border: '1px solid var(--line)',
              borderRadius: 9,
              boxShadow: 'var(--shadow)',
              overflow: 'hidden',
              zIndex: 1000,
            }}
          >
            {AR_REVIEW_OPTIONS.map((opt) => {
              const optTone = AR_REVIEW_OPTION_TONE[opt.label];
              const isSelected = opt.value === row.arReviewValue;
              return (
                <div
                  key={opt.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handlePick(opt.value);
                  }}
                  className="acc-status-option"
                  style={
                    {
                      '--opt-color': optTone?.color,
                      '--opt-bg': optTone?.background,
                      fontWeight: isSelected ? 700 : 600,
                    } as CSSProperties
                  }
                  data-selected={isSelected || undefined}
                >
                  {opt.label}
                  {isSelected && <Icon className="fa-solid fa-check" style={{ fontSize: 11 }} />}
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}

export function DisputeTable({
  rows,
  loading,
  error,
  onOpenDetail,
  onOpenProofFiles,
  onSaveAgreement,
  onSaveArReview,
}: DisputeTableProps) {
  return (
    <div className="acc-tablewrap">
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Company</th>
            <th className="acc-num">Amount</th>
            <th className="acc-num">Rej %</th>
            <th>Due</th>
            <th>Category</th>
            <th>Owner</th>
            <th>Proof</th>
            <th>Agreement</th>
            <th>AR Review</th>
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
                  <Icon className="fa-solid fa-triangle-exclamation" />
                  Could not load disputes.
                  <br />
                  <small>{error}</small>
                </div>
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={COLUMN_COUNT}>
                <div className="acc-state">
                  <Icon className="fa-solid fa-inbox" />
                  No disputes to show.
                </div>
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr
                key={r.id}
                className="acc-row"
                onDoubleClick={() => onOpenDetail(r.id)}
                title="Double-click for full details & history"
              >
                <td className="acc-code">{r.code}</td>
                <td className="acc-name" dir="auto">
                  {r.name}
                  {r.auto && (
                    <span
                      style={{
                        fontSize: 8,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '.05em',
                        color: 'var(--muted)',
                        background: 'var(--bg)',
                        border: '1px solid var(--line)',
                        padding: '2px 6px',
                        borderRadius: 4,
                        marginLeft: 6,
                      }}
                    >
                      AUTO
                    </span>
                  )}
                </td>
                <td className="acc-num">{fmtEGP(r.amount)}</td>
                <td
                  className="acc-num"
                  style={{ color: (r.rejPct ?? 0) >= 6 ? 'var(--bad)' : 'var(--ok)', fontWeight: 600 }}
                >
                  {r.rejPct != null ? `${r.rejPct}%` : <MutedDash value={null} />}
                </td>
                <td>
                  <MutedDash value={r.due} />
                </td>
                <td>
                  <span
                    style={{
                      display: 'inline-block',
                      background: 'var(--goldbg)',
                      color: 'var(--brown)',
                      fontWeight: 700,
                      fontSize: 11,
                      padding: '4px 10px',
                      borderRadius: 999,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {r.category}
                  </span>
                </td>
                <td dir="auto">
                  <MutedDash value={r.owner} />
                </td>
                <td>
                  {r.proof ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenProofFiles(r);
                      }}
                      className="acc-btn"
                      style={{
                        background: 'var(--goldbg)',
                        borderColor: 'var(--gold)',
                        color: 'var(--brown)',
                        padding: '5px 10px',
                        fontSize: 12,
                      }}
                    >
                      <Icon className="fa-solid fa-folder-open" /> View files
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenProofFiles(r);
                      }}
                      className="acc-btn"
                      style={{ padding: '5px 10px', fontSize: 12 }}
                    >
                      <Icon className="fa-solid fa-upload" /> Upload
                    </button>
                  )}
                </td>
                <td>
                  <AgreementCell row={r} onSave={onSaveAgreement} />
                </td>
                <td>
                  <ArReviewCell row={r} onSave={onSaveArReview} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
