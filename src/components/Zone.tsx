import type { ReactNode } from 'react';
import { useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import clsx from 'clsx';

interface ZoneProps {
  id: string;
  title: string;
  accepts?: string[];
  children: ReactNode;
  onRef?: (el: HTMLElement | null) => void;
  hint?: 'accepts' | 'rejects' | null;
}

export default function Zone({ id, title, accepts, children, onRef, hint }: ZoneProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { setNodeRef } = useDroppable({ id });

  return (
    <section className={clsx('zone', hint)} aria-label={title}>
      <header className="zoneHeader">
        <span>{title}</span>
        {accepts ? <span>accepts: {accepts.join(', ')}</span> : null}
      </header>
      <div
        ref={(el) => {
          ref.current = el;
          setNodeRef(el);
          onRef?.(el);
        }}
        className="zoneBody"
        role="list"
        aria-describedby={`hint-${id}`}
      >
        {children}
      </div>
      <div id={`hint-${id}`} className="sr-only">
        Drag cards here. Use arrow keys with Enter to move the focused card. Press Escape to cancel.
      </div>
    </section>
  );
}
