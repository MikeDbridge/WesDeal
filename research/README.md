# Double-dummy research pipeline

Generates random deals, solves full double-dummy tables (Bo Haglund's DDS via
WASM, 8 processes in parallel), stores them as JSONL, and analyses hand-
evaluation accuracy. Runs entirely on this machine.

**Speed guide:** full 20-cell tables ≈ 20–25 deals/sec ≈ 80k/hour ≈ ~2M/day.
Datasets are tiny (~150 bytes/deal). The browser page (WesLab) is the
point-and-click front end; this CLI is for big/overnight library building.

## Recipes (PowerShell, from the repo root)

Quick sample (4,000 deals, ~3 min):

```powershell
$env:RESEARCH_FILTER='ntish'; $env:RESEARCH_DEALS='500'
npm run research:gen
npm run research:analyze     # writes research\report.md
```

Big run (72,000 deals, ~55 min):

```powershell
$env:RESEARCH_FILTER='ntish'; $env:RESEARCH_DEALS='9000'
npm run research:gen
```

Grow the library with a NEW run (fresh deals, files accumulate):

```powershell
$env:RESEARCH_FILTER='ntish'; $env:RESEARCH_DEALS='9000'; $env:RESEARCH_RUN='1'
npm run research:gen         # adds deals-f0-r1.jsonl … deals-f7-r1.jsonl
```

Interrupted? Just re-run the same command — shards append line-by-line and
resume where they stopped. `RESEARCH_DEALS` is a *target per shard*: re-running
with the same value is a no-op; a larger value extends the same deal stream.

Uniform (unfiltered) deals: omit `RESEARCH_FILTER`. These feed the
population-share statistics and the training pool.

## Knobs

| env var | meaning | default |
|---|---|---|
| `RESEARCH_DEALS` | target deals **per shard** (×8 shards) | 500 |
| `RESEARCH_FILTER` | `ntish` = both N & S in the study population | off |
| `RESEARCH_RUN` | run id — new seed stream + new filenames | 0 |

## Conventions

- Data lives in `research/data/*.jsonl` (gitignored), one deal per line:
  `{ pbn, dd }` with `dd[strain][declarer]`, strain 0=♠ 1=♥ 2=♦ 3=♣ 4=NT,
  declarer 0=N 1=E 2=S 3=W.
- **Train/test split:** shards 6 and 7 of every run are held out as the test
  set; never fit anything on them.
- Seeds are fixed per (filter, run, shard), so any dataset is reproducible.
- The study-population rules (shapes, 1M-route exclusion) live in
  `src/engine/study.ts` — shared with the WesLab page, one definition.
- WesLab's "Download JSONL (research format)" (full-table runs only) produces
  this exact format. For clean statistics prefer CLI runs for the library, and
  treat WesLab exports as archives of interactive sessions.

## Analysis

`npm run research:analyze` reads everything in `research/data/` and writes
`research/report.md`: method comparison on the held-out test set (HCP,
BUM-RAP, Kaplan-Rubens, controls, fitted evaluators), fitted per-card values,
and the eyeball tables (trick distributions, 3NT vs 4M, shape/doubleton/tens/
aces angles).
