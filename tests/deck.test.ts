import { describe, it, expect } from 'vitest';
import {
  fullDeck,
  shuffleInPlace,
  randomDeal,
  dealFromDeck,
  mulberry32,
  SEATS,
} from '../src/engine/deal';
import { suitOf, rankOf, hcpOfRank, SUITS, DECK_SIZE } from '../src/engine/cards';

describe('deck integrity', () => {
  it('builds 52 unique cards', () => {
    const deck = fullDeck();
    expect(deck.length).toBe(DECK_SIZE);
    expect(new Set(deck).size).toBe(DECK_SIZE);
  });

  it('has exactly 13 cards in each suit and 40 total HCP', () => {
    const deck = fullDeck();
    const perSuit = Object.fromEntries(SUITS.map((s) => [s, 0]));
    let hcp = 0;
    for (const card of deck) {
      perSuit[suitOf(card)]++;
      hcp += hcpOfRank(rankOf(card));
    }
    for (const s of SUITS) expect(perSuit[s]).toBe(13);
    expect(hcp).toBe(40);
  });
});

describe('shuffle and deal', () => {
  it('shuffle preserves the multiset of cards', () => {
    const deck = shuffleInPlace(fullDeck(), mulberry32(42));
    expect(new Set(deck).size).toBe(DECK_SIZE);
  });

  it('deals four hands of 13 covering all 52 cards exactly once', () => {
    const deal = randomDeal(mulberry32(7));
    const all = SEATS.flatMap((s) => deal.hands[s]);
    expect(all.length).toBe(DECK_SIZE);
    expect(new Set(all).size).toBe(DECK_SIZE);
    for (const s of SEATS) expect(deal.hands[s].length).toBe(13);
  });

  it('is reproducible for a given seed and differs across seeds', () => {
    const a = randomDeal(mulberry32(123));
    const b = randomDeal(mulberry32(123));
    const c = randomDeal(mulberry32(124));
    expect(a.hands.N).toEqual(b.hands.N);
    expect(a.hands.N).not.toEqual(c.hands.N);
  });

  it('dealFromDeck splits in N,E,S,W order', () => {
    const deck = fullDeck();
    const deal = dealFromDeck(deck);
    expect(deal.hands.N).toEqual(deck.slice(0, 13));
    expect(deal.hands.W).toEqual(deck.slice(39, 52));
  });
});
