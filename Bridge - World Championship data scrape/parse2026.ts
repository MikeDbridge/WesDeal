/**
 * Parsers for the redesigned WBF microsite template ("DesignSystem" CSS classes)
 * introduced for the 2026 World Bridge Series (Katowice) — the four world-title
 * knockouts (Rosenblum Cup / Open Teams, Mixed Teams, Women Teams, Senior Teams).
 * Same site family as parse.ts's `classic` pages (worldbridge.org), but the HTML
 * shape changed completely: card-grid deals, a combined contract+declarer
 * <label>, one signed score per room instead of separate NS/EW columns, an
 * inline (not hover-tooltip) bidding panel, and eurobridge.org player links with
 * no first-party player/team id.
 *
 * Reuses parse.ts's small HTML primitives (symbolize/stripTags/decode/intOf/
 * cleanRanks/normVul) and, where the underlying token grammar is unchanged,
 * whole parsers (parseAuction, parseContractCell, parseMatchIds — the last is
 * called directly on the classic export from scrape.ts, since the knockoutphase
 * match-id link pattern didn't change).
 *
 * Page types (see scrape.ts for how these compose into a scrape):
 *   HandsAcrossKO.asp?qtournid=T&qround=S&qphase=P → the deals of segment S
 *   BoardDetailsKO.asp?qmatchid=M&qphase=P         → both rooms: teams,
 *                                                    players, contract, full
 *                                                    inline auction, lead,
 *                                                    tricks, score
 *   knockoutphase.asp?qtournid=T&qphase=P          → match-segment ids
 *                                                    (parse with parse.ts's
 *                                                    parseMatchIds — unchanged)
 *
 * Per-board IMPs are not exposed by the page as clean home/away columns (only a
 * single-sided bar value) — see parseResults2026 for how they're computed and
 * cross-checked instead.
 */

import {
  cleanRanks,
  decode,
  intOf,
  normVul,
  parseAuction,
  parseContractCell,
  SEAT_INDEX,
  STRAIN_LABELS,
  stripTags,
  symbolize,
  type BoardResult,
  type Deal,
  type Lineup,
  type MatchMeta,
  type NamedId,
  type Play,
  type Seat,
} from './parse';
import { toImps } from '../research/bidding/score';

// ---- Shared: seat-labelled compass blocks -----------------------------------

/**
 * Both the hand-record deal cards and the BoardDetailsKO line-ups lay out their
 * four seats as sibling `<div class="pos-n">`/`pos-w`/`pos-x`(centre icon)/
 * `pos-e`/`pos-s` blocks with NO nesting between seats — unlike the classic
 * template, the seat is labelled directly in the class, so no positional
 * (N top, W mid-left…) inference is needed. Scan marker positions and slice
 * between them (same technique as parse.ts's parseHands board-header scan) so
 * we don't have to balance nested tags with regex.
 */
function seatChunks(html: string): Partial<Record<Seat, string>> {
  const markers: { seat: Seat; at: number }[] = [];
  const re = /class="pos-([news])(?=[\s"])/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) markers.push({ seat: m[1].toUpperCase() as Seat, at: m.index });
  const chunks: Partial<Record<Seat, string>> = {};
  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].at;
    const end = i + 1 < markers.length ? markers[i + 1].at : html.length;
    chunks[markers[i].seat] = html.slice(start, end);
  }
  return chunks;
}

// ---- Deals -------------------------------------------------------------------

/**
 * A void suit is rendered as an en-dash entity (`&#8211;`) rather than left
 * blank as in the classic template. Left undropped, its digits ("8211") would
 * be mistaken for rank characters by cleanRanks (2 and 8 are valid ranks) — so
 * strip it before rank extraction, not after.
 */
function parseHandCell2026(handHtml: string): string {
  const flat = decode(stripTags(symbolize(handHtml))).replace(/&#8211;|&#8212;|&ndash;|&mdash;/g, '');
  const holding: Record<string, string> = { S: '', H: '', D: '', C: '' };
  const re = /([SHDC])([^SHDC]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(flat)) !== null) holding[m[1]] = cleanRanks(m[2]);
  return `${holding.S}.${holding.H}.${holding.D}.${holding.C}`;
}

/**
 * Parse a HandsAcrossKO page into board number → deal. Each board is a
 * `.deal-card` with `.dc-brd` (board number, linking to BoardAcrossKO) and
 * `.dc-info` ("Dealer <b>North</b><br><b>None</b> vulnerable") ahead of the
 * seat-labelled compass grid.
 */
export function parseHands2026(html: string): Map<number, Deal> {
  const out = new Map<number, Deal>();
  const starts: number[] = [];
  const cardRe = /<div class="deal-card">/g;
  let cm: RegExpExecArray | null;
  while ((cm = cardRe.exec(html)) !== null) starts.push(cm.index);

  for (let i = 0; i < starts.length; i++) {
    const block = html.slice(starts[i], i + 1 < starts.length ? starts[i + 1] : html.length);
    const boardM = block.match(/class="dc-brd"[^>]*>(\d+)</i);
    const infoM = block.match(/Dealer\s*<b>(North|East|South|West)<\/b><br>\s*<b>([^<]*)<\/b>\s*vulnerable/i);
    if (!boardM || !infoM) continue;

    const chunks = seatChunks(block);
    const handOf = (seat: Seat): string | null => {
      const chunk = chunks[seat];
      const hm = chunk?.match(/<div class="hand">([\s\S]*?)<\/div>\s*<\/div>/i);
      return hm ? parseHandCell2026(hm[1]) : null;
    };
    const north = handOf('N');
    const east = handOf('E');
    const south = handOf('S');
    const west = handOf('W');
    if (north == null || east == null || south == null || west == null) continue;

    out.set(Number(boardM[1]), {
      dealer: infoM[1][0].toUpperCase(),
      vul: normVul(infoM[2]),
      pbn: `N:${north} ${east} ${south} ${west}`, // PBN order N E S W
    });
  }
  return out;
}

// ---- Match metadata: teams, players, IMP --------------------------------------

/** The KO segment a BoardDetailsKO page belongs to, from its "Hand records"
 *  link. Same idea as parse.ts's parseKoSegment, but that page's link encodes
 *  entities (`&amp;`) where the classic template used a raw `&`, so the
 *  original regex doesn't match — hence a dedicated version here. */
export function parseKoSegment2026(html: string): number | null {
  const m = html.match(/HandsAcrossKO\.asp\?qtournid=\d+&amp;qround=(\d+)/i);
  return m ? Number(m[1]) : null;
}

/** A player's name + id from one seat's slice of a `.lineups` block. The only
 *  id available is the eurobridge.org profile's `qryid` — there is no
 *  first-party player id on this template (unlike the classic microsite's own
 *  `qryid=` results-site links, which happen to share the same param name). */
function playerFromChunk(chunk: string | undefined): NamedId | null {
  if (!chunk) return null;
  const m = chunk.match(/qryid=(\d+)"[^>]*>[\s\S]*?<span class="pn">([^<]*)<\/span>/i);
  if (!m) return null;
  const id = /^\d+$/.test(m[1]) ? Number(m[1]) : null;
  return { name: decode(m[2]).trim(), id };
}

/**
 * Parse a BoardDetailsKO header into teams, IMP and the eight players. Unlike
 * the classic template, seats are labelled directly (pos-n/w/e/s inside a
 * `.lineup` block headed "Open Room" / "Closed Room"), so no anchor-order
 * inference is needed, and team links carry no id at all (they route to
 * knockoutphase.asp, not a per-team page) — team id is always null.
 *
 * VP is not attempted: every 2026 tournament wired to this format is knockout
 * -only (no round-robin page has been seen in this template to verify a VP
 * pattern against), so vpHome/vpAway are always null, matching how the classic
 * parser already treats knockout pages.
 */
export function parseMatchMeta2026(html: string): MatchMeta {
  const teamM = html.match(
    /<span class="team home">\s*<a[^>]*>([^<]*)<\/a>[\s\S]*?<span class="team vis">\s*<a[^>]*>([^<]*)<\/a>/i,
  );
  const home: NamedId = { name: teamM ? decode(teamM[1]).trim() : '', id: null };
  const away: NamedId = { name: teamM ? decode(teamM[2]).trim() : '', id: null };

  const totalsM = html.match(/<div class="totals"><b>(-?\d+)\s*-\s*(-?\d+)<\/b>\s*IMP<\/div>/i);
  const impHome = totalsM ? Number(totalsM[1]) : null;
  const impAway = totalsM ? Number(totalsM[2]) : null;

  const openIdx = html.indexOf('<h4>Open Room</h4>');
  const closedIdx = html.indexOf('<h4>Closed Room</h4>');
  const endIdx = html.indexOf('<div class="legendrow">', closedIdx >= 0 ? closedIdx : 0);
  const openBlock = openIdx >= 0 ? html.slice(openIdx, closedIdx >= 0 ? closedIdx : html.length) : '';
  const closedBlock = closedIdx >= 0 ? html.slice(closedIdx, endIdx >= 0 ? endIdx : html.length) : '';

  const toLineup = (block: string): Lineup => {
    const chunks = seatChunks(block);
    return {
      N: playerFromChunk(chunks.N),
      E: playerFromChunk(chunks.E),
      S: playerFromChunk(chunks.S),
      W: playerFromChunk(chunks.W),
    };
  };

  return {
    home,
    away,
    vpHome: null,
    vpAway: null,
    impHome,
    impAway,
    open: toLineup(openBlock),
    closed: toLineup(closedBlock),
  };
}

// ---- Per-table results: contract, auction, lead, tricks, score ---------------

/** One room's play from its `.room.open` / `.room.closed` slice of a
 *  board-card, plus that board-card's already-matched auction for the room. */
function parsePlay2026(roomHtml: string, auction: string[]): Play | null {
  const labelM = roomHtml.match(/<label[^>]*class="ctrl">([\s\S]*?)<\/label>/i);
  if (!labelM) return null;
  const inner = labelM[1];
  const declM = inner.match(/<span class="decl">([NESW])<\/span>/i);
  if (!declM || declM.index == null) return null; // e.g. a passed-out board — no declarer, nothing to record

  const contract = parseContractCell(inner.slice(0, declM.index));
  if (!contract) return null;

  const leadM = roomHtml.match(/<div class="cell lead">[\s\S]*?<span class="cv">([\s\S]*?)<\/span>/i);
  const lead = leadM ? decode(stripTags(symbolize(leadM[1]))).replace(/\s+/g, '') : '';

  const tricksM = roomHtml.match(/<div class="cell tricks">[\s\S]*?<span class="cv">([^<]*)<\/span>/i);
  if (!tricksM) return null;
  const tricks = intOf(tricksM[1]);

  const scoreM = roomHtml.match(/<div class="cell score">[\s\S]*?<span class="cv score[^"]*">([^<]*)<\/span>/i);
  const score = scoreM ? intOf(scoreM[1]) : 0; // signed, N-S perspective (+ NS gained, − EW gained)

  return {
    contract: `${contract.level}${STRAIN_LABELS[contract.strain]}${'x'.repeat(contract.doubled)}`,
    level: contract.level,
    strain: contract.strain,
    declarer: SEAT_INDEX[declM[1].toUpperCase()],
    doubled: contract.doubled,
    lead,
    auction,
    tricks,
    nsPoints: score > 0 ? score : 0,
    ewPoints: score < 0 ? -score : 0,
  };
}

/** One board's computed-vs-page IMP cross-check (see parseResults2026). */
export interface ImpCheck {
  board: number;
  computedHome: number;
  computedAway: number;
  pageHome: number;
  pageAway: number;
  agree: boolean;
}

/**
 * Parse a BoardDetailsKO page into board number → both rooms, plus a per-board
 * IMP cross-check list.
 *
 * The page shows one combined signed score per room (N-S perspective: + = NS
 * gained, − = EW gained — verified against the standard team-match seating,
 * N/S home in the open room / away in the closed room, both by hand on several
 * boards and by the `sc-home`/`sc-vis` class the page itself attaches, which
 * tracks the *team* credited regardless of the number's raw sign) rather than
 * the classic template's separate NS/EW point columns, AND it shows only a
 * single-sided IMP bar value per board (`.imp-h`/`.imp-v`) rather than the
 * classic template's two dedicated home/away IMP columns. So per-board IMPs
 * are computed here from the two rooms' nsPoints/ewPoints with toImps (see
 * research/bidding/score.ts), the same scoring module the bidding-comparison
 * research uses, rather than trusted directly off the page — and cross-checked
 * against the page's own imp-h/imp-v figures. In sampling across several
 * matches this agreed 100% of the time; the computed value is what's returned,
 * and any disagreement is both logged and reported in the impChecks list so a
 * caller can print an aggregate agreement rate.
 */
export function parseResults2026(html: string): { results: Map<number, BoardResult>; impChecks: ImpCheck[] } {
  const results = new Map<number, BoardResult>();
  const impChecks: ImpCheck[] = [];

  const starts: number[] = [];
  const cardRe = /<div class="board-card">/g;
  let cm: RegExpExecArray | null;
  while ((cm = cardRe.exec(html)) !== null) starts.push(cm.index);

  for (let i = 0; i < starts.length; i++) {
    const block = html.slice(starts[i], i + 1 < starts.length ? starts[i + 1] : html.length);
    const boardM = block.match(/class="brd"[^>]*>Brd\s*(\d+)</i);
    if (!boardM) continue;
    const board = Number(boardM[1]);

    const openIdx = block.indexOf('class="room open"');
    const closedIdx = block.indexOf('class="room closed"');
    const panelIdx = block.indexOf('class="bidpanel"');
    if (openIdx < 0 || closedIdx < 0) continue;
    const openBlock = block.slice(openIdx, closedIdx);
    const closedBlock = block.slice(closedIdx, panelIdx >= 0 ? panelIdx : block.length);
    const panelBlock = panelIdx >= 0 ? block.slice(panelIdx) : '';

    let openAuction: string[] = [];
    let closedAuction: string[] = [];
    for (const bm of panelBlock.matchAll(/<div class="bidcol-h">([^<]*)<\/div>\s*<table>([\s\S]*?)<\/table>/gi)) {
      const heading = bm[1].toLowerCase();
      const calls = parseAuction(bm[2]);
      if (heading.includes('open')) openAuction = calls;
      else if (heading.includes('closed')) closedAuction = calls;
    }

    const open = parsePlay2026(openBlock, openAuction);
    const closed = parsePlay2026(closedBlock, closedAuction);

    let impHome = 0;
    let impAway = 0;
    if (open && closed) {
      // Home is N-S in the open room, E-W in the closed room (standard KO
      // seating) — see declaringTeam in flatten.ts for the same convention.
      const homeDiff = open.nsPoints - open.ewPoints - (closed.nsPoints - closed.ewPoints);
      const imps = toImps(homeDiff);
      impHome = Math.max(imps, 0);
      impAway = Math.max(-imps, 0);

      const impM = block.match(/<span class="imp-h">([^<]*)<\/span>[\s\S]*?<span class="imp-v">([^<]*)<\/span>/i);
      const pageHome = impM ? intOf(impM[1]) : 0;
      const pageAway = impM ? intOf(impM[2]) : 0;
      const agree = pageHome === impHome && pageAway === impAway;
      impChecks.push({ board, computedHome: impHome, computedAway: impAway, pageHome, pageAway, agree });
      if (!agree) {
        console.warn(
          `parse2026: IMP mismatch board ${board}: computed ${impHome}-${impAway}, page shows ${pageHome}-${pageAway}`,
        );
      }
    }

    results.set(board, { open, closed, impHome, impAway });
  }

  return { results, impChecks };
}
