/**
 * Flatten the scraped match records (./data/<tourn>/*.jsonl, one match per line)
 * into a small relational set of CSVs — the query-friendly shape for the
 * single-dummy vs double-dummy study and any later analysis.
 *
 * Writes into ./data/<tourn>/:
 *   contracts.csv  one row per played contract (table), denormalised with the
 *                  DD result, residual, declarer & opening-leader players, and
 *                  the declaring side's HCP — most analyses need only this file.
 *   matches.csv    one row per match: teams, VP/IMP, and the eight players.
 *   deals.csv      one row per distinct deal: dealer, vul, PBN, full DD table.
 *   schema.sql     CREATE TABLE + BULK INSERT for all three (MSSQL).
 *
 * Self-contained: depends only on the scraped JSONL. Scope with WBF_TOURN
 * (default "herning25").
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const STRAIN_LABELS = ['S', 'H', 'D', 'C', 'NT'];
const SEATS = ['N', 'E', 'S', 'W'];
const HCP: Record<string, number> = { A: 4, K: 3, Q: 2, J: 1 };

interface NamedId {
  name: string;
  id: number | null;
}
interface Play {
  contract: string;
  level: number;
  strain: number;
  declarer: number;
  doubled: number;
  lead: string;
  auction: string[];
  tricks: number;
  nsPoints: number;
  ewPoints: number;
}
interface MatchBoard {
  board: number;
  dealer: string;
  vul: string;
  pbn: string;
  dd: number[][];
  open: Play | null;
  closed: Play | null;
  impHome: number;
  impAway: number;
}
interface MatchRecord {
  tournament: string;
  event: string;
  stage: string;
  segment: number;
  matchid: number;
  home: NamedId;
  away: NamedId;
  vpHome: number | null;
  vpAway: number | null;
  impHome: number | null;
  impAway: number | null;
  players: { open: Record<string, NamedId | null>; closed: Record<string, NamedId | null> };
  boards: MatchBoard[];
}

function hcpBySeat(pbn: string): number[] {
  return pbn.slice(2).trim().split(/\s+/).map((hand) => {
    let hcp = 0;
    for (const ch of hand) hcp += HCP[ch] ?? 0;
    return hcp;
  });
}

function csvField(v: string | number | null): string {
  const s = v === null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

class Csv {
  private lines: string[];
  constructor(private cols: string[]) {
    this.lines = [cols.join(',')];
  }
  push(row: Record<string, string | number | null>): void {
    this.lines.push(this.cols.map((c) => csvField(row[c] ?? '')).join(','));
  }
  get rows(): number {
    return this.lines.length - 1;
  }
  write(file: string): void {
    writeFileSync(file, this.lines.join('\n') + '\n');
  }
}

/** N/S = home in the open room and away in the closed room (teams swap sides). */
function declaringTeam(room: 'open' | 'closed', declarer: number): 'home' | 'away' {
  const ns = declarer === 0 || declarer === 2;
  return room === 'open' ? (ns ? 'home' : 'away') : ns ? 'away' : 'home';
}

const MATCH_COLS = [
  'tournament', 'event', 'stage', 'segment', 'matchid',
  'home_team', 'home_id', 'away_team', 'away_id',
  'vp_home', 'vp_away', 'imp_home', 'imp_away',
  'open_N', 'open_N_id', 'open_E', 'open_E_id', 'open_S', 'open_S_id', 'open_W', 'open_W_id',
  'closed_N', 'closed_N_id', 'closed_E', 'closed_E_id', 'closed_S', 'closed_S_id', 'closed_W', 'closed_W_id',
];

const DEAL_COLS = [
  'tournament', 'event', 'stage', 'segment', 'board', 'dealer', 'vul',
  ...STRAIN_LABELS.flatMap((s) => SEATS.map((d) => `dd_${s}_${d}`)),
  'pbn',
];

const CONTRACT_COLS = [
  'tournament', 'event', 'stage', 'segment', 'board', 'matchid', 'room',
  'home_team', 'away_team', 'dealer', 'vul',
  'contract', 'level', 'strain', 'doubled',
  'declarer', 'declarer_player', 'declarer_team',
  'leader', 'leader_player', 'lead', 'auction', 'calls',
  'tricks', 'dd_tricks', 'residual', 'result', 'made', 'dd_made',
  'ns_points', 'ew_points', 'score_declarer', 'board_imp_home', 'board_imp_away',
  'decl_hcp', 'pair_hcp', 'pbn',
];

function* matches(dir: string): Generator<MatchRecord> {
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.jsonl') && !f.includes('contracts')).sort()) {
    for (const line of readFileSync(path.join(dir, file), 'utf8').split('\n')) {
      if (line.trim()) yield JSON.parse(line);
    }
  }
}

function emitMatch(csv: Csv, m: MatchRecord): void {
  const row: Record<string, string | number | null> = {
    tournament: m.tournament, event: m.event, stage: m.stage, segment: m.segment, matchid: m.matchid,
    home_team: m.home.name, home_id: m.home.id, away_team: m.away.name, away_id: m.away.id,
    vp_home: m.vpHome, vp_away: m.vpAway, imp_home: m.impHome, imp_away: m.impAway,
  };
  for (const room of ['open', 'closed'] as const) {
    for (const seat of SEATS) {
      const p = m.players[room][seat];
      row[`${room}_${seat}`] = p?.name ?? '';
      row[`${room}_${seat}_id`] = p?.id ?? '';
    }
  }
  csv.push(row);
}

function emitDeal(csv: Csv, m: MatchRecord, b: MatchBoard): void {
  const row: Record<string, string | number | null> = {
    tournament: m.tournament, event: m.event, stage: m.stage, segment: m.segment,
    board: b.board, dealer: b.dealer, vul: b.vul, pbn: b.pbn,
  };
  for (let s = 0; s < STRAIN_LABELS.length; s++) {
    for (let d = 0; d < SEATS.length; d++) row[`dd_${STRAIN_LABELS[s]}_${SEATS[d]}`] = b.dd[s][d];
  }
  csv.push(row);
}

function emitContract(csv: Csv, m: MatchRecord, b: MatchBoard, room: 'open' | 'closed', p: Play, hcp: number[]): void {
  const target = p.level + 6;
  const ddTricks = b.dd[p.strain][p.declarer];
  const leader = (p.declarer + 1) % 4;
  const team = declaringTeam(room, p.declarer);
  const declNS = p.declarer === 0 || p.declarer === 2;
  csv.push({
    tournament: m.tournament, event: m.event, stage: m.stage, segment: m.segment, board: b.board,
    matchid: m.matchid, room, home_team: m.home.name, away_team: m.away.name, dealer: b.dealer, vul: b.vul,
    contract: p.contract, level: p.level, strain: STRAIN_LABELS[p.strain], doubled: p.doubled,
    declarer: SEATS[p.declarer], declarer_player: m.players[room][SEATS[p.declarer]]?.name ?? '', declarer_team: team,
    leader: SEATS[leader], leader_player: m.players[room][SEATS[leader]]?.name ?? '',
    lead: p.lead, auction: p.auction.join(' '), calls: p.auction.length,
    tricks: p.tricks, dd_tricks: ddTricks, residual: p.tricks - ddTricks, result: p.tricks - target,
    made: p.tricks >= target ? 1 : 0, dd_made: ddTricks >= target ? 1 : 0,
    ns_points: p.nsPoints, ew_points: p.ewPoints,
    score_declarer: declNS ? p.nsPoints - p.ewPoints : p.ewPoints - p.nsPoints,
    board_imp_home: b.impHome, board_imp_away: b.impAway,
    decl_hcp: hcp[p.declarer], pair_hcp: hcp[p.declarer] + hcp[(p.declarer + 2) % 4], pbn: b.pbn,
  });
}

function schema(): string {
  const ddCols = STRAIN_LABELS.flatMap((s) => SEATS.map((d) => `  dd_${s}_${d}   int           NOT NULL,`)).join('\n');
  const playerCols = (['open', 'closed'] as const)
    .flatMap((r) => SEATS.flatMap((s) => [`  ${r}_${s}      varchar(40)   NULL,`, `  ${r}_${s}_id   int           NULL,`]))
    .join('\n');
  return `-- MSSQL schema for the WBF championship dataset (single-dummy vs double-dummy).
-- Place the CSVs where SQL Server can read them, then run this file.

IF OBJECT_ID('dbo.wbf_matches', 'U') IS NOT NULL DROP TABLE dbo.wbf_matches;
CREATE TABLE dbo.wbf_matches (
  tournament varchar(16)   NOT NULL,
  event      varchar(4)    NOT NULL,
  stage      varchar(4)    NOT NULL,
  segment    int           NOT NULL,
  matchid    int           NOT NULL,
  home_team  varchar(40)   NOT NULL,
  home_id    int           NULL,
  away_team  varchar(40)   NOT NULL,
  away_id    int           NULL,
  vp_home    float         NULL,
  vp_away    float         NULL,
  imp_home   int           NULL,
  imp_away   int           NULL,
${playerCols}
  CONSTRAINT pk_wbf_matches PRIMARY KEY (matchid, stage)
);
BULK INSERT dbo.wbf_matches FROM 'matches.csv'
WITH (FORMAT='CSV', FIRSTROW=2, FIELDTERMINATOR=',', ROWTERMINATOR='0x0a', TABLOCK);

IF OBJECT_ID('dbo.wbf_deals', 'U') IS NOT NULL DROP TABLE dbo.wbf_deals;
CREATE TABLE dbo.wbf_deals (
  tournament varchar(16)   NOT NULL,
  event      varchar(4)    NOT NULL,
  stage      varchar(4)    NOT NULL,
  segment    int           NOT NULL,
  board      int           NOT NULL,
  dealer     char(1)       NOT NULL,
  vul        varchar(3)    NOT NULL,
${ddCols}
  pbn        varchar(80)   NOT NULL
);
BULK INSERT dbo.wbf_deals FROM 'deals.csv'
WITH (FORMAT='CSV', FIRSTROW=2, FIELDTERMINATOR=',', ROWTERMINATOR='0x0a', TABLOCK);

IF OBJECT_ID('dbo.wbf_contracts', 'U') IS NOT NULL DROP TABLE dbo.wbf_contracts;
CREATE TABLE dbo.wbf_contracts (
  tournament      varchar(16)   NOT NULL,
  event           varchar(4)    NOT NULL,
  stage           varchar(4)    NOT NULL,
  segment         int           NOT NULL,
  board           int           NOT NULL,
  matchid         int           NOT NULL,
  room            varchar(6)    NOT NULL,
  home_team       varchar(40)   NOT NULL,
  away_team       varchar(40)   NOT NULL,
  dealer          char(1)       NOT NULL,
  vul             varchar(3)    NOT NULL,
  contract        varchar(5)    NOT NULL,
  [level]         int           NOT NULL,
  strain          varchar(2)    NOT NULL,
  doubled         int           NOT NULL,
  declarer        char(1)       NOT NULL,
  declarer_player varchar(40)   NULL,
  declarer_team   varchar(5)    NOT NULL,   -- home / away
  leader          char(1)       NOT NULL,
  leader_player   varchar(40)   NULL,
  lead            varchar(3)    NULL,       -- opening lead, e.g. CA
  auction         varchar(255)  NULL,       -- dealer first: "P 1NT P 2D P 3H P P P"
  calls           int           NOT NULL,
  tricks          int           NOT NULL,
  dd_tricks       int           NOT NULL,
  residual        int           NOT NULL,   -- tricks - dd_tricks (human minus DD)
  result          int           NOT NULL,   -- tricks - (level+6)
  made            bit           NOT NULL,
  dd_made         bit           NOT NULL,
  ns_points       int           NOT NULL,
  ew_points       int           NOT NULL,
  score_declarer  int           NOT NULL,   -- points from the declaring side's view
  board_imp_home  int           NOT NULL,
  board_imp_away  int           NOT NULL,
  decl_hcp        int           NOT NULL,
  pair_hcp        int           NOT NULL,
  pbn             varchar(80)   NOT NULL
);
BULK INSERT dbo.wbf_contracts FROM 'contracts.csv'
WITH (FORMAT='CSV', FIRSTROW=2, FIELDTERMINATOR=',', ROWTERMINATOR='0x0a', TABLOCK);

-- Example: how far human declarer play trails double-dummy, by stage.
-- SELECT stage, COUNT(*) n, AVG(CAST(residual AS float)) avg_residual
-- FROM dbo.wbf_contracts GROUP BY stage ORDER BY stage;
`;
}

export function runFlatten(): void {
  const tourn = (process.env.WBF_TOURN ?? 'herning25').trim();
  const dir = path.join(import.meta.dirname, 'data', tourn);
  if (!existsSync(dir)) throw new Error(`no data dir ${dir} — run the scrape first`);

  const matchCsv = new Csv(MATCH_COLS);
  const dealCsv = new Csv(DEAL_COLS);
  const contractCsv = new Csv(CONTRACT_COLS);
  const seenDeal = new Set<string>();
  let residualSum = 0;

  for (const m of matches(dir)) {
    emitMatch(matchCsv, m);
    for (const b of m.boards) {
      const dealKey = `${m.event}|${m.stage}|${m.segment}|${b.board}`;
      if (!seenDeal.has(dealKey)) {
        seenDeal.add(dealKey);
        emitDeal(dealCsv, m, b);
      }
      const hcp = hcpBySeat(b.pbn);
      for (const room of ['open', 'closed'] as const) {
        const p = b[room];
        if (!p) continue;
        emitContract(contractCsv, m, b, room, p, hcp);
        residualSum += p.tricks - b.dd[p.strain][p.declarer];
      }
    }
  }

  matchCsv.write(path.join(dir, 'matches.csv'));
  dealCsv.write(path.join(dir, 'deals.csv'));
  contractCsv.write(path.join(dir, 'contracts.csv'));
  writeFileSync(path.join(dir, 'schema.sql'), schema());
  console.log(`${tourn}: ${matchCsv.rows} matches, ${dealCsv.rows} deals, ${contractCsv.rows} contracts`);
  console.log(`  mean residual ${(residualSum / contractCsv.rows).toFixed(3)} tricks → contracts.csv / matches.csv / deals.csv / schema.sql`);
}
