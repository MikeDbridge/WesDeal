# What championship players actually hold for every bid

Empirical hand ranges for every call — opening, overcall, double, response through
the four level — from every auction in recent World and European team
championships, real hand dealt back onto each call. Split by vulnerability and by
partnership system where the bid’s meaning depends on it (strong vs natural 1♣,
transfer vs standard responses, multi vs weak 2♦). Every range compiles to a
[WesDeal](./index.html) filter.

**Columns.** `freq` / `n` = action rate / sample. `HCP` = p5/p25/**med**/p75/p95.
`length`, `their suit` = per-length % (tails `<k`/`k+`). `texture` = 0–10 suit
quality (A…7 weighted top-down + bonus per touching pair, normalised so solid
AKQJT = 10 at any length; QJT98 ≈ 5.3, KQ743 ≈ 4.4, rags ≈ 1), shown med (p25–p75).
`%bal` = strictly 4-3-3-3 / 4-4-3-2 / 5-3-3-2 only. `filter` = the range in the
dealer’s [filter language](#dealer-integration).

Generated from the WBF/EBL scrape — re-run `npm run research:bidding`.

## Data

- 326705 table results scanned; 118005 carry an auction; 117955 auctions
  replay as legal sequences consistent with the recorded contract, doubling
  state, and declarer (the rest are site glitches, e.g. card tokens inside
  the bidding tooltip).
- Rejected: contract-mismatch 42, double-mismatch 5, no-bid 3.
- Coverage by tournament/stage (valid auctions):

| tournament/stage | auctions |
|---|---|
| riga26/RR | 38254 |
| euchamp24/RR | 35263 |
| herning25/RR | 30869 |
| herning25/QF | 3523 |
| marrakech23/QF | 3059 |
| herning25/SF | 1703 |
| marrakech23/SF | 1518 |
| herning25/FF | 1310 |
| marrakech23/FF | 1271 |
| herning25tn/16 | 512 |
| herning25tn/QF | 256 |
| herning25tn/SF | 222 |
| herning25tn/FF | 195 |

- Strength filter: the bottom 4 teams of each event (by average
  round-robin VP) are excluded as actors — 136 teams, 80481
  calls dropped. Their opponents’ calls still count, and their systems are
  still classified (needed to condition actions against them).
- Transnational events (`*tn`) are the World Transnational Open Teams, whose
  large mixed-strength Swiss qualifier is excluded; only their knockout finals
  (Round of 16 onward) are included. Marrakech 2023’s transnational carried no
  bidding (contracts only) so contributes nothing here; Herning 2025’s does.

Caveats: passed-out deals never reach the dataset (the site records them as
"Pass" with no auction), so 4th-seat pass frequencies are unobservable. The
same deal is bid at many tables (round-robins), so per-context samples are
correlated across tables; n counts tables, and the distinct-deal count is
shown for headline contexts. Alerts/explanations are not captured — systemic
meaning is inferred from the hands themselves (see system detection).

## Key findings

- **The field opens light and overcalls light.** Natural 1M openings in seats 1–2
  centre on 13 HCP with p5 = 10 — nearly every 11-count and many decent
  10-counts get opened. One-level overcalls ((1C) 1H) run 7–16 (med 10) HCP —
  the book "8–16" is real but the median sits 3 HCP below the median opening.
- **Suit quality is a weak-hand requirement.** Light (≤10 HCP) 1H overcalls of a
  natural 1C carry a median suit texture of 4.2/10; sound ones (11+) get away
  with 5.1/10 — the values carry a moderate suit. The derived filters
  encode exactly that: a quality floor everyone meets, plus a higher bar that
  only applies below 11 HCP (`hcp >= 11 or top(h,5) >= …`).
- **Takeout doubles are opening-strength, not 12+**: (1S) X runs 11–18 (med 13);
  the light tail (10–11) comes with shape.
- **The 1NT overcall is a strong NT**: (1H) 1NT = 14–17 (med 15); balancing
  (1H) P (P) 1NT is 4 HCP lighter at 9–15 (med 11).
- **Vulnerability moves preempts, not constructive bids.** Weak jump overcalls
  swing hardest: (1C) 2H is median 7 at favourable but 11 at unfavourable.
  Simple overcalls and doubles barely move (±1 HCP).
- **Two-suited bids are universal**: (1H) 2H (Michaels) = 8–14 (med 12) with ≤2
  hearts 99% of the time; (1M) 2NT is the two lowest suits, unbalanced.
- **Negative doubles start at ~7**: 1S (2H) X = 7–15 (med 10). Redouble after
  1C (X) shows 6–16 (med 11).
- **Transfer responses to 1C are mainstream**: of classified natural-club pairs,
  133 play transfers vs 338 standard. Their 1C (P) 1D holds 4+ hearts 96%
  of the time (4–15 (med 9) HCP), and 1S is the no-major hand (79% with no 4-card major, 5–18 (med 10)) — the
  derived rules follow the shown suit, and the treatment carries on over a
  double or 1D overcall (see the transfer-responder sections).
- **Defence to 1NT is conventional and the data shows it**: (1NT) 2C holds both
  majors 4+ 89% of the time (clubs are incidental); (1NT) 2D has a 5+
  major 93% (6+ 85%) — multi-style; 2M shows the major plus a 4+ minor.
  The derived rules detect these shapes instead of reading the bid suit at
  face value (see the (1NT) ? section).
- **At this level 2D is multi** (271 pairs multi vs 47 weak among classified),
  2C strong is standard, and strong-club pairs are 14% of the field (113 of 795).
- **Shortage in their suit buys lighter action.** (1D) 1S overcallers with ≤2
  diamonds are median 10 HCP (p5 7); with 3+ diamonds median 11 (p5 7).
  The same gradient shows up in every overcall and double context (see the
  per-context cross-tabs), so the derived filters split their-suit shortage
  from length.
- **Doubles are support-first below 17, shape-free above.** Under 17 HCP, (1H) X
  holds 3+ spades 100% of the time (4+ 74%) and 2+ in both
  minors 99%; (1C) X holds both majors 3+ 95%. At 17+ those rates
  drop to 71% / 65% — the strong double is its own animal, and the derived
  filters carry it as a separate shape-free branch.
- **Action rates need a fixed-strength lens** (a strong 1C depletes the seats
  behind it). Holding 9–11 HCP, the direct seat acts 59% over a natural 1C, 56% over 1D, 48% over a strong 1C.
  See the action-rate section for the full grid.

## Partnership system census

Each partnership is classified from its own openings (min 6 samples per bid).

- 1C style: natural 601, strong 113, unknown 63, short 12, polish 6
- 1D style: natural 686, unknown 74, nebulous 35
- 1NT range: strong 621, unknown 93, weak 81
- 2C style: unknown 523, strong 151, natural 121
- 2D style: unknown 391, multi 271, other 86, weak 47
- natural base (1C natural/short and 1D not nebulous): yes 611, no 184
- 1C response style (natural/short openers, from their own 1D/1H responses):
  standard 338, transfer-walsh 133, insufficient data 136

## Openings (natural-base pairs)

HCP shown as p5/p25/**median**/p75/p95. Length is the bid suit, p5–p95 (median).
Style filter: 1C/1D/1NT/2C/2D rows use pairs whose that-bid style is natural
(1C natural or short-club; 1D natural; 2C strong excluded from "natural" row…);
1M and preempts use natural-base pairs.

### Seat 1 + Seat 2

| opening | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|
| 1C | 15940 | 1206 | 11/12/**13**/14/18 | 2:6% 3:22% 4:30% 5:23% 6:13% 7:5% | **4.8** (3.5–6.2) | 59% |
| 1D | 14630 | 980 | 10/12/**13**/14/18 | <3:1% 3:5% 4:30% 5:38% 6:21% 7:4% | **4.8** (3.6–6.2) | 36% |
| 1H | 8567 | 553 | 10/11/**13**/15/17 | 5:72% 6:23% 7:2% 8+:1% | **5.1** (3.8–6.3) | 17% |
| 1S | 8816 | 541 | 10/11/**13**/15/17 | 5:61% 6:33% 7:5% | **4.9** (3.7–6.3) | 18% |
| 1NT | 9202 | 1005 | 13/14/**15**/16/17 | — | — | 84% |
| 2C | 701 | 395 | 6/14/**20**/21/24 | <1:1% 1:8% 2:22% 3:36% 4:20% 5:8% 6:4% | **5.4** (3.0–7.5) | 43% |
| 2D | 253 | 622 | 4/6/**8**/9/12 | <5:3% 5:8% 6:80% 7:9% | **3.9** (2.8–5.2) | 2% |
| 2H | 1356 | 372 | 5/7/**8**/9/11 | <2:1% 2:3% 3:2% 4:6% 5:32% 6:52% 7:3% | **4.2** (2.9–5.3) | 5% |
| 2S | 1764 | 253 | 5/7/**8**/9/11 | <5:1% 5:34% 6:64% 7+:1% | **4.4** (3.1–5.7) | 3% |
| 2NT | 1472 | 127 | 19/19/**20**/21/21 | — | — | 83% |
| 3C | 529 | 65 | 5/5/**7**/9/10 | <5:2% 5:3% 6:65% 7:29% 8:2% | **4.4** (4.0–5.6) | 2% |
| 3D | 838 | 87 | 3/5/**8**/8/10 | <6:2% 6:43% 7:55% | **5.1** (4.1–5.5) | 0% |
| 3H | 443 | 58 | 3/5/**6**/8/9 | <6:3% 6:40% 7:42% 8:15% | **3.9** (3.0–4.8) | 1% |
| 3S | 656 | 56 | 4/6/**8**/9/10 | 6:33% 7:66% | **5.0** (3.9–6.7) | 0% |
| 3NT | 109 | 26 | 10/11/**11**/13/14 | — | — | 0% |
| 4C | 68 | 18 | 5/5/**9**/12/14 | 2:13% 3:13% 4:1% 6:3% 7:24% 8:46% | **3.5** (3.5–4.1) | 0% |
| 4D | 36 | 11 | 5/5/**5**/10/15 | 1:6% 3:22% 4:6% 6:8% 7:58% | **4.7** (2.3–4.7) | 0% |
| 4H | 298 | 24 | 3/5/**5**/10/12 | 6:2% 7:39% 8:58% 9+:2% | **4.3** (3.6–5.7) | 0% |
| 4S | 326 | 31 | 7/8/**9**/10/11 | 6:6% 7:55% 8:37% 9+:2% | **5.9** (4.8–6.7) | 0% |

### Seat 3

| opening | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|
| 1C | 2804 | 327 | 10/12/**13**/16/19 | 2:8% 3:19% 4:25% 5:30% 6:15% 7:2% | **5.0** (3.6–6.3) | 53% |
| 1D | 3375 | 264 | 10/12/**13**/15/18 | 3:4% 4:38% 5:38% 6:19% | **4.8** (3.7–6.1) | 45% |
| 1H | 1520 | 138 | 9/11/**12**/14/17 | 4:3% 5:67% 6:30% | **4.8** (3.5–5.9) | 23% |
| 1S | 2181 | 163 | 9/12/**14**/16/18 | 4:3% 5:67% 6:25% 7:3% | **5.3** (4.0–6.0) | 23% |
| 1NT | 2371 | 201 | 14/15/**15**/16/17 | — | — | 83% |
| 2C | 205 | 101 | 11/19/**22**/24/26 | 1:4% 2:14% 3:28% 4:20% 5:10% 6:17% 7:8% | **7.2** (5.1–8.3) | 30% |
| 2H | 176 | 44 | 6/7/**9**/10/11 | <3:2% 3:2% 4:2% 5:37% 6:56% 7+:1% | **3.5** (3.2–5.3) | 3% |
| 2S | 128 | 32 | 7/9/**9**/10/13 | <5:2% 5:27% 6:71% | **4.3** (3.7–6.4) | 4% |
| 2NT | 337 | 41 | 18/19/**20**/21/21 | — | — | 58% |
| 3C | 198 | 20 | 5/8/**9**/10/10 | 5:14% 6:55% 7:32% | **5.7** (4.4–6.2) | 0% |
| 3D | 53 | 11 | 4/7/**7**/9/12 | 5:8% 6:83% 7:9% | **3.8** (3.8–4.1) | 0% |
| 3H | 57 | 14 | 5/7/**9**/10/12 | <6:2% 6:70% 7:28% | **4.9** (3.5–7.2) | 0% |
| 4H | 68 | 12 | 11/12/**12**/13/16 | <6:1% 6:43% 7:22% 8:34% | **5.7** (3.8–6.6) | 0% |
| 4S | 68 | 8 | 11/11/**12**/12/15 | 6:18% 7:82% | **7.8** (7.8–8.1) | 0% |

### Seat 4

| opening | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|
| 1C | 946 | 129 | 12/13/**14**/18/20 | <2:1% 2:10% 3:36% 4:26% 5:13% 6:10% 7:4% | **5.3** (3.4–7.0) | 73% |
| 1D | 512 | 76 | 12/14/**15**/18/20 | 2:2% 3:6% 4:68% 5:7% 6:13% 7:4% | **4.8** (4.0–6.2) | 60% |
| 1H | 519 | 41 | 12/13/**15**/17/18 | 5:58% 6:40% | **5.0** (3.5–6.5) | 10% |
| 1S | 337 | 45 | 12/14/**16**/16/19 | <5:1% 5:49% 6:38% 7:12% | **5.4** (4.9–6.1) | 11% |
| 1NT | 853 | 79 | 14/15/**16**/16/17 | — | — | 86% |
| 2C | 51 | 26 | 16/18/**21**/23/23 | 1:8% 2:12% 3:53% 4:25% 5+:2% | **7.4** (4.5–8.2) | 82% |
| 2NT | 82 | 16 | 19/20/**20**/21/21 | — | — | 91% |

### Preempts by vulnerability (all seats, natural-base pairs)

| opening | vul | n | HCP p5/p25/med/p75/p95 | bid-suit len | texture |
|---|---|---|---|---|---|
| 2H | fav | 459 | 4/6/**7**/9/11 | <2:1% 2:3% 3:2% 4:8% 5:47% 6:37% 7+:2% | **3.9** (2.8–4.6) |
| 2H | none | 422 | 5/7/**8**/9/11 | <2:1% 2:3% 3:1% 4:8% 5:33% 6:53% | **4.3** (2.4–5.3) |
| 2H | both | 277 | 6/7/**8**/9/12 | <2:2% 2:3% 3:4% 4:3% 5:27% 6:54% 7:6% | **4.2** (3.2–5.7) |
| 2H | unfav | 384 | 5/8/**8**/10/12 | <2:1% 2:3% 3:3% 4:3% 5:19% 6:69% 7:3% | **4.4** (3.5–5.7) |
| 2S | fav | 656 | 4/7/**8**/9/11 | <5:1% 5:44% 6:54% | **4.3** (2.7–5.3) |
| 2S | none | 468 | 5/6/**9**/9/10 | <5:1% 5:41% 6:56% 7+:1% | **4.5** (3.2–5.8) |
| 2S | both | 429 | 5/7/**8**/9/11 | <5:1% 5:21% 6:77% 7+:1% | **4.4** (3.1–5.0) |
| 2S | unfav | 346 | 6/7/**8**/10/12 | 5:18% 6:81% 7+:1% | **4.9** (3.7–5.7) |
| 3C | fav | 402 | 5/6/**9**/9/10 | 5:10% 6:77% 7:12% 8+:1% | **5.2** (4.1–5.7) |
| 3C | none | 225 | 5/5/**8**/8/10 | <6:2% 6:47% 7:51% | **4.4** (4.3–5.5) |
| 3C | both | 25 | 4/7/**7**/9/13 | 3:4% 5:4% 6:40% 7:52% | **3.5** (3.5–5.2) |
| 3C | unfav | 78 | 6/9/**9**/10/10 | 1:3% 6:37% 7:53% 8:8% | **6.1** (5.5–6.3) |
| 3D | fav | 318 | 2/5/**7**/8/9 | 5:3% 6:77% 7:19% | **4.7** (3.2–5.5) |
| 3D | none | 206 | 3/6/**8**/9/10 | <6:2% 6:53% 7:45% | **5.1** (4.0–5.1) |
| 3D | both | 253 | 6/7/**8**/8/10 | 6:10% 7:89% | **5.3** (4.3–6.0) |
| 3D | unfav | 114 | 5/5/**7**/8/10 | 6:23% 7:77% | **5.0** (4.8–5.2) |
| 3H | fav | 195 | 1/5/**6**/7/9 | <5:2% 5:3% 6:61% 7:16% 8:17% | **3.9** (2.8–4.5) |
| 3H | none | 109 | 5/5/**7**/8/9 | <6:2% 6:61% 7:37% | **4.8** (4.8–5.9) |
| 3H | both | 135 | 5/6/**7**/9/9 | 6:3% 7:74% 8:22% | **3.6** (3.0–4.2) |
| 3H | unfav | 61 | 5/6/**8**/9/10 | 6:48% 7:49% 8:3% | **4.3** (3.3–5.2) |
| 3S | fav | 249 | 4/4/**7**/8/9 | 6:60% 7:40% | **3.9** (3.3–4.7) |
| 3S | none | 140 | 5/6/**7**/9/10 | 6:28% 7:71% | **6.3** (4.5–6.3) |
| 3S | both | 167 | 7/8/**9**/10/10 | 6:20% 7:80% | **4.8** (4.4–6.7) |
| 3S | unfav | 119 | 7/7/**7**/10/10 | 6:13% 7:86% | **7.1** (7.1–7.1) |
| 4C | fav | 50 | 5/5/**5**/9/10 | 2:2% 6:22% 7:24% 8:52% | **3.5** (3.5–4.1) |
| 4C | none | 25 | 5/8/**11**/13/14 | 3:36% 7:64% | **4.4** (3.6–5.4) |
| 4D | fav | 26 | 4/5/**5**/5/10 | 4:8% 6:15% 7:77% | **4.7** (3.0–4.7) |
| 4H | fav | 155 | 3/5/**6**/9/12 | 6:14% 7:49% 8:37% | **4.3** (2.1–5.7) |
| 4H | none | 73 | 4/5/**5**/10/16 | 6:14% 7:48% 8:32% 9:7% | **4.8** (4.7–4.8) |
| 4H | both | 127 | 5/5/**11**/12/13 | 6:3% 7:14% 8:82% | **4.2** (4.2–7.3) |
| 4S | fav | 101 | 7/8/**10**/10/12 | 6:7% 7:93% | **6.7** (4.7–6.7) |
| 4S | none | 114 | 6/9/**9**/9/9 | 7:43% 8:55% 9+:2% | **5.9** (5.9–6.3) |
| 4S | both | 55 | 8/8/**9**/12/16 | <6:2% 6:42% 7:27% 8:22% 9:7% | **4.8** (3.3–6.7) |
| 4S | unfav | 127 | 9/10/**11**/11/14 | 7:64% 8:36% | **6.4** (5.5–7.5) |

## Direct seat: RHO opens, we act — (opening) ?

Every opening 1C–4S with enough data. For 1C/1D the tables face a NATURAL opening (strong-club and nebulous-1D openers tabulated separately below); (2D) faces a weak 2D. Suit actions over (1NT) are largely conventional — 2C = both majors, 2D = one long major (multi-style), 2M = the major + a minor — and their derived rules detect those shapes from the hands instead of reading the bid at face value.

### (1C) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 49.3% | 9647 | 1019 | 2/6/**7**/9/13 | — | — | 65% |
| 1S | 12.5% | 2441 | 261 | 7/9/**11**/12/15 | <5:2% 5:81% 6:15% 7:2% | **4.3** (3.2–5.0) | 34% |
| 1H | 10.6% | 2080 | 277 | 7/9/**10**/12/16 | 4:3% 5:66% 6:23% 7:7% | **4.6** (3.7–5.4) | 16% |
| X | 8.2% | 1607 | 237 | 10/13/**14**/17/20 | theirs: <1:1% 1:17% 2:27% 3:40% 4:11% 5+:2% | — | 66% |
| 1D | 7.0% | 1370 | 258 | 7/9/**12**/14/16 | <4:1% 4:5% 5:59% 6:27% 7:5% 8:2% | **4.8** (4.0–5.7) | 26% |
| 1NT | 3.3% | 647 | 120 | 14/15/**15**/16/17 | — | — | 87% |
| 2H | 1.9% | 367 | 77 | 4/7/**8**/8/12 | <5:1% 5:5% 6:80% 7:14% | **5.0** (3.8–5.4) | 1% |
| 2S | 1.5% | 301 | 62 | 4/5/**8**/9/11 | 5:6% 6:91% 7+:2% | **4.1** (3.8–5.0) | 3% |
| 2C | 1.2% | 236 | 112 | 7/9/**11**/13/14 | 0:2% 1:26% 2:9% 3:3% 5:13% 6:35% 7:11% | **4.3** (0.4–6.3) | 4% |
| 2D | 0.9% | 184 | 81 | 5/7/**10**/12/14 | 1:11% 2:30% 3:5% 5:10% 6:41% 7+:1% | **4.1** (1.7–5.3) | 3% |
| 3H | 1.0% | 186 | 27 | 4/6/**8**/8/12 | 6:38% 7:62% | **4.5** (4.3–5.4) | 0% |
| 3S | 0.5% | 106 | 22 | 4/5/**9**/10/11 | 6:40% 7:57% 8:4% | **6.1** (4.0–6.4) | 0% |
| 2NT | 0.6% | 109 | 23 | 9/10/**13**/13/14 | — | — | 0% |
| 3D | 0.3% | 56 | 26 | 6/8/**9**/11/13 | 6:71% 7:23% 8:5% | **5.0** (4.0–5.0) | 0% |
| 4H | 0.3% | 63 | 16 | 6/11/**11**/12/13 | 6:8% 7:57% 8:35% | **5.4** (4.3–8.9) | 0% |
| 5D | 0.2% | 46 | 6 | 12/12/**12**/12/14 | 6:7% 7:2% 8:91% | **7.0** (7.0–7.0) | 0% |
| 4S | 0.2% | 42 | 14 | 6/8/**10**/12/15 | 6:7% 7:69% 8:24% | **6.1** (4.9–7.6) | 0% |
| 3C | 0.2% | 32 | 22 | 5/9/**11**/12/14 | 1:53% 2:16% 6:13% 7:16% 8:3% | **1.7** (0.0–4.3) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1S | none | 594 | 7/9/**11**/14/15 |
| 1S | fav | 541 | 8/9/**9**/12/16 |
| 1S | unfav | 653 | 7/10/**12**/13/14 |
| 1S | both | 653 | 7/9/**10**/12/14 |
| 1H | none | 606 | 7/10/**10**/13/15 |
| 1H | fav | 445 | 8/9/**10**/12/14 |
| 1H | unfav | 545 | 7/9/**10**/13/17 |
| 1H | both | 484 | 7/9/**11**/13/16 |
| X | none | 517 | 10/12/**14**/17/19 |
| X | fav | 255 | 11/13/**14**/18/24 |
| X | unfav | 465 | 12/13/**14**/17/20 |
| X | both | 370 | 11/13/**13**/14/16 |
| 1D | none | 487 | 7/9/**11**/14/15 |
| 1D | fav | 234 | 6/10/**12**/13/16 |
| 1D | unfav | 280 | 7/9/**12**/14/16 |
| 1D | both | 369 | 7/9/**12**/13/14 |
| 1NT | none | 140 | 14/15/**16**/17/17 |
| 1NT | fav | 39 | 10/14/**16**/18/18 |
| 1NT | unfav | 206 | 15/15/**15**/16/17 |
| 1NT | both | 262 | 14/15/**15**/16/17 |
| 2H | none | 132 | 5/7/**8**/8/11 |
| 2H | fav | 101 | 4/4/**7**/8/11 |
| 2H | unfav | 47 | 5/10/**11**/12/12 |
| 2H | both | 87 | 6/8/**8**/8/12 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 1S | 9/**11**/12 (613) | 9/**10**/14 (833) | 10/**10**/12 (685) | 8/**11**/14 (310) |
| 1H | 10/**11**/12 (532) | 9/**11**/13 (777) | 8/**10**/12 (370) | 9/**10**/13 (401) |
| X | 11/**13**/17 (302) | 13/**15**/16 (441) | 13/**14**/15 (649) | 13/**17**/18 (215) |
| 1D | 10/**12**/15 (217) | 9/**11**/13 (436) | 8/**11**/14 (347) | 11/**12**/14 (370) |

Anatomy of X: per HCP band, support held (both majors = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | both majors ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 92 | 99% | 78% | 96% | 93% |
| 11–13 | 573 | 98% | 38% | 100% | 39% |
| 14–16 | 528 | 91% | 16% | 99% | 46% |
| 17+ | 414 | 65% | 3% | 86% | 45% |

Dealer filters (paste into the custom filter box; derived from the data):

- `1S` → `s >= 5 and top(s,5) >= 1 and hcp in 7..15`
- `1H` → `h >= 5 and top(h,5) >= 1 and hcp in 7..16`
- `X` → `((hcp in 10..17 and c <= 2 and s >= 3 and h >= 3 and d >= 2) or (hcp in 12..17 and c in 3..4 and s >= 3 and h >= 3 and d >= 2) or hcp >= 18)`
- `1D` → `d >= 5 and top(d,5) >= 1 and hcp in 7..16`
- `1NT` → `(has(c,a) or (has(c,k) and c >= 2) or (has(c,q) and c >= 3)) and hcp in 14..17` *(+ balanced)*
- `2H` → `h >= 6 and (hcp >= 11 or top(h,5) >= 2) and ((hcp in 4..12 and c <= 2) or (hcp in 5..12 and c == 3))`

### (1D) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 51.3% | 9605 | 794 | 3/6/**8**/10/13 | — | — | 61% |
| 1S | 11.6% | 2163 | 233 | 7/9/**10**/12/15 | 4:3% 5:77% 6:17% 7:3% | **4.1** (3.0–5.3) | 28% |
| 1H | 11.1% | 2078 | 198 | 7/9/**11**/13/16 | 4:4% 5:63% 6:33% 7+:1% | **4.6** (3.4–5.8) | 18% |
| X | 10.0% | 1871 | 194 | 10/12/**14**/16/19 | theirs: 0:7% 1:14% 2:45% 3:29% 4:5% | — | 66% |
| 2C | 4.4% | 827 | 74 | 9/10/**11**/13/15 | 5:29% 6:56% 7:15% | **6.1** (4.6–7.0) | 8% |
| 1NT | 3.2% | 590 | 91 | 14/15/**16**/17/18 | — | — | 90% |
| 2D | 2.4% | 441 | 43 | 6/10/**10**/12/13 | 0:39% 1:51% 2:7% 3+:4% | **0.0** (0.0–3.7) | 0% |
| 2H | 1.4% | 255 | 54 | 5/7/**8**/10/11 | <5:2% 5:6% 6:84% 7:9% | **5.0** (3.4–6.1) | 2% |
| 3H | 0.9% | 162 | 16 | 6/6/**7**/9/10 | 6:33% 7:67% | **5.3** (3.4–5.8) | 0% |
| 3S | 0.8% | 153 | 21 | 6/7/**7**/9/10 | 6:15% 7:85% | **4.2** (3.6–7.1) | 0% |
| 2S | 0.7% | 132 | 48 | 4/6/**8**/10/12 | <5:2% 5:6% 6:85% 7:8% | **4.2** (3.7–4.7) | 1% |
| 3C | 0.7% | 136 | 40 | 4/8/**10**/10/12 | <3:3% 3:2% 5:17% 6:51% 7:23% 8:4% | **5.0** (4.0–6.7) | 0% |
| 2NT | 0.6% | 108 | 19 | 9/9/**9**/10/13 | — | — | 0% |
| 4S | 0.6% | 106 | 11 | 6/10/**12**/13/15 | 7:62% 8:9% 9:28% | **7.4** (7.1–10.0) | 0% |
| 4H | 0.1% | 25 | 9 | 7/10/**10**/16/18 | 6:56% 7:28% 8:16% | **4.6** (4.1–5.8) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1S | none | 529 | 8/10/**11**/13/15 |
| 1S | fav | 626 | 8/9/**10**/11/14 |
| 1S | unfav | 574 | 7/8/**10**/15/17 |
| 1S | both | 434 | 8/8/**11**/12/15 |
| 1H | none | 386 | 7/8/**10**/14/14 |
| 1H | fav | 308 | 8/9/**11**/13/16 |
| 1H | unfav | 741 | 7/10/**11**/13/16 |
| 1H | both | 643 | 8/9/**12**/14/15 |
| X | none | 477 | 9/12/**13**/14/15 |
| X | fav | 558 | 10/13/**14**/18/20 |
| X | unfav | 312 | 11/12/**14**/18/18 |
| X | both | 524 | 10/13/**15**/15/19 |
| 2C | none | 167 | 9/10/**10**/11/12 |
| 2C | fav | 188 | 8/12/**13**/14/17 |
| 2C | unfav | 276 | 10/10/**11**/13/16 |
| 2C | both | 196 | 9/9/**11**/12/15 |
| 1NT | none | 77 | 14/15/**17**/17/17 |
| 1NT | fav | 204 | 14/16/**16**/17/18 |
| 1NT | unfav | 82 | 15/15/**16**/17/18 |
| 1NT | both | 227 | 15/15/**16**/18/18 |
| 2D | none | 203 | 6/10/**10**/10/10 |
| 2D | fav | 40 | 9/12/**13**/13/13 |
| 2D | unfav | 53 | 8/12/**12**/12/16 |
| 2D | both | 145 | 6/6/**10**/12/12 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 1S | 7/**9**/10 (470) | 9/**10**/12 (829) | 8/**12**/13 (503) | 10/**11**/12 (361) |
| 1H | 8/**10**/13 (415) | 10/**11**/13 (901) | 8/**10**/12 (416) | 11/**14**/14 (346) |
| X | 10/**15**/15 (384) | 12/**13**/15 (851) | 14/**14**/18 (546) | 14/**16**/18 (90) |
| 2C | 10/**10**/12 (127) | 10/**11**/14 (247) | 11/**11**/13 (284) | 10/**11**/13 (169) |

Anatomy of X: per HCP band, support held (both majors = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | both majors ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 134 | 99% | 60% | 99% | 99% |
| 11–13 | 597 | 98% | 29% | 99% | 82% |
| 14–16 | 684 | 95% | 23% | 100% | 55% |
| 17+ | 456 | 31% | 6% | 99% | 51% |

Dealer filters (paste into the custom filter box; derived from the data):

- `1S` → `s >= 5 and top(s,5) >= 1 and hcp in 7..15`
- `1H` → `h >= 5 and top(h,5) >= 1 and hcp in 7..16`
- `X` → `((hcp in 10..17 and d <= 2 and s >= 3 and h >= 3 and c >= 3) or (hcp in 12..17 and d == 3 and s >= 3 and h >= 3 and c >= 3) or hcp >= 18)`
- `2C` → `c >= 5 and top(c,5) >= 2 and hcp in 9..15`
- `1NT` → `(has(d,a) or (has(d,k) and d >= 2) or (has(d,q) and d >= 3)) and hcp in 14..18` *(+ balanced)*
- `2D` → `s >= 5 and h >= 5 and hcp in 6..13`

### (1H) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 57.2% | 7188 | 487 | 3/6/**8**/10/13 | — | — | 65% |
| X | 11.6% | 1462 | 128 | 10/12/**14**/16/19 | theirs: <1:1% 1:30% 2:41% 3:26% 4+:2% | — | 56% |
| 1S | 11.4% | 1434 | 122 | 7/9/**12**/13/16 | 4:3% 5:72% 6:21% 7:3% | **5.4** (3.7–6.5) | 33% |
| 2C | 3.8% | 483 | 58 | 9/10/**12**/15/17 | 5:21% 6:59% 7:20% | **5.6** (4.7–6.7) | 10% |
| 2D | 3.3% | 413 | 58 | 8/10/**11**/13/16 | 5:21% 6:64% 7:14% | **5.3** (4.6–6.2) | 5% |
| 1NT | 3.0% | 377 | 44 | 14/15/**15**/16/17 | — | — | 85% |
| 2H | 3.0% | 376 | 27 | 8/10/**12**/13/14 | 0:40% 1:31% 2:28% | **0.0** (0.0–4.5) | 0% |
| 2S | 1.9% | 241 | 29 | 6/6/**7**/10/12 | <5:1% 5:4% 6:94% | **4.0** (3.8–5.6) | 1% |
| 2NT | 1.5% | 193 | 17 | 6/11/**11**/11/13 | — | — | 0% |
| 3D | 0.9% | 118 | 17 | 4/7/**8**/10/11 | <6:2% 6:69% 7:29% | **5.2** (5.2–5.3) | 1% |
| 4S | 0.8% | 101 | 8 | 11/11/**11**/11/15 | 6:5% 7:35% 8:59% | **7.6** (5.6–7.6) | 0% |
| 3C | 0.6% | 72 | 23 | 6/10/**10**/12/17 | 0:3% 1:6% 2:19% 5:18% 6:14% 7:40% | **4.6** (2.7–6.4) | 0% |
| 3S | 0.5% | 62 | 12 | 6/6/**7**/8/11 | 6:71% 7:26% 8:3% | **5.6** (3.8–5.6) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 379 | 11/13/**13**/15/17 |
| X | fav | 383 | 10/12/**12**/15/17 |
| X | unfav | 406 | 11/13/**14**/18/22 |
| X | both | 294 | 11/11/**14**/17/22 |
| 1S | none | 200 | 6/8/**10**/12/14 |
| 1S | fav | 389 | 8/11/**13**/14/16 |
| 1S | unfav | 399 | 7/9/**10**/14/16 |
| 1S | both | 446 | 8/10/**12**/12/16 |
| 2C | none | 139 | 8/15/**15**/15/17 |
| 2C | fav | 103 | 9/11/**11**/12/13 |
| 2C | unfav | 50 | 6/11/**11**/12/15 |
| 2C | both | 191 | 9/10/**10**/13/16 |
| 2D | none | 166 | 8/10/**13**/14/16 |
| 2D | fav | 49 | 9/10/**12**/12/16 |
| 2D | unfav | 70 | 9/11/**12**/13/15 |
| 2D | both | 128 | 10/10/**10**/11/16 |
| 1NT | none | 86 | 14/15/**15**/15/17 |
| 1NT | fav | 109 | 15/15/**15**/17/17 |
| 1NT | unfav | 127 | 14/15/**15**/15/16 |
| 1NT | both | 55 | 15/17/**17**/17/17 |
| 2H | none | 50 | 10/13/**13**/13/13 |
| 2H | fav | 135 | 12/12/**12**/13/13 |
| 2H | unfav | 79 | 8/8/**14**/14/16 |
| 2H | both | 112 | 6/10/**10**/12/12 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 11/**12**/14 (462) | 12/**13**/15 (595) | 15/**16**/17 (375) | 12/**14**/15 (30) |
| 1S | 7/**12**/13 (290) | 9/**10**/13 (495) | 11/**12**/13 (438) | 10/**14**/14 (211) |
| 2C | 11/**12**/15 (200) | 9/**12**/12 (76) | 10/**11**/14 (200) | — |
| 2D | 10/**12**/14 (157) | 10/**10**/11 (155) | 11/**11**/13 (41) | 11/**13**/13 (60) |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 80 | 100% | 91% | 100% | 99% |
| 11–13 | 621 | 100% | 81% | 99% | 87% |
| 14–16 | 461 | 100% | 61% | 98% | 65% |
| 17+ | 300 | 71% | 46% | 99% | 47% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 10..17 and h <= 2 and s >= 3 and d >= 2 and c >= 2) or (hcp in 12..17 and h == 3 and s >= 3 and d >= 2 and c >= 2) or hcp >= 18)`
- `1S` → `s >= 5 and top(s,5) >= 1 and ((hcp in 6..16 and h <= 2) or (hcp in 8..16 and h in 3..4))`
- `2C` → `c >= 5 and top(c,5) >= 2 and hcp in 9..17`
- `2D` → `d >= 5 and top(d,5) >= 1 and ((hcp in 8..16 and h <= 2) or (hcp in 10..16 and h in 3..4))`
- `1NT` → `hcp in 14..17` *(+ balanced)*
- `2H` → `s >= 5 and ((hcp in 8..14 and d >= 5) or (hcp in 8..14 and c >= 5))`

### (1S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 68.6% | 9258 | 545 | 4/6/**8**/10/13 | — | — | 61% |
| X | 7.1% | 954 | 144 | 11/12/**13**/15/18 | theirs: 0:5% 1:21% 2:43% 3:25% 4:6% | — | 58% |
| 2H | 6.4% | 866 | 74 | 10/11/**12**/14/15 | 5:45% 6:51% 7:4% | **5.4** (4.3–6.3) | 11% |
| 2D | 5.8% | 777 | 66 | 8/10/**11**/13/15 | 5:23% 6:57% 7:20% | **6.3** (5.1–7.2) | 18% |
| 2C | 3.7% | 497 | 56 | 9/10/**11**/15/16 | 5:33% 6:50% 7:17% | **4.6** (4.4–6.2) | 11% |
| 1NT | 2.7% | 362 | 48 | 15/15/**15**/17/18 | — | — | 77% |
| 2S | 1.2% | 158 | 17 | 6/7/**12**/12/15 | 0:12% 1:73% 2:13% 3+:1% | **0.0** (0.0–0.0) | 1% |
| 3C | 1.0% | 139 | 27 | 4/6/**8**/10/12 | 1:12% 2:3% 3:6% 5:4% 6:24% 7:52% | **4.5** (4.1–5.2) | 0% |
| 3D | 1.0% | 138 | 20 | 7/9/**9**/10/11 | 6:48% 7:48% 8:4% | **5.3** (5.1–6.9) | 0% |
| 3H | 1.0% | 130 | 16 | 6/8/**8**/10/12 | 6:47% 7:53% | **4.4** (4.0–7.0) | 0% |
| 2NT | 0.8% | 111 | 18 | 7/10/**11**/12/21 | — | — | 0% |
| 4H | 0.3% | 34 | 8 | 8/10/**12**/15/15 | 6:82% 7:18% | **6.3** (6.3–7.0) | 0% |
| 4C | 0.2% | 26 | 2 | 4/4/**8**/8/8 | 7:100% | **4.1** (4.1–5.2) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 150 | 10/13/**14**/14/17 |
| X | fav | 188 | 10/13/**13**/15/20 |
| X | unfav | 224 | 11/13/**14**/15/17 |
| X | both | 392 | 11/12/**13**/15/18 |
| 2H | none | 355 | 11/11/**12**/14/15 |
| 2H | fav | 111 | 10/10/**10**/12/15 |
| 2H | unfav | 185 | 9/10/**13**/13/15 |
| 2H | both | 215 | 10/10/**11**/14/14 |
| 2D | none | 191 | 7/10/**11**/12/14 |
| 2D | fav | 146 | 10/10/**10**/12/13 |
| 2D | unfav | 293 | 10/10/**11**/13/17 |
| 2D | both | 147 | 8/9/**13**/13/15 |
| 2C | none | 62 | 11/11/**12**/13/14 |
| 2C | fav | 242 | 8/10/**11**/15/16 |
| 2C | unfav | 68 | 9/9/**9**/12/15 |
| 2C | both | 125 | 11/11/**14**/15/15 |
| 1NT | none | 64 | 14/15/**15**/17/18 |
| 1NT | fav | 159 | 15/15/**17**/17/17 |
| 1NT | unfav | 40 | 15/15/**16**/17/18 |
| 1NT | both | 99 | 15/15/**15**/16/17 |
| 2S | none | 91 | 7/7/**12**/12/12 |
| 2S | fav | 35 | 6/6/**12**/15/15 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 12/**13**/14 (245) | 12/**14**/15 (407) | 13/**13**/15 (239) | 13/**17**/20 (63) |
| 2H | 10/**12**/13 (328) | 11/**12**/14 (374) | 11/**12**/15 (135) | 11/**11**/11 (29) |
| 2D | 10/**11**/13 (254) | 10/**12**/12 (222) | 10/**13**/13 (212) | 10/**10**/10 (89) |
| 2C | 10/**11**/16 (158) | 11/**13**/15 (182) | 11/**12**/14 (87) | 10/**10**/11 (70) |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 35 | 91% | 77% | 77% | 86% |
| 11–13 | 461 | 100% | 80% | 99% | 70% |
| 14–16 | 381 | 98% | 51% | 100% | 73% |
| 17+ | 77 | 49% | 39% | 81% | 30% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 11..15 and s <= 2 and h >= 3 and d >= 2 and c >= 2) or (hcp in 12..15 and s == 3 and h >= 3 and d >= 2 and c >= 2) or hcp >= 16)`
- `2H` → `h >= 5 and top(h,5) >= 1 and (hcp >= 11 or top(h,5) >= 2) and ((hcp in 10..15 and s <= 2) or (hcp in 11..15 and s == 3))`
- `2D` → `d >= 5 and top(d,5) >= 2 and ((hcp in 8..15 and s <= 2) or (hcp in 10..15 and s in 3..4))`
- `2C` → `c >= 5 and top(c,5) >= 2 and ((hcp in 8..16 and s <= 2) or (hcp in 10..16 and s in 3..4))`
- `1NT` → `(has(s,a) or (has(s,k) and s >= 2) or (has(s,q) and s >= 3)) and hcp in 15..18`
- `2S` → `h >= 5 and ((hcp in 6..15 and d >= 5) or (hcp in 6..15 and c >= 5))`

### (1NT) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 78.2% | 11735 | 967 | 3/6/**8**/10/13 | — | — | 57% |
| X | 5.6% | 846 | 243 | 9/12/**15**/17/19 | — | — | 32% |
| 2D | 4.9% | 731 | 140 | 6/9/**11**/12/16 | 1:13% 2:41% 3:23% 4:12% 5:7% 6:3% | **3.9** (1.5–5.6) | 2% |
| 2C | 4.4% | 653 | 127 | 6/10/**12**/13/15 | 0:3% 1:29% 2:41% 3:20% 4:3% 5:3% | **1.1** (0.2–3.4) | 1% |
| 2H | 2.5% | 381 | 85 | 7/10/**12**/13/16 | <2:1% 2:3% 3:3% 4:3% 5:62% 6:26% 7:3% | **4.9** (3.8–5.9) | 1% |
| 2S | 1.7% | 259 | 66 | 8/10/**11**/13/15 | <5:2% 5:61% 6:33% 7:4% | **4.7** (3.8–4.9) | 1% |
| 3D | 0.7% | 103 | 25 | 6/9/**10**/11/13 | <6:2% 6:40% 7:42% 8:17% | **6.4** (4.4–6.6) | 0% |
| 3C | 0.5% | 69 | 18 | 5/8/**10**/11/14 | 6:29% 7:51% 8:20% | **5.1** (4.3–5.8) | 0% |
| 4D | 0.3% | 46 | 4 | 9/9/**9**/9/10 | 5:2% 7:2% 8:96% | **4.4** (4.4–4.4) | 0% |
| 3H | 0.3% | 44 | 9 | 3/3/**7**/7/13 | 0:2% 6:16% 7:82% | **4.4** (4.0–5.8) | 0% |
| 2NT | 0.3% | 40 | 13 | 5/5/**10**/13/14 | — | — | 0% |
| 3S | 0.2% | 37 | 10 | 4/9/**10**/10/13 | 6:38% 7:62% | **4.7** (4.7–6.1) | 0% |
| 4H | 0.2% | 31 | 2 | 10/10/**10**/10/15 | 7:19% 8:81% | **6.5** (6.5–6.5) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 322 | 10/11/**14**/15/18 |
| X | fav | 94 | 9/10/**12**/14/18 |
| X | unfav | 266 | 11/14/**15**/17/19 |
| X | both | 164 | 9/14/**16**/19/19 |
| 2D | none | 215 | 3/9/**11**/13/17 |
| 2D | fav | 65 | 4/7/**10**/11/12 |
| 2D | unfav | 169 | 7/9/**10**/12/16 |
| 2D | both | 282 | 7/10/**11**/13/13 |
| 2C | none | 152 | 8/9/**11**/13/18 |
| 2C | fav | 238 | 5/11/**11**/13/14 |
| 2C | unfav | 81 | 7/9/**12**/12/13 |
| 2C | both | 182 | 6/11/**13**/13/15 |
| 2H | none | 148 | 5/10/**12**/15/17 |
| 2H | unfav | 157 | 6/10/**12**/12/13 |
| 2H | both | 53 | 7/10/**11**/12/13 |
| 2S | none | 107 | 9/11/**11**/13/17 |
| 2S | fav | 41 | 8/8/**9**/10/11 |
| 2S | unfav | 56 | 8/10/**12**/14/17 |
| 2S | both | 55 | 7/10/**10**/11/13 |
| 3D | none | 57 | 9/10/**11**/11/11 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 9..19`
- `2D` → `((hcp in 6..16 and s >= 5) or (hcp in 6..16 and h >= 5))`
- `2C` → `(hcp in 6..15 and s >= 4 and h >= 4)`
- `2H` → `h >= 5 and top(h,5) >= 1 and ((hcp in 7..16 and d >= 4) or (hcp in 7..16 and c >= 4))`
- `2S` → `s >= 5 and top(s,5) >= 1 and ((hcp in 8..15 and d >= 4) or (hcp in 8..15 and c >= 4))`
- `3D` → `d >= 6 and top(d,5) >= 2 and hcp in 6..13`

### (2C) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 73.0% | 1827 | 367 | 2/5/**7**/9/13 | — | — | 56% |
| X | 8.3% | 207 | 79 | 9/13/**15**/17/20 | theirs: 1:25% 2:41% 3:18% 4:6% 5:4% 6:5% | — | 55% |
| 2H | 5.6% | 140 | 46 | 7/10/**12**/13/17 | <5:1% 5:43% 6:46% 7:9% | **5.0** (4.4–5.4) | 12% |
| 2S | 5.4% | 136 | 53 | 4/8/**11**/13/16 | 5:41% 6:49% 7:9% | **4.9** (3.7–5.9) | 18% |
| 2D | 2.2% | 56 | 30 | 7/8/**11**/15/18 | 0:4% 2:4% 3:2% 4:2% 5:48% 6:30% 7:2% 8:9% | **4.6** (4.0–6.2) | 21% |
| 3D | 1.3% | 33 | 8 | 7/8/**8**/12/14 | 1:6% 6:27% 7:3% 8:64% | **4.0** (4.0–4.0) | 0% |
| 2NT | 1.3% | 32 | 17 | 4/15/**15**/17/17 | — | — | 66% |
| 3C | 1.1% | 28 | 18 | 7/12/**13**/14/15 | 0:4% 1:36% 2:14% 5:11% 6:21% 7:7% 8:7% | **4.6** (0.9–5.9) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 65 | 10/12/**16**/17/21 |
| X | fav | 40 | 9/13/**16**/16/20 |
| X | unfav | 75 | 9/13/**15**/17/20 |
| X | both | 27 | 10/12/**14**/16/19 |
| 2H | none | 52 | 6/9/**12**/14/17 |
| 2H | unfav | 46 | 7/10/**10**/12/16 |
| 2H | both | 34 | 8/12/**13**/16/17 |
| 2S | none | 64 | 5/7/**11**/14/14 |
| 2S | unfav | 25 | 9/10/**12**/13/16 |
| 2S | both | 30 | 2/8/**10**/12/13 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 12/**14**/18 (53) | 14/**16**/17 (84) | 14/**15**/15 (38) | 9/**13**/15 (32) |
| 2H | 8/**12**/13 (53) | 10/**12**/14 (65) | — | — |
| 2S | 8/**9**/12 (48) | 9/**11**/14 (48) | 7/**12**/13 (28) | — |

Anatomy of X: per HCP band, support held (both majors = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | both majors ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 15 | 60% | 27% | 73% | 33% |
| 11–13 | 50 | 88% | 48% | 98% | 66% |
| 14–16 | 78 | 94% | 44% | 100% | 62% |
| 17+ | 64 | 84% | 3% | 86% | 80% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 9..17 and c <= 4 and s >= 3 and h >= 3 and d >= 2) or hcp >= 18)`
- `2H` → `h >= 5 and top(h,5) >= 1 and hcp in 7..17`
- `2S` → `s >= 5 and top(s,5) >= 1 and hcp in 4..16`
- `2D` → `d >= 4 and top(d,5) >= 2 and hcp in 7..18`

### (2D) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 40.5% | 109 | 501 | 4/8/**9**/12/14 | — | — | 49% |
| X | 23.0% | 62 | 150 | 12/14/**16**/20/24 | theirs: <1:2% 1:16% 2:55% 3:16% 4:10% 5+:2% | — | 53% |
| 2S | 9.7% | 26 | 44 | 9/9/**11**/13/16 | 5:35% 6:38% 7:27% | **6.7** (6.3–7.0) | 27% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 29 | 11/15/**18**/24/24 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 12..17 and d <= 4 and s >= 3 and h >= 3 and c >= 2) or hcp >= 18)`

### (2H) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 56.6% | 1052 | 266 | 2/7/**10**/11/13 | — | — | 55% |
| X | 17.0% | 317 | 86 | 10/13/**14**/17/22 | theirs: 1:28% 2:43% 3:21% 4:6% 5+:3% | — | 43% |
| 2S | 11.0% | 204 | 47 | 9/13/**14**/16/17 | <5:2% 5:66% 6:29% 7:3% | **6.3** (3.8–7.0) | 6% |
| 3C | 5.6% | 104 | 20 | 10/13/**13**/14/14 | 5:4% 6:88% 7:8% | **5.7** (4.8–6.7) | 0% |
| 2NT | 4.8% | 90 | 38 | 13/15/**16**/17/18 | — | — | 63% |
| 3D | 2.8% | 52 | 16 | 7/11/**11**/13/16 | 5:15% 6:42% 7:42% | **6.6** (5.3–6.6) | 6% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 108 | 10/13/**14**/17/20 |
| X | fav | 84 | 12/13/**13**/16/17 |
| X | unfav | 83 | 10/13/**14**/16/22 |
| X | both | 42 | 11/11/**16**/19/22 |
| 2S | none | 68 | 8/12/**14**/14/14 |
| 2S | fav | 56 | 12/16/**16**/16/17 |
| 2S | unfav | 36 | 10/13/**14**/14/16 |
| 2S | both | 44 | 9/10/**15**/16/16 |
| 3C | none | 35 | 8/13/**13**/14/15 |
| 3C | unfav | 44 | 13/13/**14**/14/14 |
| 2NT | unfav | 55 | 13/15/**16**/16/18 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 11/**13**/15 (89) | 13/**14**/16 (135) | 13/**13**/17 (67) | 14/**16**/19 (26) |
| 2S | 10/**14**/14 (55) | 13/**14**/16 (62) | 12/**14**/14 (41) | 16/**16**/16 (46) |
| 3C | 13/**13**/13 (37) | — | 13/**14**/14 (59) | — |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 18 | 94% | 94% | 100% | 94% |
| 11–13 | 119 | 97% | 89% | 98% | 66% |
| 14–16 | 96 | 90% | 64% | 94% | 81% |
| 17+ | 84 | 89% | 76% | 79% | 61% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 10..17 and h <= 2 and s >= 3 and d >= 2 and c >= 2) or (hcp in 13..17 and h == 3 and s >= 3 and d >= 2 and c >= 2) or hcp >= 18)`
- `2S` → `s >= 5 and top(s,5) >= 1 and ((hcp in 8..17 and h <= 2) or (hcp in 10..17 and h in 3..4))`
- `3C` → `c >= 6 and top(c,5) >= 2 and ((hcp in 8..14 and h <= 2) or (hcp in 13..14 and h == 3))`
- `2NT` → `(has(h,a) or (has(h,k) and h >= 2) or (has(h,q) and h >= 3)) and hcp in 13..18`
- `3D` → `d >= 5 and top(d,5) >= 2 and hcp in 7..16`

### (2S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 55.1% | 1268 | 203 | 3/7/**10**/11/14 | — | — | 49% |
| X | 21.7% | 500 | 68 | 11/13/**15**/16/20 | theirs: 0:4% 1:38% 2:41% 3:13% 4:4% | — | 33% |
| 3H | 9.7% | 223 | 36 | 10/11/**12**/13/16 | 5:18% 6:81% 7+:1% | **5.1** (4.0–6.7) | 6% |
| 2NT | 7.7% | 178 | 26 | 15/17/**17**/17/18 | — | — | 90% |
| 3D | 2.0% | 46 | 11 | 10/13/**14**/14/16 | 5:7% 6:83% 7:9% 8:2% | **6.5** (6.5–6.9) | 0% |
| 3C | 1.8% | 42 | 17 | 9/11/**13**/14/16 | 5:33% 6:43% 7:24% | **4.8** (4.5–6.3) | 5% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 105 | 12/14/**14**/16/20 |
| X | fav | 128 | 13/13/**15**/16/17 |
| X | unfav | 175 | 11/13/**14**/14/17 |
| X | both | 92 | 12/16/**16**/18/21 |
| 3H | none | 38 | 10/13/**13**/13/16 |
| 3H | fav | 47 | 11/11/**11**/11/13 |
| 3H | unfav | 59 | 10/12/**13**/16/17 |
| 3H | both | 79 | 10/11/**12**/12/16 |
| 2NT | fav | 34 | 16/17/**17**/17/18 |
| 2NT | unfav | 119 | 15/17/**17**/17/18 |
| 3D | none | 30 | 10/14/**14**/14/14 |
| 3C | both | 26 | 9/11/**13**/14/18 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 13/**15**/16 (209) | 14/**14**/16 (203) | 14/**16**/16 (66) | 17/**18**/18 (22) |
| 3H | 11/**12**/12 (90) | 11/**11**/14 (58) | 13/**13**/13 (65) | — |
| 2NT | — | — | 17/**17**/17 (116) | 16/**17**/17 (53) |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| 11–13 | 119 | 100% | 78% | 99% | 90% |
| 14–16 | 290 | 100% | 58% | 100% | 83% |
| 17+ | 81 | 99% | 93% | 75% | 67% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 11..16 and s <= 2 and h >= 3 and d >= 2 and c >= 2) or (hcp in 13..16 and s == 3 and h >= 3 and d >= 2 and c >= 2) or hcp >= 17)`
- `3H` → `h >= 5 and top(h,5) >= 2 and ((hcp in 10..16 and s <= 2) or (hcp in 12..16 and s == 3))`
- `2NT` → `(has(s,a) or (has(s,k) and s >= 2) or (has(s,q) and s >= 3)) and hcp in 15..18` *(+ balanced)*

### (2NT) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 97.4% | 2058 | 167 | 2/4/**6**/8/11 | — | — | 50% |
| X | 1.2% | 26 | 14 | 12/14/**18**/21/21 | — | — | 58% |

### (3C) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 44.5% | 385 | 51 | 4/8/**10**/11/16 | — | — | 36% |
| X | 22.7% | 197 | 24 | 10/15/**16**/18/20 | theirs: 0:16% 1:12% 2:7% 3:57% 4:7% 5+:1% | — | 64% |
| 3H | 11.2% | 97 | 10 | 8/11/**11**/11/16 | 5:6% 6:94% | **5.1** (5.1–5.1) | 2% |
| 3NT | 9.1% | 79 | 11 | 15/16/**17**/18/18 | — | — | 66% |
| 4C | 4.5% | 39 | 4 | 14/14/**14**/14/14 | 0:85% 1:13% 2:3% | **0.0** (0.0–0.0) | 0% |
| 3D | 4.0% | 35 | 6 | 9/11/**11**/15/15 | 0:3% 6:89% 7:9% | **6.2** (5.9–6.2) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 43 | 14/16/**17**/17/17 |
| X | unfav | 145 | 10/15/**15**/18/20 |
| 3H | none | 76 | 11/11/**11**/11/11 |
| 3NT | none | 32 | 16/16/**17**/17/17 |
| 3NT | unfav | 44 | 15/16/**17**/18/18 |
| 4C | unfav | 33 | 14/14/**14**/14/14 |
| 3D | unfav | 34 | 10/11/**11**/15/15 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 10/**10**/18 (55) | — | 15/**15**/17 (113) | 15/**16**/16 (16) |

Anatomy of X: per HCP band, support held (both majors = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | both majors ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 29 | 97% | 97% | 100% | 100% |
| 14–16 | 78 | 97% | 58% | 88% | 10% |
| 17+ | 86 | 94% | 27% | 100% | 31% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 10..17 and c <= 2 and s >= 3 and h >= 3 and d >= 2) or (hcp in 15..17 and c == 3 and s >= 3 and h >= 3 and d >= 2) or hcp >= 18)`
- `3H` → `h >= 6 and top(h,5) >= 2 and hcp in 8..16`
- `3NT` → `(has(c,a) or (has(c,k) and c >= 2) or (has(c,q) and c >= 3)) and hcp in 15..18`

### (3D) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 46.7% | 489 | 61 | 7/9/**11**/12/14 | — | — | 51% |
| X | 15.1% | 158 | 32 | 9/13/**13**/14/20 | theirs: 0:13% 1:18% 2:61% 3:8% | — | 59% |
| 3S | 13.7% | 143 | 13 | 9/11/**11**/14/16 | 5:13% 6:72% 7:15% | **6.7** (6.7–7.8) | 13% |
| 3H | 13.4% | 140 | 13 | 12/12/**12**/12/17 | 5:19% 6:80% | **6.2** (3.6–6.2) | 0% |
| 3NT | 5.0% | 52 | 11 | 16/16/**16**/20/21 | — | — | 94% |
| 4S | 3.6% | 38 | 3 | 13/13/**14**/17/17 | 6:18% 7:50% 9:32% | **4.4** (4.4–10.0) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 88 | 12/13/**13**/13/20 |
| X | unfav | 44 | 9/9/**13**/14/17 |
| 3S | none | 29 | 9/9/**10**/13/13 |
| 3S | fav | 34 | 14/14/**14**/14/14 |
| 3S | both | 67 | 11/11/**11**/11/16 |
| 3H | unfav | 55 | 8/12/**12**/13/17 |
| 3H | both | 78 | 12/12/**12**/12/17 |
| 3NT | none | 41 | 16/16/**16**/20/20 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 9/**13**/13 (50) | 13/**13**/13 (96) | — | — |
| 3S | — | 11/**11**/14 (125) | — | — |
| 3H | 13/**13**/13 (25) | 12/**12**/12 (84) | 12/**12**/12 (30) | — |

Anatomy of X: per HCP band, support held (both majors = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | both majors ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 19 | 100% | 100% | 95% | 100% |
| 11–13 | 96 | 95% | 76% | 100% | 99% |
| 17+ | 30 | 57% | 0% | 100% | 83% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 9..17 and d <= 2 and s >= 3 and h >= 3 and c >= 3) or hcp >= 18)`
- `3S` → `s >= 5 and top(s,5) >= 3 and hcp in 9..16`
- `3H` → `h >= 5 and top(h,5) >= 1 and hcp in 12..17`
- `3NT` → `(has(d,a) or (has(d,k) and d >= 2) or (has(d,q) and d >= 3)) and hcp in 16..21` *(+ balanced)*

### (3H) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 71.2% | 421 | 53 | 2/6/**10**/11/13 | — | — | 49% |
| X | 16.6% | 98 | 18 | 10/14/**14**/16/17 | theirs: 1:38% 2:56% 3:3% 4:2% 5+:1% | — | 56% |
| 3S | 5.9% | 35 | 9 | 10/10/**11**/13/17 | 5:34% 6:66% | **3.0** (3.0–6.4) | 11% |
| 3NT | 4.6% | 27 | 6 | 14/15/**18**/18/18 | — | — | 26% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 36 | 10/14/**14**/14/18 |
| X | fav | 29 | 13/15/**17**/17/17 |
| X | unfav | 32 | 11/14/**14**/16/16 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 10..16 and h <= 2 and s >= 3 and d >= 3 and c >= 3) or hcp >= 17)`

### (3S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 81.9% | 636 | 48 | 3/5/**10**/12/13 | — | — | 48% |
| X | 8.2% | 64 | 14 | 12/13/**16**/16/18 | theirs: <1:2% 1:9% 2:58% 3:23% 4:8% | — | 33% |
| 3NT | 6.7% | 52 | 5 | 11/17/**17**/17/18 | — | — | 75% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 3NT | unfav | 39 | 17/17/**17**/17/17 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 12..15 and s <= 3 and h >= 3 and d >= 2 and c >= 2) or hcp >= 16)`
- `3NT` → `(has(s,a) or (has(s,k) and s >= 2) or (has(s,q) and s >= 3)) and hcp in 11..18`

### (4H) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 80.7% | 343 | 30 | 6/9/**10**/11/15 | — | — | 50% |
| 4S | 14.6% | 62 | 7 | 8/9/**10**/12/14 | <5:2% 5:34% 6:65% | **6.7** (5.6–7.6) | 2% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 4S | unfav | 31 | 8/8/**12**/14/14 |

Dealer filters (paste into the custom filter box; derived from the data):

- `4S` → `s >= 5 and top(s,5) >= 2 and hcp in 8..14`

### (4S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 83.8% | 384 | 39 | 5/9/**10**/11/13 | — | — | 30% |
| 4NT | 7.9% | 36 | 4 | 10/18/**21**/21/21 | — | — | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 4NT | fav | 35 | 10/21/**21**/21/21 |

## Action rates: how the opening’s meaning changes the direct seat

Share of direct-seat decisions when RHO opens. Raw rates are confounded by
strength depletion — a strong 1C means opener holds 16+, so the seats behind
hold less — so the second table fixes the acting hand’s own HCP band.

| opening faced | n | pass | X | suit bid | NT | any action |
|---|---|---|---|---|---|---|
| 1C natural (3+) | 18930 | 49% | 8% | 39% | 4% | 51% |
| 1C short (2+) | 636 | 57% | 5% | 36% | 2% | 43% |
| 1C strong | 2951 | 62% | 3% | 32% | 2% | 38% |
| 1C Polish | 232 | 62% | 3% | 31% | 4% | 38% |
| 1D natural | 18716 | 51% | 10% | 35% | 4% | 49% |
| 1D nebulous | 1022 | 52% | 10% | 33% | 4% | 48% |
| 1H (any) | 12568 | 57% | 12% | 26% | 5% | 43% |
| 1S (any) | 13491 | 69% | 7% | 21% | 4% | 31% |

Action rate at fixed own strength (the fair comparison):

| opening faced | 6–8 HCP | 9–11 HCP | 12–14 HCP | 15+ HCP |
|---|---|---|---|---|
| 1C natural (3+) | 28% | 59% | 76% | 98% |
| 1C short (2+) | 28% | 50% | 70% | — |
| 1C strong | 33% | 48% | 68% | 68% |
| 1C Polish | 27% | 45% | 58% | — |
| 1D natural | 28% | 56% | 65% | 96% |
| 1D nebulous | 25% | 59% | 56% | 96% |
| 1H (any) | 21% | 41% | 65% | 96% |
| 1S (any) | 9% | 29% | 58% | 97% |

### (1C = strong, Precision-style) ? — for comparison

| action | n | HCP p5/p25/med/p75/p95 | bid-suit len | texture |
|---|---|---|---|---|
| P | 1842 | 2/5/**7**/9/13 | — | — |
| 1S | 228 | 5/8/**10**/12/14 | <4:4% 4:4% 5:78% 6:11% 7:2% | **4.2** (3.2–5.2) |
| 1H | 252 | 5/7/**10**/12/14 | <2:1% 2:3% 3:2% 4:5% 5:71% 6:16% 7+:2% | **4.4** (3.3–5.9) |
| X | 102 | 6/8/**10**/13/19 | — | — |
| 1D | 155 | 6/7/**10**/11/15 | 2:6% 3:6% 4:11% 5:50% 6:23% 7:3% 8+:1% | **4.6** (3.3–5.7) |
| 1NT | 44 | 4/7/**11**/15/16 | — | — |
| 2H | 34 | 4/6/**7**/10/13 | 0:6% 1:6% 3:6% 4:3% 5:18% 6:53% 7:9% | **4.0** (2.7–5.5) |
| 2S | 55 | 3/5/**6**/10/12 | <5:4% 5:13% 6:84% | **4.1** (3.8–5.0) |
| 2C | 75 | 6/8/**9**/12/14 | 1:11% 2:7% 3:1% 4:1% 5:32% 6:47% 7+:1% | **5.9** (2.8–6.8) |
| 2D | 44 | 4/6/**8**/10/13 | 0:5% 1:5% 2:9% 3:16% 4:5% 5:9% 6:48% 7:5% | **3.9** (1.2–5.3) |
| 3D | 36 | 8/8/**9**/10/13 | 6:64% 7:6% 8:31% | **5.0** (4.0–6.4) |

## Balancing seat: (opening) P (P) ?

Includes balancing over weak twos and preempts — the classic "protect with less" seat.

### (1C) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| X | 33.8% | 77 | 21 | 8/11/**14**/17/18 | theirs: 1:42% 2:19% 3:34% 4:1% 5:3% 6+:1% | — | 44% |
| P | 25.9% | 59 | 25 | 8/8/**8**/10/13 | — | — | 71% |
| 1S | 16.2% | 37 | 9 | 10/10/**12**/14/14 | 5:95% 6:5% | **4.4** (2.6–4.6) | 38% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | unfav | 47 | 11/11/**12**/17/18 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 8..17 and c <= 2 and s >= 3 and h >= 3 and d >= 2) or (hcp in 10..17 and c == 3 and s >= 3 and h >= 3 and d >= 2) or hcp >= 18)`

### (1D) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| X | 35.7% | 163 | 34 | 8/9/**11**/16/19 | theirs: 0:4% 1:8% 2:48% 3:28% 4:6% 5:6% | — | 61% |
| P | 21.9% | 100 | 28 | 5/8/**8**/8/9 | — | — | 55% |
| 1H | 19.0% | 87 | 13 | 6/9/**14**/14/14 | 5:98% 6:2% | **7.5** (4.1–7.5) | 1% |
| 1S | 10.1% | 46 | 11 | 8/10/**12**/12/15 | 5:100% | **4.6** (4.4–4.6) | 28% |
| 1NT | 6.6% | 30 | 10 | 11/11/**13**/14/16 | — | — | 100% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | fav | 39 | 9/12/**18**/19/19 |
| X | unfav | 47 | 8/11/**11**/16/17 |
| X | both | 56 | 8/9/**9**/9/13 |
| 1H | none | 60 | 12/14/**14**/14/14 |
| 1S | fav | 26 | 12/12/**12**/12/14 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 9/**14**/14 (20) | 9/**9**/12 (79) | 11/**13**/19 (45) | 17/**17**/18 (19) |

Anatomy of X: per HCP band, support held (both majors = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | both majors ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 65 | 92% | 17% | 100% | 95% |
| 11–13 | 32 | 100% | 19% | 100% | 22% |
| 14–16 | 30 | 60% | 20% | 100% | 90% |
| 17+ | 36 | 72% | 47% | 33% | 8% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 8..17 and d <= 2 and s >= 3 and h >= 3 and c >= 3) or (hcp in 11..17 and d in 3..4 and s >= 3 and h >= 3 and c >= 3) or hcp >= 18)`
- `1H` → `h >= 5 and top(h,5) >= 1 and hcp in 6..14`

### (1H) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 39.3% | 157 | 24 | 5/7/**9**/10/11 | — | — | 61% |
| X | 28.3% | 113 | 22 | 7/10/**15**/22/22 | theirs: 1:4% 2:37% 3:54% 4:4% | — | 47% |
| 1NT | 10.0% | 40 | 12 | 9/11/**11**/11/15 | — | — | 53% |
| 1S | 9.3% | 37 | 10 | 7/7/**7**/11/12 | 5:54% 6:46% | **5.1** (2.2–5.4) | 46% |
| 3NT | 6.3% | 25 | 1 | 22/22/**22**/22/22 | — | — | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 48 | 7/22/**22**/22/22 |
| X | both | 43 | 10/10/**11**/15/16 |
| 1NT | both | 26 | 10/11/**11**/11/16 |
| 3NT | none | 25 | 22/22/**22**/22/22 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | — | 10/**10**/14 (42) | 16/**22**/22 (61) | — |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 34 | 100% | 38% | 100% | 88% |
| 14–16 | 33 | 100% | 64% | 58% | 36% |
| 17+ | 40 | 100% | 3% | 3% | 3% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 7..17 and h <= 2 and s >= 3) or (hcp in 15..17 and h == 3 and s >= 3) or hcp >= 18)`

### (1S) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| X | 41.6% | 207 | 28 | 9/9/**10**/16/16 | theirs: 1:47% 2:47% 3:4% 4+:1% | — | 40% |
| P | 32.2% | 160 | 37 | 5/5/**7**/9/11 | — | — | 59% |
| 1NT | 8.9% | 44 | 17 | 9/10/**11**/15/16 | — | — | 70% |
| 2C | 7.2% | 36 | 7 | 9/9/**13**/13/15 | 5:86% 6:14% | **6.0** (5.3–7.1) | 0% |
| 2H | 5.2% | 26 | 6 | 10/10/**10**/15/15 | 5:96% 7:4% | **5.8** (5.8–6.8) | 8% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 45 | 10/10/**10**/11/15 |
| X | fav | 68 | 10/15/**16**/16/17 |
| X | unfav | 26 | 7/10/**12**/15/15 |
| X | both | 68 | 9/9/**9**/9/11 |
| 2C | both | 27 | 9/9/**13**/13/13 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 9/**9**/10 (97) | 10/**16**/16 (98) | — | — |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 119 | 100% | 48% | 100% | 100% |
| 11–13 | 16 | 81% | 6% | 100% | 94% |
| 14–16 | 66 | 97% | 79% | 91% | 86% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 9..15 and s <= 2 and h >= 3 and d >= 3 and c >= 3) or hcp >= 16)`

### (1NT) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 61.5% | 1557 | 266 | 4/7/**9**/10/13 | — | — | 78% |
| X | 10.7% | 272 | 99 | 8/10/**12**/15/18 | — | — | 46% |
| 2D | 6.9% | 175 | 40 | 6/9/**9**/11/15 | <1:2% 1:4% 2:24% 3:33% 4:27% 5:8% 6:2% | **3.7** (1.1–4.4) | 14% |
| 2H | 6.1% | 155 | 34 | 7/8/**10**/11/13 | <4:3% 4:3% 5:83% 6:6% 7:6% | **4.6** (3.8–6.0) | 5% |
| 2C | 6.1% | 155 | 49 | 6/7/**8**/10/14 | 0:12% 1:16% 2:14% 3:26% 4:17% 5:14% 6+:1% | **2.8** (0.2–4.5) | 18% |
| 2S | 5.8% | 148 | 18 | 7/9/**11**/13/16 | 5:65% 6:34% | **4.0** (2.7–4.9) | 16% |
| 3H | 1.5% | 37 | 1 | 9/9/**9**/9/9 | 7:100% | **4.4** (4.4–4.4) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 96 | 8/10/**14**/15/17 |
| X | fav | 44 | 9/11/**11**/12/15 |
| X | unfav | 81 | 9/11/**15**/16/18 |
| X | both | 51 | 7/10/**10**/11/15 |
| 2D | none | 73 | 7/8/**9**/9/15 |
| 2D | unfav | 51 | 6/10/**11**/11/11 |
| 2D | both | 34 | 8/9/**9**/10/10 |
| 2H | none | 34 | 7/7/**7**/8/15 |
| 2H | fav | 84 | 9/9/**11**/11/11 |
| 2C | none | 59 | 5/8/**8**/10/15 |
| 2C | fav | 32 | 8/8/**11**/12/14 |
| 2C | both | 40 | 7/7/**7**/8/10 |
| 2S | none | 68 | 6/7/**9**/15/16 |
| 2S | unfav | 60 | 7/11/**13**/13/13 |
| 3H | both | 37 | 9/9/**9**/9/9 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 8..18`
- `2D` → `((hcp in 6..15 and s >= 5) or (hcp in 6..15 and h >= 5))`
- `2H` → `h >= 5 and top(h,5) >= 2 and ((hcp in 7..13 and d >= 4) or (hcp in 7..13 and c >= 4))`
- `2C` → `(hcp in 6..14 and s >= 4 and h >= 4)`
- `2S` → `s >= 5 and top(s,5) >= 1 and hcp in 7..16`

### (2D) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 45.6% | 52 | 33 | 4/7/**8**/11/13 | — | — | 71% |
| X | 21.9% | 25 | 19 | 8/11/**11**/14/19 | theirs: 0:4% 1:24% 2:32% 3:32% 4:8% | — | 56% |

### (2H) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 56.2% | 217 | 67 | 5/8/**9**/10/14 | — | — | 69% |
| X | 21.5% | 83 | 24 | 9/10/**11**/12/17 | theirs: 1:12% 2:67% 3:12% 4:8% | — | 73% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | unfav | 41 | 10/10/**11**/11/13 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 9..16 and h <= 3 and s >= 3 and d >= 3 and c >= 3) or hcp >= 17)`

### (2S) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 38.3% | 233 | 70 | 6/8/**9**/11/14 | — | — | 65% |
| X | 33.6% | 204 | 40 | 9/12/**14**/19/21 | theirs: 1:31% 2:29% 3:38% | — | 45% |
| 2NT | 10.2% | 62 | 12 | 14/15/**15**/15/15 | — | — | 85% |
| 3H | 6.9% | 42 | 6 | 9/14/**14**/14/15 | 5:24% 6:76% | **4.5** (4.5–4.5) | 5% |
| 3D | 5.6% | 34 | 8 | 8/11/**14**/16/16 | 5:3% 6:91% 7:6% | **6.4** (5.3–6.4) | 3% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 79 | 9/10/**14**/15/19 |
| X | fav | 44 | 16/16/**21**/21/21 |
| X | unfav | 44 | 10/11/**14**/20/20 |
| X | both | 37 | 9/12/**14**/14/15 |
| 2NT | none | 32 | 14/15/**15**/15/17 |
| 3H | none | 35 | 9/14/**14**/14/14 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 14/**14**/21 (65) | 9/**11**/16 (60) | 14/**15**/19 (78) | — |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 34 | 100% | 94% | 100% | 91% |
| 11–13 | 29 | 100% | 86% | 93% | 83% |
| 14–16 | 79 | 100% | 85% | 86% | 48% |
| 17+ | 62 | 100% | 60% | 81% | 52% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 9..17 and s <= 2 and h >= 4 and d >= 2 and c >= 2) or (hcp in 12..17 and s == 3 and h >= 4 and d >= 2 and c >= 2) or hcp >= 18)`
- `2NT` → `(has(s,a) or (has(s,k) and s >= 2) or (has(s,q) and s >= 3)) and hcp in 14..15` *(+ balanced)*

### (3C) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 38.2% | 105 | 27 | 2/7/**8**/9/13 | — | — | 76% |
| X | 28.7% | 79 | 13 | 8/15/**15**/17/19 | theirs: 1:39% 2:27% 3:32% 4:3% | — | 46% |
| 3NT | 16.7% | 46 | 5 | 14/17/**17**/18/18 | — | — | 96% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 39 | 14/15/**15**/15/18 |
| X | unfav | 29 | 8/10/**14**/17/17 |
| 3NT | unfav | 29 | 17/17/**17**/17/17 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 8..17 and c <= 2 and s >= 3 and h >= 3 and d >= 3) or (hcp in 15..17 and c == 3 and s >= 3 and h >= 3 and d >= 3) or hcp >= 18)`

### (3D) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 63.3% | 169 | 32 | 6/8/**8**/11/12 | — | — | 64% |
| X | 16.1% | 43 | 16 | 8/12/**12**/19/20 | theirs: 0:2% 1:14% 2:70% 3:14% | — | 53% |

### (3H) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 55.4% | 98 | 27 | 7/9/**9**/11/16 | — | — | 72% |
| X | 15.8% | 28 | 9 | 10/11/**12**/14/17 | theirs: 1:57% 2:25% 3:4% 4:14% | — | 25% |
| 4S | 14.7% | 26 | 1 | 17/17/**17**/17/17 | 6:100% | **6.2** (6.2–6.2) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 4S | none | 26 | 17/17/**17**/17/17 |

### (3S) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 59.9% | 145 | 25 | 6/9/**10**/11/14 | — | — | 46% |
| 3NT | 12.4% | 30 | 7 | 11/11/**14**/19/20 | — | — | 33% |
| X | 12.0% | 29 | 10 | 10/13/**13**/14/19 | theirs: 1:69% 2:24% 3:7% | — | 10% |
| 4H | 10.3% | 25 | 4 | 14/14/**16**/16/20 | 5:16% 6:84% | **6.5** (4.5–6.5) | 16% |

### (4H) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 86.3% | 240 | 25 | 4/6/**7**/9/10 | — | — | 4% |

### (4S) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 90.7% | 333 | 37 | 5/8/**8**/10/13 | — | — | 56% |

## Responding after interference: partner opens, RHO acts

Key contexts: 1x (X) ? — redouble/new suits/jump raises; 1x (overcall) ? — negative doubles, raises, free bids. 1C contexts show STANDARD responders (transfer-response pairs are tabulated separately below); 1D contexts use natural openers. After 1M (X) much of the field plays transfers / graded raises (2M−1 constructive, 2M weak or vice versa), so read the **partner's suit** column: when most hands hold 3+ support, the bid is a raise in disguise and its derived rule keys on support + strength band, not the named suit.

### 1C (X) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♣ |
|---|---|---|---|---|---|---|---|---|
| P | 32.1% | 323 | 102 | 0/3/**4**/5/7 | — | — | 64% | <2:2% 2:45% 3:31% 4:19% 5:3% |
| 1H | 16.2% | 163 | 89 | 4/6/**7**/8/9 | 1:9% 2:9% 3:12% 4:46% 5:16% 6:9% | **3.4** (1.6–4.4) | 26% | 1:24% 2:25% 3:22% 4:14% 5:7% 6:7% |
| 1D | 16.4% | 165 | 89 | 4/5/**7**/9/10 | <2:2% 2:8% 3:10% 4:13% 5:46% 6:22% | **4.0** (2.2–5.1) | 27% | 0:2% 1:17% 2:35% 3:18% 4:24% 5:1% 6:3% |
| 1S | 15.7% | 158 | 69 | 4/6/**7**/8/11 | <2:2% 2:4% 3:11% 4:44% 5:24% 6:9% 7:5% | **3.2** (1.7–3.9) | 35% | 1:12% 2:35% 3:22% 4:9% 5:21% |
| XX | 7.4% | 75 | 59 | 9/10/**11**/12/16 | — | — | 57% | 0:7% 1:5% 2:17% 3:37% 4:21% 5:12% |
| 2C | 3.2% | 32 | 31 | 4/6/**7**/7/9 | 1:9% 4:41% 5:41% 6:9% | **2.5** (1.5–4.0) | 56% | 1:9% 4:41% 5:41% 6:9% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1H | none | 55 | 5/6/**6**/7/8 |
| 1H | fav | 46 | 4/6/**8**/8/9 |
| 1H | unfav | 26 | 4/6/**8**/8/13 |
| 1H | both | 36 | 4/5/**7**/8/9 |
| 1D | none | 49 | 4/5/**8**/9/11 |
| 1D | fav | 67 | 4/6/**7**/8/10 |
| 1D | both | 29 | 4/5/**5**/8/10 |
| 1S | none | 66 | 5/6/**7**/8/9 |
| 1S | fav | 29 | 1/6/**8**/8/10 |
| 1S | both | 42 | 6/7/**7**/9/11 |
| XX | both | 31 | 9/10/**11**/11/11 |

Dealer filters (paste into the custom filter box; derived from the data):

- `1H` → `hcp in 4..9`
- `1D` → `d >= 3 and hcp in 4..10`
- `1S` → `s >= 3 and hcp in 4..11`
- `XX` → `hcp in 9..16`

### 1D (X) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♦ |
|---|---|---|---|---|---|---|---|---|
| 1H | 24.7% | 460 | 75 | 4/6/**8**/10/12 | <2:2% 2:4% 3:5% 4:32% 5:38% 6:10% 7:9% | **3.6** (2.3–4.8) | 23% | <1:2% 1:28% 2:22% 3:29% 4:17% 5+:2% |
| P | 22.8% | 425 | 88 | 0/1/**4**/5/7 | — | — | 42% | 0:3% 1:36% 2:32% 3:15% 4:8% 5:5% |
| 1S | 21.2% | 395 | 58 | 3/6/**7**/9/10 | <4:2% 4:42% 5:41% 6:9% 7:6% | **4.2** (2.0–4.8) | 35% | 0:16% 1:18% 2:17% 3:16% 4:20% 5:12% 6+:1% |
| XX | 12.6% | 235 | 51 | 6/9/**11**/12/15 | — | — | 46% | 0:12% 1:12% 2:17% 3:28% 4:10% 5:19% 6+:1% |
| 3D | 5.2% | 97 | 30 | 3/5/**6**/8/9 | <4:1% 4:27% 5:62% 6:6% 7:4% | **2.5** (2.2–3.4) | 21% | <4:1% 4:27% 5:62% 6:6% 7:4% |
| 2D | 3.6% | 67 | 32 | 3/6/**6**/9/15 | 2:7% 3:9% 4:54% 5:27% 6+:3% | **2.8** (2.2–3.4) | 55% | 2:7% 3:9% 4:54% 5:27% 6+:3% |
| 2C | 1.6% | 30 | 18 | 4/7/**7**/8/13 | 1:3% 2:7% 3:7% 4:13% 5:13% 6:43% 7:13% | **2.9** (2.9–4.1) | 20% | 0:3% 1:40% 2:27% 3:7% 4:7% 5:13% 7:3% |
| 2S | 1.5% | 28 | 8 | 3/3/**3**/8/15 | 3:25% 5:4% 7:71% | **3.4** (3.4–3.4) | 21% | 0:4% 1:64% 2:7% 4:4% 5:21% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1H | none | 105 | 4/6/**10**/11/11 |
| 1H | fav | 87 | 5/7/**7**/9/10 |
| 1H | unfav | 116 | 6/8/**10**/10/12 |
| 1H | both | 152 | 6/6/**7**/8/14 |
| 1S | none | 76 | 5/8/**10**/10/12 |
| 1S | fav | 67 | 4/6/**7**/10/10 |
| 1S | unfav | 91 | 1/3/**7**/7/12 |
| 1S | both | 161 | 6/6/**7**/8/9 |
| XX | none | 109 | 7/10/**11**/12/15 |
| XX | fav | 37 | 7/9/**9**/10/10 |
| XX | unfav | 52 | 9/12/**12**/13/15 |
| XX | both | 37 | 6/7/**8**/14/14 |
| 3D | unfav | 39 | 2/3/**6**/6/9 |
| 3D | both | 25 | 5/7/**8**/8/8 |

Dealer filters (paste into the custom filter box; derived from the data):

- `1H` → `h >= 3 and hcp in 4..12`
- `1S` → `s >= 4 and top(s,5) >= 1 and hcp in 3..10`
- `XX` → `hcp in 6..15`
- `3D` → `d >= 4 and top(d,5) >= 1 and hcp in 3..9`
- `2D` → `d >= 3 and top(d,5) >= 1 and hcp in 3..15`

### 1H (X) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♥ |
|---|---|---|---|---|---|---|---|---|
| P | 25.9% | 382 | 54 | 0/1/**3**/6/8 | — | — | 31% | <1:1% 1:51% 2:31% 3:15% 4+:1% |
| XX | 11.6% | 171 | 26 | 10/10/**10**/12/17 | — | — | 61% | <2:2% 2:88% 3:5% 4:4% 5+:1% |
| 2NT | 11.4% | 168 | 24 | 8/9/**10**/13/14 | — | — | 83% | <4:1% 4:90% 5:8% |
| 2H | 10.5% | 155 | 33 | 4/5/**6**/7/9 | <3:1% 3:83% 4:15% 5+:1% | **3.4** (1.3–4.1) | 90% | <3:1% 3:83% 4:15% 5+:1% |
| 1S | 10.4% | 154 | 31 | 5/7/**7**/10/12 | <3:2% 3:3% 4:45% 5:40% 6:9% | **4.4** (3.3–4.6) | 32% | 0:8% 1:17% 2:66% 3:8% 4+:1% |
| 4H | 7.8% | 115 | 21 | 6/6/**6**/8/13 | 3:3% 4:15% 5:74% 6:8% | **5.1** (3.2–5.1) | 17% | 3:3% 4:15% 5:74% 6:8% |
| 2D | 6.8% | 100 | 27 | 5/7/**8**/9/14 | 1:2% 2:32% 3:20% 4:14% 5:30% 6:2% | **3.5** (0.9–4.9) | 71% | <1:1% 1:2% 2:3% 3:62% 4:31% 5+:1% |
| 3H | 4.0% | 59 | 16 | 4/5/**6**/8/9 | 3:3% 4:90% 5:7% | **4.0** (1.9–4.6) | 63% | 3:3% 4:90% 5:7% |
| 1NT | 3.0% | 44 | 16 | 7/7/**7**/9/10 | — | — | 43% | 1:34% 2:50% 3:5% 4:7% 5:5% |
| 2C | 2.2% | 33 | 10 | 6/6/**7**/7/9 | 0:9% 2:33% 3:33% 4:3% 5:3% 6:18% | **1.9** (1.9–3.0) | 30% | 0:3% 1:45% 2:9% 3:42% |
| 3C | 2.0% | 29 | 11 | 5/6/**8**/9/9 | 0:3% 1:14% 2:17% 3:34% 4:31% | **1.1** (0.0–2.3) | 69% | 3:3% 4:97% |
| 3D | 1.7% | 25 | 10 | 6/9/**9**/10/14 | 1:16% 2:16% 3:48% 4:8% 5:12% | **1.5** (0.2–3.9) | 72% | 3:4% 4:84% 5:12% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| XX | fav | 43 | 10/10/**12**/12/14 |
| XX | unfav | 43 | 10/10/**12**/12/12 |
| XX | both | 61 | 10/10/**10**/10/10 |
| 2NT | none | 54 | 8/13/**14**/14/14 |
| 2NT | unfav | 90 | 9/9/**9**/9/11 |
| 2H | none | 37 | 6/7/**7**/7/9 |
| 2H | fav | 49 | 5/5/**5**/5/7 |
| 2H | both | 52 | 3/4/**6**/7/7 |
| 1S | none | 59 | 5/7/**7**/7/8 |
| 1S | unfav | 39 | 6/7/**10**/12/12 |
| 1S | both | 40 | 2/6/**8**/10/10 |
| 4H | fav | 83 | 6/6/**6**/6/8 |
| 2D | none | 35 | 7/7/**7**/9/14 |
| 2D | unfav | 25 | 6/9/**9**/9/11 |

Dealer filters (paste into the custom filter box; derived from the data):

- `XX` → `hcp in 10..17`
- `2NT` → `h >= 4 and hcp in 8..14`
- `2H` → `h >= 3 and hcp in 4..9`
- `1S` → `s >= 4 and top(s,5) >= 1 and hcp in 5..12`
- `4H` → `h >= 4 and hcp in 6..13`
- `2D` → `h >= 3 and hcp in 5..14`

### 1S (X) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♠ |
|---|---|---|---|---|---|---|---|---|
| P | 23.5% | 222 | 50 | 3/3/**4**/6/8 | — | — | 43% | 0:14% 1:5% 2:41% 3:37% 4:3% |
| 2S | 15.6% | 147 | 34 | 2/4/**6**/8/8 | 3:90% 4:9% | **1.9** (1.3–4.4) | 57% | 3:90% 4:9% |
| 2H | 10.6% | 100 | 35 | 4/8/**8**/9/11 | 2:47% 3:23% 4:19% 5:11% | **2.4** (1.5–3.6) | 58% | 2:2% 3:74% 4:24% |
| 2NT | 9.9% | 93 | 20 | 8/10/**10**/11/13 | — | — | 73% | 3:3% 4:94% 5:1% 6:2% |
| 3S | 7.6% | 72 | 17 | 1/2/**5**/6/8 | <4:1% 4:78% 5:21% | **2.6** (0.7–3.2) | 69% | <4:1% 4:78% 5:21% |
| 4S | 6.9% | 65 | 20 | 5/6/**7**/9/13 | 3:9% 4:63% 5:25% 6:3% | **3.2** (2.6–4.6) | 31% | 3:9% 4:63% 5:25% 6:3% |
| XX | 6.7% | 63 | 26 | 9/10/**11**/13/15 | — | — | 67% | 1:3% 2:48% 3:40% 4:8% 5+:2% |
| 1NT | 6.6% | 62 | 21 | 6/6/**6**/8/10 | — | — | 10% | <1:2% 1:61% 2:18% 3:18% 4+:2% |
| 2C | 5.2% | 49 | 15 | 6/6/**6**/8/10 | 1:10% 2:4% 3:57% 5:4% 6:12% 8:12% | **4.3** (4.3–4.4) | 4% | 0:55% 1:18% 2:16% 3:4% 4:6% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2S | unfav | 57 | 4/4/**4**/7/9 |
| 2S | both | 44 | 3/6/**7**/8/8 |
| 2H | both | 55 | 6/8/**8**/8/10 |
| 2NT | unfav | 25 | 10/10/**10**/10/12 |
| 2NT | both | 45 | 7/8/**10**/11/13 |
| 3S | fav | 47 | 1/1/**2**/5/5 |
| 4S | both | 41 | 6/6/**7**/8/12 |

Dealer filters (paste into the custom filter box; derived from the data):

- `2S` → `s >= 3 and hcp in 2..8`
- `2H` → `s >= 3 and hcp in 4..11`
- `2NT` → `s >= 4 and hcp in 8..13`
- `3S` → `s >= 4 and hcp in 1..8`
- `4S` → `s >= 4 and hcp in 5..13`
- `XX` → `hcp in 9..15`

### 1C (1S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♣ |
|---|---|---|---|---|---|---|---|---|
| X | 40.9% | 593 | 141 | 5/8/**9**/11/16 | theirs: <1:2% 1:19% 2:35% 3:28% 4:15% 5+:1% | — | 50% | <1:2% 1:15% 2:20% 3:44% 4:9% 5:9% |
| P | 26.9% | 391 | 122 | 1/4/**5**/6/8 | — | — | 58% | 1:9% 2:32% 3:26% 4:25% 5:6% 6+:2% |
| 1NT | 8.5% | 123 | 33 | 7/8/**10**/10/10 | — | — | 97% | <2:2% 2:3% 3:66% 4:24% 5:6% |
| 2H | 6.7% | 97 | 52 | 6/10/**10**/11/14 | <3:1% 3:13% 5:35% 6:30% 7:10% 8:10% | **4.3** (3.1–5.5) | 19% | 0:8% 1:19% 2:31% 3:33% 4:8% 5+:1% |
| 2D | 5.4% | 79 | 47 | 6/8/**10**/13/14 | 1:5% 2:28% 3:13% 4:19% 5:28% 6:5% 7:3% | **3.3** (1.7–5.4) | 27% | 0:3% 1:28% 2:19% 3:46% 4:5% |
| 2C | 3.7% | 54 | 42 | 5/7/**7**/9/14 | <2:2% 2:7% 3:17% 4:44% 5:24% 6:6% | **2.8** (2.3–4.2) | 41% | <2:2% 2:7% 3:17% 4:44% 5:24% 6:6% |
| 2S | 2.1% | 31 | 22 | 8/10/**13**/13/15 | 0:3% 1:23% 2:42% 3:23% 4:10% | **0.2** (0.0–3.0) | 65% | 1:6% 3:16% 4:48% 5:3% 6:26% |
| 3NT | 2.1% | 30 | 9 | 14/14/**14**/14/17 | — | — | 93% | 1:7% 2:3% 3:83% 4:7% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 122 | 6/8/**9**/11/14 |
| X | fav | 72 | 5/5/**6**/10/11 |
| X | unfav | 190 | 9/10/**10**/11/16 |
| X | both | 209 | 6/7/**8**/9/15 |
| 1NT | fav | 40 | 7/8/**8**/8/8 |
| 1NT | both | 66 | 10/10/**10**/10/10 |
| 2H | none | 37 | 6/8/**10**/10/15 |
| 2D | none | 35 | 6/8/**10**/13/15 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 9/**9**/11 (125) | 7/**8**/11 (209) | 7/**10**/10 (164) | 8/**9**/10 (95) |
| 1NT | — | — | 8/**8**/10 (69) | 10/**10**/10 (53) |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 5..16`
- `1NT` → `(has(s,a) or (has(s,k) and s >= 2) or (has(s,q) and s >= 3)) and hcp in 7..10` *(+ balanced)*
- `2H` → `h >= 3 and top(h,5) >= 1 and (hcp >= 11 or top(h,5) >= 2) and ((hcp in 6..14 and s <= 2) or (hcp in 7..14 and s in 3..4))`
- `2D` → `hcp in 6..14`
- `2C` → `c >= 3 and hcp in 5..14`

### 1D (1S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♦ |
|---|---|---|---|---|---|---|---|---|
| X | 40.8% | 877 | 113 | 6/7/**9**/10/12 | theirs: 0:5% 1:17% 2:29% 3:30% 4:11% 5:8% | — | 44% | 1:9% 2:34% 3:20% 4:21% 5:15% 6+:1% |
| P | 29.9% | 642 | 93 | 1/3/**6**/7/13 | — | — | 60% | 1:14% 2:39% 3:38% 4:7% 5+:2% |
| 1NT | 5.4% | 116 | 33 | 6/7/**8**/10/10 | — | — | 76% | 1:17% 2:40% 3:28% 4:12% 5:3% |
| 2D | 5.8% | 124 | 50 | 5/6/**6**/8/10 | 1:6% 2:11% 3:15% 4:54% 5:13% | **1.9** (1.0–2.4) | 57% | 1:6% 2:11% 3:15% 4:54% 5:13% |
| 2H | 4.7% | 100 | 44 | 6/8/**10**/11/14 | <3:1% 3:6% 4:1% 5:33% 6:51% 7:8% | **4.6** (3.2–5.5) | 17% | <1:1% 1:24% 2:42% 3:13% 4:15% 5:5% |
| 2C | 3.9% | 83 | 41 | 6/7/**10**/10/13 | 1:4% 2:8% 3:25% 4:13% 5:45% 6:5% | **5.7** (3.0–5.9) | 43% | 1:6% 2:20% 3:31% 4:28% 5:14% |
| 2S | 3.2% | 69 | 22 | 9/10/**11**/12/14 | 0:9% 1:43% 2:28% 3:4% 4:14% 5+:1% | **4.5** (0.0–5.6) | 28% | 4:54% 5:42% 6:4% |
| 3D | 2.6% | 56 | 15 | 5/6/**6**/6/7 | 4:41% 5:52% 6:7% | **1.9** (1.7–2.4) | 64% | 4:41% 5:52% 6:7% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 250 | 6/7/**9**/10/11 |
| X | fav | 162 | 6/6/**10**/10/13 |
| X | unfav | 262 | 6/7/**10**/10/12 |
| X | both | 203 | 6/7/**7**/9/13 |
| 1NT | fav | 28 | 6/6/**9**/9/11 |
| 1NT | unfav | 62 | 6/8/**8**/8/10 |
| 2D | none | 29 | 3/6/**7**/10/10 |
| 2D | fav | 49 | 5/6/**6**/7/9 |
| 2H | none | 36 | 6/7/**10**/10/12 |
| 2H | both | 29 | 6/9/**9**/13/13 |
| 2C | fav | 46 | 6/7/**7**/10/14 |
| 2S | fav | 29 | 10/10/**10**/14/14 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 7/**10**/10 (194) | 7/**9**/11 (258) | 6/**7**/10 (260) | 7/**9**/11 (165) |
| 1NT | — | — | 6/**8**/10 (37) | 8/**8**/9 (78) |
| 2D | — | 6/**6**/7 (41) | 6/**6**/8 (42) | 5/**7**/7 (29) |
| 2H | 6/**8**/14 (19) | 9/**10**/10 (39) | 7/**9**/11 (25) | 8/**11**/13 (17) |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 6..12`
- `1NT` → `hcp in 6..10`
- `2D` → `((hcp in 3..10 and s <= 2) or (hcp in 5..10 and s in 3..5))`
- `2H` → `h >= 5 and top(h,5) >= 1 and ((hcp in 5..14 and s <= 2) or (hcp in 6..14 and s in 3..5))`
- `2C` → `top(c,5) >= 1 and ((hcp in 5..13 and s <= 2) or (hcp in 6..13 and s in 3..4))`
- `2S` → `((hcp in 9..11 and s >= 4) or (hcp in 9..14 and s <= 3 and h <= 3) or (hcp in 12..14 and d >= 5) or (hcp in 12..14 and c >= 5))`

### 1H (1S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♥ |
|---|---|---|---|---|---|---|---|---|
| 2H | 26.5% | 379 | 32 | 4/6/**7**/8/10 | 3:79% 4:20% | **3.5** (1.3–4.6) | 54% | 3:79% 4:20% |
| P | 13.2% | 188 | 36 | 2/5/**6**/6/7 | — | — | 16% | 1:35% 2:50% 3:11% 4:3% |
| X | 11.6% | 165 | 34 | 6/7/**9**/10/14 | theirs: 1:15% 2:39% 3:22% 4:24% | — | 24% | 1:41% 2:48% 3:10% |
| 2NT | 10.6% | 151 | 30 | 8/11/**13**/14/17 | — | — | 40% | 3:15% 4:43% 5:42% |
| 2S | 9.9% | 141 | 34 | 9/10/**12**/14/17 | 1:16% 2:16% 3:36% 4:28% 5:3% | **4.0** (2.6–5.9) | 57% | 3:60% 4:16% 5:22% |
| 3H | 9.7% | 138 | 14 | 2/4/**6**/6/8 | 3:4% 4:95% | **3.4** (0.7–3.5) | 57% | 3:4% 4:95% |
| 2D | 6.0% | 85 | 30 | 6/9/**9**/11/17 | 1:2% 2:4% 3:15% 4:8% 5:11% 6:18% 7:42% | **5.6** (3.3–5.6) | 25% | 1:6% 2:58% 3:26% 4:7% 5:4% |
| 4H | 3.2% | 45 | 21 | 4/6/**8**/12/14 | 3:4% 4:62% 5:29% 6:4% | **3.4** (3.0–4.3) | 27% | 3:4% 4:62% 5:29% 6:4% |
| 1NT | 2.9% | 41 | 14 | 9/9/**9**/10/11 | — | — | 44% | 1:49% 2:44% 3:5% 4:2% |
| 2C | 2.2% | 31 | 13 | 6/6/**9**/13/17 | 1:10% 2:16% 3:6% 4:16% 5:26% 6:13% 7:13% | **6.0** (2.9–6.5) | 19% | 1:19% 2:65% 3:16% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2H | none | 50 | 6/6/**6**/6/6 |
| 2H | fav | 114 | 4/7/**7**/8/9 |
| 2H | unfav | 73 | 6/6/**6**/8/10 |
| 2H | both | 142 | 4/5/**8**/8/8 |
| X | none | 32 | 6/13/**13**/13/18 |
| X | unfav | 67 | 6/6/**7**/7/9 |
| X | both | 43 | 7/9/**10**/10/13 |
| 2NT | none | 30 | 9/12/**14**/14/17 |
| 2NT | fav | 73 | 8/11/**14**/14/17 |
| 2NT | unfav | 26 | 11/11/**12**/12/13 |
| 2S | none | 36 | 7/11/**14**/17/18 |
| 2S | fav | 56 | 9/9/**14**/14/17 |
| 2S | both | 31 | 6/10/**10**/12/13 |
| 3H | fav | 35 | 3/4/**4**/4/6 |
| 3H | unfav | 38 | 6/6/**6**/6/7 |
| 3H | both | 50 | 4/6/**6**/6/8 |
| 2D | unfav | 46 | 6/9/**9**/9/10 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 2H | 6/**6**/9 (89) | 4/**5**/5 (56) | 6/**8**/8 (143) | 7/**7**/7 (91) |
| X | 7/**7**/9 (24) | 7/**7**/10 (64) | 6/**6**/8 (36) | 9/**13**/13 (41) |
| 2NT | — | 9/**12**/12 (17) | 10/**11**/12 (41) | 13/**14**/14 (86) |
| 2S | 9/**9**/9 (23) | 10/**12**/12 (23) | 10/**13**/17 (51) | 11/**14**/14 (44) |

Dealer filters (paste into the custom filter box; derived from the data):

- `2H` → `((hcp in 4..11 and h >= 4) or (hcp in 4..11 and s >= 4) or (hcp in 4..11 and s <= 3 and h <= 3))`
- `X` → `hcp in 6..14`
- `2NT` → `hcp in 8..17`
- `2S` → `((hcp in 9..17 and h >= 4) or (hcp in 9..17 and s <= 3 and h <= 3))`
- `3H` → `h >= 4 and hcp in 2..8`
- `2D` → `d >= 3 and top(d,5) >= 1 and hcp in 6..17`

### 1C (1H) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♣ |
|---|---|---|---|---|---|---|---|---|
| X | 30.7% | 384 | 134 | 6/8/**9**/10/15 | theirs: 1:14% 2:51% 3:26% 4:5% 5:3% | — | 58% | 1:3% 2:29% 3:35% 4:29% 5:3% |
| 1S | 19.1% | 239 | 108 | 7/7/**9**/10/14 | 1:3% 2:20% 3:27% 4:8% 5:27% 6:15% | **3.3** (2.1–4.9) | 41% | 1:6% 2:17% 3:19% 4:51% 5:8% |
| P | 15.7% | 196 | 98 | 2/4/**5**/7/7 | — | — | 57% | 1:3% 2:10% 3:39% 4:36% 5:12% |
| 2C | 7.7% | 96 | 50 | 5/7/**7**/9/12 | 1:2% 2:3% 3:4% 4:38% 5:53% | **3.1** (2.5–3.9) | 9% | 1:2% 2:3% 3:4% 4:38% 5:53% |
| 1NT | 6.1% | 76 | 39 | 7/8/**9**/9/10 | — | — | 74% | 2:3% 3:14% 4:55% 5:28% |
| 2H | 5.9% | 74 | 40 | 8/9/**12**/14/15 | 1:31% 2:18% 3:45% 4:7% | **3.3** (0.9–4.7) | 36% | 1:7% 2:7% 3:16% 4:35% 5:34% 6+:1% |
| 2D | 5.5% | 69 | 34 | 6/10/**12**/12/15 | <5:3% 5:51% 6:39% 7:7% | **4.3** (3.7–4.8) | 14% | 1:6% 2:19% 3:9% 4:52% 5:13% 6+:1% |
| 3C | 5.1% | 64 | 15 | 5/5/**6**/8/8 | 4:6% 5:91% 6:3% | **3.2** (2.3–6.2) | 0% | 4:6% 5:91% 6:3% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 77 | 6/7/**8**/9/11 |
| X | fav | 114 | 6/8/**9**/11/17 |
| X | unfav | 91 | 6/8/**9**/10/13 |
| X | both | 102 | 6/9/**10**/12/15 |
| 1S | none | 84 | 7/7/**8**/11/14 |
| 1S | fav | 74 | 7/7/**10**/11/15 |
| 1S | unfav | 29 | 6/8/**9**/10/12 |
| 1S | both | 52 | 7/7/**8**/9/10 |
| 2C | fav | 29 | 5/7/**7**/7/10 |
| 2C | unfav | 29 | 6/6/**8**/8/11 |
| 1NT | none | 45 | 7/9/**9**/9/10 |
| 1NT | both | 26 | 7/8/**8**/8/10 |
| 2H | none | 30 | 9/10/**12**/14/14 |
| 2D | none | 40 | 10/10/**12**/12/14 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 6/**7**/10 (56) | 8/**9**/10 (196) | 7/**9**/10 (100) | 9/**10**/13 (32) |
| 1S | 8/**10**/12 (55) | 7/**7**/10 (92) | 8/**9**/11 (62) | 7/**7**/9 (30) |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 6..15`
- `1S` → `((hcp in 6..14 and h <= 2) or (hcp in 7..14 and h in 3..4))`
- `2C` → `c >= 4 and top(c,5) >= 1 and hcp in 5..12`
- `1NT` → `(has(h,a) or (has(h,k) and h >= 2) or (has(h,q) and h >= 3)) and hcp in 7..10`
- `2H` → `((hcp in 8..11 and s >= 4) or (hcp in 8..15 and s <= 3 and h <= 3) or (hcp in 12..15 and d >= 5) or (hcp in 12..15 and c >= 5))`
- `2D` → `d >= 5 and top(d,5) >= 1 and hcp in 6..15`

### 1D (1H) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♦ |
|---|---|---|---|---|---|---|---|---|
| X | 37.2% | 761 | 99 | 5/7/**8**/10/12 | theirs: 1:9% 2:35% 3:40% 4:14% 5:2% | — | 47% | <1:1% 1:22% 2:24% 3:29% 4:16% 5:7% |
| P | 20.4% | 417 | 70 | 2/3/**4**/5/9 | — | — | 57% | 1:14% 2:64% 3:9% 4:12% |
| 1S | 17.5% | 358 | 89 | 4/7/**9**/10/13 | <2:2% 2:5% 3:31% 4:11% 5:32% 6:15% 7:4% | **4.2** (2.4–5.2) | 40% | 0:6% 1:6% 2:35% 3:37% 4:10% 5:6% |
| 2D | 6.3% | 129 | 36 | 4/7/**7**/8/11 | 2:3% 3:5% 4:71% 5:17% 6:3% | **3.3** (2.3–3.6) | 38% | 2:3% 3:5% 4:71% 5:17% 6:3% |
| 2H | 4.2% | 87 | 30 | 7/9/**10**/12/13 | <1:1% 1:6% 2:11% 3:36% 4:23% 5:23% | **2.0** (0.0–3.8) | 37% | 0:13% 1:11% 2:9% 3:32% 4:16% 5:17% 6+:1% |
| 2C | 4.0% | 81 | 22 | 7/9/**11**/11/19 | 2:6% 3:4% 4:1% 5:7% 6:33% 7:2% 8:46% | **7.1** (4.8–7.1) | 11% | <2:1% 2:75% 3:9% 4:5% 5:10% |
| 1NT | 3.9% | 80 | 27 | 7/7/**9**/9/11 | — | — | 89% | 2:35% 3:39% 4:5% 5:21% |
| 3D | 3.1% | 64 | 15 | 4/7/**7**/7/9 | 4:75% 5:19% 6:6% | **3.0** (2.1–3.6) | 28% | 4:75% 5:19% 6:6% |
| 2S | 1.3% | 26 | 14 | 7/9/**9**/11/11 | 1:38% 3:31% 4:4% 6:27% | **2.1** (0.4–4.3) | 27% | 0:8% 1:8% 2:42% 3:4% 4:4% 5:35% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 154 | 4/8/**9**/11/13 |
| X | fav | 321 | 7/7/**8**/9/12 |
| X | unfav | 144 | 6/8/**9**/10/12 |
| X | both | 142 | 5/6/**7**/9/10 |
| 1S | none | 85 | 4/7/**9**/9/13 |
| 1S | fav | 161 | 4/8/**10**/12/12 |
| 1S | unfav | 43 | 5/7/**9**/9/13 |
| 1S | both | 69 | 5/6/**6**/8/11 |
| 2D | fav | 37 | 7/7/**9**/9/12 |
| 2D | both | 64 | 4/4/**7**/7/9 |
| 2H | fav | 54 | 9/9/**10**/12/12 |
| 2C | both | 43 | 7/11/**11**/11/15 |
| 1NT | fav | 54 | 7/7/**9**/9/9 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 7/**8**/8 (67) | 8/**9**/9 (264) | 7/**7**/9 (303) | 7/**10**/12 (127) |
| 1S | 7/**7**/8 (30) | 6/**9**/9 (138) | 7/**9**/11 (93) | 8/**10**/12 (97) |
| 2D | — | 7/**7**/9 (31) | 9/**9**/9 (25) | 7/**7**/8 (70) |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 5..12`
- `1S` → `s >= 3 and hcp in 4..13`
- `2D` → `d >= 4 and top(d,5) >= 1 and hcp in 4..11`
- `2H` → `((hcp in 7..13 and h >= 4) or (hcp in 7..13 and s >= 4) or (hcp in 7..11 and s <= 3 and h <= 3))`
- `2C` → `c >= 4 and top(c,5) >= 1 and hcp in 7..19`
- `1NT` → `(has(h,a) or (has(h,k) and h >= 2) or (has(h,q) and h >= 3)) and hcp in 7..11` *(+ balanced)*

### 1S (2H) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♠ |
|---|---|---|---|---|---|---|---|---|
| P | 32.1% | 292 | 30 | 2/3/**5**/7/10 | — | — | 35% | 0:14% 1:8% 2:46% 3:31% 4+:1% |
| 2S | 21.8% | 199 | 23 | 4/5/**6**/7/9 | <3:2% 3:63% 4:35% | **1.6** (0.7–2.4) | 74% | <3:2% 3:63% 4:35% |
| X | 9.2% | 84 | 25 | 7/8/**10**/11/15 | theirs: <1:1% 1:2% 2:31% 3:26% 4:39% | — | 61% | 0:5% 1:17% 2:62% 3:14% 4:2% |
| 3S | 9.2% | 84 | 11 | 1/6/**6**/7/7 | 3:4% 4:94% 5:2% | **0.7** (0.7–1.9) | 94% | 3:4% 4:94% 5:2% |
| 3H | 8.8% | 80 | 18 | 8/10/**10**/11/13 | 0:15% 1:14% 2:48% 3:21% 4:3% | **0.0** (0.0–2.7) | 68% | 3:75% 4:19% 5:6% |
| 4S | 6.4% | 58 | 13 | 5/6/**9**/9/11 | 3:9% 4:24% 5:67% | **2.3** (2.3–2.3) | 22% | 3:9% 4:24% 5:67% |
| 2NT | 4.8% | 44 | 15 | 7/9/**9**/10/13 | — | — | 61% | 3:34% 4:39% 5:27% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2S | none | 133 | 5/5/**6**/7/9 |
| 2S | fav | 38 | 6/6/**6**/8/9 |
| X | none | 32 | 7/7/**9**/13/15 |
| X | unfav | 31 | 7/10/**10**/10/11 |
| 3S | none | 32 | 7/7/**7**/7/7 |
| 3S | fav | 46 | 1/6/**6**/6/6 |
| 3H | unfav | 36 | 9/10/**10**/10/11 |
| 4S | none | 36 | 9/9/**9**/9/10 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 2S | 5/**5**/5 (41) | 5/**6**/7 (49) | 7/**7**/8 (73) | 4/**6**/6 (36) |

Dealer filters (paste into the custom filter box; derived from the data):

- `2S` → `((hcp in 4..11 and h >= 4) or (hcp in 4..11 and s >= 4) or (hcp in 4..11 and s <= 3 and h <= 3))`
- `X` → `hcp in 7..15`
- `3S` → `s >= 4 and hcp in 1..7`
- `3H` → `((hcp in 8..11 and s >= 4) or (hcp in 8..11 and s <= 3 and h <= 3))`
- `4S` → `s >= 4 and hcp in 5..11`

### 1H (2D) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♥ |
|---|---|---|---|---|---|---|---|---|
| X | 31.3% | 136 | 19 | 5/7/**8**/10/14 | theirs: 0:7% 1:5% 2:11% 3:60% 4:15% 5:2% | — | 67% | 1:2% 2:92% 3:5% |
| P | 22.8% | 99 | 23 | 1/5/**7**/8/14 | — | — | 52% | <1:1% 1:5% 2:76% 3:13% 4:5% |
| 2H | 13.4% | 58 | 17 | 6/6/**8**/10/10 | 2:5% 3:91% 4:3% | **2.4** (2.3–4.7) | 95% | 2:5% 3:91% 4:3% |
| 2S | 12.0% | 52 | 10 | 7/10/**10**/14/14 | <5:2% 5:52% 6:4% 7:42% | **5.4** (3.2–6.9) | 2% | 1:48% 2:52% |
| 3D | 6.5% | 28 | 12 | 8/10/**10**/10/14 | 1:14% 2:32% 3:29% 5:25% | **2.2** (0.7–3.5) | 50% | 1:7% 3:79% 4:11% 5:4% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 63 | 5/8/**8**/14/14 |
| X | both | 49 | 7/7/**7**/10/12 |
| 2S | none | 42 | 10/10/**10**/14/14 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 5/**5**/5 (16) | 8/**9**/10 (15) | 7/**8**/8 (82) | 10/**14**/14 (23) |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 5..14`
- `2H` → `((hcp in 6..11 and s >= 4) or (hcp in 6..11 and s <= 3 and h <= 3))`
- `2S` → `s >= 5 and top(s,5) >= 2 and hcp in 7..14`

### 1S (2D) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♠ |
|---|---|---|---|---|---|---|---|---|
| P | 24.4% | 192 | 26 | 3/4/**5**/8/8 | — | — | 14% | 0:7% 1:42% 2:35% 3:11% 4:5% |
| 2S | 17.3% | 136 | 20 | 1/4/**6**/7/8 | 2:4% 3:77% 4:16% 5:2% | **2.6** (1.5–3.2) | 64% | 2:4% 3:77% 4:16% 5:2% |
| 4S | 15.9% | 125 | 7 | 5/5/**6**/6/7 | 4:13% 5:87% | **2.7** (2.2–2.7) | 2% | 4:13% 5:87% |
| X | 13.7% | 108 | 17 | 6/7/**8**/8/10 | theirs: 1:3% 2:51% 3:31% 4:5% 5:9% | — | 22% | 0:48% 1:7% 2:41% 3:4% |
| 2H | 9.6% | 76 | 11 | 5/8/**9**/11/13 | <5:1% 5:26% 6:49% 7:24% | **5.2** (3.2–8.1) | 3% | 0:22% 1:9% 2:66% 3:3% |
| 3S | 7.6% | 60 | 7 | 1/5/**5**/6/7 | 3:5% 4:63% 5:32% | **3.0** (2.7–5.1) | 55% | 3:5% 4:63% 5:32% |
| 2NT | 4.6% | 36 | 6 | 7/7/**13**/13/13 | — | — | 72% | 3:6% 4:86% 5:8% |
| 3D | 3.6% | 28 | 16 | 7/9/**11**/13/13 | 0:11% 1:25% 2:11% 3:36% 4:18% | **0.9** (0.2–2.8) | 61% | 2:7% 3:21% 4:57% 5:14% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2S | none | 44 | 6/6/**7**/7/9 |
| 2S | fav | 44 | 4/4/**4**/5/8 |
| 2S | unfav | 30 | 1/6/**6**/6/6 |
| 4S | none | 58 | 6/6/**6**/6/6 |
| 4S | both | 63 | 5/5/**5**/5/7 |
| X | fav | 63 | 5/8/**8**/8/8 |
| 2H | fav | 45 | 5/8/**8**/9/9 |
| 3S | fav | 30 | 4/5/**5**/5/5 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 2S | 4/**4**/4 (42) | 7/**7**/7 (46) | 6/**6**/6 (42) | — |
| 4S | 5/**5**/5 (67) | 6/**6**/6 (55) | — | — |
| X | — | 8/**8**/8 (55) | 7/**7**/7 (34) | 9/**10**/10 (15) |

Dealer filters (paste into the custom filter box; derived from the data):

- `2S` → `((hcp in 1..11 and h >= 4) or (hcp in 1..11 and s <= 3 and h <= 3))`
- `4S` → `s >= 4 and top(s,5) >= 1 and hcp in 5..7`
- `X` → `hcp in 6..10`
- `2H` → `h >= 5 and top(h,5) >= 1 and hcp in 5..13`
- `3S` → `s >= 4 and top(s,5) >= 1 and hcp in 1..7`

### 1H (2C) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♥ |
|---|---|---|---|---|---|---|---|---|
| X | 21.7% | 109 | 25 | 6/9/**9**/10/13 | theirs: 1:3% 2:51% 3:23% 4:21% | — | 26% | 0:7% 1:20% 2:64% 3:7% |
| P | 20.7% | 104 | 22 | 4/6/**7**/8/10 | — | — | 40% | 0:5% 1:48% 2:39% 3:6% 4+:2% |
| 3C | 10.8% | 54 | 13 | 7/10/**11**/12/13 | 0:9% 1:13% 2:43% 3:35% | **0.2** (0.2–1.6) | 31% | 3:39% 4:56% 5:4% 6+:2% |
| 2NT | 10.4% | 52 | 9 | 7/11/**11**/11/13 | — | — | 17% | 3:15% 4:77% 5:8% |
| 2S | 7.8% | 39 | 8 | 5/8/**12**/12/13 | 5:49% 6:31% 7:21% | **4.5** (4.3–5.5) | 49% | 0:5% 2:56% 3:31% 4:8% |
| 2H | 6.4% | 32 | 7 | 3/7/**7**/7/9 | 3:69% 4:31% | **1.6** (1.5–3.6) | 22% | 3:69% 4:31% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | both | 80 | 6/9/**9**/10/13 |
| 3C | none | 26 | 7/11/**11**/11/11 |
| 2NT | none | 33 | 10/11/**11**/11/11 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | — | 9/**9**/9 (56) | 11/**11**/13 (25) | 7/**10**/10 (24) |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 6..13`
- `3C` → `((hcp in 7..11 and h >= 4) or (hcp in 7..13 and s >= 4))`
- `2NT` → `hcp in 7..13`

### 1S (2C) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♠ |
|---|---|---|---|---|---|---|---|---|
| P | 44.4% | 224 | 18 | 1/1/**3**/6/7 | — | — | 40% | 0:8% 1:23% 2:53% 3:15% |
| X | 17.6% | 89 | 20 | 6/7/**9**/11/12 | theirs: 1:4% 2:28% 3:53% 4:13% 5+:1% | — | 40% | 0:7% 1:38% 2:38% 3:16% 4+:1% |
| 2S | 12.5% | 63 | 11 | 4/6/**6**/6/10 | 3:90% 4:10% | **1.6** (1.6–1.6) | 27% | 3:90% 4:10% |
| 2H | 6.7% | 34 | 7 | 6/8/**9**/9/12 | 5:26% 6:74% | **4.6** (3.3–4.9) | 0% | 0:12% 1:76% 2:9% 3:3% |
| 3C | 5.9% | 30 | 12 | 8/10/**11**/12/13 | 1:10% 2:50% 3:33% 4:7% | **1.5** (1.5–3.1) | 83% | 3:67% 4:27% 5:3% 6:3% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | unfav | 49 | 6/6/**11**/11/12 |
| 2S | both | 51 | 6/6/**6**/6/9 |
| 2H | unfav | 25 | 6/9/**9**/12/12 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 6..12`
- `2S` → `(hcp in 4..11 and h >= 4)`

### 1D (2C) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♦ |
|---|---|---|---|---|---|---|---|---|
| X | 37.5% | 311 | 46 | 6/8/**9**/10/12 | theirs: 1:5% 2:37% 3:56% 4+:1% | — | 55% | 1:12% 2:32% 3:25% 4:21% 5:9% |
| P | 32.0% | 265 | 40 | 3/5/**5**/6/8 | — | — | 63% | 1:25% 2:22% 3:45% 4:7% 5+:1% |
| 2H | 15.1% | 125 | 21 | 7/9/**10**/10/12 | <5:3% 5:87% 6:10% | **4.3** (3.4–6.3) | 61% | 1:11% 2:58% 3:18% 4:6% 6:5% |
| 2D | 6.4% | 53 | 26 | 5/6/**7**/10/12 | 1:6% 2:19% 3:28% 4:42% 5:2% 6:4% | **1.8** (0.2–2.8) | 57% | 1:6% 2:19% 3:28% 4:42% 5:2% 6:4% |
| 3C | 3.4% | 28 | 7 | 9/12/**12**/15/15 | 0:4% 2:21% 3:75% | **3.2** (2.1–3.6) | 79% | 4:39% 5:57% 6:4% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 45 | 5/7/**8**/9/10 |
| X | fav | 171 | 8/8/**10**/12/12 |
| X | unfav | 44 | 7/9/**9**/10/11 |
| X | both | 51 | 6/9/**9**/10/10 |
| 2H | fav | 34 | 7/8/**9**/10/10 |
| 2H | unfav | 59 | 9/10/**10**/11/12 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 8/**8**/9 (16) | 8/**9**/9 (116) | 9/**10**/12 (175) | — |
| 2H | — | 7/**10**/11 (33) | 10/**10**/10 (76) | — |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 6..12`
- `2H` → `h >= 5 and top(h,5) >= 1 and hcp in 7..12`
- `2D` → `((hcp in 5..11 and h >= 4) or (hcp in 5..11 and s >= 4))`

### 1NT (X) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 39.5% | 349 | 124 | 2/4/**6**/7/10 | — | — | 75% |
| XX | 16.5% | 146 | 93 | 1/5/**7**/9/12 | — | — | 47% |
| 2C | 12.2% | 108 | 66 | 1/3/**6**/7/9 | <1:2% 1:9% 2:19% 3:19% 4:28% 5:19% 6:5% | **2.2** (1.3–3.9) | 39% |
| 2D | 11.4% | 101 | 36 | 1/4/**6**/6/8 | <2:3% 2:5% 3:16% 4:35% 5:39% 6:3% | **2.5** (1.5–3.5) | 41% |
| 2H | 10.9% | 96 | 50 | 1/4/**6**/8/10 | <1:1% 1:2% 2:4% 3:27% 4:7% 5:50% 6:7% 7+:1% | **2.5** (1.3–4.1) | 32% |
| 2S | 4.1% | 36 | 20 | 1/4/**6**/7/10 | 1:3% 2:3% 3:8% 5:50% 6:36% | **2.4** (1.5–3.1) | 17% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| XX | none | 49 | 2/6/**8**/9/10 |
| XX | fav | 65 | 1/4/**7**/9/13 |
| 2C | none | 33 | 1/4/**6**/8/9 |
| 2C | fav | 47 | 1/3/**6**/7/8 |
| 2D | none | 50 | 2/5/**6**/6/7 |
| 2D | fav | 26 | 3/4/**6**/7/9 |
| 2H | none | 30 | 5/6/**6**/8/10 |
| 2H | fav | 42 | 1/3/**4**/8/10 |

Dealer filters (paste into the custom filter box; derived from the data):

- `XX` → `hcp in 1..12`
- `2C` → `hcp in 1..9`
- `2D` → `d >= 3 and hcp in 1..8`
- `2H` → `h >= 3 and hcp in 1..10`

## Transfer responses over interference: 1C (…) ? by transfer-walsh pairs

Pairs whose 1C responses are transfers keep them on over a double or 1D overcall: X/1D = hearts, 1H = spades, 1S = no major. The derived rules key on the suit actually held.

### 1C (X) ? — transfer responders

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♣ |
|---|---|---|---|---|---|---|---|---|
| P | 30.7% | 132 | 102 | 0/3/**4**/5/8 | — | — | 65% | <2:2% 2:47% 3:33% 4:16% 5:2% |
| 1H | 20.0% | 86 | 89 | 3/6/**7**/8/9 | 1:19% 2:19% 3:45% 4:15% 5:2% | **3.6** (0.4–4.7) | 42% | <1:1% 1:10% 2:35% 3:33% 4:8% 5:13% |
| 1D | 17.9% | 77 | 89 | 4/5/**8**/8/12 | 1:5% 2:34% 3:27% 4:16% 5:13% 6:5% | **2.8** (0.9–4.0) | 14% | 1:21% 2:45% 3:10% 4:10% 5:1% 6:12% |
| 1S | 11.4% | 49 | 69 | 4/6/**7**/7/9 | 1:6% 2:24% 3:55% 4:6% 5:4% 6:4% | **2.3** (1.5–3.5) | 59% | 1:10% 2:8% 3:24% 4:39% 5:18% |
| XX | 9.1% | 39 | 59 | 4/8/**11**/11/16 | — | — | 46% | 0:15% 1:5% 2:10% 3:31% 4:15% 5:23% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1H | none | 31 | 3/6/**7**/8/8 |
| 1D | fav | 32 | 4/6/**8**/8/10 |

Dealer filters (paste into the custom filter box; derived from the data):

- `1H` → `(hcp in 3..11 and s >= 4)`
- `1D` → `(hcp in 4..11 and h >= 4)`

### 1C (1D) ? — transfer responders

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♣ |
|---|---|---|---|---|---|---|---|---|
| X | 31.9% | 113 | 112 | 4/7/**8**/10/14 | theirs: 1:17% 2:55% 3:15% 4:11% 5:3% | — | 51% | 1:9% 2:19% 3:43% 4:15% 5:5% 6:9% |
| 1H | 23.7% | 84 | 86 | 6/8/**9**/11/12 | 1:5% 2:18% 3:44% 4:21% 5:8% 6:4% | **3.2** (0.7–4.7) | 39% | 1:4% 2:26% 3:48% 4:7% 5:11% 6:5% |
| P | 13.0% | 46 | 83 | 2/3/**5**/7/10 | — | — | 59% | 2:20% 3:37% 4:26% 5:13% 6:4% |
| 1S | 10.2% | 36 | 65 | 6/7/**8**/10/11 | 1:8% 2:6% 3:44% 4:31% 5:6% 6:6% | **2.4** (1.5–5.6) | 61% | 1:6% 2:19% 3:19% 4:6% 5:50% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 43 | 5/8/**8**/9/12 |
| X | fav | 34 | 4/7/**8**/10/10 |
| 1H | none | 32 | 6/7/**8**/9/14 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 4/**7**/8 (19) | 8/**9**/11 (62) | 9/**9**/12 (17) | 6/**7**/9 (15) |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 4..14`
- `1H` → `(hcp in 6..12 and s >= 4)`

### 1C (1H) ? — transfer responders

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♣ |
|---|---|---|---|---|---|---|---|---|
| X | 38.4% | 229 | 134 | 5/7/**9**/10/14 | theirs: 1:17% 2:48% 3:24% 4:7% 5:3% | — | 48% | 1:7% 2:33% 3:34% 4:21% 5:4% |
| 1S | 21.0% | 125 | 108 | 6/7/**9**/10/13 | <1:2% 1:6% 2:38% 3:42% 4:5% 5:4% 6:2% | **2.4** (0.6–3.9) | 50% | 2:8% 3:11% 4:54% 5:26% |
| P | 14.6% | 87 | 98 | 2/4/**6**/7/8 | — | — | 69% | <2:1% 2:17% 3:33% 4:34% 5:13% 6+:1% |
| 2C | 6.4% | 38 | 50 | 6/7/**10**/12/15 | 1:5% 2:18% 3:8% 4:32% 5:32% 6:3% 8:3% | **3.3** (2.5–6.2) | 13% | 1:5% 2:18% 3:8% 4:32% 5:32% 6:3% 8:3% |
| 1NT | 4.5% | 27 | 39 | 7/7/**8**/9/10 | — | — | 59% | 2:4% 3:19% 4:41% 5:37% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 71 | 5/7/**8**/9/12 |
| X | fav | 65 | 6/7/**9**/10/14 |
| X | unfav | 52 | 6/8/**9**/10/13 |
| X | both | 41 | 6/7/**9**/11/15 |
| 1S | none | 26 | 7/9/**10**/10/14 |
| 1S | fav | 42 | 7/7/**9**/13/13 |
| 1S | unfav | 26 | 6/7/**8**/10/12 |
| 1S | both | 31 | 6/7/**8**/10/12 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 7/**7**/10 (41) | 8/**9**/9 (110) | 8/**9**/10 (56) | 7/**8**/9 (22) |
| 1S | 8/**8**/11 (22) | 7/**9**/10 (35) | 7/**9**/13 (44) | 7/**7**/9 (24) |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 5..14`
- `1S` → `((hcp in 6..11 and h >= 4) or (hcp in 6..11 and s <= 3 and h <= 3))`

## Advancing partner’s direct action: (1x) act (…) ?

Includes advances of overcalls and of takeout doubles (partner doubled, RHO passed or raised). 1C/1D contexts face natural openers only.

### (1C) 1H (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♥ |
|---|---|---|---|---|---|---|---|---|
| 1S | 31.7% | 104 | 26 | 4/9/**11**/11/12 | <4:2% 4:19% 5:51% 6:18% 7:10% | **3.4** (3.2–4.0) | 19% | 1:45% 2:39% 3:14% |
| P | 13.1% | 43 | 31 | 1/5/**5**/6/7 | — | — | 51% | 1:23% 2:44% 3:30% 6:2% |
| 2H | 14.3% | 47 | 21 | 5/5/**7**/8/10 | 3:70% 4:30% | **3.5** (2.1–3.8) | 77% | 3:70% 4:30% |
| 2C | 9.8% | 32 | 18 | 9/11/**11**/14/16 | 0:3% 2:16% 3:41% 4:9% 5:31% | **4.1** (2.6–6.3) | 75% | 1:16% 2:6% 3:75% 5:3% |
| 2D | 10.4% | 34 | 12 | 9/9/**12**/12/14 | 2:3% 3:3% 4:6% 5:18% 6:50% 8:21% | **2.7** (2.2–5.7) | 12% | 0:3% 1:47% 2:35% 3:15% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1S | both | 53 | 6/11/**11**/11/11 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 1S | 4/**5**/7 (15) | 9/**9**/12 (32) | 11/**11**/11 (47) | — |

Dealer filters (paste into the custom filter box; derived from the data):

- `1S` → `s >= 4 and top(s,5) >= 1 and ((hcp in 4..12 and c <= 2) or (hcp in 7..12 and c in 3..4))`

### (1C) 1S (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♠ |
|---|---|---|---|---|---|---|---|---|
| P | 25.5% | 168 | 42 | 2/4/**6**/6/9 | — | — | 39% | 0:30% 1:17% 2:45% 3:8% |
| 1NT | 18.9% | 125 | 27 | 8/10/**10**/10/11 | — | — | 22% | 0:5% 1:63% 2:30% 3+:2% |
| 2S | 15.2% | 100 | 28 | 6/7/**7**/8/9 | 3:98% 4:2% | **4.1** (3.0–4.1) | 98% | 3:98% 4:2% |
| 2C | 14.8% | 98 | 24 | 9/10/**11**/12/16 | 0:4% 2:6% 3:39% 4:47% 5:4% | **2.5** (2.3–2.9) | 83% | <1:1% 1:8% 2:3% 3:86% 4+:2% |
| 2H | 10.0% | 66 | 20 | 8/9/**10**/11/12 | 1:3% 3:5% 4:3% 5:23% 6:48% 7:18% | **5.9** (4.9–5.9) | 12% | 0:3% 1:33% 2:55% 3:9% |
| 2D | 8.5% | 56 | 17 | 8/9/**11**/11/12 | 1:11% 2:2% 3:11% 4:4% 5:11% 6:52% 8:11% | **3.4** (2.4–7.5) | 5% | 0:36% 1:25% 2:34% 3:4% 4+:2% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1NT | unfav | 100 | 8/10/**10**/10/11 |
| 2S | fav | 70 | 7/7/**7**/7/10 |
| 2C | unfav | 51 | 11/11/**11**/12/16 |
| 2H | none | 41 | 9/9/**9**/11/11 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 1NT | — | — | — | 10/**10**/10 (113) |
| 2S | — | — | 7/**7**/7 (69) | 8/**8**/9 (17) |

Dealer filters (paste into the custom filter box; derived from the data):

- `1NT` → `hcp in 8..11`
- `2S` → `s >= 3 and top(s,5) >= 1 and hcp in 6..9`
- `2C` → `hcp in 9..16`
- `2H` → `h >= 4 and top(h,5) >= 1 and (hcp >= 11 or top(h,5) >= 2) and hcp in 8..12`
- `2D` → `hcp in 8..12`

### (1D) 1H (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♥ |
|---|---|---|---|---|---|---|---|---|
| 1NT | 19.1% | 83 | 11 | 9/10/**11**/11/11 | — | — | 16% | 1:17% 2:83% |
| P | 17.7% | 77 | 19 | 2/5/**7**/7/9 | — | — | 17% | 1:29% 2:62% 3:8% 4+:1% |
| 1S | 16.1% | 70 | 26 | 6/9/**10**/10/11 | 4:33% 5:51% 6:10% 7:4% 8+:1% | **5.9** (4.8–7.6) | 36% | 1:14% 2:73% 3:13% |
| 2H | 14.1% | 61 | 16 | 7/7/**7**/8/9 | 2:3% 3:82% 4:15% | **4.2** (1.6–4.2) | 92% | 2:3% 3:82% 4:15% |
| 2C | 13.8% | 60 | 10 | 7/9/**9**/9/12 | 2:5% 3:2% 4:2% 5:5% 6:87% | **3.1** (3.1–5.2) | 7% | 1:65% 2:25% 3:8% 4+:2% |
| 2D | 11.3% | 49 | 18 | 8/9/**10**/11/14 | 1:2% 3:53% 4:27% 5:12% 6:6% | **2.1** (1.9–3.4) | 71% | 1:2% 2:20% 3:63% 4:14% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1NT | fav | 41 | 11/11/**11**/11/11 |
| 1NT | both | 26 | 7/9/**9**/10/11 |
| 1S | none | 28 | 7/9/**10**/10/11 |
| 1S | both | 28 | 7/10/**10**/10/10 |
| 2H | both | 40 | 7/7/**7**/7/9 |
| 2C | both | 54 | 7/9/**9**/9/12 |

Dealer filters (paste into the custom filter box; derived from the data):

- `1NT` → `hcp in 9..11`
- `1S` → `s >= 4 and top(s,5) >= 1 and ((hcp in 4..11 and d <= 2) or (hcp in 7..11 and d in 3..4))`
- `2H` → `h >= 3 and top(h,5) >= 1 and hcp in 7..9`
- `2C` → `c >= 5 and top(c,5) >= 2 and hcp in 7..12`

### (1D) 1S (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♠ |
|---|---|---|---|---|---|---|---|---|
| P | 26.6% | 172 | 30 | 5/6/**6**/7/8 | — | — | 32% | <1:2% 1:59% 2:33% 3:6% |
| 2D | 22.1% | 143 | 28 | 10/10/**11**/13/16 | 0:11% 1:8% 2:55% 3:12% 4:13% 5+:1% | **2.3** (0.9–2.6) | 59% | 0:3% 1:5% 2:9% 3:73% 4:8% 5+:1% |
| 2H | 15.6% | 101 | 20 | 10/11/**11**/14/14 | 3:7% 4:7% 5:29% 6:19% 7:39% | **5.7** (5.6–6.3) | 9% | 0:19% 1:59% 2:8% 3:13% |
| 1NT | 12.5% | 81 | 25 | 6/8/**10**/10/11 | — | — | 25% | 0:2% 1:65% 2:32% |
| 2S | 8.2% | 53 | 13 | 5/8/**9**/10/10 | 3:92% 4:8% | **1.5** (1.5–3.2) | 100% | 3:92% 4:8% |
| 2C | 6.3% | 41 | 15 | 8/8/**10**/12/16 | 0:2% 2:5% 3:10% 4:5% 5:20% 6:59% | **4.1** (2.2–5.0) | 22% | 1:44% 2:20% 3:29% 4:7% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2D | fav | 98 | 10/10/**10**/12/16 |
| 2D | both | 27 | 9/10/**13**/14/16 |
| 2H | none | 56 | 11/11/**11**/12/12 |
| 2H | fav | 36 | 10/12/**14**/14/14 |
| 1NT | none | 27 | 9/10/**10**/10/10 |
| 1NT | unfav | 40 | 6/7/**10**/10/10 |
| 2S | fav | 26 | 7/10/**10**/10/10 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 2D | 11/**12**/12 (27) | 10/**10**/10 (79) | 11/**14**/14 (17) | 14/**16**/16 (20) |
| 2H | — | 12/**12**/12 (30) | 11/**11**/11 (43) | 14/**14**/14 (22) |

Dealer filters (paste into the custom filter box; derived from the data):

- `2D` → `hcp in 10..16`
- `2H` → `h >= 4 and top(h,5) >= 2 and hcp in 10..14`
- `1NT` → `hcp in 6..11`
- `2S` → `s >= 3 and top(s,5) >= 1 and hcp in 5..10`

### (1H) 1S (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♠ |
|---|---|---|---|---|---|---|---|---|
| 2S | 42.2% | 86 | 10 | 4/7/**7**/8/9 | 3:87% 4:13% | **2.4** (1.7–2.4) | 92% | 3:87% 4:13% |
| P | 20.1% | 41 | 10 | 4/4/**6**/7/9 | — | — | 37% | 0:34% 1:17% 2:29% 3:20% |
| 1NT | 14.7% | 30 | 5 | 9/9/**9**/9/9 | — | — | 20% | 1:80% 2:20% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2S | fav | 55 | 7/7/**7**/7/8 |

Dealer filters (paste into the custom filter box; derived from the data):

- `2S` → `s >= 3 and hcp in 4..9`

### (1H) 2C (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♣ |
|---|---|---|---|---|---|---|---|---|
| P | 42.7% | 41 | 12 | 3/6/**6**/9/9 | — | — | 5% | 0:10% 1:80% 2:5% 3:2% 4:2% |

### (1S) 2C (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♣ |
|---|---|---|---|---|---|---|---|---|
| 3C | 31.0% | 67 | 8 | 7/7/**7**/8/10 | 2:6% 3:25% 4:66% 5:3% | **1.9** (1.9–1.9) | 94% | 2:6% 3:25% 4:66% 5:3% |
| P | 22.2% | 48 | 9 | 6/6/**8**/8/10 | — | — | 60% | 2:83% 3:10% 4:6% |
| 2NT | 17.1% | 37 | 5 | 8/10/**10**/10/10 | — | — | 19% | 2:68% 3:16% 5:16% |
| 2H | 14.8% | 32 | 3 | 7/8/**10**/10/10 | 5:100% | **2.2** (2.2–2.5) | 25% | 2:100% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 3C | fav | 48 | 7/7/**7**/7/10 |
| 2NT | fav | 31 | 10/10/**10**/10/10 |
| 2H | fav | 32 | 7/8/**10**/10/10 |

Dealer filters (paste into the custom filter box; derived from the data):

- `3C` → `c >= 3 and hcp in 7..10`

### (1S) 2H (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♥ |
|---|---|---|---|---|---|---|---|---|
| P | 46.4% | 122 | 16 | 4/7/**7**/8/9 | — | — | 80% | 1:10% 2:83% 3:7% |
| 2S | 17.5% | 46 | 7 | 9/10/**13**/13/15 | 2:17% 3:65% 4:9% 5:9% | **0.2** (0.2–3.7) | 83% | 2:65% 3:35% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2S | none | 29 | 10/13/**13**/13/13 |

### (1C) X (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 1H | 17.1% | 84 | 24 | 4/6/**8**/8/8 | 4:69% 5:30% 6+:1% | **4.9** (3.3–5.2) | 76% |
| 1S | 13.2% | 65 | 22 | 4/5/**6**/8/10 | 4:48% 5:52% | **3.6** (1.5–4.3) | 63% |
| 1NT | 13.0% | 64 | 14 | 8/9/**10**/10/10 | — | — | 81% |
| 2C | 11.8% | 58 | 14 | 8/10/**11**/14/14 | 1:3% 2:22% 3:67% 4:5% 5+:2% | **1.3** (0.2–3.0) | 69% |
| 1D | 10.0% | 49 | 18 | 2/3/**6**/7/9 | 3:6% 4:76% 5:16% 6:2% | **2.7** (2.5–3.6) | 88% |
| 2H | 9.1% | 45 | 11 | 7/8/**8**/8/9 | 4:20% 5:78% 6:2% | **6.0** (4.9–6.0) | 42% |
| 2S | 7.3% | 36 | 14 | 4/8/**10**/10/11 | 4:47% 5:53% | **3.6** (0.6–3.6) | 75% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1H | none | 42 | 4/8/**8**/8/8 |
| 1S | none | 32 | 5/5/**7**/8/8 |
| 1NT | both | 36 | 8/8/**10**/10/10 |
| 2C | none | 37 | 8/14/**14**/14/14 |
| 1D | fav | 29 | 3/3/**5**/7/7 |
| 2H | unfav | 26 | 8/8/**8**/8/8 |

Dealer filters (paste into the custom filter box; derived from the data):

- `1H` → `h >= 4 and top(h,5) >= 1 and ((hcp in 4..8 and c <= 2) or (hcp in 5..8 and c in 3..4))`
- `1S` → `s >= 4 and hcp in 4..10`
- `1NT` → `hcp in 8..10` *(+ balanced)*
- `2C` → `hcp in 8..14`

### (1D) X (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 1H | 30.5% | 129 | 26 | 5/6/**8**/9/10 | 3:12% 4:74% 5:14% | **3.5** (2.7–4.1) | 79% |
| 1NT | 15.4% | 65 | 17 | 7/7/**10**/10/10 | — | — | 92% |
| 2H | 14.4% | 61 | 13 | 8/9/**10**/10/10 | 4:95% 5:5% | **2.7** (2.7–3.5) | 85% |
| 1S | 12.8% | 54 | 20 | 0/3/**5**/8/10 | 3:7% 4:44% 5:48% | **1.5** (1.3–4.1) | 69% |
| 2D | 7.8% | 33 | 15 | 9/9/**9**/10/11 | 0:3% 1:55% 2:12% 3:12% 4:18% | **5.6** (2.9–5.6) | 30% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1H | none | 26 | 7/10/**10**/10/10 |
| 1H | fav | 68 | 5/5/**8**/8/8 |
| 1H | both | 32 | 4/6/**7**/9/9 |
| 1NT | none | 31 | 5/7/**7**/10/10 |
| 1NT | fav | 27 | 9/9/**10**/10/10 |
| 2H | none | 39 | 10/10/**10**/10/10 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 1H | — | — | 6/**7**/7 (22) | 8/**8**/9 (97) |

Dealer filters (paste into the custom filter box; derived from the data):

- `1H` → `h >= 3 and top(h,5) >= 1 and hcp in 5..10`
- `1NT` → `hcp in 7..10` *(+ balanced)*
- `2H` → `h >= 4 and top(h,5) >= 1 and hcp in 8..10`
- `1S` → `s >= 4 and hcp in 0..10`

### (1H) X (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 1S | 36.2% | 140 | 22 | 3/4/**5**/7/9 | 3:4% 4:84% 5:12% | **1.7** (1.7–3.0) | 74% |
| 1NT | 26.6% | 103 | 11 | 6/8/**9**/10/10 | — | — | 55% |
| 2C | 11.9% | 46 | 8 | 2/5/**5**/8/11 | 3:9% 4:61% 5:30% | **3.2** (1.0–3.8) | 46% |
| 2S | 6.7% | 26 | 10 | 7/7/**8**/9/10 | 4:58% 5:42% | **1.9** (1.9–2.2) | 73% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1S | none | 52 | 2/5/**5**/6/9 |
| 1S | unfav | 46 | 4/4/**4**/4/8 |
| 1NT | fav | 42 | 8/8/**8**/8/9 |
| 1NT | unfav | 52 | 7/10/**10**/10/10 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 1S | — | 6/**6**/7 (36) | 4/**5**/5 (89) | 7/**7**/7 (15) |
| 1NT | — | — | — | 8/**10**/10 (99) |

Dealer filters (paste into the custom filter box; derived from the data):

- `1S` → `s >= 4 and hcp in 3..9`
- `1NT` → `(has(h,a) or (has(h,k) and h >= 2) or (has(h,q) and h >= 3)) and hcp in 6..10`

### (1S) X (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 2H | 27.1% | 61 | 9 | 7/9/**9**/9/10 | 4:84% 5:16% | **4.7** (3.0–4.7) | 89% |
| 1NT | 24.4% | 55 | 12 | 7/7/**8**/8/10 | — | — | 98% |
| 3H | 15.1% | 34 | 9 | 8/9/**10**/10/11 | 4:76% 5:21% 7:3% | **3.5** (3.0–4.7) | 35% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2H | both | 52 | 7/9/**9**/9/9 |
| 1NT | unfav | 28 | 8/8/**8**/8/8 |

Dealer filters (paste into the custom filter box; derived from the data):

- `2H` → `h >= 4 and top(h,5) >= 1 and hcp in 7..10`
- `1NT` → `(has(s,a) or (has(s,k) and s >= 2) or (has(s,q) and s >= 3)) and hcp in 7..10` *(+ balanced)*

### (1H) X (2H) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 30.5% | 47 | 13 | 0/0/**1**/5/7 | — | — | 72% |

### (1S) X (2S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 24.3% | 37 | 12 | 2/2/**4**/5/10 | — | — | 65% |
| 3H | 24.3% | 37 | 8 | 6/9/**10**/10/10 | 4:30% 5:68% 7:3% | **4.9** (3.8–5.3) | 49% |

## Uncontested responses: 1x (P) ?

Partner opened (natural style), RHO passed. Responder ranges. The 1C row shows STANDARD responders; transfer-walsh pairs (1D = ♥, 1H = ♠, 1S = no-major NT-ish) are tabulated separately below.

### 1C (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 1D | 24.4% | 1478 | 631 | 3/6/**10**/13/17 | 1:2% 2:6% 3:12% 4:28% 5:29% 6:16% 7:6% | **4.1** (2.4–5.5) | 56% |
| 1H | 32.9% | 1987 | 612 | 5/7/**10**/12/15 | 4:61% 5:25% 6:10% 7:3% | **3.8** (2.7–4.9) | 52% |
| 1S | 28.2% | 1707 | 504 | 5/8/**10**/12/16 | 4:49% 5:38% 6:10% 7+:3% | **3.9** (2.9–5.1) | 49% |
| 1NT | 4.8% | 291 | 226 | 7/8/**10**/10/15 | — | — | 95% |
| 2C | 2.8% | 168 | 141 | 8/12/**15**/15/20 | <2:2% 2:5% 3:5% 4:23% 5:35% 6:27% 7+:2% | **5.7** (4.0–7.8) | 60% |
| 2D | 1.4% | 83 | 127 | 5/9/**13**/17/19 | 1:6% 2:5% 3:10% 5:29% 6:41% 7:10% | **5.3** (3.9–6.1) | 22% |
| P | 1.9% | 113 | 52 | 2/2/**4**/4/5 | — | — | 73% |
| 2H | 1.0% | 63 | 77 | 6/8/**12**/15/15 | 2:22% 3:30% 4:16% 5:5% 6:16% 7:11% | **4.6** (2.4–5.5) | 46% |
| 2NT | 0.6% | 34 | 55 | 10/11/**12**/14/15 | — | — | 91% |
| 2S | 0.7% | 42 | 47 | 4/10/**11**/12/17 | 2:12% 3:31% 5:12% 6:24% 7:10% 8:12% | **4.4** (2.4–6.6) | 36% |
| 3NT | 0.4% | 27 | 19 | 12/12/**14**/15/15 | — | — | 100% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1D | none | 369 | 3/5/**7**/13/17 |
| 1D | fav | 423 | 2/6/**11**/13/17 |
| 1D | unfav | 260 | 4/6/**12**/15/19 |
| 1D | both | 426 | 3/6/**9**/12/16 |
| 1H | none | 382 | 6/8/**10**/14/15 |
| 1H | fav | 709 | 6/7/**9**/11/15 |
| 1H | unfav | 287 | 6/8/**10**/12/14 |
| 1H | both | 609 | 4/7/**10**/13/16 |
| 1S | none | 397 | 6/8/**10**/13/14 |
| 1S | fav | 616 | 4/8/**10**/12/18 |
| 1S | unfav | 301 | 4/8/**10**/11/16 |
| 1S | both | 393 | 6/9/**10**/12/16 |
| 1NT | none | 131 | 7/9/**10**/10/11 |
| 1NT | fav | 29 | 7/9/**9**/11/18 |
| 1NT | unfav | 46 | 8/8/**8**/10/19 |
| 1NT | both | 85 | 8/8/**10**/10/15 |
| 2C | none | 26 | 7/9/**12**/14/21 |
| 2C | fav | 42 | 7/13/**14**/15/18 |
| 2C | unfav | 75 | 12/15/**15**/20/20 |
| 2C | both | 25 | 8/11/**12**/15/15 |

Dealer filters (paste into the custom filter box; derived from the data):

- `1D` → `d >= 3 and hcp in 3..17`
- `1H` → `h >= 4 and top(h,5) >= 1 and hcp in 5..15`
- `1S` → `s >= 4 and top(s,5) >= 1 and hcp in 5..16`
- `1NT` → `hcp in 7..15` *(+ balanced)*
- `2C` → `c >= 3 and top(c,5) >= 1 and hcp in 8..20`
- `2D` → `hcp in 5..19`

### 1D (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 1S | 38.2% | 3618 | 339 | 5/8/**10**/11/14 | 4:45% 5:43% 6:9% 7+:2% | **4.0** (2.4–5.1) | 54% |
| 1H | 36.0% | 3412 | 423 | 5/7/**9**/11/15 | <4:2% 4:57% 5:30% 6:7% 7:3% | **3.6** (2.2–4.6) | 45% |
| 1NT | 6.2% | 590 | 128 | 5/8/**9**/9/13 | — | — | 69% |
| 2C | 6.0% | 565 | 105 | 10/11/**13**/15/19 | <3:2% 3:7% 4:15% 5:27% 6:38% 7:10% | **5.6** (3.8–6.3) | 39% |
| P | 4.6% | 439 | 71 | 0/3/**4**/4/5 | — | — | 75% |
| 2D | 3.7% | 353 | 96 | 6/11/**14**/15/17 | <3:2% 3:3% 4:61% 5:29% 6:4% | **4.8** (3.7–6.9) | 81% |
| 2H | 1.1% | 100 | 39 | 4/6/**6**/8/12 | 2:5% 3:3% 4:18% 5:23% 6:42% 7:7% 8:2% | **3.8** (2.3–4.4) | 8% |
| 2NT | 0.8% | 80 | 43 | 7/11/**12**/13/15 | — | — | 91% |
| 2S | 0.8% | 76 | 39 | 5/7/**9**/10/13 | 1:5% 2:9% 3:22% 4:3% 5:11% 6:33% 7:17% | **3.4** (1.7–4.3) | 13% |
| 3C | 0.7% | 69 | 24 | 8/9/**9**/10/15 | 2:6% 3:17% 4:9% 5:9% 6:6% 7:54% | **5.8** (3.8–8.4) | 25% |
| 3NT | 0.6% | 60 | 19 | 10/12/**14**/15/15 | — | — | 95% |
| 3D | 0.5% | 51 | 21 | 3/6/**8**/9/10 | 4:47% 5:29% 6:24% | **2.8** (2.2–4.1) | 43% |
| 4H | 0.3% | 32 | 9 | 8/8/**8**/10/11 | 2:6% 7:88% 8:6% | **4.4** (4.4–5.1) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1S | none | 1114 | 5/7/**10**/12/14 |
| 1S | fav | 959 | 5/8/**9**/11/15 |
| 1S | unfav | 740 | 5/7/**9**/11/16 |
| 1S | both | 805 | 6/8/**10**/12/14 |
| 1H | none | 481 | 5/7/**8**/10/15 |
| 1H | fav | 1124 | 5/7/**9**/12/17 |
| 1H | unfav | 688 | 5/7/**8**/10/13 |
| 1H | both | 1119 | 4/7/**9**/11/15 |
| 1NT | none | 107 | 5/6/**8**/10/10 |
| 1NT | fav | 179 | 5/7/**9**/9/14 |
| 1NT | unfav | 108 | 7/8/**9**/9/13 |
| 1NT | both | 196 | 6/8/**8**/9/12 |
| 2C | none | 148 | 9/13/**15**/19/19 |
| 2C | fav | 189 | 10/10/**14**/14/18 |
| 2C | unfav | 111 | 8/11/**12**/15/17 |
| 2C | both | 117 | 9/11/**12**/12/16 |
| 2D | none | 45 | 7/12/**15**/15/15 |
| 2D | fav | 176 | 7/11/**14**/15/18 |
| 2D | unfav | 118 | 8/11/**15**/17/17 |
| 2H | fav | 31 | 6/6/**6**/8/15 |
| 2H | unfav | 25 | 6/7/**8**/9/11 |
| 2H | both | 30 | 4/6/**6**/6/12 |

Dealer filters (paste into the custom filter box; derived from the data):

- `1S` → `s >= 4 and top(s,5) >= 1 and hcp in 5..14`
- `1H` → `h >= 4 and top(h,5) >= 1 and hcp in 5..15`
- `1NT` → `hcp in 5..13`
- `2C` → `c >= 4 and top(c,5) >= 1 and hcp in 10..19`
- `2D` → `d >= 4 and top(d,5) >= 1 and hcp in 6..17`
- `2H` → `h >= 4 and top(h,5) >= 1 and hcp in 4..12`

### 1H (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 1S | 34.5% | 2086 | 237 | 5/7/**10**/12/17 | <4:1% 4:40% 5:46% 6:10% 7:3% | **3.8** (2.7–5.2) | 39% |
| 2C | 15.2% | 919 | 154 | 9/11/**13**/15/18 | 1:5% 2:14% 3:22% 4:23% 5:23% 6:10% 7+:3% | **4.2** (2.6–5.7) | 66% |
| 1NT | 12.0% | 728 | 180 | 4/6/**9**/10/13 | — | — | 45% |
| 2H | 11.2% | 678 | 70 | 5/7/**8**/9/10 | 3:91% 4:9% | **1.6** (0.4–4.1) | 95% |
| 2NT | 7.1% | 428 | 85 | 9/10/**12**/14/15 | — | — | 62% |
| 2D | 6.4% | 390 | 83 | 9/11/**13**/13/17 | <3:2% 3:5% 4:7% 5:49% 6:37% | **4.8** (4.0–6.5) | 39% |
| P | 5.1% | 311 | 48 | 0/2/**2**/4/5 | — | — | 62% |
| 3C | 1.9% | 115 | 46 | 6/8/**10**/11/12 | 1:18% 2:17% 3:23% 4:30% 5:5% 6:3% 7:3% | **3.7** (1.7–4.2) | 58% |
| 2S | 1.8% | 110 | 54 | 3/6/**9**/11/13 | 2:5% 3:23% 4:15% 5:14% 6:35% 7:9% | **4.3** (3.6–5.1) | 26% |
| 3D | 1.8% | 107 | 46 | 7/9/**10**/11/12 | 1:10% 2:38% 3:19% 4:16% 5:5% 6:12% | **3.2** (2.0–5.4) | 53% |
| 3H | 1.2% | 75 | 26 | 2/2/**6**/8/11 | 3:8% 4:91% 5+:1% | **1.5** (1.5–3.8) | 29% |
| 4H | 0.5% | 31 | 28 | 6/7/**8**/9/13 | 3:10% 4:45% 5:13% 6:32% | **4.3** (0.7–4.6) | 16% |
| 3NT | 0.4% | 26 | 20 | 10/11/**13**/13/14 | — | — | 88% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1S | none | 350 | 6/10/**11**/13/16 |
| 1S | fav | 705 | 6/7/**9**/10/14 |
| 1S | unfav | 392 | 5/8/**13**/16/18 |
| 1S | both | 639 | 3/6/**9**/11/13 |
| 2C | none | 144 | 8/12/**14**/17/18 |
| 2C | fav | 232 | 7/10/**13**/13/18 |
| 2C | unfav | 316 | 9/11/**13**/14/16 |
| 2C | both | 227 | 9/13/**15**/17/17 |
| 1NT | none | 131 | 2/6/**6**/9/14 |
| 1NT | fav | 256 | 4/5/**9**/10/11 |
| 1NT | unfav | 202 | 6/8/**9**/11/13 |
| 1NT | both | 139 | 6/8/**9**/10/12 |
| 2H | none | 295 | 6/7/**9**/9/9 |
| 2H | fav | 99 | 5/6/**7**/9/10 |
| 2H | unfav | 154 | 5/8/**8**/8/9 |
| 2H | both | 130 | 7/7/**7**/9/10 |
| 2NT | none | 105 | 10/13/**13**/14/17 |
| 2NT | fav | 157 | 7/10/**12**/13/14 |
| 2NT | unfav | 105 | 9/11/**13**/15/15 |
| 2NT | both | 61 | 9/10/**10**/10/14 |
| 2D | none | 28 | 6/8/**13**/17/18 |
| 2D | fav | 32 | 7/9/**10**/11/13 |
| 2D | unfav | 111 | 9/13/**13**/13/14 |
| 2D | both | 219 | 10/11/**13**/14/17 |

Dealer filters (paste into the custom filter box; derived from the data):

- `1S` → `s >= 4 and hcp in 5..17`
- `2C` → `hcp in 9..18`
- `1NT` → `hcp in 4..13`
- `2H` → `((hcp in 5..11 and s >= 4) or (hcp in 5..11 and s <= 3 and h <= 3))`
- `2NT` → `hcp in 9..15`
- `2D` → `d >= 4 and top(d,5) >= 1 and hcp in 9..17`

### 1S (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 1NT | 30.7% | 2389 | 297 | 4/7/**8**/9/11 | — | — | 29% |
| 2C | 20.7% | 1612 | 208 | 9/11/**13**/15/17 | <2:2% 2:15% 3:17% 4:41% 5:10% 6:11% 7:5% | **4.5** (2.9–6.0) | 67% |
| 2S | 9.4% | 732 | 101 | 4/6/**8**/9/10 | 3:90% 4:10% | **1.6** (0.9–4.3) | 82% |
| 2D | 8.6% | 671 | 115 | 9/13/**14**/15/18 | 2:3% 3:4% 4:8% 5:48% 6:35% 7+:2% | **4.8** (3.9–6.5) | 23% |
| 2NT | 7.3% | 571 | 109 | 8/10/**12**/14/15 | — | — | 51% |
| 2H | 6.9% | 535 | 108 | 10/12/**13**/15/17 | <5:4% 5:53% 6:37% 7:2% 8:3% | **5.7** (4.1–6.0) | 21% |
| P | 4.8% | 377 | 71 | 1/3/**4**/4/5 | — | — | 40% |
| 4S | 2.1% | 161 | 47 | 0/5/**6**/8/9 | <4:1% 4:22% 5:48% 6:29% | **3.0** (1.7–4.5) | 2% |
| 3C | 2.4% | 186 | 78 | 6/8/**10**/10/13 | 1:20% 2:22% 3:20% 4:17% 5:2% 6:17% 7+:3% | **2.9** (0.9–5.2) | 39% |
| 3D | 2.2% | 168 | 65 | 6/8/**9**/10/12 | 1:11% 2:21% 3:23% 4:14% 5:20% 6:2% 7:10% | **3.6** (1.5–4.7) | 39% |
| 3S | 1.2% | 97 | 43 | 0/5/**6**/7/10 | 3:4% 4:74% 5:22% | **2.5** (1.7–3.0) | 33% |
| 3NT | 1.1% | 85 | 30 | 6/9/**10**/12/14 | — | — | 32% |
| 4C | 1.0% | 78 | 15 | 9/10/**12**/13/14 | 1:96% 2:3% 3+:1% | **0.5** (0.0–0.9) | 0% |
| 3H | 0.9% | 71 | 37 | 6/8/**10**/11/13 | 1:7% 2:15% 3:14% 4:31% 5:6% 6:27% | **4.5** (2.7–5.4) | 37% |
| 4D | 0.4% | 30 | 8 | 8/9/**10**/10/12 | 0:10% 1:87% 4:3% | **0.4** (0.0–0.4) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1NT | none | 372 | 4/6/**8**/9/12 |
| 1NT | fav | 680 | 4/6/**7**/8/11 |
| 1NT | unfav | 582 | 4/7/**9**/10/11 |
| 1NT | both | 755 | 6/6/**8**/9/11 |
| 2C | none | 260 | 9/12/**13**/14/15 |
| 2C | fav | 448 | 9/11/**13**/14/20 |
| 2C | unfav | 394 | 10/13/**13**/16/17 |
| 2C | both | 510 | 9/11/**11**/15/17 |
| 2S | none | 131 | 4/8/**10**/10/10 |
| 2S | fav | 221 | 3/6/**7**/9/9 |
| 2S | unfav | 122 | 4/7/**8**/9/9 |
| 2S | both | 258 | 6/6/**8**/9/10 |
| 2D | none | 104 | 10/13/**15**/15/15 |
| 2D | fav | 288 | 8/13/**14**/14/22 |
| 2D | unfav | 93 | 11/13/**13**/14/17 |
| 2D | both | 186 | 9/11/**14**/17/18 |
| 2NT | none | 118 | 9/10/**12**/14/14 |
| 2NT | fav | 260 | 8/9/**12**/14/15 |
| 2NT | unfav | 32 | 7/10/**12**/13/16 |
| 2NT | both | 161 | 9/10/**11**/12/15 |
| 2H | none | 114 | 10/12/**13**/17/17 |
| 2H | fav | 152 | 9/12/**13**/14/14 |
| 2H | unfav | 224 | 11/12/**12**/16/18 |
| 2H | both | 45 | 8/10/**14**/14/17 |

Dealer filters (paste into the custom filter box; derived from the data):

- `1NT` → `hcp in 4..11`
- `2C` → `top(c,5) >= 1 and hcp in 9..17`
- `2S` → `((hcp in 4..11 and h >= 4) or (hcp in 4..11 and s <= 3 and h <= 3))`
- `2D` → `d >= 4 and top(d,5) >= 1 and hcp in 9..18`
- `2NT` → `hcp in 8..15`
- `2H` → `h >= 5 and top(h,5) >= 1 and hcp in 10..17`

### 1NT (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 2C | 28.4% | 2808 | 481 | 6/8/**9**/11/14 | <1:1% 1:14% 2:28% 3:29% 4:21% 5:4% 6:3% | **2.7** (0.9–4.5) | 48% |
| P | 20.5% | 2033 | 326 | 3/4/**6**/7/8 | — | — | 74% |
| 2H | 13.0% | 1287 | 209 | 4/6/**9**/13/17 | 0:4% 1:11% 2:35% 3:43% 4:2% 5:3% | **1.9** (0.2–3.9) | 42% |
| 2D | 12.5% | 1237 | 216 | 3/5/**7**/10/16 | 1:22% 2:25% 3:31% 4:15% 5:6% | **1.9** (0.9–4.0) | 27% |
| 3NT | 9.4% | 927 | 171 | 8/10/**10**/12/14 | — | — | 76% |
| 2NT | 3.6% | 357 | 170 | 5/9/**11**/12/16 | — | — | 53% |
| 3C | 3.7% | 367 | 144 | 7/10/**11**/12/16 | <1:2% 1:12% 2:29% 3:20% 4:21% 5:10% 6:7% | **3.8** (1.8–5.4) | 62% |
| 2S | 2.5% | 247 | 121 | 6/9/**10**/12/21 | 1:27% 2:9% 3:55% 4:5% 5:2% | **3.0** (0.4–5.6) | 35% |
| 4D | 1.9% | 184 | 48 | 7/8/**9**/10/15 | <1:2% 1:16% 2:32% 3:44% 4:4% 5:2% | **1.5** (0.5–4.0) | 1% |
| 4H | 1.1% | 113 | 34 | 7/9/**9**/9/17 | <1:2% 1:5% 2:32% 3:57% 4:2% 6:3% | **2.4** (1.3–3.5) | 1% |
| 4C | 1.0% | 98 | 26 | 7/8/**9**/10/19 | 1:32% 2:22% 3:40% 4:1% 5:5% | **3.3** (0.0–4.7) | 1% |
| 3S | 0.7% | 72 | 33 | 9/10/**10**/11/16 | 1:81% 2:1% 3:10% 4:6% 5+:3% | **0.0** (0.0–3.9) | 7% |
| 3D | 0.7% | 65 | 47 | 6/9/**11**/12/16 | 1:31% 2:17% 3:11% 4:11% 5:17% 6:14% | **3.1** (0.0–4.2) | 23% |
| 3H | 0.4% | 44 | 21 | 8/11/**12**/21/21 | 1:77% 2:14% 3:9% | **5.6** (3.9–10.0) | 7% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2C | none | 693 | 6/8/**9**/10/14 |
| 2C | fav | 797 | 3/8/**11**/14/16 |
| 2C | unfav | 626 | 6/8/**10**/11/14 |
| 2C | both | 692 | 6/7/**9**/10/13 |
| 2H | none | 385 | 3/6/**9**/13/14 |
| 2H | fav | 483 | 4/6/**10**/13/15 |
| 2H | unfav | 186 | 5/10/**12**/17/17 |
| 2H | both | 233 | 1/5/**6**/9/12 |
| 2D | none | 398 | 3/5/**7**/10/17 |
| 2D | fav | 295 | 3/7/**8**/12/16 |
| 2D | unfav | 212 | 2/5/**6**/10/12 |
| 2D | both | 332 | 4/6/**7**/8/14 |
| 3NT | none | 387 | 9/10/**10**/12/15 |
| 3NT | fav | 280 | 8/10/**10**/12/14 |
| 3NT | unfav | 142 | 8/10/**11**/12/13 |
| 3NT | both | 118 | 8/9/**11**/11/15 |
| 2NT | none | 90 | 5/9/**11**/14/16 |
| 2NT | fav | 124 | 8/10/**11**/13/14 |
| 2NT | unfav | 53 | 8/9/**11**/11/15 |
| 2NT | both | 90 | 2/7/**9**/10/12 |
| 3C | none | 102 | 9/10/**12**/14/16 |
| 3C | fav | 128 | 8/10/**11**/13/17 |
| 3C | unfav | 58 | 9/10/**11**/12/15 |
| 3C | both | 79 | 2/8/**10**/11/14 |

Dealer filters (paste into the custom filter box; derived from the data):

- `2C` → `((hcp in 6..11 and h >= 4) or (hcp in 6..11 and s >= 4))`
- `2H` → `(hcp in 4..17 and s >= 4)`
- `2D` → `(hcp in 3..16 and h >= 4)`
- `3NT` → `hcp in 8..14`
- `2NT` → `hcp in 5..16`
- `3C` → `((hcp in 7..11 and h >= 4) or (hcp in 7..16 and s >= 4) or (hcp in 7..16 and s <= 3 and h <= 3))`

## Transfer responses to 1C: 1C (P) ? by transfer-walsh pairs

Detected per partnership from the hands (4+ of the next suit in essentially every 1D/1H response). The derived rules key on the suit actually shown: 1D = hearts, 1H = spades. The field’s 1S is multi-way — see the decision matrices below for its components.

### 1C (P) ? — transfer responders

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 1D | 34.7% | 1003 | 631 | 4/7/**9**/12/15 | 1:8% 2:26% 3:26% 4:28% 5:9% 6:3% | **3.0** (1.5–4.9) | 52% |
| 1H | 34.2% | 989 | 612 | 4/7/**10**/11/15 | 0:2% 1:8% 2:26% 3:50% 4:10% 5:3% | **3.0** (1.1–4.5) | 49% |
| 1S | 15.9% | 459 | 504 | 5/8/**10**/13/18 | 0:2% 1:3% 2:24% 3:63% 4:4% 5:3% | **3.2** (1.5–4.3) | 65% |
| 1NT | 4.0% | 117 | 226 | 8/10/**11**/14/18 | — | — | 90% |
| 2C | 3.5% | 102 | 141 | 8/12/**14**/15/20 | 0:4% 1:11% 2:21% 3:9% 4:5% 5:26% 6:24% | **4.3** (2.5–6.3) | 32% |
| 2D | 1.8% | 52 | 127 | 4/7/**13**/15/19 | <2:2% 2:25% 3:25% 4:4% 5:27% 6:8% 7:10% | **4.8** (2.6–5.5) | 25% |
| P | 2.3% | 66 | 52 | 1/2/**4**/4/5 | — | — | 77% |
| 2H | 1.1% | 31 | 77 | 4/5/**8**/11/15 | 0:6% 1:6% 2:26% 3:13% 4:19% 5:10% 6:16% 7:3% | **2.2** (0.5–3.5) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1D | none | 192 | 5/8/**9**/13/15 |
| 1D | fav | 355 | 5/7/**9**/11/16 |
| 1D | unfav | 147 | 5/8/**10**/12/15 |
| 1D | both | 309 | 4/6/**10**/12/15 |
| 1H | none | 236 | 5/7/**10**/11/14 |
| 1H | fav | 328 | 3/7/**9**/11/17 |
| 1H | unfav | 188 | 5/7/**9**/11/14 |
| 1H | both | 237 | 6/8/**10**/12/16 |
| 1S | none | 120 | 5/7/**10**/14/17 |
| 1S | fav | 133 | 4/8/**11**/13/17 |
| 1S | unfav | 90 | 5/8/**12**/15/19 |
| 1S | both | 116 | 4/8/**9**/12/16 |
| 1NT | none | 30 | 8/10/**11**/12/14 |
| 1NT | fav | 36 | 6/10/**13**/15/18 |
| 1NT | both | 27 | 8/10/**10**/11/16 |
| 2C | fav | 31 | 6/11/**13**/14/17 |
| 2C | unfav | 36 | 10/13/**15**/15/20 |

Dealer filters (paste into the custom filter box; derived from the data):

- `1D` → `(hcp in 4..15 and h >= 4)`
- `1H` → `(hcp in 4..15 and s >= 4)`
- `1S` → `((hcp in 12..18 and h >= 4) or (hcp in 5..18 and s <= 3 and h <= 3))`
- `1NT` → `hcp in 8..18` *(+ balanced)*
- `2C` → `hcp in 8..20`
- `2D` → `((hcp in 4..19 and h >= 4) or (hcp in 12..19 and s <= 3 and h <= 3) or (hcp in 12..19 and d >= 5) or (hcp in 12..19 and c >= 5))`

## Reverse-engineering the 1C complex: what does each bid show?

Single 1C-auction bids are multi-way (a transfer-walsh 1S = weak no-major OR
GF balanced OR GF with a minor; 1C (1D) X may be 4-4 majors or just hearts), so
face-value stats can’t isolate hand types. These matrices invert the question:
for each **hand type** the responder can hold, what did they actually bid?
Rows are mutually exclusive hand types, cells are P(action | hand type) as %.
Read the ambiguity off the table: the `4♠ only` and `4-4 majors` rows show
whether X/1D carries spades, and the `no 4M` rows show where the NT-ish and
GF hands route. (Next steps: the same inversion per partnership, and
cross-checking against the published convention cards.)

### 1C (P) ? — standard responders

| hand type | n | 1H | 1S | 1D | 1NT | 2C | P | 2D | other |
|---|---|---|---|---|---|---|---|---|---|
| ≤4 HCP | 418 | 14% | 17% | 43% | · | · | 22% | 1% | 2% |
| 5–11 · 4♥ only | 1043 | 88% | · | 9% | · | · | 1% | · | 1% |
| 5–11 · 4♠ only | 1129 | · | 84% | 15% | · | · | · | 1% | 1% |
| 5–11 · 4-4+ majors | 592 | 61% | 28% | 7% | · | 1% | · | · | 3% |
| 5–11 · no 4M | 802 | · | · | 54% | 32% | 2% | 1% | 2% | 9% |
| 12+ · 4♥ only | 638 | 65% | · | 30% | · | 1% | · | 2% | 2% |
| 12+ · 4♠ only | 566 | · | 83% | 10% | 1% | 1% | · | 1% | 3% |
| 12+ · 4-4+ majors | 292 | 76% | 16% | 3% | 1% | 3% | · | · | · |
| 12+ · no 4M bal | 417 | · | · | 54% | 3% | 19% | · | 4% | 19% |
| 12+ · no 4M unbal | 149 | · | 1% | 55% | · | 30% | · | 11% | 2% |

### 1C (X) ? — standard responders

| hand type | n | P | 1D | 1H | 1S | XX | 2C | 2D | other |
|---|---|---|---|---|---|---|---|---|---|
| ≤4 HCP | 276 | 79% | 8% | 3% | 3% | · | 1% | 1% | 5% |
| 5–11 · 4♥ only | 197 | 15% | 28% | 39% | 2% | 4% | 2% | 5% | 6% |
| 5–11 · 4♠ only | 239 | 10% | 7% | 19% | 44% | 13% | · | · | 6% |
| 5–11 · 4-4+ majors | 60 | 8% | 10% | 48% | 25% | 7% | 2% | · | · |
| 5–11 · no 4M | 205 | 23% | 29% | · | 12% | 5% | 12% | 4% | 14% |

### 1C (1D) ? — standard responders

| hand type | n | 1H | X | 1S | P | 3C | 2C | 2H | other |
|---|---|---|---|---|---|---|---|---|---|
| ≤4 HCP | 103 | 10% | 7% | 3% | 60% | 2% | 1% | 11% | 7% |
| 5–11 · 4♥ only | 159 | 45% | 39% | · | 7% | · | · | 1% | 8% |
| 5–11 · 4♠ only | 153 | 27% | 5% | 41% | 8% | · | · | 8% | 10% |
| 5–11 · 4-4+ majors | 151 | 15% | 46% | 21% | 3% | · | 12% | 1% | 3% |
| 5–11 · no 4M | 194 | · | · | 13% | 14% | 37% | 25% | · | 11% |
| 12+ · 4♠ only | 39 | 41% | 13% | 41% | · | · | · | 5% | · |

### 1C (P) ? — transfer-walsh responders

| hand type | n | 1D | 1H | 1S | 1NT | 2C | P | 2D | other |
|---|---|---|---|---|---|---|---|---|---|
| ≤4 HCP | 196 | 26% | 28% | 11% | 1% | 1% | 29% | 2% | 4% |
| 5–11 · 4♥ only | 457 | 94% | 2% | 1% | · | · | · | 2% | 2% |
| 5–11 · 4♠ only | 628 | 2% | 94% | 2% | · | 1% | · | · | 2% |
| 5–11 · 4-4+ majors | 319 | 66% | 28% | · | · | 2% | · | 1% | 3% |
| 5–11 · no 4M | 330 | 3% | 1% | 70% | 16% | 2% | 2% | · | 5% |
| 12+ · 4♥ only | 284 | 63% | 2% | 19% | 2% | 7% | · | 4% | 2% |
| 12+ · 4♠ only | 283 | 2% | 77% | 8% | 6% | 1% | · | 1% | 6% |
| 12+ · 4-4+ majors | 133 | 74% | 18% | · | 5% | 1% | · | 1% | 2% |
| 12+ · no 4M bal | 186 | 4% | · | 48% | 14% | 15% | · | 6% | 13% |
| 12+ · no 4M unbal | 75 | 3% | · | 36% | 3% | 41% | · | 13% | 4% |

### 1C (X) ? — transfer-walsh responders

| hand type | n | P | 1H | 1D | 1S | XX | 2H | 2S | other |
|---|---|---|---|---|---|---|---|---|---|
| ≤4 HCP | 128 | 70% | 8% | 7% | 3% | 2% | 5% | 5% | · |
| 5–11 · 4♥ only | 82 | 15% | 2% | 60% | 1% | 7% | 2% | · | 12% |
| 5–11 · 4♠ only | 99 | 16% | 61% | · | 4% | 13% | 3% | 1% | 2% |
| 5–11 · 4-4+ majors | 27 | 7% | 44% | 30% | 4% | 4% | 7% | · | 4% |
| 5–11 · no 4M | 73 | 16% | · | 1% | 53% | 10% | · | · | 19% |

### 1C (1D) ? — transfer-walsh responders

| hand type | n | X | 1H | P | 1S | 2C | 3C | 2H | other |
|---|---|---|---|---|---|---|---|---|---|
| ≤4 HCP | 35 | 20% | · | 63% | 3% | · | · | 6% | 9% |
| 5–11 · 4♥ only | 70 | 76% | 6% | 3% | 1% | · | · | 1% | 13% |
| 5–11 · 4♠ only | 74 | 3% | 66% | 11% | 5% | · | · | 9% | 5% |
| 5–11 · 4-4+ majors | 76 | 49% | 26% | · | 13% | 8% | · | · | 4% |
| 5–11 · no 4M | 69 | 1% | · | 17% | 29% | 22% | 20% | · | 10% |

## Book vs field

"Book" is the SAYC/2-over-1 teaching range (ACBL SAYC card/booklet). "Field" is
this dataset: p5–p95 (median). The field is systematically lighter than the book
at the bottom of ranges, and vulnerability is the biggest modifier for preempts.

| context | book | field |
|---|---|---|
| 1M opening (seats 1–2) | 12–21 (light 11s common in practice) | 10–17 (med 13), n=17383 |
| 1NT opening (strong-NT pairs) | 15–17 | 14–17 (med 15), n=12426 |
| 2NT opening | 20–21 | 19–21 (med 20), n=1891 |
| weak 2S (seats 1–3) | 5–11, 6-card suit | 5–11 (med 8), n=1892 |
| 1-level overcall (1C) 1H | 8–16 (down to ~8) | 7–16 (med 10), n=2080 |
| 2-level overcall (1S) 2H | 10–17ish, good suit | 10–15 (med 12), n=866 |
| 1NT overcall (1H) 1NT | 15–18 | 14–17 (med 15), n=377 |
| takeout double (1S) X | opening values (12+) or shape | 11–18 (med 13), n=954 |
| weak jump overcall (1C) 2H | ~6–10, 6-card suit | 4–12 (med 8), n=367 |
| Michaels (1H) 2H | 8–12 or 16+, 5-5 | 8–14 (med 12), n=376 |
| unusual 2NT (1S) 2NT | weak or 17+, 5-5 minors | 7–21 (med 11), n=111 |
| negative double 1S (2H) X | 7+ (level-adjusted) | 7–15 (med 10), n=84 |
| new suit response 1C (P) 1H (std responders) | 6+ | 5–15 (med 10), n=1987 |

## Dealer integration

`research/bidding/bid-profiles.json` (v2) holds one record per context × action ×
(vul | "all") × (style | "all") with n≥25. Each record carries the action
frequency, full HCP histogram, per-suit length histograms/percentiles, the
HCP-by-their-length cross-tab, stopper rate, and a derived `rule`:

```json
{
  "family": "overOpen",
  "key": "1H",
  "action": "X",
  "label": "(1H) X",
  "n": 1462,
  "hcp": {
    "mean": 14.12,
    "sd": 2.86,
    "min": 5,
    "max": 24,
    "p": [
      10,
      11,
      12,
      14,
      16,
      18,
      19
    ],
    "hist": "…"
  },
  "suitLen": "… per-suit percentiles + histograms …",
  "hcpByTheirLen": {
    "2": {
      "n": 595,
      "p": [
        11,
        11,
        12,
        13,
        15,
        17,
        17
      ]
    },
    "3": {
      "n": 375,
      "p": [
        12,
        12,
        15,
        16,
        17,
        19,
        19
      ]
    },
    "0–1": {
      "n": 462,
      "p": [
        10,
        10,
        11,
        12,
        14,
        18,
        22
      ]
    },
    "4+": {
      "n": 30,
      "p": [
        11,
        12,
        12,
        14,
        15,
        15,
        17
      ]
    }
  },
  "rule": {
    "anyOf": [
      {
        "label": "takeout shape, short in theirs",
        "hcp": {
          "min": 10,
          "max": 17
        },
        "suit": [
          {
            "suit": 1,
            "max": 2
          },
          {
            "suit": 0,
            "min": 3
          },
          {
            "suit": 2,
            "min": 2
          },
          {
            "suit": 3,
            "min": 2
          }
        ]
      },
      {
        "label": "takeout shape, length in theirs",
        "hcp": {
          "min": 12,
          "max": 17
        },
        "suit": [
          {
            "suit": 1,
            "min": 3,
            "max": 3
          },
          {
            "suit": 0,
            "min": 3
          },
          {
            "suit": 2,
            "min": 2
          },
          {
            "suit": 3,
            "min": 2
          }
        ]
      },
      {
        "label": "strength, any shape",
        "hcp": {
          "min": 18
        }
      }
    ],
    "common": [],
    "filterExpr": "((hcp in 10..17 and h <= 2 and s >= 3 and d >= 2 and c >= 2) or (hcp in 12..17 and h == 3 and s >= 3 and d >= 2 and c >= 2) or hcp >= 18)"
  }
}
```

The `rule` is the integration contract:

- `rule.filterExpr` pastes directly into the dealer’s per-seat **custom filter**
  box (the expression language in src/engine/filter.ts) — every emitted
  expression is compile-checked against the real engine during generation.
- Doubles carry two branches: a support/shape branch below the strong
  threshold, plus a shape-free strength branch (very strong doubles are real
  and must stay in the filter).
- Overcalls split their-suit shortage (lighter HCP floor) from length
  (sounder), matching the observed gradient.
- Suit quality uses `top(x,5)` (A/K/Q/J/T count): a floor everyone meets plus a
  stricter bar that binds only below 11 HCP — sound values excuse a moderate
  suit, a light action needs the suit to carry it.
- Conventional actions are detected, not assumed: suit bids over (1NT) derive
  as both-majors / one-long-major / long-minor shapes when that is what the
  field holds, and 1M (X) responses that are raises in disguise (transfers,
  graded raises) key on support for partner’s major.
- `rule.balanced` isn’t expressible in the filter language — set the seat’s
  Balanced checkbox alongside the expression.
- To deal a whole auction start (e.g. West opens 1H, North doubles), apply the
  opening profile’s rule to one seat and the action profile’s rule to the
  next; generate-and-test handles the joint constraint.

The histograms are retained so stricter (p10–p90) or looser (min–max) cuts can
be derived without re-running the study.

## Files

- `research/bidding/bid-profiles.json` — machine-readable profiles (v2): every
  context×action with n≥25, overall + per-vul + per-style, each with action
  frequency, HCP histogram/percentiles, per-suit length histograms, the
  their-suit cross-tab, and a derived `rule` with a compile-checked `filterExpr`.
- Rules map onto the dealer’s `HandConstraint` (src/engine/constraints.ts):
  `filterExpr` → custom filter box, `balanced` → the Balanced toggle.
- Profiles also cover families not tabulated above (e.g. sandwich-seat actions
  `(1C) P (1S) ?`) — filter by `family`.

