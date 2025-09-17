import type { CSSProperties } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';

import type { Card as CardT } from '@/types';

interface CardProps {
  card: CardT;
  selected?: boolean;
  onSelect?: (cardId: string) => void;
}

export default function Card({ card, selected = false, onSelect }: CardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: isDragging ? 'none' : 'manipulation',
  };

  const handleSelect = () => {
    if (!onSelect || isDragging) return;
    onSelect(card.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx('card', card.type, {
        dragging: isDragging,
        selected,
        selectable: Boolean(onSelect),
      })}
      aria-label={`${card.label}, ${card.type}`}
      {...attributes}
      {...listeners}
      onClick={handleSelect}
      aria-selected={onSelect ? selected : undefined}
      role="listitem"
      aria-roledescription="Card"
    >
      <span className="typeBadge">{card.type}</span>
      <div className="cardLabel">{card.label}</div>
    </div>
  );
}
