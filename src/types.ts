export type ZoneId = 'hand' | 'board' | 'discard';
export type CardType = 'unit' | 'spell';

export interface Card {
  id: string;
  label: string;
  type: CardType;
  image: string;
}

export type ZoneState = Record<ZoneId, string[]>;
export type CardsById = Record<string, Card>;
