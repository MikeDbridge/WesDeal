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

Nine championships, 2017–2026 (~324k contracts / 18k deals). See `TOURNAMENTS`
in `scrape.ts`.

- **World Team Championships** (`worldbridge.org`, codes `BB/VC/DOT/WUC`, RR +
  knockout QF/SF/FF): `lyon17` (3 events, no Mixed), `wuhan19`, `salso22`
  (Salsomaggiore, the postponed "2021" edition), `marrakech23`, `herning25`.
- **European Team Championships** (`eurobridge.org`, codes `OPEN/WOMEN/SEN/MIX`,
  **round-robin only**, long variable round counts): `ostend18` (3 events),
  `madeira22`, `euchamp24` (Herning), `riga26`.
- **Events**: the four national/world team divisions — Open, Women, Seniors,
  Mixed. Not pairs / transnational / BAM. (Division-code map across the two
  naming schemes: BB=OPEN, VC=WOMEN, DOT=SEN, WUC=MIX.)
- **Bidding**: present in newer sites (2025, and all knockouts); the older
  round-robins (2017–2023) carry no auctions — the deal source is auto-detected.
- **Combined data**: `data/_all/{contracts,matches,deals}.csv` concatenates every
  tournament (each row carries its `tournament` + `event`) for a single load.

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

- **Seat mapping.** Hand diagrams have no seat labels; position fixes them
  (N top, W mid-left, E mid-right, S bottom → PBN in N E S W order). Verified two
  ways: the bidding (board 1's mid-right hand is the 15-HCP 1NT opener = East)
  and DD agreeing with real results (residuals centre on 0).
- **Auctions** are pulled out of each contract cell's hover tooltip, normalised
  to dealer-first calls (`P` `X` `XX` `1NT` `2D`…). Validated: for every 2025
  contract, the auction's final bid equals the stated contract.
- **Large positive residuals are real, not bugs.** Declarers can beat
  double-dummy when defenders miss the DD defence (e.g. failing to draw trumps,
  letting a long side-suit run). Each row's score cross-checks the contract+tricks.
- **DD** is solved once per distinct deal (memoised by PBN) via `bridge-dds`.
- **`declarer_team`** uses the standard team-match seating: N/S is the home team
  in the open room and the away team in the closed room.

## Files

| file | role |
|------|------|
| `parse.ts`    | pure HTML parsers (deals, results, teams/players, auctions) |
| `scrape.ts`   | cached fetch + DD + per-match JSONL; `TOURNAMENTS` config |
| `flatten.ts`  | JSONL → contracts/matches/deals CSV + `schema.sql` |
| `*.task.ts`   | vitest entry points for scrape / flatten |
| `tests/`      | parser tests + real-HTML fixtures |

## TODO

- Optional: emit a SQLite file directly (currently CSV + MSSQL schema only).
