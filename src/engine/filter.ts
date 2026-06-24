/**
 * A small expression language for custom per-hand filters.
 *
 * A filter is a yes/no condition over a single hand. Examples:
 *   spades >= 6 and top(spades, 6) >= 3
 *   not (hearts >= 4 and spades >= 4 and hcp in 3..9)
 *   majors := spades + hearts >= 8     (not yet — see arithmetic below)
 *   has(spades, A) and has(spades, K)
 *
 * Grammar (lowest to highest precedence):
 *   or            a or b        (also  a | b,  a || b)
 *   and           a and b       (also  a & b,  a && b)
 *   not           not a         (also  ! a)
 *   comparison    a >= b, a < b, a = b, a != b, a in lo..hi
 *   additive      a + b, a - b
 *   primary       number | suit-length | hcp | knr | controls
 *                 | top(suit, n) | has(suit, rank) | ( expr )
 *
 * Suit length: spades|hearts|diamonds|clubs (or s|h|d|c).
 * top(suit, n): how many of the top n ranks of that suit are held.
 * has(suit, rank): holds that specific card (rank A|K|Q|J|T or 2..10).
 */

import { type Card, HCP_BY_CARD } from './cards';
import { knrPoints } from './knr';

export interface HandContext {
  hcp: number;
  knr: number;
  controls: number;
  len: ArrayLike<number>; // [spades, hearts, diamonds, clubs]
  mask: ArrayLike<number>; // 13-bit rank mask per suit (bit = rank-2)
}

export interface CompiledFilter {
  predicate: (ctx: HandContext) => boolean;
  usesKnr: boolean;
  usesControls: boolean;
  source: string;
}

export interface FilterCompileResult {
  /** Present when the (non-empty) source compiled successfully. */
  filter?: CompiledFilter;
  /** Present when the source is malformed. */
  error?: string;
}

class FilterError extends Error {
  constructor(message: string, readonly pos: number | null = null) {
    super(message);
  }
}

const SUIT_INDEX: Record<string, number> = {
  spades: 0, s: 0, hearts: 1, h: 1, diamonds: 2, d: 2, clubs: 3, c: 3,
};
const RANK_LETTER: Record<string, number> = { a: 14, k: 13, q: 12, j: 11, t: 10 };

// ---- Tokenizer -------------------------------------------------------------

interface Tok {
  t: 'num' | 'name' | 'op';
  v: string | number;
  raw?: string;
  pos: number;
}

function tokenize(src: string): Tok[] {
  const toks: Tok[] = [];
  const reWs = /\s+/y;
  const reNum = /\d+(?:\.\d+)?/y;
  const reName = /[A-Za-z]+/y;
  let i = 0;
  while (i < src.length) {
    reWs.lastIndex = i;
    if (reWs.test(src)) {
      i = reWs.lastIndex;
      continue;
    }
    reNum.lastIndex = i;
    const mNum = reNum.exec(src);
    if (mNum) {
      toks.push({ t: 'num', v: Number.parseFloat(mNum[0]), pos: i });
      i = reNum.lastIndex;
      continue;
    }
    reName.lastIndex = i;
    const mName = reName.exec(src);
    if (mName) {
      const lower = mName[0].toLowerCase();
      if (lower === 'and' || lower === 'or' || lower === 'not' || lower === 'in') {
        toks.push({ t: 'op', v: lower, pos: i });
      } else {
        toks.push({ t: 'name', v: lower, raw: mName[0], pos: i });
      }
      i = reName.lastIndex;
      continue;
    }
    const two = src.substr(i, 2);
    if (two === '>=' || two === '<=' || two === '==' || two === '!=') {
      toks.push({ t: 'op', v: two, pos: i });
      i += 2;
      continue;
    }
    if (two === '&&') { toks.push({ t: 'op', v: 'and', pos: i }); i += 2; continue; }
    if (two === '||') { toks.push({ t: 'op', v: 'or', pos: i }); i += 2; continue; }
    if (two === '..') { toks.push({ t: 'op', v: '..', pos: i }); i += 2; continue; }
    const ch = src[i];
    if (ch === '>' || ch === '<') { toks.push({ t: 'op', v: ch, pos: i }); i++; continue; }
    if (ch === '=') { toks.push({ t: 'op', v: '==', pos: i }); i++; continue; }
    if (ch === '+' || ch === '-') { toks.push({ t: 'op', v: ch, pos: i }); i++; continue; }
    if (ch === '&') { toks.push({ t: 'op', v: 'and', pos: i }); i++; continue; }
    if (ch === '|') { toks.push({ t: 'op', v: 'or', pos: i }); i++; continue; }
    if (ch === '!') { toks.push({ t: 'op', v: 'not', pos: i }); i++; continue; }
    if (ch === '(' || ch === ')' || ch === ',') { toks.push({ t: 'op', v: ch, pos: i }); i++; continue; }
    throw new FilterError(`Unexpected character "${ch}"`, i);
  }
  toks.push({ t: 'op', v: 'eof', pos: src.length });
  return toks;
}

// ---- AST -------------------------------------------------------------------

type Node =
  | { k: 'num'; v: number; pos: number }
  | { k: 'bool'; v: boolean; pos: number }
  | { k: 'len'; suit: number; pos: number }
  | { k: 'var'; name: 'hcp' | 'knr' | 'controls'; pos: number }
  | { k: 'top'; suit: number; n: Node; pos: number }
  | { k: 'has'; suit: number; rank: number; pos: number }
  | { k: 'bin'; op: '+' | '-'; a: Node; b: Node; pos: number }
  | { k: 'cmp'; op: string; a: Node; b: Node; pos: number }
  | { k: 'inr'; x: Node; lo: Node; hi: Node; pos: number }
  | { k: 'and' | 'or'; a: Node; b: Node; pos: number }
  | { k: 'not'; a: Node; pos: number };

class Parser {
  private pos = 0;
  constructor(private readonly toks: Tok[]) {}

  private peek(): Tok {
    return this.toks[this.pos];
  }
  private next(): Tok {
    return this.toks[this.pos++];
  }
  private isOp(v: string): boolean {
    const t = this.peek();
    return t.t === 'op' && t.v === v;
  }
  private eat(v: string): Tok {
    const t = this.next();
    if (!(t.t === 'op' && t.v === v)) throw new FilterError(`Expected "${v}"`, t.pos);
    return t;
  }
  expectEof(): void {
    if (!this.isOp('eof')) throw new FilterError('Unexpected extra input', this.peek().pos);
  }

  parseExpr(): Node {
    return this.parseOr();
  }
  private parseOr(): Node {
    let a = this.parseAnd();
    while (this.isOp('or')) {
      const pos = this.next().pos;
      a = { k: 'or', a, b: this.parseAnd(), pos };
    }
    return a;
  }
  private parseAnd(): Node {
    let a = this.parseNot();
    while (this.isOp('and')) {
      const pos = this.next().pos;
      a = { k: 'and', a, b: this.parseNot(), pos };
    }
    return a;
  }
  private parseNot(): Node {
    if (this.isOp('not')) {
      const pos = this.next().pos;
      return { k: 'not', a: this.parseNot(), pos };
    }
    return this.parseCmp();
  }
  private parseCmp(): Node {
    const a = this.parseAdd();
    const t = this.peek();
    if (t.t === 'op' && t.v === 'in') {
      this.next();
      const lo = this.parseAdd();
      this.eat('..');
      const hi = this.parseAdd();
      return { k: 'inr', x: a, lo, hi, pos: t.pos };
    }
    if (t.t === 'op' && ['>=', '<=', '>', '<', '==', '!='].includes(t.v as string)) {
      this.next();
      return { k: 'cmp', op: t.v as string, a, b: this.parseAdd(), pos: t.pos };
    }
    return a;
  }
  private parseAdd(): Node {
    let a = this.parsePrimary();
    while (this.isOp('+') || this.isOp('-')) {
      const t = this.next();
      a = { k: 'bin', op: t.v as '+' | '-', a, b: this.parsePrimary(), pos: t.pos };
    }
    return a;
  }
  private parsePrimary(): Node {
    const t = this.next();
    if (t.t === 'num') return { k: 'num', v: t.v as number, pos: t.pos };
    if (t.t === 'op' && t.v === '(') {
      const e = this.parseOr();
      this.eat(')');
      return e;
    }
    if (t.t === 'name') {
      const name = t.v as string;
      if (this.isOp('(')) {
        this.next();
        if (name === 'top') {
          const suit = this.parseSuit();
          this.eat(',');
          const n = this.parseAdd();
          this.eat(')');
          return { k: 'top', suit, n, pos: t.pos };
        }
        if (name === 'has') {
          const suit = this.parseSuit();
          this.eat(',');
          const rank = this.parseRank();
          this.eat(')');
          return { k: 'has', suit, rank, pos: t.pos };
        }
        throw new FilterError(`Unknown function "${t.raw}"`, t.pos);
      }
      const si = SUIT_INDEX[name];
      if (si !== undefined) return { k: 'len', suit: si, pos: t.pos };
      if (name === 'hcp' || name === 'knr' || name === 'controls') return { k: 'var', name, pos: t.pos };
      if (name === 'true') return { k: 'bool', v: true, pos: t.pos };
      if (name === 'false') return { k: 'bool', v: false, pos: t.pos };
      throw new FilterError(`Unknown name "${t.raw}"`, t.pos);
    }
    throw new FilterError(`Unexpected "${String(t.v)}"`, t.pos);
  }
  private parseSuit(): number {
    const t = this.next();
    if (t.t === 'name') {
      const si = SUIT_INDEX[t.v as string];
      if (si !== undefined) return si;
    }
    throw new FilterError('Expected a suit (spades/hearts/diamonds/clubs)', t.pos);
  }
  private parseRank(): number {
    const t = this.next();
    if (t.t === 'num' && Number.isInteger(t.v) && (t.v as number) >= 2 && (t.v as number) <= 10) {
      return t.v as number;
    }
    if (t.t === 'name') {
      const r = RANK_LETTER[t.v as string];
      if (r) return r;
    }
    throw new FilterError('Expected a rank (A/K/Q/J/T or 2-10)', t.pos);
  }
}

// ---- Compiler (type-check + closure generation) ----------------------------

type Kind = 'num' | 'bool';
interface Compiled {
  type: Kind;
  fn: (ctx: HandContext) => number | boolean;
}

function popcount(n: number): number {
  let c = 0;
  while (n) {
    n &= n - 1;
    c++;
  }
  return c;
}

/** Bit mask of the top `n` ranks of a suit (rank 14 down). */
function topMask(n: number): number {
  if (n <= 0) return 0;
  if (n >= 13) return 0x1fff;
  return ((1 << n) - 1) << (13 - n);
}

class Compiler {
  usesKnr = false;
  usesControls = false;

  private num(node: Node): (ctx: HandContext) => number {
    const c = this.compile(node);
    if (c.type !== 'num') throw new FilterError('Expected a number here', node.pos);
    return c.fn as (ctx: HandContext) => number;
  }
  private bool(node: Node): (ctx: HandContext) => boolean {
    const c = this.compile(node);
    if (c.type !== 'bool') {
      throw new FilterError('Expected a yes/no condition here (did you mean a comparison?)', node.pos);
    }
    return c.fn as (ctx: HandContext) => boolean;
  }

  compile(node: Node): Compiled {
    switch (node.k) {
      case 'num':
        return { type: 'num', fn: () => node.v };
      case 'bool':
        return { type: 'bool', fn: () => node.v };
      case 'len':
        return { type: 'num', fn: (ctx) => ctx.len[node.suit] };
      case 'var':
        if (node.name === 'knr') {
          this.usesKnr = true;
          return { type: 'num', fn: (ctx) => ctx.knr };
        }
        if (node.name === 'controls') {
          this.usesControls = true;
          return { type: 'num', fn: (ctx) => ctx.controls };
        }
        return { type: 'num', fn: (ctx) => ctx.hcp };
      case 'top': {
        const n = this.num(node.n);
        const suit = node.suit;
        return { type: 'num', fn: (ctx) => popcount(ctx.mask[suit] & topMask(n(ctx))) };
      }
      case 'has': {
        const bit = 1 << (node.rank - 2);
        const suit = node.suit;
        return { type: 'bool', fn: (ctx) => (ctx.mask[suit] & bit) !== 0 };
      }
      case 'bin': {
        const a = this.num(node.a);
        const b = this.num(node.b);
        return { type: 'num', fn: node.op === '+' ? (ctx) => a(ctx) + b(ctx) : (ctx) => a(ctx) - b(ctx) };
      }
      case 'cmp': {
        const a = this.num(node.a);
        const b = this.num(node.b);
        const op = node.op;
        return { type: 'bool', fn: compareFn(op, a, b) };
      }
      case 'inr': {
        const x = this.num(node.x);
        const lo = this.num(node.lo);
        const hi = this.num(node.hi);
        return { type: 'bool', fn: (ctx) => { const v = x(ctx); return v >= lo(ctx) && v <= hi(ctx); } };
      }
      case 'and': {
        const a = this.bool(node.a);
        const b = this.bool(node.b);
        return { type: 'bool', fn: (ctx) => a(ctx) && b(ctx) };
      }
      case 'or': {
        const a = this.bool(node.a);
        const b = this.bool(node.b);
        return { type: 'bool', fn: (ctx) => a(ctx) || b(ctx) };
      }
      case 'not': {
        const a = this.bool(node.a);
        return { type: 'bool', fn: (ctx) => !a(ctx) };
      }
    }
  }
}

function compareFn(
  op: string,
  a: (ctx: HandContext) => number,
  b: (ctx: HandContext) => number,
): (ctx: HandContext) => boolean {
  switch (op) {
    case '>=': return (ctx) => a(ctx) >= b(ctx);
    case '<=': return (ctx) => a(ctx) <= b(ctx);
    case '>': return (ctx) => a(ctx) > b(ctx);
    case '<': return (ctx) => a(ctx) < b(ctx);
    case '==': return (ctx) => a(ctx) === b(ctx);
    default: return (ctx) => a(ctx) !== b(ctx); // !=
  }
}

// ---- Public API ------------------------------------------------------------

/** Compile a filter source string. Empty source means "no filter". */
export function compileFilter(source: string): FilterCompileResult {
  if (source.trim() === '') return {};
  try {
    const parser = new Parser(tokenize(source));
    const ast = parser.parseExpr();
    parser.expectEof();
    const compiler = new Compiler();
    const root = compiler.compile(ast);
    if (root.type !== 'bool') {
      throw new FilterError('A filter must be a yes/no condition, e.g. "spades >= 5"', 0);
    }
    return {
      filter: {
        predicate: root.fn as (ctx: HandContext) => boolean,
        usesKnr: compiler.usesKnr,
        usesControls: compiler.usesControls,
        source: source.trim(),
      },
    };
  } catch (e) {
    if (e instanceof FilterError) {
      return { error: e.pos != null ? `${e.message} (position ${e.pos + 1})` : e.message };
    }
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

const ACE_BIT = 1 << 12;
const KING_BIT = 1 << 11;

/** Build a HandContext from 13 cards — for tests and standalone evaluation. */
export function buildContext(cards: ArrayLike<Card>): HandContext {
  const len = [0, 0, 0, 0];
  const mask = [0, 0, 0, 0];
  let hcp = 0;
  for (let k = 0; k < cards.length; k++) {
    const card = cards[k];
    hcp += HCP_BY_CARD[card];
    const suit = (card / 13) | 0;
    len[suit]++;
    mask[suit] |= 1 << card % 13;
  }
  let controls = 0;
  for (let s = 0; s < 4; s++) {
    if (mask[s] & ACE_BIT) controls += 2;
    if (mask[s] & KING_BIT) controls += 1;
  }
  return { hcp, knr: knrPoints(cards), controls, len, mask };
}

/** Compile and evaluate a filter against a hand — convenience for tests. */
export function runFilter(source: string, cards: ArrayLike<Card>): boolean {
  const { filter, error } = compileFilter(source);
  if (error) throw new Error(error);
  return filter ? filter.predicate(buildContext(cards)) : true;
}
