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

- 329979 table results scanned; 121279 carry an auction; 121227 auctions
  replay as legal sequences consistent with the recorded contract, doubling
  state, and declarer (the rest are site glitches, e.g. card tokens inside
  the bidding tooltip).
- Rejected: contract-mismatch 44, double-mismatch 5, no-bid 3.
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
| prague26tn/16 | 868 |
| strasbourg23tn/16 | 839 |
| herning25tn/16 | 512 |
| strasbourg23tn/QF | 448 |
| prague26tn/QF | 447 |
| herning25tn/QF | 256 |
| prague26tn/SF | 224 |
| herning25tn/SF | 222 |
| strasbourg23tn/SF | 222 |
| herning25tn/FF | 195 |
| prague26tn/FF | 112 |
| strasbourg23tn/FF | 112 |

- Strength filter: the bottom 4 teams of each event (by average
  round-robin VP) are excluded as actors — 136 teams, 80481
  calls dropped. Their opponents’ calls still count, and their systems are
  still classified (needed to condition actions against them).
- Transnational events (`*tn`) are the Transnational Open Teams (World: Herning
  2025, Marrakech 2023; European: Strasbourg 2023, Prague 2026), whose large
  mixed-strength Swiss qualifier is excluded — only their knockout finals (Round
  of 16 onward) are included. Marrakech 2023’s transnational carried no bidding
  (contracts only) so contributes nothing here; the other three do.

Caveats: passed-out deals never reach the dataset (the site records them as
"Pass" with no auction), so 4th-seat pass frequencies are unobservable. The
same deal is bid at many tables (round-robins), so per-context samples are
correlated across tables; n counts tables, and the distinct-deal count is
shown for headline contexts. Alerts/explanations are not captured — systemic
meaning is inferred from the hands themselves (see system detection).

## Key findings

- **The field opens light and overcalls light.** Natural 1M openings in seats 1–2
  centre on 13 HCP with p5 = 10 — nearly every 11-count and many decent
  10-counts get opened. One-level overcalls ((1C) 1H) run 7–16 (med 11) HCP —
  the book "8–16" is real but the median sits 2 HCP below the median opening.
- **Suit quality is a weak-hand requirement.** Light (≤10 HCP) 1H overcalls of a
  natural 1C carry a median suit texture of 4.2/10; sound ones (11+) get away
  with 5.1/10 — the values carry a moderate suit. The derived filters
  encode exactly that: a quality floor everyone meets, plus a higher bar that
  only applies below 11 HCP (`hcp >= 11 or top(h,5) >= …`).
- **Takeout doubles are opening-strength, not 12+**: (1S) X runs 11–19 (med 13);
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
  137 play transfers vs 345 standard. Their 1C (P) 1D holds 4+ hearts 96%
  of the time (5–15 (med 9) HCP), and 1S is the no-major hand (79% with no 4-card major, 4–17 (med 10)) — the
  derived rules follow the shown suit, and the treatment carries on over a
  double or 1D overcall (see the transfer-responder sections).
- **Defence to 1NT is conventional and the data shows it**: (1NT) 2C holds both
  majors 4+ 90% of the time (clubs are incidental); (1NT) 2D has a 5+
  major 93% (6+ 86%) — multi-style; 2M shows the major plus a 4+ minor.
  The derived rules detect these shapes instead of reading the bid suit at
  face value (see the (1NT) ? section).
- **At this level 2D is multi** (274 pairs multi vs 48 weak among classified),
  2C strong is standard, and strong-club pairs are 14% of the field (118 of 847).
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

- 1C style: natural 624, strong 118, unknown 85, short 14, polish 6
- 1D style: natural 707, unknown 104, nebulous 36
- 1NT range: strong 641, unknown 122, weak 84
- 2C style: unknown 570, strong 155, natural 122
- 2D style: unknown 436, multi 274, other 89, weak 48
- natural base (1C natural/short and 1D not nebulous): yes 636, no 211
- 1C response style (natural/short openers, from their own 1D/1H responses):
  standard 345, transfer-walsh 137, insufficient data 150

## Openings (natural-base pairs)

HCP shown as p5/p25/**median**/p75/p95. Length is the bid suit, p5–p95 (median).
Style filter: 1C/1D/1NT/2C/2D rows use pairs whose that-bid style is natural
(1C natural or short-club; 1D natural; 2C strong excluded from "natural" row…);
1M and preempts use natural-base pairs.

### Seat 1 + Seat 2

| opening | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|
| 1C | 16386 | 1356 | 11/12/**13**/14/18 | 2:6% 3:22% 4:30% 5:23% 6:13% 7:4% | **4.8** (3.5–6.2) | 59% |
| 1D | 15006 | 1098 | 10/12/**13**/14/18 | <3:1% 3:5% 4:30% 5:38% 6:21% 7:4% | **4.8** (3.6–6.2) | 36% |
| 1H | 8834 | 611 | 10/11/**13**/15/17 | 5:72% 6:23% 7:2% 8+:1% | **5.2** (3.8–6.3) | 17% |
| 1S | 9125 | 619 | 10/11/**13**/15/17 | 5:62% 6:32% 7:5% | **4.9** (3.7–6.3) | 18% |
| 1NT | 9470 | 1132 | 13/14/**15**/16/17 | — | — | 84% |
| 2C | 716 | 418 | 5/14/**20**/21/24 | <1:1% 1:8% 2:22% 3:35% 4:20% 5:8% 6:4% | **5.4** (3.0–7.5) | 42% |
| 2D | 256 | 667 | 4/6/**8**/9/12 | <5:3% 5:7% 6:80% 7:9% | **3.9** (2.8–5.1) | 2% |
| 2H | 1393 | 397 | 5/7/**8**/9/11 | <2:1% 2:3% 3:2% 4:6% 5:33% 6:51% 7:3% | **4.2** (2.9–5.3) | 5% |
| 2S | 1825 | 284 | 5/7/**8**/9/11 | 5:34% 6:64% 7+:1% | **4.4** (3.1–5.6) | 3% |
| 2NT | 1529 | 145 | 19/19/**20**/21/21 | — | — | 84% |
| 3C | 551 | 71 | 5/5/**7**/9/10 | <5:2% 5:3% 6:65% 7:29% 8+:2% | **4.4** (4.0–5.6) | 2% |
| 3D | 856 | 94 | 3/5/**8**/8/10 | <6:2% 6:43% 7:55% | **5.0** (4.1–5.5) | 0% |
| 3H | 462 | 67 | 3/5/**6**/8/9 | <6:3% 6:39% 7:44% 8:15% | **3.9** (3.0–4.7) | 1% |
| 3S | 669 | 62 | 4/6/**8**/9/10 | 6:34% 7:66% | **5.0** (3.9–6.7) | 0% |
| 3NT | 110 | 27 | 10/11/**11**/13/14 | — | — | 0% |
| 4C | 70 | 19 | 5/5/**9**/12/14 | 2:13% 3:13% 4:1% 6:4% 7:24% 8:44% | **3.5** (3.5–4.1) | 0% |
| 4D | 39 | 13 | 5/5/**6**/10/15 | 1:5% 3:21% 4:5% 6:8% 7:56% 8:5% | **4.7** (2.3–4.7) | 0% |
| 4H | 301 | 26 | 3/5/**5**/10/12 | <7:2% 7:39% 8:57% 9+:2% | **4.3** (3.6–5.7) | 0% |
| 4S | 330 | 33 | 7/8/**9**/10/11 | 6:5% 7:56% 8:37% 9+:2% | **5.9** (4.8–6.7) | 0% |

### Seat 3

| opening | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|
| 1C | 2923 | 372 | 10/12/**13**/16/19 | 2:8% 3:19% 4:25% 5:30% 6:15% 7:2% | **5.0** (3.6–6.3) | 53% |
| 1D | 3453 | 291 | 10/12/**13**/14/18 | 3:4% 4:38% 5:38% 6:19% | **4.9** (3.7–6.1) | 44% |
| 1H | 1564 | 154 | 9/11/**12**/14/17 | 4:3% 5:67% 6:30% | **4.8** (3.5–6.2) | 23% |
| 1S | 2254 | 183 | 9/11/**13**/16/18 | 4:3% 5:68% 6:25% 7:3% | **5.3** (4.1–6.0) | 23% |
| 1NT | 2443 | 225 | 14/15/**15**/16/17 | — | — | 82% |
| 2C | 210 | 108 | 10/19/**21**/24/26 | 1:4% 2:14% 3:28% 4:20% 5:10% 6:16% 7:9% | **7.2** (5.1–7.9) | 31% |
| 2H | 177 | 46 | 6/7/**9**/10/11 | <3:2% 3:2% 4:2% 5:37% 6:56% 7+:1% | **3.5** (3.2–5.3) | 3% |
| 2S | 134 | 35 | 7/8/**9**/10/13 | <5:1% 5:27% 6:72% | **4.3** (3.7–6.2) | 4% |
| 2NT | 352 | 49 | 18/19/**20**/20/21 | — | — | 59% |
| 3C | 198 | 20 | 5/8/**9**/10/10 | 5:14% 6:55% 7:32% | **5.7** (4.4–6.2) | 0% |
| 3D | 55 | 14 | 4/7/**7**/9/12 | 5:11% 6:80% 7:9% | **3.8** (3.8–4.4) | 0% |
| 3H | 64 | 15 | 5/7/**9**/10/11 | <6:2% 6:63% 7:36% | **4.4** (3.5–6.9) | 0% |
| 4H | 69 | 13 | 10/12/**12**/13/16 | <6:1% 6:42% 7:23% 8:33% | **5.7** (3.8–6.6) | 0% |
| 4S | 71 | 9 | 11/11/**12**/12/15 | 6:20% 7:80% | **7.8** (7.0–8.1) | 0% |

### Seat 4

| opening | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|
| 1C | 989 | 151 | 12/13/**14**/18/20 | <2:1% 2:10% 3:35% 4:26% 5:13% 6:10% 7:4% | **5.3** (3.4–7.0) | 73% |
| 1D | 519 | 83 | 12/14/**15**/18/20 | 2:2% 3:6% 4:68% 5:7% 6:13% 7:4% | **4.8** (4.0–6.2) | 60% |
| 1H | 543 | 48 | 12/13/**15**/17/18 | 5:57% 6:42% | **5.0** (3.5–6.5) | 10% |
| 1S | 356 | 50 | 12/14/**16**/16/19 | <5:1% 5:49% 6:38% 7:11% | **5.4** (4.9–6.1) | 12% |
| 1NT | 876 | 86 | 14/15/**16**/16/17 | — | — | 87% |
| 2C | 56 | 32 | 16/18/**21**/23/23 | 1:7% 2:11% 3:54% 4:27% 5+:2% | **7.0** (4.5–8.2) | 82% |
| 2NT | 92 | 23 | 18/20/**20**/21/21 | — | — | 86% |

### Preempts by vulnerability (all seats, natural-base pairs)

| opening | vul | n | HCP p5/p25/med/p75/p95 | bid-suit len | texture |
|---|---|---|---|---|---|
| 2H | fav | 473 | 4/6/**7**/9/11 | <2:1% 2:3% 3:2% 4:8% 5:47% 6:37% 7+:1% | **3.9** (2.8–4.6) |
| 2H | none | 428 | 5/7/**8**/9/11 | <2:1% 2:3% 3:1% 4:8% 5:33% 6:53% | **4.3** (2.4–5.3) |
| 2H | both | 286 | 6/7/**8**/9/12 | <2:2% 2:3% 3:3% 4:3% 5:28% 6:54% 7:6% | **4.2** (3.0–5.7) |
| 2H | unfav | 395 | 5/8/**8**/10/12 | <2:1% 2:3% 3:3% 4:3% 5:19% 6:69% 7:4% | **4.4** (3.5–5.7) |
| 2S | fav | 677 | 4/7/**8**/9/11 | <5:1% 5:45% 6:54% | **4.3** (2.7–5.3) |
| 2S | none | 493 | 5/6/**9**/9/10 | <5:1% 5:41% 6:56% 7+:1% | **4.4** (3.2–5.8) |
| 2S | both | 441 | 5/7/**8**/9/11 | <5:1% 5:21% 6:77% 7+:1% | **4.4** (3.1–5.0) |
| 2S | unfav | 356 | 6/7/**9**/10/12 | 5:18% 6:80% 7+:2% | **4.9** (3.7–5.7) |
| 3C | fav | 407 | 5/6/**9**/9/10 | 5:10% 6:77% 7:12% 8+:1% | **5.2** (4.1–5.7) |
| 3C | none | 239 | 5/5/**8**/8/10 | <6:2% 6:49% 7:49% | **4.4** (4.3–5.5) |
| 3C | both | 28 | 2/7/**7**/7/13 | 3:4% 5:4% 6:36% 7:57% | **3.5** (3.2–3.9) |
| 3C | unfav | 78 | 6/9/**9**/10/10 | 1:3% 6:37% 7:53% 8:8% | **6.1** (5.5–6.3) |
| 3D | fav | 326 | 2/5/**7**/8/9 | 5:4% 6:76% 7:20% | **4.4** (3.2–5.5) |
| 3D | none | 215 | 3/6/**8**/8/10 | <6:2% 6:53% 7:45% | **5.1** (4.0–5.1) |
| 3D | both | 256 | 6/7/**8**/8/10 | 6:10% 7:88% 8+:1% | **5.3** (4.3–6.0) |
| 3D | unfav | 114 | 5/5/**7**/8/10 | 6:23% 7:77% | **5.0** (4.8–5.2) |
| 3H | fav | 196 | 1/5/**6**/7/9 | <5:2% 5:3% 6:61% 7:16% 8:17% | **3.9** (2.8–4.5) |
| 3H | none | 111 | 5/5/**7**/8/9 | <6:2% 6:61% 7:36% | **4.8** (4.8–5.9) |
| 3H | both | 143 | 5/6/**8**/9/9 | 6:3% 7:75% 8:21% | **3.6** (3.0–4.2) |
| 3H | unfav | 76 | 5/6/**7**/9/10 | 6:38% 7:59% 8:3% | **4.3** (3.3–5.2) |
| 3S | fav | 252 | 4/4/**7**/8/9 | 6:60% 7:40% | **3.9** (3.3–4.7) |
| 3S | none | 151 | 5/6/**7**/9/10 | 6:30% 7:69% | **6.3** (4.3–6.3) |
| 3S | both | 167 | 7/8/**9**/10/10 | 6:20% 7:80% | **4.8** (4.4–6.7) |
| 3S | unfav | 119 | 7/7/**7**/10/10 | 6:13% 7:86% | **7.1** (7.1–7.1) |
| 4C | fav | 51 | 5/5/**5**/9/10 | <6:2% 6:24% 7:24% 8:51% | **3.5** (3.5–4.1) |
| 4C | none | 25 | 5/8/**11**/13/14 | 3:36% 7:64% | **4.4** (3.6–5.4) |
| 4D | fav | 27 | 4/5/**5**/5/10 | 4:7% 6:15% 7:78% | **4.7** (3.0–4.7) |
| 4H | fav | 157 | 3/5/**6**/9/12 | 6:14% 7:49% 8:37% | **4.3** (3.5–5.7) |
| 4H | none | 74 | 4/5/**5**/10/16 | 6:14% 7:47% 8:32% 9:7% | **4.8** (4.7–4.8) |
| 4H | both | 127 | 5/5/**11**/12/13 | 6:3% 7:14% 8:82% | **4.2** (4.2–7.3) |
| 4S | fav | 105 | 7/8/**10**/10/12 | 6:7% 7:93% | **6.7** (4.7–6.7) |
| 4S | none | 114 | 6/9/**9**/9/9 | 7:43% 8:55% 9+:2% | **5.9** (5.9–6.3) |
| 4S | both | 57 | 8/8/**9**/11/16 | <6:2% 6:44% 7:26% 8:21% 9:7% | **4.8** (4.4–6.7) |
| 4S | unfav | 128 | 9/10/**11**/11/14 | 7:64% 8:36% | **6.4** (5.5–7.5) |

## Direct seat: RHO opens, we act — (opening) ?

Every opening 1C–4S with enough data. For 1C/1D the tables face a NATURAL opening (strong-club and nebulous-1D openers tabulated separately below); (2D) faces a weak 2D. Suit actions over (1NT) are largely conventional — 2C = both majors, 2D = one long major (multi-style), 2M = the major + a minor — and their derived rules detect those shapes from the hands instead of reading the bid at face value.

### (1C) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 49.4% | 9966 | 1144 | 2/6/**7**/9/13 | — | — | 65% |
| 1S | 12.3% | 2489 | 281 | 7/9/**11**/12/15 | <5:2% 5:81% 6:15% 7:2% | **4.3** (3.2–5.0) | 34% |
| 1H | 10.7% | 2151 | 311 | 7/9/**11**/13/16 | 4:3% 5:66% 6:23% 7:7% | **4.6** (3.7–5.4) | 16% |
| X | 8.2% | 1649 | 256 | 10/13/**14**/17/20 | theirs: <1:1% 1:17% 2:28% 3:40% 4:12% 5+:2% | — | 66% |
| 1D | 7.1% | 1441 | 278 | 7/9/**12**/14/16 | 4:5% 5:59% 6:27% 7:6% 8:2% | **4.8** (4.0–5.5) | 26% |
| 1NT | 3.3% | 659 | 125 | 14/15/**15**/16/17 | — | — | 86% |
| 2H | 1.9% | 378 | 83 | 4/7/**8**/8/12 | <5:1% 5:5% 6:80% 7:14% | **4.9** (3.8–5.4) | 1% |
| 2S | 1.5% | 310 | 67 | 4/5/**7**/9/11 | 5:6% 6:90% 7:3% | **4.2** (3.8–5.0) | 3% |
| 2C | 1.2% | 243 | 119 | 7/9/**11**/13/14 | 0:2% 1:26% 2:9% 3:3% 5:14% 6:34% 7:11% | **4.3** (0.9–6.3) | 4% |
| 2D | 0.9% | 184 | 82 | 5/7/**10**/12/14 | 1:11% 2:30% 3:5% 5:10% 6:41% 7+:1% | **4.1** (1.7–5.3) | 3% |
| 3H | 1.0% | 192 | 31 | 4/6/**8**/8/12 | 6:39% 7:60% | **4.4** (4.3–5.4) | 0% |
| 3S | 0.5% | 109 | 23 | 4/6/**9**/10/11 | 6:39% 7:58% 8:4% | **6.1** (4.0–6.4) | 0% |
| 2NT | 0.5% | 109 | 23 | 9/10/**13**/13/14 | — | — | 0% |
| 3D | 0.3% | 56 | 26 | 6/8/**9**/11/13 | 6:71% 7:23% 8:5% | **5.0** (4.0–5.0) | 0% |
| 4H | 0.4% | 72 | 18 | 6/11/**11**/13/15 | 6:7% 7:63% 8:31% | **5.8** (4.3–8.9) | 0% |
| 5D | 0.2% | 46 | 6 | 12/12/**12**/12/14 | 6:7% 7:2% 8:91% | **7.0** (7.0–7.0) | 0% |
| 4S | 0.2% | 42 | 14 | 6/8/**10**/12/15 | 6:7% 7:69% 8:24% | **6.1** (4.9–7.6) | 0% |
| 3C | 0.2% | 32 | 24 | 5/9/**11**/12/14 | 1:53% 2:16% 6:13% 7:16% 8:3% | **1.7** (0.0–4.3) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1S | none | 616 | 7/9/**11**/14/15 |
| 1S | fav | 544 | 8/9/**9**/12/16 |
| 1S | unfav | 662 | 7/10/**12**/13/14 |
| 1S | both | 667 | 7/9/**10**/12/14 |
| 1H | none | 626 | 7/10/**10**/13/15 |
| 1H | fav | 459 | 8/9/**10**/12/14 |
| 1H | unfav | 561 | 7/9/**10**/13/17 |
| 1H | both | 505 | 7/9/**11**/13/16 |
| X | none | 525 | 10/12/**14**/17/19 |
| X | fav | 265 | 11/13/**14**/18/24 |
| X | unfav | 481 | 12/13/**14**/17/20 |
| X | both | 378 | 11/13/**13**/14/16 |
| 1D | none | 506 | 7/9/**11**/14/15 |
| 1D | fav | 266 | 6/10/**12**/13/16 |
| 1D | unfav | 284 | 7/9/**12**/14/16 |
| 1D | both | 385 | 7/9/**12**/13/14 |
| 1NT | none | 140 | 14/15/**16**/17/17 |
| 1NT | fav | 47 | 13/14/**15**/17/18 |
| 1NT | unfav | 208 | 15/15/**15**/16/17 |
| 1NT | both | 264 | 14/15/**15**/16/17 |
| 2H | none | 135 | 5/7/**8**/8/11 |
| 2H | fav | 107 | 4/4/**7**/8/11 |
| 2H | unfav | 49 | 5/10/**11**/12/12 |
| 2H | both | 87 | 6/8/**8**/8/12 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 1S | 9/**11**/12 (619) | 9/**10**/14 (854) | 10/**10**/12 (701) | 8/**11**/14 (315) |
| 1H | 10/**11**/12 (543) | 9/**11**/13 (802) | 8/**10**/12 (386) | 9/**10**/13 (420) |
| X | 11/**13**/17 (309) | 13/**14**/16 (462) | 13/**14**/15 (653) | 13/**17**/18 (225) |
| 1D | 10/**12**/15 (240) | 9/**11**/13 (453) | 8/**11**/13 (360) | 11/**12**/14 (388) |

Anatomy of X: per HCP band, support held (both majors = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | both majors ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 93 | 99% | 78% | 96% | 94% |
| 11–13 | 595 | 98% | 40% | 100% | 41% |
| 14–16 | 537 | 91% | 15% | 99% | 46% |
| 17+ | 424 | 65% | 3% | 85% | 46% |

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
| P | 51.3% | 9840 | 883 | 3/6/**8**/10/13 | — | — | 61% |
| 1S | 11.5% | 2205 | 252 | 7/9/**10**/12/15 | 4:3% 5:76% 6:18% 7:3% | **4.2** (3.0–5.3) | 27% |
| 1H | 11.1% | 2137 | 222 | 7/9/**11**/13/16 | 4:4% 5:63% 6:32% 7+:1% | **4.6** (3.4–5.8) | 19% |
| X | 10.0% | 1909 | 209 | 10/12/**14**/16/19 | theirs: 0:7% 1:13% 2:46% 3:29% 4:5% | — | 66% |
| 2C | 4.4% | 845 | 81 | 9/10/**11**/13/15 | 5:29% 6:56% 7:15% | **6.1** (4.6–7.0) | 8% |
| 1NT | 3.2% | 616 | 102 | 14/15/**16**/17/18 | — | — | 90% |
| 2D | 2.3% | 450 | 46 | 6/10/**10**/12/13 | 0:38% 1:50% 2:8% 3+:4% | **0.0** (0.0–4.6) | 0% |
| 2H | 1.4% | 259 | 57 | 5/7/**8**/10/11 | <5:2% 5:6% 6:83% 7:9% | **5.0** (3.4–6.1) | 2% |
| 3H | 0.9% | 170 | 19 | 6/6/**7**/9/10 | 6:34% 7:66% | **5.3** (3.4–5.8) | 0% |
| 3S | 0.8% | 158 | 23 | 6/7/**7**/9/10 | 6:17% 7:83% | **4.2** (3.6–7.1) | 0% |
| 2S | 0.7% | 138 | 52 | 4/6/**7**/10/12 | <5:1% 5:6% 6:86% 7:7% | **4.2** (3.8–4.7) | 1% |
| 3C | 0.7% | 141 | 42 | 4/8/**10**/10/12 | <3:3% 3:2% 5:16% 6:52% 7:22% 8:4% | **5.0** (4.0–6.4) | 0% |
| 2NT | 0.6% | 109 | 19 | 9/9/**9**/10/13 | — | — | 0% |
| 4S | 0.6% | 106 | 11 | 6/10/**12**/13/15 | 7:62% 8:9% 9:28% | **7.4** (7.1–10.0) | 0% |
| 4H | 0.2% | 29 | 12 | 7/10/**10**/16/18 | 6:52% 7:34% 8:14% | **4.6** (4.3–6.5) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1S | none | 535 | 8/10/**11**/13/15 |
| 1S | fav | 643 | 8/9/**10**/11/14 |
| 1S | unfav | 585 | 7/8/**10**/15/17 |
| 1S | both | 442 | 8/8/**11**/12/15 |
| 1H | none | 401 | 7/8/**10**/13/14 |
| 1H | fav | 315 | 8/9/**11**/13/16 |
| 1H | unfav | 763 | 7/10/**11**/13/16 |
| 1H | both | 658 | 8/9/**12**/14/15 |
| X | none | 494 | 9/12/**13**/14/17 |
| X | fav | 560 | 10/13/**14**/18/20 |
| X | unfav | 327 | 11/12/**14**/18/18 |
| X | both | 528 | 10/13/**15**/15/19 |
| 2C | none | 170 | 9/10/**10**/11/13 |
| 2C | fav | 191 | 8/12/**13**/14/17 |
| 2C | unfav | 282 | 10/10/**11**/13/16 |
| 2C | both | 202 | 9/9/**11**/12/15 |
| 1NT | none | 80 | 14/15/**17**/17/17 |
| 1NT | fav | 206 | 14/16/**16**/17/18 |
| 1NT | unfav | 93 | 15/15/**16**/17/18 |
| 1NT | both | 237 | 15/15/**16**/18/18 |
| 2D | none | 204 | 6/10/**10**/10/10 |
| 2D | fav | 40 | 9/12/**13**/13/13 |
| 2D | unfav | 61 | 12/12/**12**/12/14 |
| 2D | both | 145 | 6/6/**10**/12/12 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 1S | 8/**9**/10 (483) | 9/**10**/12 (845) | 8/**12**/13 (510) | 10/**11**/12 (367) |
| 1H | 8/**10**/13 (428) | 10/**11**/13 (921) | 8/**10**/12 (437) | 11/**14**/14 (351) |
| X | 10/**15**/15 (388) | 12/**13**/15 (873) | 14/**14**/18 (557) | 14/**16**/18 (91) |
| 2C | 10/**10**/12 (132) | 10/**11**/14 (257) | 11/**11**/13 (285) | 10/**11**/13 (171) |

Anatomy of X: per HCP band, support held (both majors = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | both majors ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 134 | 99% | 60% | 99% | 99% |
| 11–13 | 617 | 99% | 28% | 99% | 82% |
| 14–16 | 685 | 95% | 23% | 100% | 55% |
| 17+ | 473 | 32% | 6% | 99% | 52% |

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
| P | 57.5% | 7456 | 543 | 3/6/**8**/10/13 | — | — | 66% |
| X | 11.5% | 1492 | 137 | 10/12/**14**/16/19 | theirs: <1:1% 1:30% 2:41% 3:25% 4+:2% | — | 56% |
| 1S | 11.3% | 1469 | 133 | 7/9/**12**/13/16 | 4:3% 5:73% 6:21% 7:4% | **5.4** (3.7–6.4) | 33% |
| 2C | 3.8% | 491 | 60 | 9/10/**12**/15/17 | 5:21% 6:58% 7:21% | **5.6** (4.7–6.7) | 9% |
| 2D | 3.3% | 433 | 65 | 8/10/**11**/13/16 | 5:21% 6:64% 7:15% | **5.3** (4.4–6.2) | 5% |
| 2H | 3.0% | 383 | 28 | 8/10/**12**/13/14 | 0:40% 1:30% 2:30% | **0.0** (0.0–4.5) | 0% |
| 1NT | 2.9% | 378 | 45 | 14/15/**15**/16/17 | — | — | 85% |
| 2S | 1.9% | 247 | 32 | 6/6/**8**/10/12 | <5:1% 5:4% 6:94% | **4.3** (3.8–5.6) | 1% |
| 2NT | 1.5% | 197 | 18 | 6/11/**11**/11/13 | — | — | 0% |
| 3D | 0.9% | 119 | 18 | 4/7/**8**/10/11 | <6:2% 6:69% 7:29% | **5.2** (5.2–5.3) | 1% |
| 4S | 0.9% | 112 | 10 | 8/11/**11**/11/15 | 6:4% 7:41% 8:54% | **7.6** (5.6–7.6) | 0% |
| 3C | 0.6% | 81 | 26 | 6/9/**10**/12/14 | 0:5% 1:5% 2:17% 5:17% 6:12% 7:43% | **4.1** (2.7–6.4) | 0% |
| 3S | 0.5% | 67 | 15 | 6/6/**7**/8/11 | 6:69% 7:28% 8:3% | **4.7** (3.8–5.6) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 383 | 11/13/**13**/15/17 |
| X | fav | 402 | 10/12/**12**/15/17 |
| X | unfav | 408 | 11/13/**14**/18/22 |
| X | both | 299 | 11/11/**14**/17/22 |
| 1S | none | 208 | 6/8/**10**/12/14 |
| 1S | fav | 398 | 8/11/**13**/14/16 |
| 1S | unfav | 400 | 7/9/**10**/14/16 |
| 1S | both | 463 | 8/10/**12**/12/16 |
| 2C | none | 145 | 8/14/**15**/15/17 |
| 2C | fav | 105 | 9/11/**11**/12/13 |
| 2C | unfav | 50 | 6/11/**11**/12/15 |
| 2C | both | 191 | 9/10/**10**/13/16 |
| 2D | none | 170 | 8/10/**13**/14/16 |
| 2D | fav | 58 | 9/10/**11**/12/16 |
| 2D | unfav | 74 | 9/11/**12**/13/15 |
| 2D | both | 131 | 10/10/**10**/11/16 |
| 2H | none | 50 | 10/13/**13**/13/13 |
| 2H | fav | 135 | 12/12/**12**/13/13 |
| 2H | unfav | 86 | 8/8/**14**/14/16 |
| 2H | both | 112 | 6/10/**10**/12/12 |
| 1NT | none | 86 | 14/15/**15**/15/17 |
| 1NT | fav | 109 | 15/15/**15**/17/17 |
| 1NT | unfav | 128 | 14/15/**15**/15/16 |
| 1NT | both | 55 | 15/17/**17**/17/17 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 11/**12**/14 (463) | 12/**13**/15 (619) | 15/**16**/17 (380) | 12/**14**/15 (30) |
| 1S | 7/**12**/13 (297) | 9/**10**/13 (500) | 11/**12**/13 (448) | 10/**13**/14 (224) |
| 2C | 10/**11**/15 (206) | 9/**12**/12 (78) | 10/**11**/14 (200) | — |
| 2D | 10/**12**/14 (160) | 10/**10**/11 (166) | 11/**11**/12 (46) | 11/**13**/13 (61) |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 81 | 100% | 91% | 100% | 99% |
| 11–13 | 641 | 100% | 81% | 99% | 86% |
| 14–16 | 470 | 100% | 62% | 98% | 66% |
| 17+ | 300 | 71% | 46% | 99% | 47% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 10..17 and h <= 2 and s >= 3 and d >= 2 and c >= 2) or (hcp in 12..17 and h == 3 and s >= 3 and d >= 2 and c >= 2) or hcp >= 18)`
- `1S` → `s >= 5 and top(s,5) >= 1 and ((hcp in 6..16 and h <= 2) or (hcp in 8..16 and h in 3..4))`
- `2C` → `c >= 5 and top(c,5) >= 2 and hcp in 9..17`
- `2D` → `d >= 5 and top(d,5) >= 1 and ((hcp in 8..16 and h <= 2) or (hcp in 10..16 and h in 3..4))`
- `2H` → `s >= 5 and ((hcp in 8..14 and d >= 5) or (hcp in 8..14 and c >= 5))`
- `1NT` → `hcp in 14..17` *(+ balanced)*

### (1S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 68.3% | 9556 | 615 | 4/6/**8**/10/13 | — | — | 61% |
| X | 7.3% | 1018 | 163 | 11/12/**13**/15/19 | theirs: 0:5% 1:22% 2:42% 3:25% 4:7% | — | 57% |
| 2H | 6.4% | 897 | 86 | 10/10/**12**/14/15 | 5:45% 6:51% 7:4% | **5.9** (4.3–6.3) | 11% |
| 2D | 5.8% | 818 | 72 | 8/10/**11**/13/15 | 5:24% 6:57% 7:19% | **6.3** (5.1–7.2) | 18% |
| 2C | 3.6% | 503 | 60 | 9/10/**11**/15/16 | 5:33% 6:50% 7:17% | **4.6** (4.4–6.2) | 12% |
| 1NT | 2.8% | 398 | 58 | 15/15/**16**/17/18 | — | — | 78% |
| 2S | 1.1% | 158 | 17 | 6/7/**12**/12/15 | 0:12% 1:73% 2:13% 3+:1% | **0.0** (0.0–0.0) | 1% |
| 3C | 1.0% | 140 | 28 | 4/6/**8**/10/12 | 1:11% 2:3% 3:6% 5:4% 6:24% 7:52% | **4.5** (4.1–5.2) | 0% |
| 3D | 1.0% | 138 | 20 | 7/9/**9**/10/11 | 6:48% 7:48% 8:4% | **5.3** (5.1–6.9) | 0% |
| 3H | 0.9% | 132 | 17 | 6/8/**8**/10/12 | 6:48% 7:52% | **4.9** (4.0–7.0) | 0% |
| 2NT | 0.8% | 111 | 18 | 7/10/**11**/12/21 | — | — | 0% |
| 4H | 0.3% | 46 | 9 | 8/10/**10**/15/15 | 6:61% 7:39% | **7.0** (6.3–7.1) | 0% |
| 4C | 0.2% | 32 | 3 | 4/4/**7**/8/8 | 7:100% | **4.1** (4.1–5.2) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 166 | 10/13/**14**/14/17 |
| X | fav | 205 | 10/13/**13**/15/20 |
| X | unfav | 241 | 11/13/**14**/15/18 |
| X | both | 406 | 11/12/**13**/15/19 |
| 2H | none | 359 | 11/11/**12**/14/15 |
| 2H | fav | 114 | 10/10/**10**/12/15 |
| 2H | unfav | 200 | 9/10/**13**/13/15 |
| 2H | both | 224 | 10/10/**11**/14/14 |
| 2D | none | 191 | 7/10/**11**/12/14 |
| 2D | fav | 154 | 10/10/**10**/12/15 |
| 2D | unfav | 319 | 10/10/**11**/13/17 |
| 2D | both | 154 | 8/10/**13**/13/15 |
| 2C | none | 62 | 11/11/**12**/13/14 |
| 2C | fav | 244 | 8/10/**11**/15/16 |
| 2C | unfav | 72 | 9/9/**10**/12/15 |
| 2C | both | 125 | 11/11/**14**/15/15 |
| 1NT | none | 81 | 14/15/**15**/17/18 |
| 1NT | fav | 162 | 15/15/**17**/17/17 |
| 1NT | unfav | 42 | 15/15/**16**/18/18 |
| 1NT | both | 113 | 15/15/**15**/16/17 |
| 2S | none | 91 | 7/7/**12**/12/12 |
| 2S | fav | 35 | 6/6/**12**/15/15 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 12/**13**/14 (270) | 12/**14**/15 (427) | 13/**14**/15 (252) | 13/**18**/19 (69) |
| 2H | 10/**12**/13 (335) | 11/**12**/14 (383) | 11/**12**/15 (141) | 11/**11**/11 (38) |
| 2D | 10/**11**/13 (264) | 10/**12**/12 (222) | 10/**13**/13 (228) | 10/**10**/11 (104) |
| 2C | 10/**11**/16 (158) | 11/**13**/15 (184) | 11/**12**/14 (90) | 10/**10**/11 (71) |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 38 | 92% | 79% | 79% | 87% |
| 11–13 | 487 | 100% | 79% | 99% | 71% |
| 14–16 | 392 | 98% | 51% | 100% | 73% |
| 17+ | 101 | 58% | 47% | 81% | 32% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 11..15 and s <= 2 and h >= 3 and d >= 2 and c >= 2) or (hcp in 12..15 and s == 3 and h >= 3 and d >= 2 and c >= 2) or hcp >= 16)`
- `2H` → `h >= 5 and top(h,5) >= 1 and (hcp >= 11 or top(h,5) >= 2) and hcp in 10..15`
- `2D` → `d >= 5 and top(d,5) >= 2 and ((hcp in 8..15 and s <= 2) or (hcp in 10..15 and s in 3..4))`
- `2C` → `c >= 5 and top(c,5) >= 2 and ((hcp in 8..16 and s <= 2) or (hcp in 10..16 and s in 3..4))`
- `1NT` → `(has(s,a) or (has(s,k) and s >= 2) or (has(s,q) and s >= 3)) and hcp in 15..18`
- `2S` → `h >= 5 and ((hcp in 6..15 and d >= 5) or (hcp in 6..15 and c >= 5))`

### (1NT) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 78.1% | 12147 | 1085 | 3/6/**8**/10/13 | — | — | 58% |
| X | 5.7% | 883 | 263 | 9/12/**15**/17/19 | — | — | 33% |
| 2D | 4.9% | 766 | 155 | 6/9/**11**/12/16 | <1:1% 1:13% 2:41% 3:23% 4:13% 5:6% 6:3% | **3.8** (1.5–5.5) | 2% |
| 2C | 4.4% | 684 | 135 | 6/10/**12**/13/15 | 0:4% 1:30% 2:41% 3:19% 4:3% 5:3% | **1.1** (0.2–3.4) | 1% |
| 2H | 2.5% | 388 | 91 | 7/10/**12**/13/16 | <2:1% 2:3% 3:3% 4:3% 5:62% 6:26% 7:3% | **4.9** (3.8–5.9) | 1% |
| 2S | 1.7% | 270 | 73 | 8/10/**11**/13/15 | <5:2% 5:61% 6:33% 7:4% | **4.7** (3.8–4.9) | 1% |
| 3D | 0.7% | 104 | 26 | 6/9/**10**/11/13 | <6:2% 6:40% 7:41% 8:16% | **6.4** (4.4–6.6) | 0% |
| 3C | 0.5% | 76 | 20 | 5/8/**10**/11/14 | <6:1% 6:26% 7:54% 8:18% | **4.7** (4.0–5.8) | 0% |
| 4D | 0.3% | 46 | 4 | 9/9/**9**/9/10 | 5:2% 7:2% 8:96% | **4.4** (4.4–4.4) | 0% |
| 3H | 0.3% | 45 | 10 | 3/3/**7**/7/13 | 0:2% 6:18% 7:80% | **5.3** (4.0–5.8) | 0% |
| 2NT | 0.3% | 40 | 13 | 5/5/**10**/13/14 | — | — | 0% |
| 3S | 0.2% | 37 | 10 | 4/9/**10**/10/13 | 6:38% 7:62% | **4.7** (4.7–6.1) | 0% |
| 4H | 0.2% | 31 | 2 | 10/10/**10**/10/15 | 7:19% 8:81% | **6.5** (6.5–6.5) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 343 | 10/11/**14**/16/18 |
| X | fav | 95 | 9/10/**13**/14/18 |
| X | unfav | 278 | 11/14/**15**/17/19 |
| X | both | 167 | 9/14/**16**/19/19 |
| 2D | none | 232 | 3/9/**11**/12/17 |
| 2D | fav | 66 | 4/7/**10**/11/12 |
| 2D | unfav | 186 | 7/9/**10**/12/15 |
| 2D | both | 282 | 7/10/**11**/13/13 |
| 2C | none | 163 | 8/9/**11**/13/17 |
| 2C | fav | 239 | 5/11/**11**/13/14 |
| 2C | unfav | 100 | 7/10/**12**/12/15 |
| 2C | both | 182 | 6/11/**13**/13/15 |
| 2H | none | 150 | 5/10/**12**/15/17 |
| 2H | unfav | 161 | 6/10/**12**/12/13 |
| 2H | both | 54 | 7/10/**11**/12/14 |
| 2S | none | 112 | 9/11/**11**/13/17 |
| 2S | fav | 42 | 8/8/**9**/10/11 |
| 2S | unfav | 59 | 8/10/**12**/14/17 |
| 2S | both | 57 | 7/10/**10**/11/13 |
| 3D | none | 57 | 9/10/**11**/11/11 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 9..19`
- `2D` → `((hcp in 6..16 and s >= 5) or (hcp in 6..16 and h >= 5))`
- `2C` → `(hcp in 6..15 and s >= 4 and h >= 4)`
- `2H` → `h >= 4 and top(h,5) >= 1 and ((hcp in 7..16 and d >= 4) or (hcp in 7..16 and c >= 4))`
- `2S` → `s >= 5 and top(s,5) >= 1 and ((hcp in 8..15 and d >= 4) or (hcp in 8..15 and c >= 4))`
- `3D` → `d >= 6 and top(d,5) >= 2 and hcp in 6..13`

### (2C) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 73.1% | 1869 | 389 | 2/5/**7**/9/13 | — | — | 55% |
| X | 8.2% | 209 | 81 | 9/13/**15**/17/20 | theirs: 1:25% 2:40% 3:19% 4:6% 5:4% 6:5% | — | 55% |
| 2S | 5.5% | 140 | 57 | 4/8/**11**/13/15 | 5:41% 6:49% 7:9% | **4.9** (3.7–5.8) | 17% |
| 2H | 5.5% | 140 | 46 | 7/10/**12**/13/17 | <5:1% 5:43% 6:46% 7:9% | **5.0** (4.4–5.4) | 12% |
| 2D | 2.4% | 62 | 36 | 7/8/**11**/15/17 | 0:3% 2:3% 3:3% 4:2% 5:47% 6:32% 7:2% 8:8% | **4.6** (4.0–6.2) | 21% |
| 2NT | 1.3% | 33 | 18 | 4/15/**15**/17/17 | — | — | 64% |
| 3D | 1.3% | 33 | 8 | 7/8/**8**/12/14 | 1:6% 6:27% 7:3% 8:64% | **4.0** (4.0–4.0) | 0% |
| 3C | 1.1% | 28 | 18 | 7/12/**13**/14/15 | 0:4% 1:36% 2:14% 5:11% 6:21% 7:7% 8:7% | **4.6** (0.9–5.9) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 67 | 10/12/**16**/17/21 |
| X | fav | 40 | 9/13/**16**/16/20 |
| X | unfav | 75 | 9/13/**15**/17/20 |
| X | both | 27 | 10/12/**14**/16/19 |
| 2S | none | 66 | 5/7/**11**/14/14 |
| 2S | unfav | 27 | 9/10/**12**/13/16 |
| 2S | both | 30 | 2/8/**10**/12/13 |
| 2H | none | 52 | 6/9/**12**/14/17 |
| 2H | unfav | 46 | 7/10/**10**/12/16 |
| 2H | both | 34 | 8/12/**13**/16/17 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 12/**14**/18 (53) | 14/**16**/17 (84) | 14/**15**/15 (39) | 9/**13**/16 (33) |
| 2S | 8/**9**/12 (49) | 10/**11**/14 (49) | 7/**12**/13 (29) | — |
| 2H | 8/**12**/13 (53) | 10/**12**/14 (65) | — | — |

Anatomy of X: per HCP band, support held (both majors = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | both majors ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 15 | 60% | 27% | 73% | 33% |
| 11–13 | 51 | 88% | 49% | 96% | 65% |
| 14–16 | 78 | 94% | 44% | 100% | 62% |
| 17+ | 65 | 85% | 3% | 86% | 78% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 9..17 and c <= 4 and s >= 3 and h >= 3 and d >= 2) or hcp >= 18)`
- `2S` → `s >= 5 and top(s,5) >= 1 and ((hcp in 4..15 and c <= 2) or (hcp in 7..15 and c in 3..4))`
- `2H` → `h >= 5 and top(h,5) >= 1 and hcp in 7..17`
- `2D` → `d >= 4 and top(d,5) >= 1 and hcp in 7..17`

### (2D) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 40.1% | 110 | 533 | 4/8/**9**/12/14 | — | — | 49% |
| X | 23.7% | 65 | 159 | 12/15/**16**/20/24 | theirs: <1:2% 1:15% 2:54% 3:18% 4:9% 5+:2% | — | 55% |
| 2S | 9.5% | 26 | 46 | 9/9/**11**/13/16 | 5:35% 6:38% 7:27% | **6.7** (6.3–7.0) | 27% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 29 | 11/15/**18**/24/24 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 12..17 and d <= 4 and s >= 3 and h >= 3 and c >= 2) or hcp >= 18)`

### (2H) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 56.5% | 1078 | 281 | 2/7/**10**/11/13 | — | — | 54% |
| X | 17.3% | 330 | 92 | 10/13/**14**/17/22 | theirs: 1:27% 2:44% 3:21% 4:6% 5+:2% | — | 44% |
| 2S | 10.8% | 206 | 49 | 9/13/**14**/16/17 | <5:2% 5:66% 6:29% 7:3% | **6.3** (3.9–7.0) | 6% |
| 3C | 5.7% | 108 | 22 | 10/13/**13**/14/14 | 5:4% 6:87% 7:7% 8+:2% | **5.6** (4.8–6.7) | 0% |
| 2NT | 4.9% | 93 | 40 | 13/15/**16**/17/18 | — | — | 65% |
| 3D | 2.8% | 53 | 17 | 7/11/**11**/13/16 | 5:15% 6:43% 7:42% | **6.6** (5.3–6.6) | 6% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 108 | 10/13/**14**/17/20 |
| X | fav | 91 | 11/13/**13**/16/17 |
| X | unfav | 89 | 10/13/**14**/16/22 |
| X | both | 42 | 11/11/**16**/19/22 |
| 2S | none | 69 | 8/12/**14**/14/14 |
| 2S | fav | 57 | 12/16/**16**/16/17 |
| 2S | unfav | 36 | 10/13/**14**/14/16 |
| 2S | both | 44 | 9/10/**15**/16/16 |
| 3C | none | 36 | 8/13/**13**/14/15 |
| 3C | unfav | 44 | 13/13/**14**/14/14 |
| 2NT | unfav | 57 | 13/15/**16**/16/18 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 11/**13**/15 (90) | 13/**14**/16 (145) | 13/**13**/17 (68) | 14/**16**/19 (27) |
| 2S | 10/**14**/14 (56) | 13/**14**/16 (62) | 12/**14**/14 (41) | 16/**16**/16 (47) |
| 3C | 13/**13**/13 (37) | — | 13/**14**/14 (60) | — |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 18 | 94% | 94% | 100% | 94% |
| 11–13 | 121 | 97% | 89% | 98% | 66% |
| 14–16 | 106 | 90% | 65% | 94% | 82% |
| 17+ | 85 | 89% | 76% | 78% | 60% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 10..17 and h <= 2 and s >= 3 and d >= 2 and c >= 2) or (hcp in 13..17 and h == 3 and s >= 3 and d >= 2 and c >= 2) or hcp >= 18)`
- `2S` → `s >= 5 and top(s,5) >= 1 and ((hcp in 8..17 and h <= 2) or (hcp in 10..17 and h in 3..4))`
- `3C` → `c >= 6 and top(c,5) >= 2 and ((hcp in 8..14 and h <= 2) or (hcp in 12..14 and h == 3))`
- `2NT` → `(has(h,a) or (has(h,k) and h >= 2) or (has(h,q) and h >= 3)) and hcp in 13..18`
- `3D` → `d >= 5 and top(d,5) >= 2 and hcp in 7..16`

### (2S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 55.1% | 1316 | 226 | 3/7/**10**/11/14 | — | — | 48% |
| X | 21.9% | 522 | 75 | 11/13/**15**/16/20 | theirs: 0:5% 1:38% 2:40% 3:13% 4:4% | — | 32% |
| 3H | 9.5% | 227 | 39 | 10/11/**12**/13/16 | 5:18% 6:81% 7+:1% | **5.1** (4.0–6.7) | 7% |
| 2NT | 7.6% | 181 | 28 | 15/17/**17**/17/18 | — | — | 90% |
| 3D | 2.1% | 51 | 12 | 10/13/**14**/14/16 | 5:6% 6:84% 7:8% 8+:2% | **6.5** (6.3–6.5) | 0% |
| 3C | 1.9% | 45 | 19 | 9/11/**13**/14/16 | 5:31% 6:47% 7:22% | **4.8** (4.3–6.2) | 4% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 108 | 12/14/**15**/16/20 |
| X | fav | 130 | 13/13/**15**/16/17 |
| X | unfav | 178 | 11/13/**14**/14/17 |
| X | both | 106 | 12/16/**16**/19/21 |
| 3H | none | 39 | 10/13/**13**/13/16 |
| 3H | fav | 48 | 11/11/**11**/11/13 |
| 3H | unfav | 61 | 10/12/**13**/15/17 |
| 3H | both | 79 | 10/11/**12**/12/16 |
| 2NT | fav | 34 | 16/17/**17**/17/18 |
| 2NT | unfav | 120 | 15/17/**17**/17/18 |
| 3D | none | 35 | 10/13/**14**/14/14 |
| 3C | both | 26 | 9/11/**13**/14/18 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 13/**15**/16 (226) | 14/**14**/16 (207) | 14/**16**/16 (67) | 17/**18**/18 (22) |
| 3H | 11/**12**/12 (91) | 11/**11**/12 (61) | 13/**13**/13 (65) | — |
| 2NT | — | — | 17/**17**/17 (119) | 16/**17**/17 (53) |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| 11–13 | 126 | 100% | 79% | 99% | 90% |
| 14–16 | 293 | 100% | 57% | 100% | 84% |
| 17+ | 93 | 98% | 82% | 78% | 70% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 11..17 and s <= 2 and h >= 3 and d >= 2 and c >= 2) or (hcp in 13..17 and s == 3 and h >= 3 and d >= 2 and c >= 2) or hcp >= 18)`
- `3H` → `h >= 5 and top(h,5) >= 2 and ((hcp in 10..16 and s <= 2) or (hcp in 12..16 and s == 3))`
- `2NT` → `(has(s,a) or (has(s,k) and s >= 2) or (has(s,q) and s >= 3)) and hcp in 15..18` *(+ balanced)*
- `3D` → `d >= 6 and top(d,5) >= 2 and hcp in 10..16`

### (2NT) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 97.4% | 2162 | 198 | 2/4/**6**/8/12 | — | — | 51% |
| X | 1.2% | 26 | 14 | 12/14/**18**/21/21 | — | — | 58% |

### (3C) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 44.2% | 395 | 54 | 4/8/**10**/11/16 | — | — | 36% |
| X | 24.0% | 215 | 27 | 10/15/**16**/18/20 | theirs: 0:14% 1:19% 2:7% 3:53% 4:7% | — | 59% |
| 3H | 10.9% | 97 | 10 | 8/11/**11**/11/16 | 5:6% 6:94% | **5.1** (5.1–5.1) | 2% |
| 3NT | 8.8% | 79 | 11 | 15/16/**17**/18/18 | — | — | 66% |
| 4C | 4.4% | 39 | 4 | 14/14/**14**/14/14 | 0:85% 1:13% 2:3% | **0.0** (0.0–0.0) | 0% |
| 3D | 3.9% | 35 | 6 | 9/11/**11**/15/15 | 0:3% 6:89% 7:9% | **6.2** (5.9–6.2) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 61 | 14/16/**17**/17/19 |
| X | unfav | 145 | 10/15/**15**/18/20 |
| 3H | none | 76 | 11/11/**11**/11/11 |
| 3NT | none | 32 | 16/16/**17**/17/17 |
| 3NT | unfav | 44 | 15/16/**17**/18/18 |
| 4C | unfav | 33 | 14/14/**14**/14/14 |
| 3D | unfav | 34 | 10/11/**11**/15/15 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 10/**18**/19 (72) | — | 15/**15**/17 (113) | 15/**16**/16 (16) |

Anatomy of X: per HCP band, support held (both majors = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | both majors ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 29 | 97% | 97% | 100% | 100% |
| 14–16 | 83 | 98% | 60% | 89% | 16% |
| 17+ | 99 | 95% | 23% | 100% | 40% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 10..17 and c <= 2 and s >= 3 and h >= 3 and d >= 2) or (hcp in 15..17 and c == 3 and s >= 3 and h >= 3 and d >= 2) or hcp >= 18)`
- `3H` → `h >= 6 and top(h,5) >= 2 and hcp in 8..16`
- `3NT` → `(has(c,a) or (has(c,k) and c >= 2) or (has(c,q) and c >= 3)) and hcp in 15..18`

### (3D) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 46.9% | 502 | 68 | 7/9/**11**/12/14 | — | — | 51% |
| X | 15.4% | 165 | 35 | 9/13/**13**/14/20 | theirs: 0:13% 1:19% 2:60% 3:8% | — | 56% |
| 3S | 13.4% | 144 | 14 | 9/11/**11**/14/17 | 5:13% 6:72% 7:15% | **6.7** (6.7–7.8) | 13% |
| 3H | 13.4% | 143 | 14 | 12/12/**12**/13/17 | 5:21% 6:78% | **6.2** (3.6–6.2) | 2% |
| 3NT | 4.9% | 52 | 11 | 16/16/**16**/20/21 | — | — | 94% |
| 4S | 3.5% | 38 | 3 | 13/13/**14**/17/17 | 6:18% 7:50% 9:32% | **4.4** (4.4–10.0) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 94 | 12/13/**13**/13/20 |
| X | unfav | 45 | 9/9/**13**/14/18 |
| 3S | none | 29 | 9/9/**10**/13/13 |
| 3S | fav | 34 | 14/14/**14**/14/14 |
| 3S | both | 67 | 11/11/**11**/11/16 |
| 3H | unfav | 58 | 8/12/**12**/13/18 |
| 3H | both | 78 | 12/12/**12**/12/17 |
| 3NT | none | 41 | 16/16/**16**/20/20 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 9/**13**/13 (53) | 13/**13**/13 (99) | — | — |
| 3S | — | 11/**11**/14 (125) | — | — |
| 3H | 13/**13**/13 (25) | 12/**12**/12 (84) | 12/**12**/12 (33) | — |

Anatomy of X: per HCP band, support held (both majors = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | both majors ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 19 | 100% | 100% | 95% | 100% |
| 11–13 | 99 | 95% | 77% | 100% | 99% |
| 14–16 | 16 | 81% | 56% | 94% | 63% |
| 17+ | 31 | 55% | 0% | 100% | 81% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 9..17 and d <= 2 and s >= 3 and h >= 3 and c >= 3) or hcp >= 18)`
- `3S` → `s >= 5 and top(s,5) >= 3 and hcp in 9..17`
- `3H` → `h >= 5 and top(h,5) >= 1 and hcp in 12..17`
- `3NT` → `(has(d,a) or (has(d,k) and d >= 2) or (has(d,q) and d >= 3)) and hcp in 16..21` *(+ balanced)*

### (3H) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 69.4% | 429 | 58 | 2/6/**10**/11/13 | — | — | 48% |
| X | 16.3% | 101 | 20 | 11/14/**14**/16/17 | theirs: 1:40% 2:54% 3:3% 4+:3% | — | 54% |
| 3S | 6.6% | 41 | 11 | 8/10/**10**/12/16 | 5:29% 6:56% 7:15% | **3.3** (3.0–6.4) | 10% |
| 3NT | 5.7% | 35 | 8 | 14/16/**18**/18/18 | — | — | 23% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 37 | 10/14/**14**/14/18 |
| X | fav | 31 | 13/15/**17**/17/17 |
| X | unfav | 32 | 11/14/**14**/16/16 |
| 3NT | unfav | 25 | 14/16/**18**/18/18 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 14/**14**/14 (40) | 14/**16**/17 (55) | — | — |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| 14–16 | 64 | 100% | 78% | 98% | 98% |
| 17+ | 23 | 91% | 91% | 91% | 91% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 11..16 and h <= 2 and s >= 3 and d >= 3 and c >= 3) or hcp >= 17)`

### (3S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 81.9% | 652 | 54 | 3/5/**10**/12/13 | — | — | 47% |
| X | 8.2% | 65 | 15 | 12/14/**16**/16/18 | theirs: <1:2% 1:9% 2:58% 3:23% 4:8% | — | 34% |
| 3NT | 6.7% | 53 | 6 | 11/17/**17**/17/18 | — | — | 75% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 3NT | unfav | 40 | 17/17/**17**/17/17 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 12..15 and s <= 3 and h >= 3 and d >= 2 and c >= 2) or hcp >= 16)`
- `3NT` → `(has(s,a) or (has(s,k) and s >= 2) or (has(s,q) and s >= 3)) and hcp in 11..18`

### (4H) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 80.4% | 345 | 32 | 6/9/**10**/11/15 | — | — | 50% |
| 4S | 14.5% | 62 | 7 | 8/9/**10**/12/14 | <5:2% 5:34% 6:65% | **6.7** (5.6–7.6) | 2% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 4S | unfav | 31 | 8/8/**12**/14/14 |

Dealer filters (paste into the custom filter box; derived from the data):

- `4S` → `s >= 5 and top(s,5) >= 2 and hcp in 8..14`

### (4S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 83.7% | 390 | 41 | 5/9/**10**/11/14 | — | — | 31% |
| 4NT | 8.2% | 38 | 5 | 10/15/**21**/21/21 | — | — | 0% |

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
| 1C natural (3+) | 19458 | 49% | 8% | 39% | 4% | 51% |
| 1C short (2+) | 716 | 57% | 5% | 36% | 2% | 43% |
| 1C strong | 3011 | 63% | 3% | 32% | 2% | 37% |
| 1C Polish | 232 | 62% | 3% | 31% | 4% | 38% |
| 1D natural | 19177 | 51% | 10% | 35% | 4% | 49% |
| 1D nebulous | 1049 | 52% | 10% | 33% | 4% | 48% |
| 1H (any) | 12974 | 57% | 11% | 26% | 5% | 43% |
| 1S (any) | 13988 | 68% | 7% | 21% | 4% | 32% |

Action rate at fixed own strength (the fair comparison):

| opening faced | 6–8 HCP | 9–11 HCP | 12–14 HCP | 15+ HCP |
|---|---|---|---|---|
| 1C natural (3+) | 28% | 59% | 76% | 98% |
| 1C short (2+) | 26% | 50% | 70% | — |
| 1C strong | 33% | 48% | 68% | 67% |
| 1C Polish | 27% | 45% | 58% | — |
| 1D natural | 27% | 56% | 65% | 96% |
| 1D nebulous | 24% | 59% | 56% | 96% |
| 1H (any) | 21% | 41% | 65% | 96% |
| 1S (any) | 9% | 29% | 58% | 97% |

### (1C = strong, Precision-style) ? — for comparison

| action | n | HCP p5/p25/med/p75/p95 | bid-suit len | texture |
|---|---|---|---|---|
| P | 1885 | 2/5/**7**/9/13 | — | — |
| 1S | 233 | 5/8/**10**/12/14 | <4:4% 4:4% 5:78% 6:12% 7:2% | **4.2** (3.2–5.2) |
| 1H | 258 | 5/7/**10**/12/14 | <2:1% 2:3% 3:2% 4:5% 5:71% 6:16% 7+:2% | **4.4** (3.3–5.9) |
| X | 102 | 6/8/**10**/13/19 | — | — |
| 1D | 157 | 6/7/**10**/11/15 | 2:6% 3:6% 4:11% 5:50% 6:22% 7:3% 8+:1% | **4.6** (3.3–5.7) |
| 1NT | 44 | 4/7/**11**/15/16 | — | — |
| 2H | 35 | 4/6/**7**/10/13 | 0:6% 1:6% 3:6% 4:3% 5:17% 6:54% 7:9% | **4.0** (2.7–6.4) |
| 2S | 56 | 3/5/**6**/10/12 | <5:4% 5:13% 6:82% 7+:2% | **4.1** (3.8–4.9) |
| 2C | 76 | 6/8/**9**/12/14 | 1:11% 2:7% 3:1% 4:1% 5:32% 6:46% 7:3% | **5.7** (2.8–6.8) |
| 2D | 44 | 4/6/**8**/10/13 | 0:5% 1:5% 2:9% 3:16% 4:5% 5:9% 6:48% 7:5% | **3.9** (1.2–5.3) |
| 3D | 36 | 8/8/**9**/10/13 | 6:64% 7:6% 8:31% | **5.0** (4.0–6.4) |

## Balancing seat: (opening) P (P) ?

Includes balancing over weak twos and preempts — the classic "protect with less" seat.

### (1C) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| X | 33.8% | 80 | 23 | 8/11/**14**/17/18 | theirs: 1:43% 2:19% 3:33% 4:3% 5:3% 6+:1% | — | 44% |
| P | 25.7% | 61 | 27 | 8/8/**8**/10/13 | — | — | 70% |
| 1S | 16.0% | 38 | 10 | 10/10/**12**/14/14 | 5:95% 6:5% | **4.4** (2.6–4.6) | 37% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | unfav | 47 | 11/11/**12**/17/18 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 8..17 and c <= 2 and s >= 3 and h >= 3 and d >= 2) or (hcp in 10..17 and c == 3 and s >= 3 and h >= 3 and d >= 2) or hcp >= 18)`

### (1D) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| X | 35.9% | 166 | 38 | 8/9/**11**/16/19 | theirs: 0:5% 1:8% 2:48% 3:27% 4:7% 5:5% | — | 61% |
| P | 21.6% | 100 | 28 | 5/8/**8**/8/9 | — | — | 55% |
| 1H | 19.2% | 89 | 14 | 6/9/**14**/14/14 | 5:98% 6:2% | **7.5** (4.1–7.5) | 1% |
| 1S | 9.9% | 46 | 11 | 8/10/**12**/12/15 | 5:100% | **4.6** (4.4–4.6) | 28% |
| 1NT | 6.5% | 30 | 10 | 11/11/**13**/14/16 | — | — | 100% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | fav | 41 | 9/12/**18**/19/19 |
| X | unfav | 47 | 8/11/**11**/16/17 |
| X | both | 56 | 8/9/**9**/9/13 |
| 1H | none | 62 | 12/14/**14**/14/14 |
| 1S | fav | 26 | 12/12/**12**/12/14 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 9/**14**/14 (21) | 9/**9**/12 (79) | 11/**13**/19 (45) | 17/**18**/18 (21) |

Anatomy of X: per HCP band, support held (both majors = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | both majors ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 66 | 92% | 18% | 100% | 95% |
| 11–13 | 32 | 100% | 19% | 100% | 22% |
| 14–16 | 30 | 60% | 20% | 100% | 90% |
| 17+ | 38 | 68% | 45% | 37% | 8% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 8..17 and d <= 2 and s >= 3 and h >= 3 and c >= 3) or (hcp in 11..17 and d in 3..4 and s >= 3 and h >= 3 and c >= 3) or hcp >= 18)`
- `1H` → `h >= 5 and top(h,5) >= 1 and hcp in 6..14`

### (1H) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 39.1% | 158 | 25 | 5/7/**9**/10/11 | — | — | 61% |
| X | 28.0% | 113 | 22 | 7/10/**15**/22/22 | theirs: 1:4% 2:37% 3:54% 4:4% | — | 47% |
| 1NT | 9.9% | 40 | 12 | 9/11/**11**/11/15 | — | — | 53% |
| 1S | 9.4% | 38 | 11 | 7/7/**7**/11/14 | 5:55% 6:45% | **5.1** (2.2–5.4) | 45% |
| 3NT | 6.2% | 25 | 1 | 22/22/**22**/22/22 | — | — | 0% |

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
| X | 41.4% | 208 | 29 | 9/9/**10**/15/16 | theirs: 1:47% 2:48% 3:4% 4+:1% | — | 40% |
| P | 32.4% | 163 | 39 | 5/5/**7**/9/11 | — | — | 60% |
| 1NT | 8.9% | 45 | 18 | 9/10/**11**/15/16 | — | — | 71% |
| 2C | 7.4% | 37 | 8 | 9/9/**13**/13/15 | 5:84% 6:16% | **6.0** (5.3–7.1) | 0% |
| 2H | 5.2% | 26 | 6 | 10/10/**10**/15/15 | 5:96% 7:4% | **5.8** (5.8–6.8) | 8% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 45 | 10/10/**10**/11/15 |
| X | fav | 68 | 10/15/**16**/16/17 |
| X | unfav | 26 | 7/10/**12**/15/15 |
| X | both | 69 | 9/9/**9**/9/11 |
| 2C | both | 28 | 9/9/**13**/13/13 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 9/**9**/10 (97) | 10/**16**/16 (99) | — | — |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 119 | 100% | 48% | 100% | 100% |
| 11–13 | 17 | 82% | 6% | 100% | 94% |
| 14–16 | 66 | 97% | 79% | 91% | 86% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 9..15 and s <= 2 and h >= 3 and d >= 3 and c >= 3) or hcp >= 16)`

### (1NT) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 61.6% | 1623 | 292 | 4/7/**9**/10/13 | — | — | 77% |
| X | 11.0% | 289 | 109 | 8/10/**12**/15/17 | — | — | 45% |
| 2D | 6.8% | 179 | 42 | 6/9/**9**/11/15 | <1:2% 1:4% 2:23% 3:32% 4:27% 5:9% 6:2% | **3.7** (1.1–4.4) | 13% |
| 2C | 6.2% | 164 | 53 | 6/7/**8**/10/14 | 0:11% 1:16% 2:13% 3:27% 4:20% 5:13% 6+:1% | **2.8** (0.2–4.5) | 17% |
| 2H | 6.1% | 160 | 38 | 7/8/**10**/11/13 | <4:3% 4:3% 5:82% 6:8% 7:6% | **4.5** (3.8–5.9) | 4% |
| 2S | 5.7% | 150 | 20 | 7/9/**11**/13/16 | 5:65% 6:34% | **4.0** (2.7–4.9) | 15% |
| 3H | 1.4% | 37 | 1 | 9/9/**9**/9/9 | 7:100% | **4.4** (4.4–4.4) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 102 | 8/10/**14**/15/17 |
| X | fav | 46 | 9/11/**11**/12/15 |
| X | unfav | 88 | 7/11/**14**/16/18 |
| X | both | 53 | 7/10/**10**/11/15 |
| 2D | none | 73 | 7/8/**9**/9/15 |
| 2D | unfav | 55 | 6/10/**11**/11/11 |
| 2D | both | 34 | 8/9/**9**/10/10 |
| 2C | none | 63 | 5/8/**8**/10/14 |
| 2C | fav | 35 | 7/8/**11**/12/14 |
| 2C | both | 42 | 7/7/**7**/9/10 |
| 2H | none | 35 | 7/7/**8**/8/15 |
| 2H | fav | 84 | 9/9/**11**/11/11 |
| 2S | none | 69 | 6/8/**9**/15/16 |
| 2S | unfav | 60 | 7/11/**13**/13/13 |
| 3H | both | 37 | 9/9/**9**/9/9 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 8..17`
- `2D` → `((hcp in 6..15 and s >= 5) or (hcp in 6..15 and h >= 5))`
- `2C` → `(hcp in 6..14 and s >= 4 and h >= 4)`
- `2H` → `h >= 5 and top(h,5) >= 2 and ((hcp in 7..13 and d >= 4) or (hcp in 7..13 and c >= 4))`
- `2S` → `s >= 5 and top(s,5) >= 1 and hcp in 7..16`

### (2D) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 45.5% | 55 | 34 | 4/8/**9**/11/13 | — | — | 73% |
| X | 24.0% | 29 | 23 | 8/11/**12**/14/19 | theirs: 0:3% 1:24% 2:31% 3:34% 4:7% | — | 55% |

### (2H) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 56.3% | 219 | 68 | 5/8/**9**/10/14 | — | — | 69% |
| X | 21.6% | 84 | 25 | 9/10/**11**/12/17 | theirs: 1:12% 2:67% 3:13% 4:8% | — | 74% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | unfav | 41 | 10/10/**11**/11/13 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 9..16 and h <= 3 and s >= 3 and d >= 3 and c >= 3) or hcp >= 17)`

### (2S) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 38.6% | 240 | 76 | 6/8/**9**/11/14 | — | — | 65% |
| X | 33.2% | 206 | 42 | 9/12/**14**/19/21 | theirs: 1:31% 2:29% 3:38% | — | 46% |
| 2NT | 10.1% | 63 | 13 | 14/15/**15**/15/17 | — | — | 86% |
| 3H | 6.9% | 43 | 7 | 9/14/**14**/14/15 | 5:26% 6:74% | **4.5** (4.5–4.5) | 5% |
| 3D | 5.5% | 34 | 8 | 8/11/**14**/16/16 | 5:3% 6:91% 7:6% | **6.4** (5.3–6.4) | 3% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 81 | 9/10/**14**/15/19 |
| X | fav | 44 | 16/16/**21**/21/21 |
| X | unfav | 44 | 10/11/**14**/20/20 |
| X | both | 37 | 9/12/**14**/14/15 |
| 2NT | none | 33 | 14/15/**15**/15/17 |
| 3H | none | 35 | 9/14/**14**/14/14 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 14/**14**/21 (65) | 9/**11**/16 (60) | 14/**15**/19 (79) | — |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 35 | 100% | 91% | 100% | 89% |
| 11–13 | 29 | 100% | 86% | 93% | 83% |
| 14–16 | 79 | 100% | 85% | 86% | 48% |
| 17+ | 63 | 100% | 59% | 81% | 51% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 9..17 and s <= 2 and h >= 4 and d >= 2 and c >= 2) or (hcp in 10..17 and s == 3 and h >= 4 and d >= 2 and c >= 2) or hcp >= 18)`
- `2NT` → `(has(s,a) or (has(s,k) and s >= 2) or (has(s,q) and s >= 3)) and hcp in 14..17` *(+ balanced)*

### (3C) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 37.6% | 105 | 27 | 2/7/**8**/9/13 | — | — | 76% |
| X | 29.4% | 82 | 14 | 10/14/**15**/17/19 | theirs: 0:4% 1:38% 2:26% 3:30% 4:2% | — | 44% |
| 3NT | 16.8% | 47 | 6 | 14/17/**17**/18/18 | — | — | 96% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 39 | 14/15/**15**/15/18 |
| X | unfav | 32 | 8/10/**14**/17/17 |
| 3NT | unfav | 30 | 17/17/**17**/17/17 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 8..17 and c <= 2 and s >= 3 and h >= 3 and d >= 3) or (hcp in 15..17 and c == 3 and s >= 3 and h >= 3 and d >= 3) or hcp >= 18)`

### (3D) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 61.8% | 170 | 33 | 6/8/**8**/11/12 | — | — | 65% |
| X | 16.4% | 45 | 18 | 8/11/**12**/13/20 | theirs: 0:2% 1:13% 2:67% 3:18% | — | 51% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | unfav | 25 | 8/12/**12**/12/20 |

### (3H) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 54.9% | 100 | 29 | 7/9/**9**/11/16 | — | — | 72% |
| X | 15.4% | 28 | 9 | 10/11/**12**/14/17 | theirs: 1:57% 2:25% 3:4% 4:14% | — | 25% |
| 4S | 14.3% | 26 | 1 | 17/17/**17**/17/17 | 6:100% | **6.2** (6.2–6.2) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 4S | none | 26 | 17/17/**17**/17/17 |

### (3S) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 58.8% | 147 | 27 | 6/9/**10**/11/14 | — | — | 46% |
| 3NT | 14.4% | 36 | 9 | 11/11/**15**/19/20 | — | — | 44% |
| X | 11.6% | 29 | 10 | 10/13/**13**/14/19 | theirs: 1:69% 2:24% 3:7% | — | 10% |
| 4H | 10.0% | 25 | 4 | 14/14/**16**/16/20 | 5:16% 6:84% | **6.5** (4.5–6.5) | 16% |

### (4H) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 86.4% | 242 | 27 | 4/6/**7**/9/10 | — | — | 4% |

### (4S) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 90.6% | 338 | 38 | 5/8/**8**/10/13 | — | — | 55% |

## Responding after interference: partner opens, RHO acts

Key contexts: 1x (X) ? — redouble/new suits/jump raises; 1x (overcall) ? — negative doubles, raises, free bids. 1C contexts show STANDARD responders (transfer-response pairs are tabulated separately below); 1D contexts use natural openers. After 1M (X) much of the field plays transfers / graded raises (2M−1 constructive, 2M weak or vice versa), so read the **partner's suit** column: when most hands hold 3+ support, the bid is a raise in disguise and its derived rule keys on support + strength band, not the named suit.

### 1C (X) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♣ |
|---|---|---|---|---|---|---|---|---|
| P | 32.1% | 331 | 111 | 0/3/**4**/5/7 | — | — | 65% | <2:3% 2:45% 3:30% 4:19% 5:3% |
| 1D | 16.7% | 172 | 96 | 4/6/**7**/9/11 | <2:2% 2:8% 3:10% 4:15% 5:44% 6:21% | **4.0** (2.2–5.1) | 29% | 0:2% 1:17% 2:33% 3:19% 4:24% 5:2% 6:3% |
| 1H | 15.9% | 164 | 90 | 4/6/**7**/8/9 | 1:9% 2:9% 3:12% 4:46% 5:16% 6:9% | **3.4** (1.6–4.4) | 26% | 1:24% 2:26% 3:22% 4:14% 5:7% 6:7% |
| 1S | 15.7% | 162 | 76 | 4/6/**7**/8/10 | <2:2% 2:4% 3:14% 4:43% 5:23% 6:9% 7:5% | **3.2** (1.7–3.9) | 36% | 1:12% 2:35% 3:22% 4:11% 5:20% |
| XX | 7.6% | 78 | 63 | 9/10/**11**/12/16 | — | — | 59% | 0:6% 1:5% 2:17% 3:38% 4:22% 5:12% |
| 2C | 3.1% | 32 | 32 | 4/6/**7**/7/9 | 1:9% 4:41% 5:41% 6:9% | **2.5** (1.5–4.0) | 56% | 1:9% 4:41% 5:41% 6:9% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1D | none | 49 | 4/5/**8**/9/11 |
| 1D | fav | 68 | 4/6/**7**/8/10 |
| 1D | both | 32 | 4/5/**6**/8/10 |
| 1H | none | 55 | 5/6/**6**/7/8 |
| 1H | fav | 47 | 4/6/**8**/8/9 |
| 1H | unfav | 26 | 4/6/**8**/8/13 |
| 1H | both | 36 | 4/5/**7**/8/9 |
| 1S | none | 66 | 5/6/**7**/8/9 |
| 1S | fav | 30 | 1/6/**8**/8/10 |
| 1S | both | 44 | 6/7/**7**/9/11 |
| XX | both | 33 | 9/10/**11**/11/13 |

Dealer filters (paste into the custom filter box; derived from the data):

- `1D` → `d >= 3 and hcp in 4..11`
- `1H` → `hcp in 4..9`
- `1S` → `s >= 3 and hcp in 4..10`
- `XX` → `hcp in 9..16`

### 1D (X) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♦ |
|---|---|---|---|---|---|---|---|---|
| 1H | 24.5% | 466 | 78 | 4/6/**8**/10/12 | <2:2% 2:4% 3:5% 4:31% 5:37% 6:11% 7:9% | **3.5** (2.3–4.8) | 23% | <1:2% 1:27% 2:22% 3:29% 4:17% 5+:2% |
| P | 22.7% | 432 | 91 | 0/1/**4**/5/7 | — | — | 43% | 0:3% 1:35% 2:32% 3:16% 4:9% 5:5% |
| 1S | 20.9% | 397 | 60 | 3/6/**7**/9/10 | 3:2% 4:42% 5:41% 6:9% 7:6% | **4.2** (2.0–4.8) | 36% | 0:16% 1:18% 2:17% 3:16% 4:20% 5:12% 6+:1% |
| XX | 12.7% | 241 | 57 | 6/9/**11**/12/15 | — | — | 47% | 0:12% 1:12% 2:18% 3:28% 4:10% 5:18% 6+:1% |
| 3D | 5.4% | 102 | 32 | 3/5/**6**/8/9 | <4:2% 4:29% 5:59% 6:6% 7:4% | **2.5** (2.2–3.4) | 24% | <4:2% 4:29% 5:59% 6:6% 7:4% |
| 2D | 3.8% | 72 | 35 | 3/6/**6**/9/15 | 2:7% 3:10% 4:54% 5:25% 6:1% 7:3% | **2.8** (2.2–3.4) | 56% | 2:7% 3:10% 4:54% 5:25% 6:1% 7:3% |
| 2C | 1.7% | 32 | 19 | 4/7/**7**/8/13 | 1:3% 2:6% 3:6% 4:13% 5:13% 6:47% 7:13% | **2.9** (2.9–4.1) | 19% | 0:3% 1:44% 2:25% 3:6% 4:6% 5:13% 7:3% |
| 2S | 1.5% | 28 | 8 | 3/3/**3**/8/15 | 3:25% 5:4% 7:71% | **3.4** (3.4–3.4) | 21% | 0:4% 1:64% 2:7% 4:4% 5:21% |
| 2NT | 1.3% | 25 | 16 | 3/6/**9**/15/15 | — | — | 48% | 4:16% 5:72% 6:12% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1H | none | 109 | 4/5/**10**/11/11 |
| 1H | fav | 89 | 5/7/**7**/9/10 |
| 1H | unfav | 116 | 6/8/**10**/10/12 |
| 1H | both | 152 | 6/6/**7**/8/14 |
| 1S | none | 77 | 5/8/**10**/10/12 |
| 1S | fav | 68 | 4/6/**7**/10/10 |
| 1S | unfav | 91 | 1/3/**7**/7/12 |
| 1S | both | 161 | 6/6/**7**/8/9 |
| XX | none | 109 | 7/10/**11**/12/15 |
| XX | fav | 41 | 7/8/**9**/10/10 |
| XX | unfav | 53 | 9/12/**12**/13/15 |
| XX | both | 38 | 6/7/**8**/14/14 |
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
| P | 25.6% | 386 | 58 | 0/1/**3**/6/8 | — | — | 31% | <1:1% 1:51% 2:31% 3:15% 4+:1% |
| XX | 11.4% | 171 | 26 | 10/10/**10**/12/17 | — | — | 61% | <2:2% 2:88% 3:5% 4:4% 5+:1% |
| 2NT | 11.2% | 169 | 25 | 8/9/**10**/13/14 | — | — | 83% | <4:1% 4:91% 5:8% |
| 2H | 11.0% | 166 | 36 | 4/5/**6**/7/9 | <3:1% 3:84% 4:14% 5+:1% | **3.2** (1.1–4.0) | 89% | <3:1% 3:84% 4:14% 5+:1% |
| 1S | 10.5% | 158 | 33 | 5/7/**7**/10/12 | <3:2% 3:3% 4:45% 5:39% 6:11% | **4.4** (3.3–4.6) | 31% | 0:8% 1:19% 2:64% 3:8% 4+:1% |
| 4H | 7.6% | 115 | 21 | 6/6/**6**/8/13 | 3:3% 4:15% 5:74% 6:8% | **5.1** (3.2–5.1) | 17% | 3:3% 4:15% 5:74% 6:8% |
| 2D | 6.9% | 104 | 28 | 5/7/**8**/9/14 | <2:2% 2:31% 3:19% 4:17% 5:29% 6+:2% | **3.5** (0.9–4.9) | 68% | <2:3% 2:3% 3:63% 4:30% |
| 3H | 3.9% | 59 | 16 | 4/5/**6**/8/9 | 3:3% 4:90% 5:7% | **4.0** (1.9–4.6) | 63% | 3:3% 4:90% 5:7% |
| 1NT | 2.9% | 44 | 16 | 7/7/**7**/9/10 | — | — | 43% | 1:34% 2:50% 3:5% 4:7% 5:5% |
| 2C | 2.3% | 34 | 11 | 6/6/**7**/7/9 | 0:9% 2:32% 3:35% 4:3% 5:3% 6:18% | **1.9** (1.9–3.0) | 29% | 0:3% 1:47% 2:9% 3:41% |
| 3C | 2.0% | 30 | 12 | 5/6/**8**/9/9 | 0:3% 1:13% 2:17% 3:33% 4:30% 5:3% | **1.1** (0.0–3.4) | 67% | 3:7% 4:93% |
| 3D | 1.8% | 27 | 11 | 6/9/**9**/10/14 | 1:22% 2:15% 3:44% 4:7% 5:11% | **1.5** (0.2–3.9) | 67% | 3:4% 4:78% 5:19% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| XX | fav | 43 | 10/10/**12**/12/14 |
| XX | unfav | 43 | 10/10/**12**/12/12 |
| XX | both | 61 | 10/10/**10**/10/10 |
| 2NT | none | 55 | 8/13/**14**/14/14 |
| 2NT | unfav | 90 | 9/9/**9**/9/11 |
| 2H | none | 37 | 6/7/**7**/7/9 |
| 2H | fav | 49 | 5/5/**5**/5/7 |
| 2H | unfav | 27 | 4/5/**5**/9/9 |
| 2H | both | 53 | 3/4/**6**/7/7 |
| 1S | none | 62 | 5/7/**7**/7/8 |
| 1S | unfav | 39 | 6/7/**10**/12/12 |
| 1S | both | 40 | 2/6/**8**/10/10 |
| 4H | fav | 83 | 6/6/**6**/6/8 |
| 2D | none | 35 | 7/7/**7**/9/14 |
| 2D | unfav | 29 | 6/9/**9**/9/11 |

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
| P | 24.1% | 243 | 57 | 2/3/**4**/6/8 | — | — | 42% | 0:13% 1:5% 2:44% 3:35% 4:2% |
| 2S | 15.3% | 154 | 38 | 2/4/**6**/8/8 | 3:91% 4:8% | **1.9** (1.3–4.4) | 56% | 3:91% 4:8% |
| 2H | 10.8% | 109 | 40 | 4/8/**8**/9/11 | 2:49% 3:22% 4:17% 5:10% 6+:2% | **2.8** (1.5–3.6) | 57% | <3:2% 3:76% 4:22% |
| 2NT | 9.4% | 95 | 21 | 8/10/**10**/11/13 | — | — | 74% | 3:3% 4:94% 5:1% 6:2% |
| 3S | 7.3% | 74 | 19 | 1/2/**5**/6/8 | 3:3% 4:77% 5:20% | **2.6** (1.1–3.2) | 70% | 3:3% 4:77% 5:20% |
| XX | 7.3% | 74 | 29 | 9/10/**11**/13/15 | — | — | 72% | 1:3% 2:46% 3:43% 4:7% 5+:1% |
| 1NT | 6.7% | 67 | 24 | 6/6/**7**/8/10 | — | — | 15% | <1:1% 1:57% 2:21% 3:19% 4+:1% |
| 4S | 6.7% | 67 | 21 | 5/6/**8**/10/13 | 3:12% 4:61% 5:24% 6:3% | **3.2** (2.6–4.6) | 33% | 3:12% 4:61% 5:24% 6:3% |
| 2C | 5.0% | 50 | 16 | 4/6/**6**/8/10 | 1:10% 2:4% 3:58% 5:4% 6:12% 8:12% | **4.3** (4.3–4.4) | 4% | 0:54% 1:18% 2:18% 3:4% 4:6% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2S | unfav | 60 | 4/4/**4**/7/8 |
| 2S | both | 47 | 3/6/**7**/8/8 |
| 2H | both | 58 | 6/8/**8**/8/10 |
| 2NT | unfav | 25 | 10/10/**10**/10/12 |
| 2NT | both | 47 | 7/8/**10**/11/13 |
| 3S | fav | 49 | 1/1/**2**/5/6 |
| 1NT | none | 37 | 6/6/**6**/6/9 |

Dealer filters (paste into the custom filter box; derived from the data):

- `2S` → `s >= 3 and hcp in 2..8`
- `2H` → `s >= 3 and hcp in 4..11`
- `2NT` → `s >= 4 and hcp in 8..13`
- `3S` → `s >= 4 and hcp in 1..8`
- `XX` → `hcp in 9..15`
- `1NT` → `hcp in 6..10`

### 1C (1S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♣ |
|---|---|---|---|---|---|---|---|---|
| X | 40.6% | 600 | 145 | 5/8/**9**/11/16 | theirs: <1:2% 1:19% 2:35% 3:28% 4:15% 5+:1% | — | 50% | <1:2% 1:15% 2:21% 3:44% 4:10% 5:9% |
| P | 26.9% | 398 | 131 | 1/4/**5**/6/8 | — | — | 58% | 1:9% 2:32% 3:26% 4:26% 5:6% 6+:2% |
| 1NT | 8.4% | 124 | 35 | 7/8/**10**/10/10 | — | — | 97% | <2:2% 2:3% 3:65% 4:23% 5:6% |
| 2H | 6.6% | 98 | 53 | 6/10/**10**/11/14 | 2:2% 3:13% 5:35% 6:30% 7:10% 8:10% | **4.2** (3.1–5.5) | 19% | 0:8% 1:18% 2:31% 3:33% 4:8% 5+:2% |
| 2D | 5.3% | 79 | 47 | 6/8/**10**/13/14 | 1:5% 2:28% 3:13% 4:19% 5:28% 6:5% 7:3% | **3.3** (1.7–5.4) | 27% | 0:3% 1:28% 2:19% 3:46% 4:5% |
| 2C | 3.9% | 58 | 47 | 5/7/**7**/10/14 | <2:2% 2:9% 3:19% 4:43% 5:22% 6:5% | **2.8** (2.3–4.4) | 40% | <2:2% 2:9% 3:19% 4:43% 5:22% 6:5% |
| 2S | 2.2% | 33 | 25 | 8/11/**13**/13/17 | 0:3% 1:21% 2:42% 3:21% 4:12% | **0.2** (0.2–3.0) | 64% | 1:6% 3:15% 4:52% 5:3% 6:24% |
| 3NT | 2.1% | 31 | 9 | 14/14/**14**/14/17 | — | — | 94% | 1:6% 2:3% 3:81% 4:10% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 123 | 6/8/**9**/11/14 |
| X | fav | 73 | 5/5/**6**/10/11 |
| X | unfav | 190 | 9/10/**10**/11/16 |
| X | both | 214 | 6/7/**8**/9/15 |
| 1NT | fav | 40 | 7/8/**8**/8/8 |
| 1NT | both | 66 | 10/10/**10**/10/10 |
| 2H | none | 37 | 6/8/**10**/10/15 |
| 2D | none | 35 | 6/8/**10**/13/15 |
| 2S | none | 25 | 8/10/**13**/13/17 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 9/**9**/11 (127) | 7/**8**/11 (209) | 7/**10**/11 (166) | 8/**9**/10 (98) |
| 1NT | — | — | 8/**8**/10 (70) | 10/**10**/10 (53) |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 5..16`
- `1NT` → `(has(s,a) or (has(s,k) and s >= 2) or (has(s,q) and s >= 3)) and hcp in 7..10` *(+ balanced)*
- `2H` → `h >= 3 and top(h,5) >= 1 and (hcp >= 11 or top(h,5) >= 2) and ((hcp in 6..14 and s <= 2) or (hcp in 7..14 and s in 3..4))`
- `2D` → `hcp in 6..14`
- `2C` → `hcp in 5..14`

### 1D (1S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♦ |
|---|---|---|---|---|---|---|---|---|
| X | 40.3% | 883 | 118 | 6/7/**9**/10/12 | theirs: 0:5% 1:17% 2:29% 3:30% 4:11% 5:8% | — | 44% | 1:9% 2:34% 3:20% 4:21% 5:15% 6+:1% |
| P | 29.7% | 650 | 97 | 1/3/**6**/7/13 | — | — | 60% | 1:14% 2:39% 3:38% 4:7% 5+:2% |
| 1NT | 6.0% | 132 | 40 | 6/8/**8**/10/10 | — | — | 76% | 1:15% 2:39% 3:26% 4:17% 5:4% |
| 2D | 5.8% | 128 | 54 | 5/6/**6**/8/10 | 1:5% 2:11% 3:16% 4:53% 5:13% | **2.1** (1.0–2.8) | 57% | 1:5% 2:11% 3:16% 4:53% 5:13% |
| 2H | 4.7% | 102 | 46 | 6/8/**10**/11/14 | 3:7% 5:32% 6:51% 7:8% | **4.6** (3.4–5.5) | 18% | 1:25% 2:41% 3:13% 4:16% 5:5% |
| 2C | 3.9% | 85 | 44 | 6/7/**10**/10/13 | 1:4% 2:8% 3:26% 4:13% 5:44% 6:6% | **5.7** (3.0–5.8) | 44% | 1:6% 2:20% 3:32% 4:28% 5:14% |
| 2S | 3.3% | 72 | 23 | 9/10/**11**/12/14 | 0:8% 1:42% 2:26% 3:8% 4:14% 5+:1% | **3.6** (0.0–5.6) | 31% | 4:56% 5:40% 6:4% |
| 3D | 2.6% | 57 | 17 | 5/6/**6**/6/8 | 4:40% 5:53% 6:7% | **1.9** (1.7–2.4) | 65% | 4:40% 5:53% 6:7% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 252 | 6/7/**9**/10/11 |
| X | fav | 162 | 6/6/**10**/10/13 |
| X | unfav | 262 | 6/7/**10**/10/12 |
| X | both | 207 | 6/7/**7**/9/15 |
| 1NT | fav | 31 | 6/6/**9**/9/11 |
| 1NT | unfav | 73 | 6/8/**8**/10/10 |
| 2D | none | 30 | 3/5/**7**/10/10 |
| 2D | fav | 50 | 5/6/**6**/7/9 |
| 2H | none | 37 | 6/7/**10**/10/12 |
| 2H | both | 29 | 6/9/**9**/13/13 |
| 2C | fav | 47 | 6/7/**7**/10/14 |
| 2S | fav | 29 | 10/10/**10**/14/14 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 7/**10**/10 (196) | 7/**9**/11 (258) | 6/**7**/10 (264) | 7/**9**/11 (165) |
| 1NT | — | — | 6/**8**/10 (46) | 8/**8**/9 (85) |
| 2D | — | 6/**6**/7 (45) | 6/**6**/8 (42) | 5/**7**/7 (29) |
| 2H | 6/**8**/14 (20) | 9/**10**/10 (39) | 7/**9**/11 (26) | 8/**11**/13 (17) |

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
| 2H | 26.2% | 384 | 34 | 4/6/**7**/8/9 | 3:79% 4:20% | **3.5** (1.3–4.6) | 54% | 3:79% 4:20% |
| P | 13.7% | 201 | 40 | 2/5/**6**/6/8 | — | — | 16% | 1:33% 2:53% 3:10% 4:3% |
| X | 11.5% | 168 | 35 | 6/7/**9**/10/14 | theirs: 1:16% 2:38% 3:21% 4:24% | — | 23% | 1:40% 2:49% 3:10% |
| 2NT | 10.4% | 152 | 31 | 8/11/**13**/14/17 | — | — | 40% | 3:15% 4:43% 5:42% |
| 2S | 9.7% | 142 | 35 | 9/10/**12**/14/17 | 1:15% 2:17% 3:36% 4:27% 5:3% | **3.9** (2.6–5.9) | 57% | 3:60% 4:16% 5:23% |
| 3H | 9.4% | 138 | 14 | 2/4/**6**/6/8 | 3:4% 4:95% | **3.4** (0.7–3.5) | 57% | 3:4% 4:95% |
| 2D | 6.0% | 88 | 32 | 6/8/**9**/10/17 | 1:2% 2:5% 3:15% 4:8% 5:10% 6:17% 7:43% | **5.1** (3.3–5.6) | 25% | 1:8% 2:56% 3:26% 4:7% 5:3% |
| 4H | 3.1% | 46 | 22 | 4/6/**8**/12/14 | 3:4% 4:61% 5:30% 6:4% | **3.4** (3.0–4.3) | 28% | 3:4% 4:61% 5:30% 6:4% |
| 1NT | 3.0% | 44 | 16 | 8/9/**9**/10/11 | — | — | 43% | 1:50% 2:41% 3:7% 4:2% |
| 2C | 2.3% | 33 | 15 | 6/6/**9**/13/17 | 1:9% 2:15% 3:9% 4:15% 5:27% 6:12% 7:12% | **4.2** (2.9–6.5) | 21% | 1:21% 2:61% 3:18% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2H | none | 50 | 6/6/**6**/6/6 |
| 2H | fav | 114 | 4/7/**7**/8/9 |
| 2H | unfav | 76 | 6/6/**6**/8/10 |
| 2H | both | 144 | 4/5/**8**/8/8 |
| X | none | 35 | 6/13/**13**/13/18 |
| X | unfav | 67 | 6/6/**7**/7/9 |
| X | both | 43 | 7/9/**10**/10/13 |
| 2NT | none | 30 | 9/12/**14**/14/17 |
| 2NT | fav | 73 | 8/11/**14**/14/17 |
| 2NT | unfav | 26 | 11/11/**12**/12/13 |
| 2S | none | 36 | 7/11/**14**/17/18 |
| 2S | fav | 56 | 9/9/**14**/14/17 |
| 2S | both | 32 | 6/10/**10**/12/13 |
| 3H | fav | 35 | 3/4/**4**/4/6 |
| 3H | unfav | 38 | 6/6/**6**/6/7 |
| 3H | both | 50 | 4/6/**6**/6/8 |
| 2D | unfav | 47 | 6/9/**9**/9/10 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 2H | 6/**6**/9 (89) | 4/**5**/5 (58) | 6/**8**/8 (146) | 7/**7**/7 (91) |
| X | 7/**7**/9 (27) | 7/**7**/10 (64) | 6/**6**/8 (36) | 9/**13**/13 (41) |
| 2NT | — | 9/**12**/12 (18) | 10/**11**/12 (41) | 13/**14**/14 (86) |
| 2S | 9/**9**/9 (23) | 10/**12**/12 (24) | 10/**13**/17 (51) | 11/**14**/14 (44) |

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
| X | 31.5% | 403 | 153 | 6/7/**9**/10/15 | theirs: 1:14% 2:50% 3:26% 4:6% 5:2% | — | 57% | 1:4% 2:29% 3:33% 4:30% 5:4% |
| 1S | 18.7% | 240 | 114 | 7/7/**9**/10/14 | 1:3% 2:20% 3:27% 4:8% 5:28% 6:15% | **3.3** (2.1–4.8) | 40% | 1:6% 2:17% 3:19% 4:51% 5:8% |
| P | 15.7% | 201 | 107 | 2/4/**5**/7/7 | — | — | 57% | 1:3% 2:11% 3:38% 4:37% 5:11% |
| 2C | 7.6% | 97 | 54 | 5/7/**7**/9/12 | 1:2% 2:4% 3:4% 4:37% 5:53% | **3.1** (2.5–3.9) | 10% | 1:2% 2:4% 3:4% 4:37% 5:53% |
| 1NT | 5.9% | 76 | 39 | 7/8/**9**/9/10 | — | — | 74% | 2:3% 3:14% 4:55% 5:28% |
| 2H | 5.9% | 76 | 43 | 8/9/**11**/13/15 | 1:30% 2:18% 3:43% 4:8% | **3.3** (0.9–4.7) | 36% | 1:7% 2:8% 3:17% 4:34% 5:33% 6+:1% |
| 2D | 5.6% | 72 | 36 | 6/10/**12**/12/15 | <5:3% 5:50% 6:39% 7:8% | **4.3** (3.7–4.8) | 14% | 1:7% 2:19% 3:8% 4:51% 5:13% 6+:1% |
| 3C | 5.0% | 64 | 15 | 5/5/**6**/8/8 | 4:6% 5:91% 6:3% | **3.2** (2.3–6.2) | 0% | 4:6% 5:91% 6:3% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 80 | 6/7/**8**/9/11 |
| X | fav | 118 | 6/8/**9**/11/17 |
| X | unfav | 94 | 6/8/**9**/10/13 |
| X | both | 111 | 6/8/**9**/12/15 |
| 1S | none | 85 | 7/7/**8**/11/14 |
| 1S | fav | 74 | 7/7/**10**/11/15 |
| 1S | unfav | 29 | 6/8/**9**/10/12 |
| 1S | both | 52 | 7/7/**8**/9/10 |
| 2C | fav | 29 | 5/7/**7**/7/10 |
| 2C | unfav | 29 | 6/6/**8**/8/11 |
| 1NT | none | 45 | 7/9/**9**/9/10 |
| 1NT | both | 26 | 7/8/**8**/8/10 |
| 2H | none | 31 | 9/10/**12**/14/14 |
| 2D | none | 41 | 10/10/**12**/12/14 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 6/**8**/10 (59) | 8/**9**/10 (202) | 7/**9**/10 (106) | 9/**10**/12 (36) |
| 1S | 8/**10**/11 (56) | 7/**7**/10 (92) | 8/**9**/11 (62) | 7/**7**/9 (30) |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 6..15`
- `1S` → `((hcp in 6..14 and h <= 2) or (hcp in 7..14 and h in 3..4))`
- `2C` → `c >= 3 and top(c,5) >= 1 and hcp in 5..12`
- `1NT` → `(has(h,a) or (has(h,k) and h >= 2) or (has(h,q) and h >= 3)) and hcp in 7..10`
- `2H` → `((hcp in 8..11 and s >= 4) or (hcp in 8..15 and s <= 3 and h <= 3) or (hcp in 12..15 and d >= 5) or (hcp in 12..15 and c >= 5))`
- `2D` → `d >= 5 and top(d,5) >= 1 and hcp in 6..15`

### 1D (1H) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♦ |
|---|---|---|---|---|---|---|---|---|
| X | 37.4% | 788 | 110 | 5/7/**8**/10/12 | theirs: 1:9% 2:35% 3:39% 4:14% 5:2% | — | 48% | <1:1% 1:21% 2:25% 3:30% 4:16% 5:7% |
| P | 19.9% | 420 | 73 | 2/3/**4**/5/9 | — | — | 57% | 1:15% 2:63% 3:9% 4:12% |
| 1S | 17.5% | 369 | 96 | 4/7/**9**/10/13 | <2:2% 2:5% 3:30% 4:10% 5:33% 6:15% 7:4% | **4.2** (2.4–5.2) | 40% | 0:5% 1:6% 2:34% 3:39% 4:9% 5:6% |
| 2D | 6.2% | 130 | 38 | 4/7/**7**/8/11 | 2:3% 3:5% 4:72% 5:17% 6:3% | **3.3** (2.3–3.6) | 38% | 2:3% 3:5% 4:72% 5:17% 6:3% |
| 2H | 4.5% | 94 | 34 | 7/8/**10**/12/13 | <1:1% 1:7% 2:12% 3:34% 4:24% 5:21% | **2.0** (0.0–3.8) | 36% | 0:12% 1:11% 2:12% 3:34% 4:15% 5:16% 6+:1% |
| 2C | 4.0% | 84 | 25 | 7/9/**11**/11/19 | <2:1% 2:6% 3:4% 4:2% 5:8% 6:32% 7:2% 8:44% | **7.1** (4.3–7.1) | 12% | <2:1% 2:73% 3:10% 4:7% 5:10% |
| 1NT | 3.8% | 80 | 27 | 7/7/**9**/9/11 | — | — | 89% | 2:35% 3:39% 4:5% 5:21% |
| 3D | 3.1% | 65 | 16 | 4/7/**7**/7/9 | 4:75% 5:18% 6:6% | **3.0** (2.1–3.6) | 28% | 4:75% 5:18% 6:6% |
| 2S | 1.3% | 28 | 17 | 7/9/**10**/11/13 | 1:36% 2:4% 3:32% 4:4% 6:25% | **2.1** (0.4–4.3) | 25% | 0:7% 1:7% 2:39% 3:4% 4:7% 5:32% 6:4% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 161 | 4/8/**9**/11/13 |
| X | fav | 326 | 7/7/**8**/9/12 |
| X | unfav | 148 | 6/8/**9**/10/12 |
| X | both | 153 | 5/6/**7**/9/11 |
| 1S | none | 88 | 4/7/**9**/9/13 |
| 1S | fav | 168 | 4/8/**10**/12/12 |
| 1S | unfav | 43 | 5/7/**9**/9/13 |
| 1S | both | 70 | 5/6/**6**/8/11 |
| 2D | fav | 37 | 7/7/**9**/9/12 |
| 2D | both | 64 | 4/4/**7**/7/9 |
| 2H | fav | 59 | 8/9/**10**/12/12 |
| 2C | both | 43 | 7/11/**11**/11/15 |
| 1NT | fav | 54 | 7/7/**9**/9/9 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 7/**8**/8 (70) | 8/**9**/9 (276) | 7/**7**/9 (311) | 8/**10**/12 (131) |
| 1S | 7/**7**/8 (34) | 6/**9**/9 (140) | 7/**9**/11 (95) | 8/**10**/12 (100) |
| 2D | — | 7/**7**/9 (31) | 9/**9**/9 (25) | 5/**7**/8 (71) |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 5..12`
- `1S` → `s >= 3 and hcp in 4..13`
- `2D` → `d >= 4 and top(d,5) >= 1 and hcp in 4..11`
- `2H` → `((hcp in 7..13 and h >= 4) or (hcp in 7..13 and s >= 4) or (hcp in 7..11 and s <= 3 and h <= 3))`
- `2C` → `c >= 3 and top(c,5) >= 1 and hcp in 7..19`
- `1NT` → `(has(h,a) or (has(h,k) and h >= 2) or (has(h,q) and h >= 3)) and hcp in 7..11` *(+ balanced)*

### 1S (2H) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♠ |
|---|---|---|---|---|---|---|---|---|
| P | 31.6% | 298 | 34 | 2/3/**5**/7/10 | — | — | 35% | 0:14% 1:8% 2:46% 3:30% 4+:2% |
| 2S | 22.7% | 214 | 27 | 4/5/**6**/7/9 | <3:1% 3:66% 4:33% | **1.6** (0.7–3.0) | 76% | <3:1% 3:66% 4:33% |
| X | 9.2% | 87 | 27 | 7/8/**10**/11/15 | theirs: <1:1% 1:2% 2:30% 3:28% 4:39% | — | 62% | 0:5% 1:16% 2:63% 3:14% 4:2% |
| 3S | 8.9% | 84 | 11 | 1/6/**6**/7/7 | 3:4% 4:94% 5:2% | **0.7** (0.7–1.9) | 94% | 3:4% 4:94% 5:2% |
| 3H | 8.8% | 83 | 19 | 8/10/**10**/11/13 | 0:14% 1:17% 2:46% 3:20% 4:2% | **0.0** (0.0–2.7) | 65% | 3:76% 4:18% 5:6% |
| 4S | 6.5% | 61 | 15 | 5/6/**9**/9/11 | 3:11% 4:25% 5:64% | **2.3** (2.3–2.3) | 23% | 3:11% 4:25% 5:64% |
| 2NT | 4.8% | 45 | 16 | 7/9/**9**/10/13 | — | — | 60% | 3:36% 4:38% 5:27% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2S | none | 137 | 5/5/**6**/7/9 |
| 2S | fav | 49 | 6/6/**7**/8/9 |
| X | none | 32 | 7/7/**9**/13/15 |
| X | unfav | 33 | 7/10/**10**/10/15 |
| 3S | none | 32 | 7/7/**7**/7/7 |
| 3S | fav | 46 | 1/6/**6**/6/6 |
| 3H | unfav | 36 | 9/10/**10**/10/11 |
| 4S | none | 36 | 9/9/**9**/9/10 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 2S | 5/**5**/5 (41) | 5/**6**/8 (64) | 7/**7**/8 (73) | 4/**6**/6 (36) |

Dealer filters (paste into the custom filter box; derived from the data):

- `2S` → `((hcp in 4..11 and h >= 4) or (hcp in 4..11 and s >= 4) or (hcp in 4..11 and s <= 3 and h <= 3))`
- `X` → `hcp in 7..15`
- `3S` → `s >= 4 and hcp in 1..7`
- `3H` → `((hcp in 8..11 and s >= 4) or (hcp in 8..11 and s <= 3 and h <= 3))`
- `4S` → `s >= 3 and hcp in 5..11`

### 1H (2D) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♥ |
|---|---|---|---|---|---|---|---|---|
| X | 30.0% | 136 | 19 | 5/7/**8**/10/14 | theirs: 0:7% 1:5% 2:11% 3:60% 4:15% 5:2% | — | 67% | 1:2% 2:92% 3:5% |
| P | 23.1% | 105 | 26 | 1/5/**7**/8/14 | — | — | 53% | 1:6% 2:72% 3:16% 4:5% |
| 2H | 13.0% | 59 | 18 | 6/6/**8**/10/10 | 2:5% 3:92% 4:3% | **2.4** (2.3–4.7) | 95% | 2:5% 3:92% 4:3% |
| 2S | 11.5% | 52 | 10 | 7/10/**10**/14/14 | <5:2% 5:52% 6:4% 7:42% | **5.4** (3.2–6.9) | 2% | 1:48% 2:52% |
| 3D | 6.8% | 31 | 14 | 8/9/**10**/10/14 | 1:16% 2:29% 3:32% 5:23% | **2.2** (0.7–3.5) | 52% | 1:6% 3:71% 4:16% 5:6% |

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
| P | 24.0% | 199 | 28 | 2/4/**5**/8/8 | — | — | 14% | 0:7% 1:44% 2:34% 3:11% 4:5% |
| 2S | 17.5% | 145 | 22 | 4/4/**6**/7/8 | 2:4% 3:79% 4:15% 5:2% | **2.6** (1.5–3.2) | 60% | 2:4% 3:79% 4:15% 5:2% |
| 4S | 15.1% | 125 | 7 | 5/5/**6**/6/7 | 4:13% 5:87% | **2.7** (2.2–2.7) | 2% | 4:13% 5:87% |
| X | 15.0% | 124 | 19 | 6/7/**8**/9/11 | theirs: 1:2% 2:44% 3:40% 4:4% 5:8% | — | 20% | 0:42% 1:19% 2:36% 3:3% |
| 2H | 10.1% | 84 | 12 | 5/8/**9**/11/13 | <5:1% 5:24% 6:54% 7:21% | **5.2** (3.5–8.1) | 2% | 0:20% 1:8% 2:69% 3:2% |
| 3S | 7.2% | 60 | 7 | 1/5/**5**/6/7 | 3:5% 4:63% 5:32% | **3.0** (2.7–5.1) | 55% | 3:5% 4:63% 5:32% |
| 2NT | 4.3% | 36 | 6 | 7/7/**13**/13/13 | — | — | 72% | 3:6% 4:86% 5:8% |
| 3D | 3.5% | 29 | 17 | 7/9/**11**/13/13 | 0:10% 1:24% 2:10% 3:34% 4:21% | **0.9** (0.2–2.8) | 59% | 2:10% 3:21% 4:55% 5:14% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2S | none | 44 | 6/6/**7**/7/9 |
| 2S | fav | 44 | 4/4/**4**/5/8 |
| 2S | unfav | 38 | 1/6/**6**/6/6 |
| 4S | none | 58 | 6/6/**6**/6/6 |
| 4S | both | 63 | 5/5/**5**/5/7 |
| X | fav | 79 | 5/8/**8**/8/11 |
| 2H | fav | 53 | 5/8/**9**/9/10 |
| 3S | fav | 30 | 4/5/**5**/5/5 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 2S | 4/**4**/4 (43) | 6/**7**/7 (54) | 6/**6**/6 (42) | — |
| 4S | 5/**5**/5 (67) | 6/**6**/6 (55) | — | — |
| X | — | 8/**8**/8 (55) | 7/**7**/11 (50) | 9/**10**/10 (15) |

Dealer filters (paste into the custom filter box; derived from the data):

- `2S` → `((hcp in 4..11 and h >= 4) or (hcp in 4..11 and s <= 3 and h <= 3))`
- `4S` → `s >= 4 and top(s,5) >= 1 and hcp in 5..7`
- `X` → `hcp in 6..11`
- `2H` → `h >= 5 and top(h,5) >= 1 and hcp in 5..13`
- `3S` → `s >= 4 and top(s,5) >= 1 and hcp in 1..7`

### 1H (2C) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♥ |
|---|---|---|---|---|---|---|---|---|
| X | 21.6% | 110 | 26 | 6/9/**9**/10/13 | theirs: 1:4% 2:51% 3:23% 4:21% | — | 25% | 0:7% 1:20% 2:65% 3:7% |
| P | 20.4% | 104 | 22 | 4/6/**7**/8/10 | — | — | 40% | 0:5% 1:48% 2:39% 3:6% 4+:2% |
| 3C | 10.8% | 55 | 14 | 7/9/**11**/12/13 | 0:9% 1:13% 2:44% 3:35% | **0.2** (0.2–1.6) | 31% | 3:38% 4:55% 5:5% 6+:2% |
| 2NT | 10.2% | 52 | 9 | 7/11/**11**/11/13 | — | — | 17% | 3:15% 4:77% 5:8% |
| 2S | 7.8% | 40 | 9 | 5/8/**12**/12/13 | 5:50% 6:30% 7:20% | **4.5** (4.3–5.5) | 48% | 0:5% 2:58% 3:30% 4:8% |
| 2H | 6.3% | 32 | 7 | 3/7/**7**/7/9 | 3:69% 4:31% | **1.6** (1.5–3.6) | 22% | 3:69% 4:31% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | both | 80 | 6/9/**9**/10/13 |
| 3C | none | 27 | 7/10/**11**/11/11 |
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
| P | 43.8% | 224 | 18 | 1/1/**3**/6/7 | — | — | 40% | 0:8% 1:23% 2:53% 3:15% |
| X | 17.4% | 89 | 20 | 6/7/**9**/11/12 | theirs: 1:4% 2:28% 3:53% 4:13% 5+:1% | — | 40% | 0:7% 1:38% 2:38% 3:16% 4+:1% |
| 2S | 12.3% | 63 | 11 | 4/6/**6**/6/10 | 3:90% 4:10% | **1.6** (1.6–1.6) | 27% | 3:90% 4:10% |
| 2H | 7.4% | 38 | 10 | 6/8/**9**/9/12 | 5:24% 6:71% 7:5% | **4.6** (3.3–4.9) | 0% | 0:11% 1:74% 2:13% 3:3% |
| 3C | 5.9% | 30 | 12 | 8/10/**11**/12/13 | 1:10% 2:50% 3:33% 4:7% | **1.5** (1.5–3.1) | 83% | 3:67% 4:27% 5:3% 6:3% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | unfav | 49 | 6/6/**11**/11/12 |
| 2S | both | 51 | 6/6/**6**/6/9 |
| 2H | unfav | 26 | 6/9/**9**/12/12 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 6..12`
- `2S` → `(hcp in 4..11 and h >= 4)`

### 1D (2C) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♦ |
|---|---|---|---|---|---|---|---|---|
| X | 37.7% | 319 | 50 | 6/8/**9**/10/12 | theirs: 1:6% 2:37% 3:55% 4+:1% | — | 54% | 1:12% 2:33% 3:25% 4:21% 5:9% |
| P | 31.4% | 266 | 41 | 3/5/**5**/6/8 | — | — | 62% | 1:24% 2:22% 3:45% 4:8% 5+:1% |
| 2H | 14.9% | 126 | 22 | 7/9/**10**/10/12 | <5:3% 5:87% 6:10% | **4.3** (3.4–6.3) | 60% | 1:11% 2:59% 3:18% 4:6% 6:5% |
| 2D | 6.5% | 55 | 28 | 5/6/**7**/10/12 | 1:5% 2:18% 3:29% 4:42% 5:2% 6:4% | **1.7** (0.2–2.8) | 56% | 1:5% 2:18% 3:29% 4:42% 5:2% 6:4% |
| 3C | 3.4% | 29 | 8 | 9/12/**12**/15/15 | 0:3% 1:3% 2:21% 3:72% | **3.2** (2.1–3.6) | 76% | 2:3% 4:38% 5:55% 6:3% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 47 | 5/7/**8**/9/10 |
| X | fav | 171 | 8/8/**10**/12/12 |
| X | unfav | 46 | 7/9/**9**/10/11 |
| X | both | 55 | 6/9/**9**/10/10 |
| 2H | fav | 34 | 7/8/**9**/10/10 |
| 2H | unfav | 59 | 9/10/**10**/11/12 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 8/**9**/9 (21) | 8/**9**/9 (118) | 9/**10**/12 (176) | — |
| 2H | — | 7/**10**/11 (33) | 10/**10**/10 (76) | — |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 6..12`
- `2H` → `h >= 5 and top(h,5) >= 1 and hcp in 7..12`
- `2D` → `((hcp in 5..11 and h >= 4) or (hcp in 5..11 and s >= 4))`

### 1NT (X) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 38.6% | 355 | 129 | 2/4/**6**/7/10 | — | — | 75% |
| XX | 17.1% | 157 | 102 | 1/5/**7**/9/12 | — | — | 45% |
| 2C | 12.3% | 113 | 69 | 1/3/**6**/7/9 | <1:2% 1:9% 2:18% 3:18% 4:29% 5:20% 6:4% | **2.2** (1.3–3.9) | 38% |
| 2H | 11.2% | 103 | 54 | 1/4/**6**/8/10 | 1:4% 2:4% 3:28% 4:7% 5:49% 6:7% | **2.7** (1.3–4.3) | 31% |
| 2D | 11.1% | 102 | 37 | 1/4/**6**/6/8 | <2:3% 2:5% 3:16% 4:34% 5:39% 6:3% | **2.5** (1.5–3.6) | 40% |
| 2S | 4.1% | 38 | 22 | 1/4/**6**/7/10 | 1:3% 2:3% 3:8% 5:53% 6:34% | **2.7** (1.5–3.1) | 18% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| XX | none | 58 | 2/6/**8**/9/10 |
| XX | fav | 67 | 1/4/**7**/9/13 |
| 2C | none | 33 | 1/4/**6**/8/9 |
| 2C | fav | 52 | 1/3/**6**/7/9 |
| 2H | none | 35 | 5/6/**6**/8/11 |
| 2H | fav | 42 | 1/3/**4**/8/10 |
| 2D | none | 51 | 2/5/**6**/6/8 |
| 2D | fav | 26 | 3/4/**6**/7/9 |

Dealer filters (paste into the custom filter box; derived from the data):

- `XX` → `hcp in 1..12`
- `2C` → `hcp in 1..9`
- `2H` → `h >= 3 and hcp in 1..10`
- `2D` → `d >= 3 and hcp in 1..8`

## Transfer responses over interference: 1C (…) ? by transfer-walsh pairs

Pairs whose 1C responses are transfers keep them on over a double or 1D overcall: X/1D = hearts, 1H = spades, 1S = no major. The derived rules key on the suit actually held.

### 1C (X) ? — transfer responders

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♣ |
|---|---|---|---|---|---|---|---|---|
| P | 30.7% | 134 | 111 | 0/3/**4**/5/8 | — | — | 66% | <2:1% 2:48% 3:32% 4:16% 5:2% |
| 1D | 17.8% | 78 | 96 | 4/5/**8**/9/12 | 1:5% 2:33% 3:28% 4:15% 5:13% 6:5% | **2.1** (0.9–4.0) | 14% | 1:21% 2:45% 3:10% 4:10% 5:3% 6:12% |
| 1H | 19.7% | 86 | 90 | 3/6/**7**/8/9 | 1:19% 2:19% 3:45% 4:15% 5:2% | **3.6** (0.4–4.7) | 42% | <1:1% 1:10% 2:35% 3:33% 4:8% 5:13% |
| 1S | 11.7% | 51 | 76 | 4/6/**7**/7/10 | 1:6% 2:25% 3:55% 4:6% 5:4% 6:4% | **2.3** (1.5–4.3) | 57% | 1:12% 2:8% 3:25% 4:37% 5:18% |
| XX | 8.9% | 39 | 63 | 4/8/**11**/11/16 | — | — | 46% | 0:15% 1:5% 2:10% 3:31% 4:15% 5:23% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1D | fav | 33 | 4/6/**8**/8/10 |
| 1H | none | 31 | 3/6/**7**/8/8 |

Dealer filters (paste into the custom filter box; derived from the data):

- `1D` → `(hcp in 4..11 and h >= 4)`
- `1H` → `(hcp in 3..11 and s >= 4)`
- `1S` → `(hcp in 4..11 and s <= 3 and h <= 3)`

### 1C (1D) ? — transfer responders

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♣ |
|---|---|---|---|---|---|---|---|---|
| X | 32.7% | 123 | 116 | 4/7/**9**/10/13 | theirs: 1:15% 2:50% 3:19% 4:13% 5:2% | — | 52% | 1:8% 2:20% 3:46% 4:14% 5:5% 6:8% |
| 1H | 23.9% | 90 | 94 | 6/8/**9**/11/12 | 1:4% 2:19% 3:44% 4:20% 5:9% 6:3% | **3.5** (0.7–4.7) | 40% | 1:3% 2:28% 3:47% 4:8% 5:10% 6:4% |
| P | 12.2% | 46 | 90 | 2/3/**5**/7/10 | — | — | 59% | 2:20% 3:37% 4:26% 5:13% 6:4% |
| 1S | 9.6% | 36 | 71 | 6/7/**8**/10/11 | 1:8% 2:6% 3:44% 4:31% 5:6% 6:6% | **2.4** (1.5–5.6) | 61% | 1:6% 2:19% 3:19% 4:6% 5:50% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 43 | 5/8/**8**/9/12 |
| X | fav | 35 | 4/7/**8**/10/13 |
| 1H | none | 33 | 6/8/**8**/9/14 |
| 1H | unfav | 26 | 6/8/**10**/11/12 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 4/**7**/8 (19) | 8/**9**/11 (62) | 9/**9**/12 (23) | 6/**7**/7 (19) |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 4..13`
- `1H` → `(hcp in 6..12 and s >= 4)`

### 1C (1H) ? — transfer responders

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♣ |
|---|---|---|---|---|---|---|---|---|
| X | 39.5% | 244 | 153 | 5/7/**9**/10/14 | theirs: 1:16% 2:48% 3:25% 4:8% 5:3% | — | 48% | 1:7% 2:32% 3:32% 4:23% 5:4% |
| 1S | 20.4% | 126 | 114 | 6/7/**9**/10/13 | <1:2% 1:6% 2:38% 3:43% 4:5% 5:4% 6:2% | **2.4** (0.6–3.9) | 49% | 2:8% 3:11% 4:54% 5:26% |
| P | 14.1% | 87 | 107 | 2/4/**6**/7/8 | — | — | 69% | <2:1% 2:17% 3:33% 4:34% 5:13% 6+:1% |
| 2C | 6.3% | 39 | 54 | 6/7/**10**/12/15 | 1:5% 2:18% 3:8% 4:33% 5:31% 6:3% 8:3% | **3.4** (2.5–6.2) | 13% | 1:5% 2:18% 3:8% 4:33% 5:31% 6:3% 8:3% |
| 1NT | 4.5% | 28 | 39 | 7/7/**8**/9/10 | — | — | 57% | 2:4% 3:18% 4:39% 5:39% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 76 | 5/7/**8**/9/12 |
| X | fav | 68 | 5/7/**9**/10/14 |
| X | unfav | 54 | 6/8/**9**/10/13 |
| X | both | 46 | 6/7/**9**/11/15 |
| 1S | none | 27 | 7/9/**10**/12/14 |
| 1S | fav | 42 | 7/7/**9**/13/13 |
| 1S | unfav | 26 | 6/7/**8**/10/12 |
| 1S | both | 31 | 6/7/**8**/10/12 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 7/**7**/10 (42) | 8/**9**/10 (116) | 7/**9**/10 (60) | 7/**8**/10 (26) |
| 1S | 8/**8**/12 (23) | 7/**9**/10 (35) | 7/**9**/13 (44) | 7/**7**/9 (24) |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 5..14`
- `1S` → `((hcp in 6..11 and h >= 4) or (hcp in 6..11 and s <= 3 and h <= 3))`

## Advancing partner’s direct action: (1x) act (…) ?

Includes advances of overcalls and of takeout doubles (partner doubled, RHO passed or raised). 1C/1D contexts face natural openers only.

### (1C) 1H (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♥ |
|---|---|---|---|---|---|---|---|---|
| 1S | 31.2% | 105 | 27 | 4/9/**11**/11/12 | <4:2% 4:19% 5:51% 6:18% 7:10% | **3.4** (3.2–4.0) | 19% | 1:46% 2:39% 3:14% |
| P | 14.2% | 48 | 34 | 1/4/**5**/6/8 | — | — | 52% | 1:25% 2:46% 3:27% 6:2% |
| 2H | 13.9% | 47 | 21 | 5/5/**7**/8/10 | 3:70% 4:30% | **3.5** (2.1–3.8) | 77% | 3:70% 4:30% |
| 2C | 9.8% | 33 | 20 | 9/11/**11**/14/16 | 0:3% 2:18% 3:39% 4:9% 5:30% | **4.1** (3.2–6.3) | 76% | 1:15% 2:6% 3:76% 5:3% |
| 2D | 10.1% | 34 | 12 | 9/9/**12**/12/14 | 2:3% 3:3% 4:6% 5:18% 6:50% 8:21% | **2.7** (2.2–5.7) | 12% | 0:3% 1:47% 2:35% 3:15% |

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
| P | 25.1% | 170 | 44 | 2/4/**6**/6/9 | — | — | 39% | 0:30% 1:17% 2:45% 3:8% |
| 1NT | 19.2% | 130 | 29 | 8/10/**10**/10/11 | — | — | 22% | 0:5% 1:61% 2:33% 3+:2% |
| 2S | 15.9% | 108 | 32 | 6/7/**7**/8/9 | 3:95% 4:5% | **4.1** (3.0–4.1) | 95% | 3:95% 4:5% |
| 2C | 14.5% | 98 | 24 | 9/10/**11**/12/16 | 0:4% 2:6% 3:39% 4:47% 5:4% | **2.5** (2.3–2.9) | 83% | <1:1% 1:8% 2:3% 3:86% 4+:2% |
| 2H | 9.9% | 67 | 21 | 8/9/**10**/11/12 | 1:3% 3:4% 4:3% 5:24% 6:48% 7:18% | **5.9** (4.9–5.9) | 13% | 0:3% 1:33% 2:55% 3:9% |
| 2D | 8.3% | 56 | 17 | 8/9/**11**/11/12 | 1:11% 2:2% 3:11% 4:4% 5:11% 6:52% 8:11% | **3.4** (2.4–7.5) | 5% | 0:36% 1:25% 2:34% 3:4% 4+:2% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1NT | unfav | 100 | 8/10/**10**/10/11 |
| 2S | fav | 71 | 7/7/**7**/7/10 |
| 2C | unfav | 51 | 11/11/**11**/12/16 |
| 2H | none | 42 | 9/9/**9**/11/11 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 1NT | — | — | — | 10/**10**/10 (117) |
| 2S | — | 7/**8**/8 (17) | 7/**7**/7 (71) | 8/**8**/9 (20) |

Dealer filters (paste into the custom filter box; derived from the data):

- `1NT` → `hcp in 8..11`
- `2S` → `s >= 3 and top(s,5) >= 1 and hcp in 6..9`
- `2C` → `hcp in 9..16`
- `2H` → `h >= 4 and top(h,5) >= 1 and (hcp >= 11 or top(h,5) >= 2) and hcp in 8..12`
- `2D` → `hcp in 8..12`

### (1D) 1H (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♥ |
|---|---|---|---|---|---|---|---|---|
| 1NT | 19.0% | 83 | 11 | 9/10/**11**/11/11 | — | — | 16% | 1:17% 2:83% |
| P | 17.6% | 77 | 19 | 2/5/**7**/7/9 | — | — | 17% | 1:29% 2:62% 3:8% 4+:1% |
| 1S | 16.2% | 71 | 27 | 6/9/**10**/10/11 | 4:34% 5:51% 6:10% 7:4% 8+:1% | **5.9** (4.5–7.6) | 35% | 1:14% 2:73% 3:13% |
| 2C | 14.0% | 61 | 11 | 7/9/**9**/9/14 | 2:5% 3:3% 4:2% 5:5% 6:85% | **3.1** (3.1–5.2) | 8% | 1:64% 2:26% 3:8% 4+:2% |
| 2H | 14.0% | 61 | 16 | 7/7/**7**/8/9 | 2:3% 3:82% 4:15% | **4.2** (1.6–4.2) | 92% | 2:3% 3:82% 4:15% |
| 2D | 11.2% | 49 | 18 | 8/9/**10**/11/14 | 1:2% 3:53% 4:27% 5:12% 6:6% | **2.1** (1.9–3.4) | 71% | 1:2% 2:20% 3:63% 4:14% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1NT | fav | 41 | 11/11/**11**/11/11 |
| 1NT | both | 26 | 7/9/**9**/10/11 |
| 1S | none | 28 | 7/9/**10**/10/11 |
| 1S | both | 28 | 7/10/**10**/10/10 |
| 2C | both | 54 | 7/9/**9**/9/12 |
| 2H | both | 40 | 7/7/**7**/7/9 |

Dealer filters (paste into the custom filter box; derived from the data):

- `1NT` → `hcp in 9..11`
- `1S` → `s >= 4 and top(s,5) >= 1 and ((hcp in 4..11 and d <= 2) or (hcp in 7..11 and d in 3..4))`
- `2C` → `c >= 5 and top(c,5) >= 2 and hcp in 7..14`
- `2H` → `h >= 3 and top(h,5) >= 1 and hcp in 7..9`

### (1D) 1S (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♠ |
|---|---|---|---|---|---|---|---|---|
| P | 26.8% | 175 | 32 | 5/6/**6**/7/8 | — | — | 33% | <1:2% 1:58% 2:34% 3:6% |
| 2D | 21.9% | 143 | 28 | 10/10/**11**/13/16 | 0:11% 1:8% 2:55% 3:12% 4:13% 5+:1% | **2.3** (0.9–2.6) | 59% | 0:3% 1:5% 2:9% 3:73% 4:8% 5+:1% |
| 2H | 15.6% | 102 | 21 | 10/11/**11**/14/14 | 3:7% 4:7% 5:29% 6:19% 7:38% | **5.6** (5.6–6.3) | 9% | 0:19% 1:59% 2:9% 3:13% |
| 1NT | 12.5% | 82 | 26 | 6/8/**10**/10/11 | — | — | 24% | 0:2% 1:65% 2:33% |
| 2S | 8.6% | 56 | 15 | 5/7/**9**/10/10 | 3:93% 4:7% | **2.3** (1.5–3.2) | 96% | 3:93% 4:7% |
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
- `2H` → `h >= 4 and top(h,5) >= 2 and ((hcp in 9..14 and d <= 2) or (hcp in 10..14 and d in 3..4))`
- `1NT` → `hcp in 6..11`
- `2S` → `s >= 3 and top(s,5) >= 1 and hcp in 5..10`

### (1H) 1S (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♠ |
|---|---|---|---|---|---|---|---|---|
| 2S | 43.8% | 95 | 12 | 4/7/**7**/9/9 | 3:88% 4:12% | **2.4** (1.7–2.4) | 93% | 3:88% 4:12% |
| P | 18.9% | 41 | 10 | 4/4/**6**/7/9 | — | — | 37% | 0:34% 1:17% 2:29% 3:20% |
| 1NT | 14.3% | 31 | 6 | 9/9/**9**/9/10 | — | — | 19% | 1:81% 2:19% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2S | fav | 55 | 7/7/**7**/7/8 |
| 2S | both | 31 | 8/8/**9**/9/9 |

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
| P | 45.7% | 123 | 17 | 4/7/**7**/8/9 | — | — | 80% | 1:10% 2:83% 3:7% |
| 2S | 17.1% | 46 | 7 | 9/10/**13**/13/15 | 2:17% 3:65% 4:9% 5:9% | **0.2** (0.2–3.7) | 83% | 2:65% 3:35% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2S | none | 29 | 10/13/**13**/13/13 |

### (1C) X (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 1H | 18.4% | 94 | 28 | 4/6/**8**/8/8 | 4:64% 5:33% 6:3% | **4.9** (3.3–5.2) | 69% |
| 1S | 13.7% | 70 | 26 | 4/5/**6**/8/10 | 4:44% 5:56% | **3.6** (1.5–4.3) | 61% |
| 1NT | 12.5% | 64 | 14 | 8/9/**10**/10/10 | — | — | 81% |
| 2C | 11.6% | 59 | 14 | 8/10/**11**/14/14 | 1:3% 2:22% 3:68% 4:5% 5+:2% | **1.3** (0.2–3.0) | 68% |
| 1D | 9.6% | 49 | 18 | 2/3/**6**/7/9 | 3:6% 4:76% 5:16% 6:2% | **2.7** (2.5–3.6) | 88% |
| 2H | 9.0% | 46 | 12 | 7/8/**8**/8/9 | 4:22% 5:76% 6:2% | **6.0** (4.9–6.0) | 43% |
| 2S | 7.1% | 36 | 14 | 4/8/**10**/10/11 | 4:47% 5:53% | **3.6** (0.6–3.6) | 75% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1H | none | 44 | 4/7/**8**/8/8 |
| 1H | unfav | 28 | 5/5/**6**/8/8 |
| 1S | none | 33 | 5/5/**7**/8/8 |
| 1NT | both | 36 | 8/8/**10**/10/10 |
| 2C | none | 38 | 8/14/**14**/14/14 |
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
| 1H | 30.2% | 130 | 27 | 5/6/**8**/9/10 | 3:12% 4:73% 5:15% | **3.5** (2.7–4.1) | 78% |
| 1NT | 15.1% | 65 | 17 | 7/7/**10**/10/10 | — | — | 92% |
| 2H | 14.2% | 61 | 13 | 8/9/**10**/10/10 | 4:95% 5:5% | **2.7** (2.7–3.5) | 85% |
| 1S | 13.3% | 57 | 21 | 0/4/**5**/8/10 | 3:7% 4:42% 5:51% | **1.6** (1.3–4.1) | 70% |
| 2D | 8.1% | 35 | 16 | 9/9/**9**/10/11 | 0:3% 1:51% 2:17% 3:11% 4:17% | **5.6** (2.9–5.6) | 34% |

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
| 1S | 36.1% | 141 | 23 | 4/4/**5**/7/9 | 3:4% 4:84% 5:12% | **1.7** (1.7–3.0) | 74% |
| 1NT | 26.6% | 104 | 12 | 6/8/**9**/10/10 | — | — | 56% |
| 2C | 12.0% | 47 | 9 | 2/5/**5**/8/11 | 3:11% 4:60% 5:30% | **3.2** (1.0–3.8) | 47% |
| 2S | 6.6% | 26 | 10 | 7/7/**8**/9/10 | 4:58% 5:42% | **1.9** (1.9–2.2) | 73% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1S | none | 52 | 2/5/**5**/6/9 |
| 1S | unfav | 46 | 4/4/**4**/4/8 |
| 1NT | fav | 43 | 8/8/**8**/8/9 |
| 1NT | unfav | 52 | 7/10/**10**/10/10 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 1S | — | 6/**6**/7 (36) | 4/**5**/5 (89) | 7/**7**/7 (16) |
| 1NT | — | — | — | 8/**9**/10 (100) |

Dealer filters (paste into the custom filter box; derived from the data):

- `1S` → `s >= 4 and hcp in 4..9`
- `1NT` → `(has(h,a) or (has(h,k) and h >= 2) or (has(h,q) and h >= 3)) and hcp in 6..10`

### (1S) X (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 2H | 26.0% | 64 | 11 | 7/9/**9**/9/10 | 4:84% 5:16% | **4.7** (3.0–4.7) | 88% |
| 1NT | 22.8% | 56 | 13 | 7/7/**8**/8/10 | — | — | 98% |
| 3H | 14.2% | 35 | 10 | 6/9/**10**/10/11 | 4:74% 5:20% 6:3% 7:3% | **3.5** (3.0–4.7) | 34% |
| 2D | 11.0% | 27 | 9 | 4/4/**6**/7/7 | 4:19% 5:81% | **4.4** (3.7–4.6) | 56% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2H | both | 54 | 7/9/**9**/9/9 |
| 1NT | unfav | 29 | 7/8/**8**/8/8 |

Dealer filters (paste into the custom filter box; derived from the data):

- `2H` → `h >= 4 and top(h,5) >= 1 and hcp in 7..10`
- `1NT` → `(has(s,a) or (has(s,k) and s >= 2) or (has(s,q) and s >= 3)) and hcp in 7..10` *(+ balanced)*

### (1H) X (2H) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 28.5% | 47 | 13 | 0/0/**1**/5/7 | — | — | 72% |

### (1S) X (2S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 23.9% | 38 | 13 | 2/2/**4**/5/10 | — | — | 66% |
| 3H | 23.9% | 38 | 9 | 5/9/**10**/10/10 | 4:29% 5:66% 6:3% 7:3% | **4.9** (3.0–5.3) | 47% |

## Uncontested responses: 1x (P) ?

Partner opened (natural style), RHO passed. Responder ranges. The 1C row shows STANDARD responders; transfer-walsh pairs (1D = ♥, 1H = ♠, 1S = no-major NT-ish) are tabulated separately below.

### 1C (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 1D | 24.6% | 1530 | 697 | 3/5/**9**/13/17 | <2:3% 2:6% 3:12% 4:28% 5:29% 6:16% 7:6% | **4.1** (2.3–5.4) | 56% |
| 1H | 32.8% | 2039 | 670 | 5/7/**10**/12/15 | 4:61% 5:26% 6:10% 7:3% | **3.8** (2.7–4.9) | 52% |
| 1S | 28.2% | 1752 | 553 | 5/8/**10**/12/16 | 4:48% 5:38% 6:10% 7+:3% | **3.9** (2.9–5.1) | 49% |
| 1NT | 4.8% | 296 | 234 | 7/8/**10**/10/15 | — | — | 95% |
| 2C | 2.8% | 171 | 147 | 8/12/**15**/15/20 | <2:2% 2:5% 3:5% 4:23% 5:35% 6:27% 7:2% | **5.7** (4.0–7.8) | 60% |
| 2D | 1.4% | 84 | 132 | 5/9/**13**/16/19 | 1:6% 2:5% 3:11% 5:29% 6:40% 7:10% | **5.1** (3.9–5.7) | 21% |
| P | 1.9% | 116 | 58 | 2/2/**4**/4/5 | — | — | 74% |
| 2H | 1.0% | 63 | 81 | 6/8/**12**/15/15 | 2:22% 3:30% 4:16% 5:5% 6:16% 7:11% | **4.6** (2.4–5.5) | 46% |
| 2NT | 0.5% | 34 | 58 | 10/11/**12**/14/15 | — | — | 91% |
| 2S | 0.7% | 43 | 49 | 4/10/**11**/12/17 | 2:12% 3:33% 5:12% 6:23% 7:9% 8:12% | **4.4** (2.4–6.6) | 37% |
| 3NT | 0.5% | 31 | 22 | 12/12/**14**/15/15 | — | — | 100% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1D | none | 376 | 3/5/**7**/13/17 |
| 1D | fav | 439 | 2/5/**11**/13/17 |
| 1D | unfav | 272 | 4/6/**12**/15/19 |
| 1D | both | 443 | 3/6/**9**/12/16 |
| 1H | none | 395 | 6/8/**10**/14/15 |
| 1H | fav | 731 | 6/7/**9**/11/15 |
| 1H | unfav | 292 | 6/8/**10**/12/14 |
| 1H | both | 621 | 4/7/**10**/13/16 |
| 1S | none | 405 | 6/8/**10**/13/14 |
| 1S | fav | 633 | 4/8/**10**/12/18 |
| 1S | unfav | 308 | 4/8/**10**/11/16 |
| 1S | both | 406 | 6/9/**10**/12/16 |
| 1NT | none | 133 | 7/9/**10**/10/11 |
| 1NT | fav | 30 | 7/9/**9**/11/18 |
| 1NT | unfav | 46 | 8/8/**8**/10/19 |
| 1NT | both | 87 | 8/8/**10**/10/15 |
| 2C | none | 27 | 7/9/**13**/14/21 |
| 2C | fav | 42 | 7/13/**14**/15/18 |
| 2C | unfav | 76 | 12/15/**15**/15/20 |
| 2C | both | 26 | 8/10/**12**/15/15 |

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
| 1S | 37.8% | 3676 | 368 | 5/8/**10**/11/15 | 4:45% 5:42% 6:10% 7+:2% | **4.0** (2.4–5.2) | 53% |
| 1H | 36.3% | 3527 | 469 | 5/7/**9**/11/15 | <4:2% 4:57% 5:31% 6:7% 7:3% | **3.6** (2.2–4.6) | 45% |
| 1NT | 6.4% | 619 | 141 | 5/8/**8**/9/13 | — | — | 69% |
| 2C | 5.9% | 576 | 115 | 10/11/**13**/15/19 | <3:2% 3:7% 4:15% 5:26% 6:38% 7:10% | **5.5** (3.8–6.3) | 39% |
| P | 4.6% | 445 | 75 | 0/3/**4**/4/5 | — | — | 75% |
| 2D | 3.6% | 354 | 97 | 6/11/**14**/15/17 | <3:2% 3:3% 4:61% 5:29% 6:4% | **4.8** (3.7–6.9) | 81% |
| 2H | 1.1% | 103 | 42 | 4/6/**6**/9/12 | 2:5% 3:3% 4:17% 5:24% 6:41% 7:8% 8+:2% | **3.8** (2.7–4.4) | 8% |
| 2NT | 0.9% | 84 | 45 | 6/11/**12**/13/15 | — | — | 92% |
| 2S | 0.8% | 77 | 41 | 5/8/**9**/10/13 | 1:5% 2:9% 3:22% 4:3% 5:10% 6:32% 7:18% | **3.4** (1.9–4.3) | 13% |
| 3C | 0.7% | 70 | 26 | 8/9/**9**/10/15 | 2:6% 3:17% 4:9% 5:9% 6:7% 7:53% | **5.8** (3.7–8.4) | 24% |
| 3NT | 0.6% | 60 | 19 | 10/12/**14**/15/15 | — | — | 95% |
| 3D | 0.6% | 55 | 24 | 3/5/**8**/9/10 | 4:49% 5:27% 6:24% | **2.8** (2.2–4.1) | 44% |
| 4H | 0.3% | 32 | 9 | 8/8/**8**/10/11 | 2:6% 7:88% 8:6% | **4.4** (4.4–5.1) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1S | none | 1134 | 5/7/**10**/12/14 |
| 1S | fav | 975 | 5/8/**9**/11/15 |
| 1S | unfav | 743 | 5/7/**9**/11/16 |
| 1S | both | 824 | 6/8/**10**/12/14 |
| 1H | none | 494 | 5/7/**8**/10/15 |
| 1H | fav | 1174 | 5/7/**9**/12/17 |
| 1H | unfav | 706 | 5/7/**8**/11/13 |
| 1H | both | 1153 | 4/7/**10**/12/15 |
| 1NT | none | 110 | 5/6/**8**/10/10 |
| 1NT | fav | 182 | 5/7/**8**/9/14 |
| 1NT | unfav | 114 | 6/8/**9**/9/13 |
| 1NT | both | 213 | 6/8/**8**/9/12 |
| 2C | none | 150 | 9/13/**15**/19/19 |
| 2C | fav | 193 | 10/10/**14**/14/18 |
| 2C | unfav | 113 | 8/11/**12**/15/17 |
| 2C | both | 120 | 9/11/**12**/12/16 |
| 2D | none | 45 | 7/12/**15**/15/15 |
| 2D | fav | 176 | 7/11/**14**/15/18 |
| 2D | unfav | 118 | 8/11/**15**/17/17 |
| 2H | fav | 32 | 6/6/**6**/8/15 |
| 2H | unfav | 26 | 6/7/**8**/9/11 |
| 2H | both | 31 | 4/6/**6**/9/12 |

Dealer filters (paste into the custom filter box; derived from the data):

- `1S` → `s >= 4 and top(s,5) >= 1 and hcp in 5..15`
- `1H` → `h >= 4 and top(h,5) >= 1 and hcp in 5..15`
- `1NT` → `hcp in 5..13`
- `2C` → `c >= 4 and top(c,5) >= 1 and hcp in 10..19`
- `2D` → `d >= 4 and top(d,5) >= 1 and hcp in 6..17`
- `2H` → `h >= 4 and top(h,5) >= 1 and hcp in 4..12`

### 1H (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 1S | 34.5% | 2162 | 261 | 5/7/**10**/12/17 | <4:1% 4:41% 5:45% 6:10% 7:3% | **3.8** (2.7–5.2) | 39% |
| 2C | 15.1% | 949 | 166 | 9/12/**13**/15/18 | 1:5% 2:14% 3:22% 4:24% 5:23% 6:10% 7+:3% | **4.2** (2.6–5.7) | 66% |
| 1NT | 12.3% | 773 | 191 | 4/7/**9**/10/12 | — | — | 44% |
| 2H | 11.2% | 704 | 79 | 5/7/**8**/9/10 | 3:91% 4:9% | **1.6** (0.4–4.1) | 94% |
| 2NT | 7.0% | 441 | 91 | 8/10/**12**/14/15 | — | — | 61% |
| 2D | 6.4% | 400 | 88 | 9/11/**13**/13/17 | <3:2% 3:5% 4:7% 5:50% 6:37% | **4.9** (4.0–6.5) | 40% |
| P | 5.0% | 316 | 50 | 0/2/**2**/4/5 | — | — | 62% |
| 3C | 1.9% | 117 | 48 | 6/8/**10**/11/12 | 1:18% 2:19% 3:23% 4:30% 5:5% 6:3% 7:3% | **3.4** (1.7–4.2) | 57% |
| 2S | 1.8% | 111 | 55 | 3/6/**9**/11/13 | 2:5% 3:23% 4:14% 5:14% 6:35% 7:9% | **4.3** (3.6–5.1) | 26% |
| 3D | 1.8% | 110 | 49 | 7/9/**10**/11/12 | 1:11% 2:37% 3:18% 4:16% 5:5% 6:13% | **3.2** (2.0–5.4) | 53% |
| 3H | 1.3% | 80 | 29 | 2/2/**6**/8/10 | 3:8% 4:91% 5+:1% | **1.5** (1.5–3.7) | 33% |
| 4H | 0.5% | 32 | 29 | 6/7/**8**/9/13 | 3:9% 4:47% 5:13% 6:31% | **4.3** (0.7–4.6) | 16% |
| 3NT | 0.4% | 27 | 21 | 10/11/**13**/13/14 | — | — | 85% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1S | none | 364 | 6/10/**11**/13/16 |
| 1S | fav | 728 | 6/7/**9**/10/13 |
| 1S | unfav | 412 | 5/8/**12**/16/18 |
| 1S | both | 658 | 3/6/**9**/11/13 |
| 2C | none | 152 | 8/12/**14**/16/18 |
| 2C | fav | 239 | 7/10/**13**/13/18 |
| 2C | unfav | 320 | 9/11/**13**/14/16 |
| 2C | both | 238 | 9/13/**15**/17/17 |
| 1NT | none | 145 | 2/6/**8**/10/14 |
| 1NT | fav | 283 | 4/5/**9**/10/11 |
| 1NT | unfav | 202 | 6/8/**9**/11/13 |
| 1NT | both | 143 | 6/8/**9**/10/12 |
| 2H | none | 302 | 6/7/**9**/9/9 |
| 2H | fav | 104 | 5/6/**7**/9/10 |
| 2H | unfav | 162 | 5/8/**8**/8/9 |
| 2H | both | 136 | 7/7/**7**/9/10 |
| 2NT | none | 108 | 10/13/**13**/14/17 |
| 2NT | fav | 157 | 7/10/**12**/13/14 |
| 2NT | unfav | 109 | 9/11/**13**/15/15 |
| 2NT | both | 67 | 8/10/**10**/10/14 |
| 2D | none | 30 | 6/10/**13**/17/18 |
| 2D | fav | 38 | 7/9/**10**/11/15 |
| 2D | unfav | 111 | 9/13/**13**/13/14 |
| 2D | both | 221 | 10/11/**13**/14/17 |

Dealer filters (paste into the custom filter box; derived from the data):

- `1S` → `s >= 4 and hcp in 5..17`
- `2C` → `hcp in 9..18`
- `1NT` → `hcp in 4..12`
- `2H` → `((hcp in 5..11 and s >= 4) or (hcp in 5..11 and s <= 3 and h <= 3))`
- `2NT` → `hcp in 8..15`
- `2D` → `d >= 4 and top(d,5) >= 1 and hcp in 9..17`

### 1S (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 1NT | 30.6% | 2451 | 325 | 4/7/**8**/9/11 | — | — | 29% |
| 2C | 21.2% | 1697 | 240 | 9/11/**13**/15/17 | <2:2% 2:14% 3:18% 4:40% 5:10% 6:11% 7:5% | **4.5** (2.9–6.0) | 66% |
| 2S | 9.3% | 747 | 111 | 4/6/**8**/9/10 | 3:90% 4:10% | **1.6** (0.8–4.3) | 82% |
| 2D | 8.6% | 686 | 121 | 9/13/**14**/15/18 | 2:3% 3:4% 4:8% 5:49% 6:34% 7+:2% | **4.8** (3.9–6.5) | 23% |
| 2H | 6.9% | 556 | 117 | 10/11/**13**/15/17 | <5:4% 5:54% 6:37% 7:2% 8:3% | **5.7** (4.1–6.0) | 20% |
| 2NT | 7.4% | 592 | 123 | 8/10/**12**/14/15 | — | — | 50% |
| P | 4.8% | 383 | 74 | 1/3/**4**/4/5 | — | — | 39% |
| 4S | 2.0% | 161 | 47 | 0/5/**6**/8/9 | <4:1% 4:22% 5:48% 6:29% | **3.0** (1.7–4.5) | 2% |
| 3C | 2.4% | 196 | 86 | 6/8/**10**/10/13 | 1:19% 2:20% 3:20% 4:17% 5:2% 6:19% 7+:3% | **3.0** (0.9–5.2) | 38% |
| 3D | 2.1% | 171 | 68 | 6/8/**9**/10/12 | 1:11% 2:20% 3:23% 4:15% 5:19% 6:2% 7:10% | **3.6** (1.5–4.7) | 40% |
| 3S | 1.2% | 99 | 45 | 0/5/**6**/7/10 | 3:5% 4:74% 5:21% | **2.5** (1.7–3.2) | 33% |
| 3NT | 1.1% | 85 | 30 | 6/9/**10**/12/14 | — | — | 32% |
| 4C | 1.0% | 78 | 15 | 9/10/**12**/13/14 | 1:96% 2:3% 3+:1% | **0.5** (0.0–0.9) | 0% |
| 3H | 0.9% | 74 | 40 | 6/9/**10**/11/13 | 1:7% 2:15% 3:15% 4:30% 5:5% 6:28% | **4.5** (2.7–5.4) | 36% |
| 4D | 0.4% | 30 | 8 | 8/9/**10**/10/12 | 0:10% 1:87% 4:3% | **0.4** (0.0–0.4) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1NT | none | 392 | 4/7/**8**/9/12 |
| 1NT | fav | 701 | 4/6/**7**/8/11 |
| 1NT | unfav | 590 | 4/7/**9**/10/11 |
| 1NT | both | 768 | 6/6/**8**/9/11 |
| 2C | none | 281 | 9/12/**13**/14/15 |
| 2C | fav | 463 | 9/11/**13**/14/20 |
| 2C | unfav | 407 | 10/13/**13**/16/17 |
| 2C | both | 546 | 9/11/**12**/15/17 |
| 2S | none | 133 | 4/8/**9**/10/10 |
| 2S | fav | 225 | 3/6/**7**/9/9 |
| 2S | unfav | 125 | 4/7/**8**/9/9 |
| 2S | both | 264 | 6/6/**8**/9/10 |
| 2D | none | 104 | 10/13/**15**/15/15 |
| 2D | fav | 301 | 8/13/**14**/14/17 |
| 2D | unfav | 95 | 10/13/**13**/14/17 |
| 2D | both | 186 | 9/11/**14**/17/18 |
| 2H | none | 116 | 10/12/**13**/17/17 |
| 2H | fav | 159 | 9/11/**13**/14/14 |
| 2H | unfav | 231 | 11/12/**12**/16/18 |
| 2H | both | 50 | 8/10/**14**/14/17 |
| 2NT | none | 120 | 9/10/**12**/14/14 |
| 2NT | fav | 264 | 8/9/**12**/14/15 |
| 2NT | unfav | 39 | 7/10/**12**/13/16 |
| 2NT | both | 169 | 9/10/**11**/12/15 |

Dealer filters (paste into the custom filter box; derived from the data):

- `1NT` → `hcp in 4..11`
- `2C` → `top(c,5) >= 1 and hcp in 9..17`
- `2S` → `((hcp in 4..11 and h >= 4) or (hcp in 4..11 and s <= 3 and h <= 3))`
- `2D` → `d >= 4 and top(d,5) >= 1 and hcp in 9..18`
- `2H` → `h >= 5 and top(h,5) >= 1 and hcp in 10..17`
- `2NT` → `hcp in 8..15`

### 1NT (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 2C | 28.4% | 2891 | 535 | 6/8/**9**/11/14 | <1:1% 1:13% 2:28% 3:29% 4:21% 5:5% 6:3% | **2.7** (0.9–4.5) | 48% |
| P | 20.7% | 2108 | 360 | 3/4/**6**/7/8 | — | — | 74% |
| 2H | 13.1% | 1332 | 233 | 4/6/**9**/13/16 | 0:4% 1:11% 2:36% 3:43% 4:2% 5:3% | **1.9** (0.5–3.9) | 42% |
| 2D | 12.4% | 1258 | 231 | 3/5/**7**/10/16 | 1:22% 2:25% 3:31% 4:15% 5:6% | **1.9** (0.9–4.0) | 27% |
| 3NT | 9.4% | 956 | 187 | 8/10/**10**/12/14 | — | — | 76% |
| 2NT | 3.6% | 365 | 179 | 5/9/**11**/12/16 | — | — | 53% |
| 3C | 3.7% | 376 | 156 | 7/10/**11**/12/16 | <1:2% 1:11% 2:29% 3:20% 4:21% 5:10% 6:7% | **3.8** (1.8–5.4) | 62% |
| 2S | 2.5% | 252 | 127 | 6/9/**10**/12/21 | 1:26% 2:10% 3:55% 4:5% 5:2% | **3.0** (0.4–5.4) | 36% |
| 4D | 1.8% | 187 | 52 | 7/8/**9**/10/15 | <1:2% 1:17% 2:32% 3:44% 4:4% 5:2% | **1.5** (0.5–4.2) | 1% |
| 4H | 1.1% | 116 | 36 | 7/9/**9**/9/17 | <1:2% 1:5% 2:32% 3:57% 4:2% 6:3% | **2.4** (1.3–3.5) | 1% |
| 4C | 1.0% | 98 | 26 | 7/8/**9**/10/19 | 1:32% 2:22% 3:40% 4:1% 5:5% | **3.3** (0.0–4.7) | 1% |
| 3S | 0.7% | 72 | 33 | 9/10/**10**/11/16 | 1:81% 2:1% 3:10% 4:6% 5+:3% | **0.0** (0.0–3.9) | 7% |
| 3D | 0.7% | 67 | 48 | 6/8/**11**/12/16 | 1:33% 2:16% 3:10% 4:10% 5:16% 6:13% | **3.1** (0.0–4.2) | 22% |
| 3H | 0.4% | 44 | 22 | 8/11/**12**/21/21 | 1:77% 2:14% 3:9% | **5.6** (3.9–10.0) | 7% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2C | none | 708 | 6/8/**9**/10/14 |
| 2C | fav | 827 | 3/8/**11**/14/16 |
| 2C | unfav | 650 | 6/8/**10**/11/14 |
| 2C | both | 706 | 6/7/**9**/10/13 |
| 2H | none | 395 | 3/7/**9**/13/14 |
| 2H | fav | 489 | 4/6/**10**/13/15 |
| 2H | unfav | 198 | 5/9/**12**/17/17 |
| 2H | both | 250 | 1/5/**6**/10/12 |
| 2D | none | 406 | 3/5/**7**/9/17 |
| 2D | fav | 304 | 3/7/**8**/12/16 |
| 2D | unfav | 212 | 2/5/**6**/10/12 |
| 2D | both | 336 | 4/6/**7**/9/14 |
| 3NT | none | 389 | 9/10/**10**/12/15 |
| 3NT | fav | 292 | 8/10/**10**/12/14 |
| 3NT | unfav | 152 | 8/10/**11**/12/13 |
| 3NT | both | 123 | 8/9/**11**/11/15 |
| 2NT | none | 92 | 5/9/**11**/14/16 |
| 2NT | fav | 127 | 8/10/**11**/13/16 |
| 2NT | unfav | 56 | 8/9/**11**/11/15 |
| 2NT | both | 90 | 2/7/**9**/10/12 |
| 3C | none | 102 | 9/10/**12**/14/16 |
| 3C | fav | 132 | 8/10/**11**/13/17 |
| 3C | unfav | 60 | 9/10/**11**/12/15 |
| 3C | both | 82 | 2/8/**10**/11/14 |

Dealer filters (paste into the custom filter box; derived from the data):

- `2C` → `((hcp in 6..11 and h >= 4) or (hcp in 6..11 and s >= 4))`
- `2H` → `(hcp in 4..16 and s >= 4)`
- `2D` → `(hcp in 3..16 and h >= 4)`
- `3NT` → `hcp in 8..14`
- `2NT` → `hcp in 5..16`
- `3C` → `((hcp in 7..11 and h >= 4) or (hcp in 7..16 and s >= 4) or (hcp in 7..16 and s <= 3 and h <= 3))`

## Transfer responses to 1C: 1C (P) ? by transfer-walsh pairs

Detected per partnership from the hands (4+ of the next suit in essentially every 1D/1H response). The derived rules key on the suit actually shown: 1D = hearts, 1H = spades. The field’s 1S is multi-way — see the decision matrices below for its components.

### 1C (P) ? — transfer responders

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 1D | 34.8% | 1043 | 697 | 5/7/**9**/12/15 | 1:9% 2:25% 3:26% 4:28% 5:9% 6:3% | **2.9** (1.5–4.9) | 52% |
| 1H | 33.9% | 1016 | 670 | 4/7/**10**/11/15 | 0:2% 1:9% 2:26% 3:50% 4:9% 5:3% | **3.0** (1.1–4.5) | 49% |
| 1S | 16.0% | 480 | 553 | 4/8/**10**/13/17 | 0:2% 1:4% 2:24% 3:62% 4:4% 5:3% 6+:1% | **3.1** (1.5–4.3) | 64% |
| 1NT | 3.9% | 118 | 234 | 8/10/**11**/14/18 | — | — | 89% |
| 2C | 3.5% | 106 | 147 | 8/12/**13**/15/20 | 0:4% 1:11% 2:20% 3:9% 4:6% 5:25% 6:24% | **4.3** (2.5–6.3) | 31% |
| 2D | 1.8% | 54 | 132 | 4/9/**13**/15/19 | <2:2% 2:24% 3:26% 4:6% 5:26% 6:7% 7:9% | **4.8** (3.3–5.6) | 24% |
| P | 2.3% | 69 | 58 | 1/2/**4**/4/5 | — | — | 75% |
| 2H | 1.1% | 33 | 81 | 4/6/**8**/11/15 | 0:6% 1:6% 2:24% 3:15% 4:18% 5:12% 6:15% 7:3% | **2.2** (0.5–3.5) | 3% |
| 2NT | 0.8% | 25 | 58 | 12/13/**14**/15/16 | — | — | 88% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1D | none | 200 | 5/8/**9**/13/15 |
| 1D | fav | 368 | 5/7/**9**/11/16 |
| 1D | unfav | 154 | 5/8/**10**/12/15 |
| 1D | both | 321 | 4/7/**10**/12/15 |
| 1H | none | 247 | 5/7/**10**/12/14 |
| 1H | fav | 335 | 3/7/**9**/11/17 |
| 1H | unfav | 191 | 5/7/**9**/11/14 |
| 1H | both | 243 | 6/8/**10**/12/16 |
| 1S | none | 131 | 5/7/**10**/14/17 |
| 1S | fav | 136 | 4/8/**11**/13/17 |
| 1S | unfav | 94 | 5/8/**11**/15/19 |
| 1S | both | 119 | 4/8/**9**/12/16 |
| 1NT | none | 31 | 8/10/**11**/13/14 |
| 1NT | fav | 36 | 6/10/**13**/15/18 |
| 1NT | both | 27 | 8/10/**10**/11/16 |
| 2C | fav | 33 | 6/11/**13**/14/17 |
| 2C | unfav | 36 | 10/13/**15**/15/20 |

Dealer filters (paste into the custom filter box; derived from the data):

- `1D` → `(hcp in 5..15 and h >= 4)`
- `1H` → `(hcp in 4..15 and s >= 4)`
- `1S` → `(hcp in 4..17 and s <= 3 and h <= 3)`
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
| ≤4 HCP | 436 | 14% | 17% | 44% | · | · | 22% | 1% | 2% |
| 5–11 · 4♥ only | 1069 | 88% | · | 10% | · | · | 1% | · | 1% |
| 5–11 · 4♠ only | 1169 | · | 84% | 14% | · | · | · | 1% | 1% |
| 5–11 · 4-4+ majors | 607 | 62% | 27% | 7% | · | · | · | · | 3% |
| 5–11 · no 4M | 833 | · | · | 55% | 31% | 2% | 1% | 2% | 9% |
| 12+ · 4♥ only | 653 | 66% | · | 29% | · | 1% | · | 2% | 2% |
| 12+ · 4♠ only | 572 | · | 83% | 10% | 1% | 1% | · | 1% | 3% |
| 12+ · 4-4+ majors | 302 | 75% | 16% | 3% | 2% | 3% | · | · | · |
| 12+ · no 4M bal | 424 | · | · | 54% | 3% | 19% | · | 4% | 19% |
| 12+ · no 4M unbal | 149 | · | 1% | 55% | · | 30% | · | 11% | 2% |

### 1C (X) ? — standard responders

| hand type | n | P | 1D | 1H | 1S | XX | 2C | 2D | other |
|---|---|---|---|---|---|---|---|---|---|
| ≤4 HCP | 280 | 79% | 8% | 3% | 3% | · | 1% | 1% | 5% |
| 5–11 · 4♥ only | 201 | 15% | 28% | 39% | 1% | 4% | 1% | 5% | 6% |
| 5–11 · 4♠ only | 241 | 11% | 7% | 19% | 44% | 13% | · | · | 6% |
| 5–11 · 4-4+ majors | 60 | 8% | 10% | 48% | 25% | 7% | 2% | · | · |
| 5–11 · no 4M | 218 | 22% | 30% | · | 13% | 6% | 11% | 4% | 14% |

### 1C (1D) ? — standard responders

| hand type | n | 1H | X | 1S | P | 3C | 2C | 2D | other |
|---|---|---|---|---|---|---|---|---|---|
| ≤4 HCP | 106 | 9% | 7% | 3% | 61% | 2% | 1% | 6% | 11% |
| 5–11 · 4♥ only | 162 | 44% | 40% | · | 7% | · | · | 5% | 4% |
| 5–11 · 4♠ only | 160 | 29% | 4% | 41% | 8% | · | · | 1% | 17% |
| 5–11 · 4-4+ majors | 163 | 15% | 46% | 20% | 3% | · | 12% | 1% | 3% |
| 5–11 · no 4M | 199 | · | · | 13% | 14% | 36% | 25% | 3% | 10% |
| 12+ · 4♠ only | 39 | 41% | 13% | 41% | · | · | · | · | 5% |

### 1C (P) ? — transfer-walsh responders

| hand type | n | 1D | 1H | 1S | 1NT | 2C | P | 2D | other |
|---|---|---|---|---|---|---|---|---|---|
| ≤4 HCP | 202 | 25% | 28% | 12% | · | · | 29% | 1% | 3% |
| 5–11 · 4♥ only | 472 | 94% | 1% | 1% | · | · | · | 2% | 1% |
| 5–11 · 4♠ only | 647 | 2% | 94% | 2% | · | 1% | · | · | 2% |
| 5–11 · 4-4+ majors | 332 | 67% | 27% | · | · | 2% | · | 1% | 3% |
| 5–11 · no 4M | 347 | 3% | 1% | 70% | 16% | 3% | 2% | 1% | 5% |
| 12+ · 4♥ only | 300 | 64% | 2% | 18% | 2% | 8% | · | 4% | 2% |
| 12+ · 4♠ only | 292 | 2% | 77% | 8% | 6% | 1% | · | 1% | 5% |
| 12+ · 4-4+ majors | 137 | 74% | 18% | · | 5% | 1% | · | 1% | 2% |
| 12+ · no 4M bal | 189 | 4% | · | 49% | 14% | 14% | · | 6% | 13% |
| 12+ · no 4M unbal | 75 | 3% | · | 36% | 3% | 41% | · | 13% | 4% |

### 1C (X) ? — transfer-walsh responders

| hand type | n | P | 1H | 1D | 1S | XX | 2H | 2S | other |
|---|---|---|---|---|---|---|---|---|---|
| ≤4 HCP | 129 | 70% | 8% | 7% | 3% | 2% | 5% | 5% | 1% |
| 5–11 · 4♥ only | 85 | 16% | 2% | 59% | 1% | 7% | 2% | · | 12% |
| 5–11 · 4♠ only | 99 | 16% | 61% | · | 4% | 13% | 3% | 1% | 2% |
| 5–11 · 4-4+ majors | 27 | 7% | 44% | 30% | 4% | 4% | 7% | · | 4% |
| 5–11 · no 4M | 75 | 16% | · | 1% | 53% | 9% | · | 1% | 19% |

### 1C (1D) ? — transfer-walsh responders

| hand type | n | X | 1H | P | 1S | 2C | 3C | 2H | other |
|---|---|---|---|---|---|---|---|---|---|
| ≤4 HCP | 36 | 19% | · | 61% | 3% | 3% | · | 6% | 8% |
| 5–11 · 4♥ only | 77 | 78% | 5% | 3% | 1% | · | · | 1% | 12% |
| 5–11 · 4♠ only | 79 | 3% | 67% | 10% | 5% | · | · | 10% | 5% |
| 5–11 · 4-4+ majors | 79 | 49% | 27% | · | 13% | 8% | · | · | 4% |
| 5–11 · no 4M | 73 | 1% | · | 16% | 27% | 21% | 19% | · | 15% |

## Book vs field

"Book" is the SAYC/2-over-1 teaching range (ACBL SAYC card/booklet). "Field" is
this dataset: p5–p95 (median). The field is systematically lighter than the book
at the bottom of ranges, and vulnerability is the biggest modifier for preempts.

| context | book | field |
|---|---|---|
| 1M opening (seats 1–2) | 12–21 (light 11s common in practice) | 10–17 (med 13), n=17959 |
| 1NT opening (strong-NT pairs) | 15–17 | 14–17 (med 15), n=12789 |
| 2NT opening | 20–21 | 19–21 (med 20), n=1973 |
| weak 2S (seats 1–3) | 5–11, 6-card suit | 5–11 (med 8), n=1959 |
| 1-level overcall (1C) 1H | 8–16 (down to ~8) | 7–16 (med 11), n=2151 |
| 2-level overcall (1S) 2H | 10–17ish, good suit | 10–15 (med 12), n=897 |
| 1NT overcall (1H) 1NT | 15–18 | 14–17 (med 15), n=378 |
| takeout double (1S) X | opening values (12+) or shape | 11–19 (med 13), n=1018 |
| weak jump overcall (1C) 2H | ~6–10, 6-card suit | 4–12 (med 8), n=378 |
| Michaels (1H) 2H | 8–12 or 16+, 5-5 | 8–14 (med 12), n=383 |
| unusual 2NT (1S) 2NT | weak or 17+, 5-5 minors | 7–21 (med 11), n=111 |
| negative double 1S (2H) X | 7+ (level-adjusted) | 7–15 (med 10), n=87 |
| new suit response 1C (P) 1H (std responders) | 6+ | 5–15 (med 10), n=2039 |

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
  "n": 1492,
  "hcp": {
    "mean": 14.08,
    "sd": 2.85,
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
      "n": 619,
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
      "n": 380,
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
      "n": 463,
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

