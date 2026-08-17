import { STATUS_CARDS } from '../normalize';

interface StatusCardsProps {
  counts: Record<string, number>;
  activeKey: string;
  onSelect: (key: string) => void;
}

export function StatusCards({ counts, activeKey, onSelect }: StatusCardsProps) {
  return (
    <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
      {STATUS_CARDS.map((card) => {
        const active = activeKey === card.key;
        return (
          <div
            key={card.key}
            className={`kpi-card${card.cardClass ? ` ${card.cardClass}` : ''}${active ? ' kpi-card-active' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(card.key)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelect(card.key);
            }}
          >
            <div className="kpi-label">
              <i className="fa-solid fa-circle" style={{ fontSize: 7 }} />
              {card.label}
            </div>
            <div className="kpi-value">{counts[card.key] ?? 0}</div>
            <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 2 }}>{card.sub}</div>
          </div>
        );
      })}
    </div>
  );
}
