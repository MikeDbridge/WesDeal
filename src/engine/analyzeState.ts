/**
 * WesPlay (analyze.html) state: the whole analyser position — hands, dealer,
 * vulnerability, contract and the cards played so far — encoded in the URL
 * hash (`#d=…`) as JSON → UTF-8 → base64url, following the `#s=` pattern of
 * the deal generator (shareState.ts).
 *
 * The URL being the state is the page's growth spine: the import panel, other
 * pages and shared links all feed the analyser the same way, any position can
 * be bookmarked or sent, and nothing needs a server.
 */

import { SEATS, type Seat } from './deal';
import type { Vulnerability } from './board';
import { bytesToB64Url, b64UrlToBytes } from './shareState';

export interface AnalyzeState {
  v: 1;
  /** Per-seat holdings in PBN suit order, e.g. "AKQ2.54.T987.J32" (♠.♥.♦.♣). */
  hands: Record<Seat, string>;
  dealer: Seat;
  vul: Vulnerability;
  /** Contract without declarer, e.g. "4S", "3NT", "4Sx", "4Sxx". */
  contract?: string;
  declarer?: Seat;
  /** Cards played so far in play order, 2 chars each ("SK" = ♠K, T for ten). */
  play?: string;
}

const VULS = new Set<string>(['None', 'NS', 'EW', 'Both']);
const CONTRACT_RE = /^[1-7](NT|[SHDC])(x{0,2})$/i;
const PLAY_RE = /^(?:[SHDC][AKQJT98765432])*$/;

export function encodeAnalyzeState(state: AnalyzeState): string {
  return bytesToB64Url(new TextEncoder().encode(JSON.stringify(state)));
}

/** Decode a `#d=` blob; returns null on anything malformed. */
export function decodeAnalyzeState(encoded: string): AnalyzeState | null {
  try {
    const json = new TextDecoder().decode(b64UrlToBytes(encoded));
    const obj = JSON.parse(json) as unknown;
    return isAnalyzeState(obj) ? obj : null;
  } catch {
    return null;
  }
}

function isAnalyzeState(x: unknown): x is AnalyzeState {
  if (typeof x !== 'object' || x === null) return false;
  const o = x as Record<string, unknown>;
  if (o.v !== 1) return false;
  const hands = o.hands;
  if (typeof hands !== 'object' || hands === null) return false;
  for (const seat of SEATS) {
    if (typeof (hands as Record<string, unknown>)[seat] !== 'string') return false;
  }
  if (!SEATS.includes(o.dealer as Seat)) return false;
  if (!VULS.has(o.vul as string)) return false;
  if (o.contract !== undefined && !(typeof o.contract === 'string' && CONTRACT_RE.test(o.contract))) return false;
  if (o.declarer !== undefined && !SEATS.includes(o.declarer as Seat)) return false;
  if (o.play !== undefined && !(typeof o.play === 'string' && PLAY_RE.test(o.play))) return false;
  return true;
}

/** The declaring side's vulnerability under `vul` (for scoring). */
export function sideVulnerable(vul: Vulnerability, declarer: Seat): boolean {
  if (vul === 'Both') return true;
  if (vul === 'None') return false;
  const ns = declarer === 'N' || declarer === 'S';
  return vul === 'NS' ? ns : !ns;
}

/** DDS vulnerability code (0 none, 1 both, 2 NS, 3 EW) for DealerPar. */
export function ddsVulnerability(vul: Vulnerability): number {
  return vul === 'None' ? 0 : vul === 'Both' ? 1 : vul === 'NS' ? 2 : 3;
}
