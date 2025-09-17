import clsx from 'clsx';

import type { Card as CardT } from '@/types';

interface DragOverlayCardProps {
  card: CardT;
  size?: 'default' | 'grid';
}

export default function DragOverlayCard({ card, size = 'default' }: DragOverlayCardProps) {
  if (!card) {
    return null;
  }

  return (
    <div
      className={clsx('card', card.type, 'overlay', size === 'grid' && 'card--grid')}
      aria-hidden="true"
    >
      <img src={card.image} alt="" className="cardArt" draggable={false} />
      <div className="cardContent">
        <span className="typeBadge">{card.type}</span>
        <div className="cardLabel">{card.label}</div>
      </div>
    </div>
  );
}
