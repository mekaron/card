import type { Card as CardT } from '@/types';

interface CardDetailsPanelProps {
  card: CardT | null;
}

export default function CardDetailsPanel({ card }: CardDetailsPanelProps) {
  return (
    <aside className="cardDetails" aria-live="polite">
      <header className="cardDetailsHeader">
        <span>Card Details</span>
        {card ? <span className={`cardDetailsTypePill ${card.type}`}>{card.type}</span> : null}
      </header>

      {card ? (
        <div className="cardDetailsBody">
          <div className={`cardDetailsPreview ${card.type}`}>
            <img src={card.image} alt="" className="cardDetailsArt" draggable={false} />
            <div className="cardDetailsContent">
              <span className="typeBadge">{card.type}</span>
              <div className="cardDetailsLabel">{card.label}</div>
            </div>
          </div>

          <dl className="cardDetailsList">
            <div className="cardDetailsRow">
              <dt>Name</dt>
              <dd>{card.label}</dd>
            </div>
            <div className="cardDetailsRow">
              <dt>Type</dt>
              <dd className={`cardDetailsTypeText ${card.type}`}>{card.type}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <p className="cardDetailsEmpty">Select a card from your hand to view its details.</p>
      )}
    </aside>
  );
}
