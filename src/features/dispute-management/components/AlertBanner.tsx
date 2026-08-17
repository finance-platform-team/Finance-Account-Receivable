import { useState } from 'react';
import type { CSSProperties } from 'react';
import { fmtEGP } from '../normalize';
import type { DisputeRow } from '../types';

interface AlertBannerProps {
  pending: DisputeRow[];
  onOpen: (id: string) => void;
}

const VISIBLE_LIMIT = 8;

const bannerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 14,
  background: 'var(--warnbg)',
  border: '1px solid var(--line)',
  borderLeft: '4px solid var(--warn)',
  borderRadius: 12,
  padding: '14px 16px',
  marginBottom: 14,
  boxShadow: 'var(--shadow)',
};

const iconWrapStyle: CSSProperties = {
  flexShrink: 0,
  width: 34,
  height: 34,
  borderRadius: '50%',
  background: 'var(--card)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export function AlertBanner({ pending, onOpen }: AlertBannerProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div style={bannerStyle}>
      <div style={iconWrapStyle}>
        <i className="fa-solid fa-bell" style={{ color: 'var(--warn)', fontSize: 14 }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {pending.length === 0 ? (
          <>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13, color: 'var(--brown)' }}>
              AR Action Required
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--muted)',
                marginTop: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 7,
              }}
            >
              <i className="fa-solid fa-circle-check" style={{ color: 'var(--ok)' }} /> No disputes pending AR
              verification.
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                fontFamily: "'Outfit',sans-serif",
                fontWeight: 700,
                fontSize: 13,
                color: 'var(--brown)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              AR Action Required
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 10,
                  background: 'var(--warn)',
                  color: '#fff',
                  padding: '1px 9px',
                  borderRadius: 999,
                }}
              >
                {pending.length}
              </span>
              <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--muted)' }}>awaiting AR verification</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {pending.slice(0, VISIBLE_LIMIT).map((r) => (
                <span
                  key={r.id}
                  onClick={() => onOpen(r.id)}
                  onMouseEnter={() => setHoveredId(r.id)}
                  onMouseLeave={() => setHoveredId((cur) => (cur === r.id ? null : cur))}
                  title="Open details"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'var(--card)',
                    border: `1px solid ${hoveredId === r.id ? 'var(--gold)' : 'var(--line)'}`,
                    borderRadius: 999,
                    padding: '5px 6px 5px 11px',
                    cursor: 'pointer',
                    maxWidth: '100%',
                    transition: '.15s',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontWeight: 700,
                      fontSize: 10,
                      color: 'var(--gold)',
                      flexShrink: 0,
                    }}
                  >
                    {r.code}
                  </span>
                  <span
                    dir="auto"
                    style={{
                      fontWeight: 500,
                      fontSize: 11,
                      color: 'var(--ink)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: 220,
                    }}
                  >
                    {r.name}
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontWeight: 700,
                      fontSize: 10,
                      color: 'var(--brown)',
                      background: 'var(--goldbg)',
                      padding: '2px 8px',
                      borderRadius: 999,
                      flexShrink: 0,
                    }}
                  >
                    {fmtEGP(r.amount)}
                  </span>
                </span>
              ))}
              {pending.length > VISIBLE_LIMIT && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'var(--card)',
                    border: '1px solid var(--line)',
                    borderRadius: 999,
                    padding: '5px 11px',
                    cursor: 'default',
                  }}
                >
                  <span style={{ fontWeight: 500, fontSize: 11, color: 'var(--muted)' }}>
                    +{pending.length - VISIBLE_LIMIT} more
                  </span>
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
