import { useEffect, useRef } from 'react';

type ScrollTarget = { id: string; el: HTMLElement };

function distanceToEdge(y: number, rect: DOMRect, edgePx: number) {
  if (y < rect.top) return -Infinity;
  if (y > rect.bottom) return Infinity;

  const topDist = y - rect.top;
  const botDist = rect.bottom - y;

  if (topDist <= edgePx) return -topDist;
  if (botDist <= edgePx) return botDist;
  return 0;
}

interface EdgeAutoScrollOptions {
  edge?: number;
  maxSpeed?: number;
}

export function useEdgeAutoScroll(
  isDragging: () => boolean,
  opts?: EdgeAutoScrollOptions,
) {
  const edge = opts?.edge ?? 32;
  const maxSpeed = opts?.maxSpeed ?? 600;
  const containers = useRef<ScrollTarget[]>([]);
  const pointer = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const onMove = (event: PointerEvent | TouchEvent) => {
      if (!isDragging()) return;

      if ('clientX' in event) {
        const pointerEvent = event as PointerEvent;
        pointer.current = { x: pointerEvent.clientX, y: pointerEvent.clientY };
      } else {
        const touchEvent = event as TouchEvent;
        const touch = touchEvent.touches[0] || touchEvent.changedTouches[0];

        if (touch) {
          pointer.current = { x: touch.clientX, y: touch.clientY };
        }
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onMove as EventListener);
      window.removeEventListener('touchmove', onMove as EventListener);
    };
  }, [isDragging]);

  useEffect(() => {
    let previousTimestamp = performance.now();

    const step = (timestamp: number) => {
      rafId.current = requestAnimationFrame(step);

      const dt = Math.max(0.016, (timestamp - previousTimestamp) / 1000);
      previousTimestamp = timestamp;

      if (!isDragging()) return;

      const { x, y } = pointer.current;
      for (const { el } of containers.current) {
        const rect = el.getBoundingClientRect();
        if (x < rect.left || x > rect.right) continue;

        const distance = distanceToEdge(y, rect, edge);
        if (distance === 0 || !Number.isFinite(distance)) continue;

        const ratio = Math.max(0, (edge - Math.abs(distance)) / edge);
        const speed = Math.min(maxSpeed, 80 + ratio * maxSpeed);
        const delta = Math.sign(distance) * speed * dt;

        if (delta !== 0) {
          el.scrollBy({ top: delta, behavior: 'auto' });
        }
      }
    };

    rafId.current = requestAnimationFrame(step);

    return () => {
      if (rafId.current != null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [isDragging, edge, maxSpeed]);

  function register(el: HTMLElement | null, id: string) {
    if (!el) return;
    if (containers.current.find((container) => container.el === el)) return;

    containers.current.push({ id, el });
  }

  return { register };
}
