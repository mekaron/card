import type { CSSProperties } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';

import type { Card as CardT } from '@/types';

interface CardProps {
  card: CardT;
}

export default function Card({ card }: CardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'none',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx('card', card.type, { dragging: isDragging })}
      aria-label={`${card.label}, ${card.type}`}
      {...attributes}
      {...listeners}
      role="listitem"
      aria-roledescription="Card"
    >
      <span className="typeBadge">{card.type}</span>
      <div className="cardLabel">{card.label}</div>
    </div>
  );
}
