/**
 * Trick-play mechanics for the WesPlay analyser: contracts, turn order, legal
 * plays, trick winners, running trick counts, and the translation of a
 * mid-play position into a DDS `SolveBoardPBN` request.
 *
 * Conventions match DDS throughout: strain 0=♠ 1=♥ 2=♦ 3=♣ 4=NT; seats 0=N
 * 1=E 2=S 3=W (the same order as SUITS and SEATS, so a card's suit index IS
 * its DDS suit number). A SolveBoard `score` is the future tricks for the
 * side of the player to move, including the trick in progress; completed
 * tricks are the caller's to add (see `declarerTotal`).
 */

import { type Card, RANK_LABELS, rankOf, SUITS, makeCard } from './cards';
import { type Deal, type Seat, SEATS } from './deal';
import { handToPBN } from './format';

/** Strain letters by DDS index (N alone is accepted for NT when parsing). */
export const STRAIN_LETTERS = ['S', 'H', 'D', 'C', 'NT'] as const;

export interface Contract {
  level: number;
  /** 0=♠ 1=♥ 2=♦ 3=♣ 4=NT */
  strain: number;
  /** 0=N 1=E 2=S 3=W */
  declarer: number;
  /** 0 undoubled, 1 doubled, 2 redoubled. */
  doubled: 0 | 1 | 2;
}

const CONTRACT_RE = /^\s*([1-7])\s*(NT|[SHDC])\s*(XX|X)?\s*$/i;

/** Parse "4S" / "3NT" / "4Sx" / "4sxx" (declarer supplied separately). */
export function parseContract(text: string, declarer: number): Contract | null {
  const m = CONTRACT_RE.exec(text);
  if (!m || declarer < 0 || declarer > 3) return null;
  const strain = m[2].toUpperCase() === 'NT' ? 4 : 'SHDC'.indexOf(m[2].toUpperCase());
  const doubled = (m[3] ? m[3].length : 0) as 0 | 1 | 2;
  return { level: Number(m[1]), strain, declarer, doubled };
}

/** Contract without declarer, e.g. "4Sx" (the AnalyzeState encoding). */
export function contractString(c: Contract): string {
  return `${c.level}${STRAIN_LETTERS[c.strain]}${'x'.repeat(c.doubled)}`;
}

// ---- Card codes ("SK" = ♠K), shared with LIN play and the URL state --------

/** Two-character code for a card: suit letter + rank label ("SK", "HT"). */
export function cardCode(card: Card): string {
  return SUITS[suitOf2(card)] + RANK_LABELS[rankOf(card)];
}

const RANK_BY_CHAR: Record<string, number> = {
  A: 14, K: 13, Q: 12, J: 11, T: 10,
  '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2,
};

/** Parse a card code (case-insensitive, "10" accepted): "sk" → ♠K. */
export function cardFromCode(code: string): Card | null {
  const text = code.trim().toUpperCase().replace('10', 'T');
  if (text.length !== 2) return null;
  const suit = 'SHDC'.indexOf(text[0]);
  const rank = RANK_BY_CHAR[text[1]];
  if (suit < 0 || rank === undefined) return null;
  return suit * 13 + (rank - 2);
}

/** A play string "SKS3D4…" → cards; null if any pair is malformed. */
export function playFromString(play: string): Card[] | null {
  if (play.length % 2 !== 0) return null;
  const out: Card[] = [];
  for (let i = 0; i < play.length; i += 2) {
    const card = cardFromCode(play.slice(i, i + 2));
    if (card === null) return null;
    out.push(card);
  }
  return out;
}

export function playToString(plays: Card[]): string {
  return plays.map(cardCode).join('');
}

// A card's suit index (0=♠ … 3=♣) — equals its DDS suit number.
function suitOf2(card: Card): number {
  return Math.floor(card / 13);
}

// ---- Turn order and trick mechanics ----------------------------------------

export interface TrickView {
  /** Seat index that led the trick. */
  leader: number;
  /** Cards in play order (leader first). */
  cards: Card[];
  /** Seat index that won the trick. */
  winner: number;
}

export interface PlayView {
  /** Completed tricks. */
  tricks: TrickView[];
  /** The trick in progress (0–3 cards; leader set even when empty). */
  current: { leader: number; cards: Card[] };
  /** Seat index to play next, or null when all 52 cards are gone. */
  toPlay: number | null;
  /** Cards still held (current-trick cards removed — the DDS convention). */
  remaining: Record<Seat, Card[]>;
  declarerTricks: number;
  defenderTricks: number;
  complete: boolean;
}

/** Winner of a completed trick: highest trump, else highest of the led suit. */
export function trickWinner(cards: Card[], leader: number, trump: number): number {
  let best = 0;
  for (let i = 1; i < 4; i++) {
    const s = suitOf2(cards[i]);
    const bs = suitOf2(cards[best]);
    if (s === bs) {
      if (rankOf(cards[i]) > rankOf(cards[best])) best = i;
    } else if (s === trump) {
      best = i;
    }
  }
  return (leader + best) % 4;
}

/**
 * Replay `plays` from the opening lead, tracking tricks and remaining cards.
 * Throws on an impossible play (wrong seat's card or revoke) — callers feed
 * imported plays through `sanitisePlays` first.
 */
export function computePlay(deal: Deal, contract: Contract, plays: Card[]): PlayView {
  const remaining: Record<Seat, Card[]> = {
    N: [...deal.hands.N], E: [...deal.hands.E], S: [...deal.hands.S], W: [...deal.hands.W],
  };
  const tricks: TrickView[] = [];
  let leader = (contract.declarer + 1) % 4;
  let current: Card[] = [];
  let declarerTricks = 0;
  let defenderTricks = 0;

  for (const card of plays) {
    const seat = SEATS[(leader + current.length) % 4];
    const hand = remaining[seat];
    const at = hand.indexOf(card);
    if (at < 0) throw new Error(`${seat} does not hold ${cardCode(card)}`);
    if (current.length > 0) {
      const led = suitOf2(current[0]);
      if (suitOf2(card) !== led && hand.some((c) => suitOf2(c) === led)) {
        throw new Error(`${seat} must follow suit`);
      }
    }
    hand.splice(at, 1);
    current.push(card);
    if (current.length === 4) {
      const winner = trickWinner(current, leader, contract.strain);
      tricks.push({ leader, cards: current, winner });
      if (winner % 2 === contract.declarer % 2) declarerTricks++;
      else defenderTricks++;
      leader = winner;
      current = [];
    }
  }

  const complete = tricks.length === 13;
  return {
    tricks,
    current: { leader, cards: current },
    toPlay: complete ? null : (leader + current.length) % 4,
    remaining,
    declarerTricks,
    defenderTricks,
    complete,
  };
}

/** The cards the seat to move may legally play (follow suit if possible). */
export function legalPlays(view: PlayView): Card[] {
  if (view.toPlay === null) return [];
  const hand = view.remaining[SEATS[view.toPlay]];
  if (view.current.cards.length === 0) return [...hand];
  const led = suitOf2(view.current.cards[0]);
  const follow = hand.filter((c) => suitOf2(c) === led);
  return follow.length > 0 ? follow : [...hand];
}

/**
 * Keep the longest prefix of an imported play that is actually legal (claims,
 * truncated records and irregularities drop the tail rather than the import).
 */
export function sanitisePlays(deal: Deal, contract: Contract, plays: Card[]): { plays: Card[]; dropped: number } {
  let good = 0;
  try {
    for (let n = 1; n <= plays.length; n++) {
      const view = computePlay(deal, contract, plays.slice(0, n - 1));
      if (view.toPlay === null || !legalPlays(view).includes(plays[n - 1])) break;
      good = n;
    }
  } catch {
    // computePlay only throws on plays beyond `good`; fall through.
  }
  return { plays: plays.slice(0, good), dropped: plays.length - good };
}

// ---- DDS position -----------------------------------------------------------

export interface DDPlayPosition {
  trump: number;
  /** Seat index that led the current trick. */
  first: number;
  /** Cards already played to the current trick, padded with 0s to length 3. */
  currentTrickSuit: number[];
  currentTrickRank: number[];
  /** PBN of the cards still held (current-trick cards removed). */
  remainCards: string;
}

/** The DDS request for the position after `plays`; null once play is over. */
export function ddPosition(deal: Deal, contract: Contract, plays: Card[]): DDPlayPosition | null {
  const view = computePlay(deal, contract, plays);
  if (view.toPlay === null) return null;
  const currentTrickSuit = [0, 0, 0];
  const currentTrickRank = [0, 0, 0];
  view.current.cards.forEach((c, i) => {
    currentTrickSuit[i] = suitOf2(c);
    currentTrickRank[i] = rankOf(c);
  });
  return {
    trump: contract.strain,
    first: view.current.leader,
    currentTrickSuit,
    currentTrickRank,
    remainCards: 'N:' + SEATS.map((s) => handToPBN(view.remaining[s])).join(' '),
  };
}

/** Whether the seat to move is on the declaring side. */
export function moverDeclaring(view: PlayView, contract: Contract): boolean {
  return view.toPlay !== null && view.toPlay % 2 === contract.declarer % 2;
}

/**
 * Declarer's total tricks implied by a SolveBoard score for the side to move
 * (completed tricks won so far + the mover's future tricks).
 */
export function declarerTotal(view: PlayView, contract: Contract, moverScore: number): number {
  return moverDeclaring(view, contract)
    ? view.declarerTricks + moverScore
    : 13 - (view.defenderTricks + moverScore);
}

// ---- Duplicate scoring (with doubles) ---------------------------------------

/**
 * Duplicate score for the DECLARING side: positive when the contract makes,
 * negative when it goes down. Generalises `scoreContract` (lead.ts) with
 * doubling: trick score ×2/×4, the 50/100 insult, doubled over-tricks and the
 * doubled undertrick ladder.
 */
export function scoreDeclarer(level: number, strain: number, doubled: 0 | 1 | 2, tricks: number, vul: boolean): number {
  const need = 6 + level;
  if (tricks < need) {
    const down = need - tricks;
    if (doubled === 0) return -down * (vul ? 100 : 50);
    // Doubled: nv 100/300/500 then +300 each; vul 200 then +300 each. ×2 redoubled.
    const base = vul
      ? 200 + 300 * (down - 1)
      : down === 1 ? 100 : down === 2 ? 300 : 500 + 300 * (down - 3);
    return -base * doubled;
  }
  const per = strain === 2 || strain === 3 ? 20 : 30; // minors 20, majors/NT 30
  const trickScore = (strain === 4 ? 40 + 30 * (level - 1) : per * level) * (doubled === 0 ? 1 : doubled * 2);
  const overPer = doubled === 0 ? (strain === 4 ? 30 : per) : (vul ? 200 : 100) * doubled;
  let score = trickScore + (tricks - need) * overPer;
  score += trickScore >= 100 ? (vul ? 500 : 300) : 50;
  score += 50 * doubled; // the insult
  if (level === 6) score += vul ? 750 : 500;
  if (level === 7) score += vul ? 1500 : 1000;
  return score;
}

/** "+420" / "−50", from the declaring side's viewpoint. */
export function scoreLabel(score: number): string {
  return (score >= 0 ? '+' : '−') + Math.abs(score);
}

/** Result suffix for a completed play: "=", "+2" or "−1". */
export function resultLabel(level: number, tricks: number): string {
  const diff = tricks - (6 + level);
  return diff === 0 ? '=' : diff > 0 ? `+${diff}` : `−${-diff}`;
}

// ---- Small helpers shared by importers and the page -------------------------

/** Build a Deal from four 13-card hands already validated elsewhere. */
export function dealFromHands(hands: Record<Seat, Card[]>): Deal {
  return { hands: { N: [...hands.N], E: [...hands.E], S: [...hands.S], W: [...hands.W] } };
}

/** The 13 cards missing from three known 13-card hands (or any partial set). */
export function missingCards(hands: Partial<Record<Seat, Card[]>>): Card[] {
  const used = new Set<Card>();
  for (const seat of SEATS) for (const c of hands[seat] ?? []) used.add(c);
  const out: Card[] = [];
  for (let c = 0; c < 52; c++) if (!used.has(c)) out.push(c);
  return out;
}

/** Rebuild the card for a (suit index, rank) pair from a DDS reply. */
export function cardFromDds(suit: number, rank: number): Card {
  return makeCard(SUITS[suit], rank);
}
