import {
  useEffect,
  useRef,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';

import type { Card as CardT } from '@/types';

interface TapIntent {
  pointerId: number;
  startX: number;
  startY: number;
  startTime: number;
}

const TAP_MAX_DURATION = 200;
const TAP_MOVE_TOLERANCE = 12;

interface CardProps {
  card: CardT;
  selected?: boolean;
  onSelect?: (cardId: string) => void;
  size?: 'default' | 'grid';
}

export default function Card({
  card,
  selected = false,
  onSelect,
  size = 'default',
}: CardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: isDragging ? 'none' : 'manipulation',
  };

  const tapIntentRef = useRef<TapIntent | null>(null);
  const dragStartedRef = useRef(false);

  useEffect(() => {
    if (isDragging) {
      dragStartedRef.current = true;
    }
  }, [isDragging]);

  const handlePointerDownCapture = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragStartedRef.current = false;

    if (!onSelect || event.pointerType !== 'touch') {
      tapIntentRef.current = null;
      return;
    }

    tapIntentRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startTime: event.timeStamp,
    };
  };

  const handlePointerMoveCapture = (event: ReactPointerEvent<HTMLDivElement>) => {
    const intent = tapIntentRef.current;
    if (!intent || intent.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - intent.startX;
    const deltaY = event.clientY - intent.startY;
    if (Math.hypot(deltaX, deltaY) > TAP_MOVE_TOLERANCE) {
      tapIntentRef.current = null;
    }
  };

  const handlePointerUpCapture = (event: ReactPointerEvent<HTMLDivElement>) => {
    const intent = tapIntentRef.current;
    tapIntentRef.current = null;

    const didDrag = dragStartedRef.current;
    dragStartedRef.current = false;

    if (!onSelect || event.pointerType !== 'touch' || !intent) {
      return;
    }

    if (intent.pointerId !== event.pointerId) {
      return;
    }

    if (didDrag) {
      return;
    }

    const duration = event.timeStamp - intent.startTime;
    if (duration > TAP_MAX_DURATION) {
      return;
    }

    onSelect(card.id);
  };

  const handlePointerLeave = (event: ReactPointerEvent<HTMLDivElement>) => {
    const intent = tapIntentRef.current;
    if (intent && intent.pointerId === event.pointerId) {
      tapIntentRef.current = null;
    }
  };

  const handlePointerCancelCapture = () => {
    tapIntentRef.current = null;
    dragStartedRef.current = false;
  };

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!onSelect || isDragging) return;

    const nativeEvent = event.nativeEvent as typeof event.nativeEvent & { pointerType?: string };
    if (nativeEvent.pointerType === 'touch') {
      return;
    }

    onSelect(card.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'card',
        card.type,
        {
          dragging: isDragging,
          selected,
          selectable: Boolean(onSelect),
        },
        size === 'grid' && 'card--grid',
      )}
      aria-label={`${card.label}, ${card.type}`}
      {...attributes}
      {...listeners}
      onPointerDownCapture={handlePointerDownCapture}
      onPointerMoveCapture={handlePointerMoveCapture}
      onPointerUpCapture={handlePointerUpCapture}
      onPointerLeave={handlePointerLeave}
      onPointerCancelCapture={handlePointerCancelCapture}
      onClick={handleClick}
      aria-selected={onSelect ? selected : undefined}
      role="listitem"
      aria-roledescription="Card"
    >
      <img src={card.image} alt="" className="cardArt" draggable={false} />
      <div className="cardContent">
        <span className="typeBadge">{card.type}</span>
        <div className="cardLabel">{card.label}</div>
      </div>
    </div>
  );
}
