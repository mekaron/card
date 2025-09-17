import type { Card as CardT } from '@/types';

interface DragOverlayCardProps {
  card: CardT;
}

export default function DragOverlayCard({ card }: DragOverlayCardProps) {
  if (!card) {
    return null;
  }

  return (
    <div className={`card ${card.type} overlay`} aria-hidden="true">
      <span className="typeBadge">{card.type}</span>
      <div className="cardLabel">{card.label}</div>
    </div>
  );
}
