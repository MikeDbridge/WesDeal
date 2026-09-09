# Bridge — World Championship data scrape

Scrapes the World Bridge Federation results microsites into a rich, query-ready
dataset: every board of the team championships, with the deal, the full result
at both tables (contract, declarer, opening lead, and — where the site has it —
the complete auction), the teams and the eight players by seat, the scores and
IMPs, **and** the double-dummy table for every deal.

The headline use is comparing real ("single-dummy") human play against
double-dummy ground truth, but the dataset captures everything the pages expose
so it supports much more (player/team analysis, lead stats, bidding, scoring).

## What's covered

Thirteen championships plus two transnationals, 2017–2026 (~567k contracts / 35k
deals). See `TOURNAMENTS` in `scrape.ts`.

- **World Team Championships** (`worldbridge.org`, codes `BB/VC/DOT/WUC`, RR +
  knockout QF/SF/FF): `lyon17` (3 events, no Mixed), `wuhan19`, `salso22`
  (Salsomaggiore, the postponed "2021" edition), `marrakech23`, `herning25`.
- **World Bridge Series** (`worldbridge.org`, Katowice 2026, redesigned
  microsite template — see "Page formats" below): the four open-entry world
  knockout titles, each scraped knockout-only (`rrTournid: 0` — the qualifying
  stage isn't published in this template): `katowice26` (Rosenblum Cup / Open
  Teams, phases 64→FF), `katowice26mx` (Mixed Teams, 32→FF), `katowice26w`
  (Women Teams, QF→FF), `katowice26s` (Senior Teams, QF→FF).
- **Transnational Open Teams** (code `TNOT`): the open field that runs alongside
  the world/European championship — a large mixed-strength Swiss qualifier then a
  knockout. We scrape only the **knockout finals** (phase `16` = Round of 16,
  then `QF/SF/FF`); `rrTournid: 0` skips the Swiss. World (`worldbridge.org`, KO
  tournid = team Bermuda-Bowl KO id + 7): `herning25tn` (bidding present),
  `marrakech23tn` (contracts only — 2023 transnational recorded no auctions).
  European Open Championships (`eurobridge.org`): `strasbourg23tn` (2023),
  `prague26tn` (2026) — both with bidding. Other divisions (Women/Senior/Mixed
  transnational) live at neighbouring tournids if wanted.
- **European Team Championships** (`eurobridge.org`, codes `OPEN/WOMEN/SEN/MIX`,
  **round-robin only**, long variable round counts): `ostend18` (3 events),
  `madeira22`, `euchamp24` (Herning), `riga26`.
- **Events**: the four national/world team divisions — Open, Women, Seniors,
  Mixed — plus the Open transnational. Not pairs / BAM. (Division-code map across
  the two naming schemes: BB=OPEN, VC=WOMEN, DOT=SEN, WUC=MIX.)
- **US — USBF USBC** (`usbf.org`, code `usbc26`, ingested by `usbf.ts` not the
  WBF scraper): the US Bridge Championships publish LoveBridge **PBN** files (one
  per round / KO segment) with full `[Deal]` + `[Auction]` + `[Play]` + per-seat
  players + `[Room]`/`[Table]`. A match = (Round|segment, Table) with Open+Closed
  rooms. Full auctions (a different US system population); DD is solved locally
  (not in the file). PBN deals rotate their leading seat — normalised to
  North-first on ingest. `npm run bridge:usbf` (env `USBF_PAGE`/`USBF_TOURN`/
  `USBF_EVENTS`), then `WBF_TOURN=usbc26 npm run bridge:flatten`.
- **US NABC knockouts** (BBO vugraph LIN, `vanderbilt25`/`spingold25`/`soloway25`,
  ingested by `lin.ts`): the strong US teams KOs (Round of 32 onward is nearly
  Bermuda-Bowl strength). The vugraph archive is searched (POST) and each hit's
  `.lin` fetched; one LIN carries both rooms of a segment with full `mb|` auctions.
  Deals (S/W/N/E order, digit dealer) are normalised to North-first; contract/
  declarer derived from the auction. `npm run bridge:lin` (env `LIN_SEARCH`
  ';'-separated queries, `LIN_TOURN`), then `WBF_TOURN=<key> npm run bridge:flatten`.
  Reisinger excluded (board-a-match scoring).
- **Bidding**: present in newer sites (2025, and all knockouts), all USBF PBN, and
  all BBO-LIN NABC KOs; the older round-robins (2017–2023) carry no auctions — the
  deal source is auto-detected.
- **Page formats**: `Tournament.pageFormat` selects the parser set — `'classic'`
  (default, `parse.ts`) for every worldbridge.org/eurobridge.org microsite through
  2025, or `'cards2026'` (`parse2026.ts`) for the redesigned template introduced
  for Katowice 2026 (card-grid hand records, a combined contract+declarer label,
  one signed score per room instead of separate NS/EW columns, and an inline
  rather than hover-tooltip bidding panel). Both parser sets produce the same
  `MatchRecord`/`MatchBoard`/`Play` shape, so `scrape.ts`'s orchestration,
  `flatten.ts`, and every downstream reader are unaware which template a
  tournament uses. The `cards2026` template shows only a single-sided per-board
  IMP bar value, not the classic template's separate home/away columns, so
  `parse2026.ts` computes each board's IMPs itself from the two rooms' recorded
  scores (`toImps` from `research/bidding/score.ts`) and cross-checks the result
  against the page's own figure, logging any disagreement (`scrape.ts` prints an
  aggregate agreement rate at the end of the run — 100% across every match
  sampled while building this).
- **Combined data**: `data/_all/{contracts,matches,deals}.csv` concatenates every
  tournament (each row carries its `tournament` + `event`) for a single load.
  Rebuilt by hand after adding a tournament — concatenate each `data/<tourn>/`
  CSV, keeping one header (there is no `_all` build script).

## Running it

```
npm run bridge:test      # parser unit tests (fixtures, no network)
npm run bridge:scrape    # fetch → per-match JSONL in data/<tourn>/
npm run bridge:flatten   # JSONL → CSVs + schema.sql in data/<tourn>/
```

Scope via environment variables:

| var | default | meaning |
|-----|---------|---------|
| `WBF_TOURN`     | `herning25`     | tournament key |
| `WBF_EVENTS`    | all four        | e.g. `BB,VC` |
| `WBF_RR_ROUNDS` | `1-23`          | round spec: `1`, `1-23`, `1,3,5-7`, or `""` to skip |
| `WBF_KO_PHASES` | tournament's    | e.g. `QF,SF,FF`, or `""` to skip |

Example — just the 2023 Bermuda Bowl round-robin:

```
WBF_TOURN=marrakech23 WBF_EVENTS=BB WBF_KO_PHASES="" npm run bridge:scrape
```

Raw HTML is cached under `cache/<tourn>/` (a 300 ms delay throttles fetching),
so re-runs are instant and never re-hit the server. Both `cache/` and `data/`
are gitignored. A stage file that already exists is skipped, so an interrupted
scrape resumes.

## Output

`data/<tourn>/` holds per-stage JSONL (one match per line) and, after flatten,
three CSVs plus `schema.sql` (MSSQL `CREATE TABLE` + `BULK INSERT`):

- **contracts.csv** — one row per played contract (table). Denormalised: the
  deal, contract, auction, lead, tricks, **dd_tricks**, **residual**
  (`tricks − dd_tricks`, human minus double-dummy), the declarer & opening-leader
  players, declaring team, scores/IMPs, and the declaring side's HCP. Most
  analyses need only this file.
- **matches.csv** — one row per match: teams (+ids), VP/IMP, and the eight
  players (name + id) by room and seat.
- **deals.csv** — one row per distinct deal: dealer, vulnerability, PBN, and the
  full 5×4 double-dummy table (`dd_<strain>_<seat>`).

## How it works (and the non-obvious bits)

- **Seat mapping.** Classic-template hand diagrams have no seat labels; position
  fixes them (N top, W mid-left, E mid-right, S bottom → PBN in N E S W order).
  Verified two ways: the bidding (board 1's mid-right hand is the 15-HCP 1NT
  opener = East) and DD agreeing with real results (residuals centre on 0). The
  `cards2026` template labels each compass position directly in its CSS class
  (`pos-n`/`pos-w`/`pos-e`/`pos-s`), so `parse2026.ts` reads seats off that
  instead of position.
- **Auctions** are pulled out of each contract cell's hover tooltip (`cards2026`:
  an inline bidding panel, same W-N-E-S / "-" pad / token grammar), normalised
  to dealer-first calls (`P` `X` `XX` `1NT` `2D`…). Validated: for every 2025 and
  every `cards2026` contract, the auction's final bid equals the stated contract.
- **Large positive residuals are real, not bugs.** Declarers can beat
  double-dummy when defenders miss the DD defence (e.g. failing to draw trumps,
  letting a long side-suit run). Each row's score cross-checks the contract+tricks.
- **DD** is solved once per distinct deal (memoised by PBN) via `bridge-dds`.
- **`declarer_team`** uses the standard team-match seating: N/S is the home team
  in the open room and the away team in the closed room.

## Files

| file | role |
|------|------|
| `parse.ts`    | pure HTML parsers for the classic (pre-2026) template |
| `parse2026.ts`| pure HTML parsers for the `cards2026` template (Katowice 2026); reuses parse.ts's small HTML primitives and auction/contract-cell parsers |
| `scrape.ts`   | cached fetch + DD + per-match JSONL; `TOURNAMENTS` config; picks the parser set per `pageFormat` |
| `flatten.ts`  | JSONL → contracts/matches/deals CSV + `schema.sql` |
| `*.task.ts`   | vitest entry points for scrape / flatten |
| `tests/`      | parser tests + real-HTML fixtures |

## TODO

- Optional: emit a SQLite file directly (currently CSV + MSSQL schema only).
