import React from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import Zone from './components/Zone';
import Card from './components/Card';
import CardDetailsPanel from './components/CardDetailsPanel';
import DragOverlayCard from './components/DragOverlayCard';
import A11yLiveRegion from './components/A11yLiveRegion';
import { useEdgeAutoScroll } from './dnd/useEdgeAutoScroll';
import type { Card as CardT, CardsById, ZoneId, ZoneState } from './types';
import { arrayMove } from './util/array';
import { announce, vibrate } from './util/a11y';
import { useHistoryState } from './state/useHistoryState';
import { PageScrollLock } from './util/scrollLock';

type Id = string;

const initialCards: CardsById = {
  'c-01': { id: 'c-01', label: 'Scout', type: 'unit', image: '/cards/scout.svg' },
  'c-02': { id: 'c-02', label: 'Archer', type: 'unit', image: '/cards/archer.svg' },
  'c-03': { id: 'c-03', label: 'Knight', type: 'unit', image: '/cards/knight.svg' },
  'c-04': { id: 'c-04', label: 'Mage Bolt', type: 'spell', image: '/cards/mage-bolt.svg' },
  'c-05': { id: 'c-05', label: 'Fireball', type: 'spell', image: '/cards/fireball.svg' },
  'c-06': { id: 'c-06', label: 'Healer', type: 'unit', image: '/cards/healer.svg' },
  'c-07': { id: 'c-07', label: 'Rogue', type: 'unit', image: '/cards/rogue.svg' },
  'c-08': { id: 'c-08', label: 'Ice Nova', type: 'spell', image: '/cards/ice-nova.svg' },
};

const initialZones: ZoneState = {
  hand: ['c-01', 'c-03', 'c-04', 'c-05', 'c-06', 'c-07', 'c-08'],
  board: ['c-02'],
  discard: [],
};

function findContainer(containers: ZoneState, id: Id | null): ZoneId | null {
  if (!id) return null;

  const allZones = Object.keys(containers) as ZoneId[];
  if (allZones.includes(id as ZoneId)) return id as ZoneId;

  return allZones.find((zoneId) => containers[zoneId].includes(id)) ?? null;
}

function canDrop(card: CardT, toZone: ZoneId): boolean {
  if (toZone === 'board') return card.type === 'unit';
  return true;
}

export default function App() {
  const [cardsById] = React.useState<CardsById>(initialCards);
  const state = useHistoryState<ZoneState>(initialZones);
  const containers = state.present;

  const [activeId, setActiveId] = React.useState<Id | null>(null);
  const [selectedCardId, setSelectedCardId] = React.useState<string | null>(null);
  const [activeCardOrigin, setActiveCardOrigin] = React.useState<ZoneId | null>(null);
  const [hint, setHint] = React.useState<Record<ZoneId, 'accepts' | 'rejects' | null>>({
    hand: null,
    board: null,
    discard: null,
  });

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const isDragging = React.useCallback(() => activeId != null, [activeId]);
  const { register } = useEdgeAutoScroll(isDragging, { edge: 32, maxSpeed: 600 });

  const activeCard = activeId ? cardsById[activeId] : null;
  const selectedCard = selectedCardId ? cardsById[selectedCardId] : null;

  React.useEffect(() => {
    if (selectedCardId && !containers.hand.includes(selectedCardId)) {
      setSelectedCardId(null);
    }
  }, [containers.hand, selectedCardId]);

  const handleSelectCard = React.useCallback(
    (cardId: string) => {
      setSelectedCardId((current) => {
        if (!containers.hand.includes(cardId)) {
          return current;
        }

        const next = current === cardId ? null : cardId;
        const card = cardsById[cardId];
        if (next) {
          announce(`${card.label} selected`);
        } else {
          announce(`${card.label} deselected`);
        }
        return next;
      });
    },
    [cardsById, containers.hand],
  );

  const registerZoneRef = React.useCallback(
    (zone: ZoneId, el: HTMLElement | null) => {
      if (el) {
        register(el, zone);
      }
    },
    [register],
  );

  const undo = React.useCallback(() => {
    state.undo();
    announce('Undid last move');
  }, [state]);

  const redo = React.useCallback(() => {
    state.redo();
    announce('Redid move');
  }, [state]);

  const reset = React.useCallback(() => {
    state.replace(initialZones);
    announce('Reset');
  }, [state]);

  const onDragStart = React.useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      setActiveId(active.id as string);
      const origin = findContainer(containers, active.id as string);
      setActiveCardOrigin(origin ?? null);
      vibrate(10);
      announce(`Picked up ${cardsById[active.id as string].label}`);
    },
    [cardsById, containers],
  );

  const onDragOver = React.useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const from = findContainer(containers, activeId);
      const to = findContainer(containers, overId);
      if (!from || !to) return;

      if (from === to) {
        const activeIndex = containers[from].indexOf(activeId);
        const overIndex = containers[from].indexOf(overId);

        if (activeIndex !== overIndex && overIndex >= 0) {
          state.setEphemeral((prev) => ({
            ...prev,
            [from]: arrayMove(prev[from], activeIndex, overIndex),
          }));
        }
        return;
      }

      const card = cardsById[activeId];
      setHint((current) => ({ ...current, [to]: canDrop(card, to) ? 'accepts' : 'rejects' }));

      state.setEphemeral((prev) => {
        const fromItems = prev[from].filter((id) => id !== activeId);
        const toItems = prev[to].slice();
        const overIndex = toItems.indexOf(overId);
        const insertAt = overIndex >= 0 ? overIndex : toItems.length;
        toItems.splice(insertAt, 0, activeId);

        return { ...prev, [from]: fromItems, [to]: toItems };
      });
    },
    [cardsById, containers, state],
  );

  const onDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const id = active.id as string;
      setHint({ hand: null, board: null, discard: null });
      setActiveCardOrigin(null);

      if (!over) {
        setActiveId(null);
        state.replace(state.baseline);
        announce('Cancelled');
        return;
      }

      const from = findContainer(containers, id);
      const to = findContainer(containers, over.id as string);
      if (!from || !to) {
        setActiveId(null);
        return;
      }

      const card = cardsById[id];
      if (!canDrop(card, to)) {
        vibrate([5, 20, 30]);
        announce(`Invalid drop: ${card.type} cannot be placed on ${to}`);
        state.replace(state.baseline);
        setActiveId(null);
        return;
      }

      state.commit(undefined, { type: 'drop', card: id, from, to });
      setActiveId(null);
      vibrate(8);
      announce(`Dropped ${card.label} on ${to}`);
    },
    [cardsById, containers, state],
  );

  const onDragCancel = React.useCallback(() => {
    setActiveId(null);
    state.replace(state.baseline);
    announce('Cancelled');
    setActiveCardOrigin(null);
  }, [state]);

  return (
    <div className="app">
      <PageScrollLock />
      <A11yLiveRegion />

      <header className="header">
        <div className="title">Deck Builder</div>
        <div className="actions">
          <button onClick={undo} className="danger" aria-label="Undo last move" disabled={!state.canUndo}>
            Undo
          </button>
          <button onClick={redo} aria-label="Redo" disabled={!state.canRedo}>
            Redo
          </button>
          <button className="primary" onClick={reset}>
            Reset
          </button>
        </div>
      </header>

      <div className="content">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          onDragCancel={onDragCancel}
        >
          <div className="workspace">
            <div className="zones">
              <Zone
                id="hand"
                title="Hand"
                accepts={['unit', 'spell']}
                onRef={(el) => registerZoneRef('hand', el)}
                hint={hint.hand}
              >
                <SortableContext items={containers.hand} strategy={verticalListSortingStrategy}>
                  <div className="list">
                    {containers.hand.map((id) => (
                      <Card
                        key={id}
                        card={cardsById[id]}
                        selected={selectedCardId === id}
                        onSelect={handleSelectCard}
                      />
                    ))}
                  </div>
                </SortableContext>
              </Zone>

              <Zone
                id="board"
                title="Board"
                accepts={['unit']}
                onRef={(el) => registerZoneRef('board', el)}
                hint={hint.board}
              >
                <SortableContext items={containers.board} strategy={rectSortingStrategy}>
                  <div className="grid">
                    {containers.board.map((id) => (
                      <Card key={id} card={cardsById[id]} size="grid" />
                    ))}
                  </div>
                </SortableContext>
              </Zone>

              <Zone
                id="discard"
                title="Discard"
                accepts={['unit', 'spell']}
                onRef={(el) => registerZoneRef('discard', el)}
                hint={hint.discard}
              >
                <SortableContext items={containers.discard} strategy={verticalListSortingStrategy}>
                  <div className="list">
                    {containers.discard.map((id) => (
                      <Card key={id} card={cardsById[id]} />
                    ))}
                  </div>
                </SortableContext>
              </Zone>
            </div>

            <CardDetailsPanel card={selectedCard} />
          </div>

          <DragOverlay dropAnimation={{ duration: 130 }}>
            {activeCard ? (
              <DragOverlayCard
                card={activeCard}
                size={activeCardOrigin === 'board' ? 'grid' : 'default'}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
