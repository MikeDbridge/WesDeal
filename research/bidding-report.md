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

- 337096 table results scanned; 128396 carry an auction; 128314 auctions
  replay as legal sequences consistent with the recorded contract, doubling
  state, and declarer (the rest are site glitches, e.g. card tokens inside
  the bidding tooltip).
- Rejected: contract-mismatch 44, calls-after-end 30, double-mismatch 5, no-bid 3.
- Coverage by tournament/stage (valid auctions):

| tournament/stage | auctions |
|---|---|
| riga26/RR | 38254 |
| euchamp24/RR | 35263 |
| herning25/RR | 30869 |
| herning25/QF | 3523 |
| marrakech23/QF | 3059 |
| usbc26/RR | 2107 |
| herning25/SF | 1703 |
| marrakech23/SF | 1518 |
| herning25/FF | 1310 |
| marrakech23/FF | 1271 |
| prague26tn/16 | 868 |
| strasbourg23tn/16 | 839 |
| usbc26/QF | 682 |
| vanderbilt25/16 | 530 |
| soloway25/KO | 528 |
| herning25tn/16 | 512 |
| vanderbilt25/QF | 478 |
| spingold25/QF | 466 |
| strasbourg23tn/QF | 448 |
| prague26tn/QF | 447 |
| spingold25/KO | 345 |
| usbc26/SF | 320 |
| spingold25/16 | 270 |
| herning25tn/QF | 256 |
| vanderbilt25/SF | 240 |
| spingold25/32 | 237 |
| spingold25/SF | 235 |
| prague26tn/SF | 224 |
| herning25tn/SF | 222 |
| strasbourg23tn/SF | 222 |
| herning25tn/FF | 195 |
| usbc26/FF | 174 |
| vanderbilt25/FF | 158 |
| soloway25/FF | 130 |
| spingold25/FF | 120 |
| prague26tn/FF | 112 |
| strasbourg23tn/FF | 112 |
| soloway25/QF | 61 |
| soloway25/16 | 6 |

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
  natural 1C carry a median suit texture of 4.1/10; sound ones (11+) get away
  with 5.1/10 — the values carry a moderate suit. The derived filters
  encode exactly that: a quality floor everyone meets, plus a higher bar that
  only applies below 11 HCP (`hcp >= 11 or top(h,5) >= …`).
- **Takeout doubles are opening-strength, not 12+**: (1S) X runs 11–19 (med 13);
  the light tail (10–11) comes with shape.
- **The 1NT overcall is a strong NT**: (1H) 1NT = 14–17 (med 15); balancing
  (1H) P (P) 1NT is 4 HCP lighter at 10–15 (med 11).
- **Vulnerability moves preempts, not constructive bids.** Weak jump overcalls
  swing hardest: (1C) 2H is median 7 at favourable but 10 at unfavourable.
  Simple overcalls and doubles barely move (±1 HCP).
- **Two-suited bids are universal**: (1H) 2H (Michaels) = 8–14 (med 12) with ≤2
  hearts 99% of the time; (1M) 2NT is the two lowest suits, unbalanced.
- **Negative doubles start at ~7**: 1S (2H) X = 7–15 (med 10). Redouble after
  1C (X) shows 6–16 (med 11).
- **Transfer responses to 1C are mainstream**: of classified natural-club pairs,
  148 play transfers vs 359 standard. Their 1C (P) 1D holds 4+ hearts 96%
  of the time (4–15 (med 9) HCP), and 1S is the no-major hand (79% with no 4-card major, 4–17 (med 10)) — the
  derived rules follow the shown suit, and the treatment carries on over a
  double or 1D overcall (see the transfer-responder sections).
- **Defence to 1NT is conventional and the data shows it**: (1NT) 2C holds both
  majors 4+ 89% of the time (clubs are incidental); (1NT) 2D has a 5+
  major 93% (6+ 85%) — multi-style; 2M shows the major plus a 4+ minor.
  The derived rules detect these shapes instead of reading the bid suit at
  face value (see the (1NT) ? section).
- **At this level 2D is multi** (280 pairs multi vs 51 weak among classified),
  2C strong is standard, and strong-club pairs are 12% of the field (138 of 1105).
- **Shortage in their suit buys lighter action.** (1D) 1S overcallers with ≤2
  diamonds are median 10 HCP (p5 7); with 3+ diamonds median 11 (p5 7).
  The same gradient shows up in every overcall and double context (see the
  per-context cross-tabs), so the derived filters split their-suit shortage
  from length.
- **Doubles are support-first below 17, shape-free above.** Under 17 HCP, (1H) X
  holds 3+ spades 100% of the time (4+ 74%) and 2+ in both
  minors 99%; (1C) X holds both majors 3+ 95%. At 17+ those rates
  drop to 70% / 65% — the strong double is its own animal, and the derived
  filters carry it as a separate shape-free branch.
- **Action rates need a fixed-strength lens** (a strong 1C depletes the seats
  behind it). Holding 9–11 HCP, the direct seat acts 59% over a natural 1C, 56% over 1D, 48% over a strong 1C.
  See the action-rate section for the full grid.

## Partnership system census

Each partnership is classified from its own openings (min 6 samples per bid).

- 1C style: natural 681, unknown 263, strong 138, short 16, polish 7
- 1D style: natural 769, unknown 291, nebulous 45
- 1NT range: strong 702, unknown 313, weak 90
- 2C style: unknown 821, strong 158, natural 126
- 2D style: unknown 682, multi 280, other 92, weak 51
- natural base (1C natural/short and 1D not nebulous): yes 695, no 410
- 1C response style (natural/short openers, from their own 1D/1H responses):
  standard 359, transfer-walsh 148, insufficient data 176

## Openings (natural-base pairs)

HCP shown as p5/p25/**median**/p75/p95. Length is the bid suit, p5–p95 (median).
Style filter: 1C/1D/1NT/2C/2D rows use pairs whose that-bid style is natural
(1C natural or short-club; 1D natural; 2C strong excluded from "natural" row…);
1M and preempts use natural-base pairs.

### Seat 1 + Seat 2

| opening | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|
| 1C | 17087 | 1808 | 11/12/**13**/14/18 | 2:6% 3:22% 4:30% 5:23% 6:13% 7:4% | **4.8** (3.5–6.2) | 59% |
| 1D | 15709 | 1496 | 10/12/**13**/14/18 | <3:1% 3:5% 4:30% 5:38% 6:20% 7:4% | **4.8** (3.6–6.2) | 36% |
| 1H | 9171 | 793 | 10/11/**13**/15/17 | 5:72% 6:23% 7:2% 8+:1% | **5.1** (3.8–6.3) | 17% |
| 1S | 9660 | 837 | 10/11/**13**/15/18 | 5:61% 6:32% 7:5% | **4.9** (3.7–6.3) | 18% |
| 1NT | 9993 | 1411 | 13/14/**15**/16/17 | — | — | 84% |
| 2C | 726 | 486 | 6/14/**20**/21/24 | <1:1% 1:8% 2:22% 3:35% 4:20% 5:8% 6:4% | **5.4** (3.0–7.5) | 42% |
| 2D | 270 | 781 | 4/6/**8**/9/13 | <5:4% 5:7% 6:80% 7:9% | **3.9** (2.9–5.2) | 2% |
| 2H | 1470 | 460 | 5/7/**8**/9/11 | <2:1% 2:3% 3:2% 4:6% 5:33% 6:52% 7:3% | **4.2** (2.9–5.3) | 5% |
| 2S | 1882 | 350 | 5/7/**8**/9/11 | 5:34% 6:64% 7+:1% | **4.4** (3.1–5.6) | 3% |
| 2NT | 1557 | 176 | 19/19/**20**/21/21 | — | — | 84% |
| 3C | 582 | 95 | 5/5/**7**/9/10 | <5:2% 5:3% 6:64% 7:30% 8+:2% | **4.4** (4.1–5.6) | 2% |
| 3D | 883 | 119 | 3/5/**8**/8/10 | <6:2% 6:43% 7:55% | **5.0** (4.1–5.5) | 0% |
| 3H | 509 | 86 | 3/5/**6**/8/9 | <6:3% 6:39% 7:45% 8:13% | **3.9** (3.0–4.8) | 1% |
| 3S | 679 | 76 | 4/6/**8**/9/10 | 6:33% 7:66% | **4.8** (3.9–6.7) | 0% |
| 3NT | 114 | 34 | 9/11/**11**/12/14 | — | — | 1% |
| 4C | 71 | 22 | 5/5/**9**/12/14 | 2:13% 3:13% 4:3% 6:4% 7:24% 8:44% | **3.5** (3.5–4.1) | 0% |
| 4D | 43 | 19 | 5/5/**7**/10/15 | 1:7% 3:19% 4:5% 6:7% 7:53% 8:9% | **4.7** (2.3–4.7) | 0% |
| 4H | 317 | 36 | 3/5/**5**/10/12 | 6:3% 7:41% 8:55% 9+:2% | **4.5** (3.9–5.8) | 0% |
| 4S | 345 | 39 | 7/8/**9**/10/11 | 6:5% 7:54% 8:39% 9+:2% | **5.9** (4.7–6.6) | 0% |

### Seat 3

| opening | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|
| 1C | 3066 | 482 | 10/12/**13**/16/19 | 2:8% 3:19% 4:25% 5:30% 6:15% 7:2% | **5.0** (3.6–6.3) | 53% |
| 1D | 3609 | 370 | 10/12/**13**/15/18 | 3:4% 4:37% 5:39% 6:18% | **4.9** (3.7–6.1) | 45% |
| 1H | 1695 | 222 | 9/11/**13**/14/17 | 4:3% 5:68% 6:28% | **4.8** (3.5–6.2) | 25% |
| 1S | 2328 | 233 | 9/11/**13**/16/18 | 4:4% 5:68% 6:25% 7:3% | **5.3** (4.0–6.0) | 23% |
| 1NT | 2562 | 296 | 14/15/**15**/16/17 | — | — | 82% |
| 2C | 213 | 116 | 10/19/**21**/24/26 | 1:4% 2:14% 3:28% 4:19% 5:10% 6:16% 7:8% | **7.2** (5.1–7.9) | 31% |
| 2H | 183 | 53 | 6/7/**9**/10/11 | <3:2% 3:2% 4:2% 5:36% 6:56% 7+:2% | **3.5** (3.2–5.3) | 3% |
| 2S | 137 | 39 | 5/8/**9**/10/13 | <5:1% 5:26% 6:72% | **4.3** (3.7–6.2) | 4% |
| 2NT | 358 | 56 | 18/19/**20**/20/21 | — | — | 59% |
| 3C | 204 | 25 | 6/8/**9**/10/10 | 5:13% 6:55% 7:31% | **5.7** (4.4–6.2) | 0% |
| 3D | 65 | 19 | 4/6/**7**/8/12 | 5:9% 6:83% 7:8% | **3.8** (3.8–4.9) | 0% |
| 3H | 66 | 20 | 5/7/**9**/10/12 | 5:3% 6:61% 7:36% | **4.4** (3.5–6.9) | 0% |
| 3S | 26 | 11 | 7/7/**7**/8/11 | 6:81% 7:19% | **7.1** (5.3–7.1) | 0% |
| 4C | 25 | 9 | 8/8/**9**/11/11 | 6:40% 7:60% | **5.7** (4.4–6.2) | 0% |
| 4H | 71 | 15 | 10/12/**13**/13/16 | <6:1% 6:41% 7:23% 8:35% | **5.7** (3.8–6.6) | 0% |
| 4S | 76 | 14 | 11/11/**12**/12/15 | 6:18% 7:78% 8:4% | **7.8** (6.7–8.1) | 0% |

### Seat 4

| opening | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|
| 1C | 1032 | 196 | 12/13/**14**/18/20 | <2:1% 2:9% 3:35% 4:27% 5:13% 6:10% 7:4% | **5.3** (3.4–7.0) | 73% |
| 1D | 551 | 115 | 12/14/**15**/18/20 | 2:2% 3:6% 4:66% 5:10% 6:13% 7:3% | **4.8** (4.0–6.2) | 59% |
| 1H | 562 | 63 | 12/13/**15**/17/18 | 5:58% 6:41% 7+:1% | **5.0** (3.5–6.5) | 10% |
| 1S | 391 | 67 | 12/14/**16**/16/19 | <5:1% 5:53% 6:36% 7:10% | **5.4** (4.9–6.2) | 13% |
| 1NT | 929 | 123 | 14/15/**16**/16/17 | — | — | 87% |
| 2C | 61 | 43 | 17/18/**21**/23/23 | 1:7% 2:11% 3:52% 4:28% 5+:2% | **6.5** (4.5–8.2) | 84% |
| 2NT | 98 | 30 | 18/20/**20**/21/22 | — | — | 87% |

### Preempts by vulnerability (all seats, natural-base pairs)

| opening | vul | n | HCP p5/p25/med/p75/p95 | bid-suit len | texture |
|---|---|---|---|---|---|
| 2H | fav | 513 | 4/6/**7**/9/11 | 2:3% 3:2% 4:7% 5:47% 6:38% 7+:1% | **3.9** (2.8–4.8) |
| 2H | none | 442 | 5/7/**8**/9/11 | <2:1% 2:2% 3:1% 4:8% 5:33% 6:53% | **4.4** (2.5–5.3) |
| 2H | both | 301 | 6/7/**8**/9/12 | <2:2% 2:3% 3:3% 4:3% 5:27% 6:56% 7:6% | **4.2** (3.2–5.7) |
| 2H | unfav | 409 | 5/8/**8**/10/12 | <2:1% 2:2% 3:2% 4:2% 5:18% 6:69% 7:4% | **4.4** (3.5–5.7) |
| 2S | fav | 690 | 4/7/**8**/9/11 | <5:1% 5:44% 6:54% | **4.3** (2.7–5.3) |
| 2S | none | 508 | 5/6/**9**/9/10 | <5:1% 5:41% 6:56% 7+:1% | **4.5** (3.2–5.8) |
| 2S | both | 455 | 5/7/**8**/9/11 | <5:1% 5:20% 6:77% 7+:1% | **4.4** (3.1–5.0) |
| 2S | unfav | 375 | 6/7/**9**/10/12 | 5:17% 6:81% 7:2% | **4.9** (3.7–5.7) |
| 3C | fav | 415 | 5/6/**8**/9/10 | 5:10% 6:77% 7:12% 8+:1% | **5.2** (4.1–5.7) |
| 3C | none | 247 | 5/5/**8**/8/10 | <6:2% 6:48% 7:50% | **4.4** (4.3–5.5) |
| 3C | both | 39 | 2/7/**7**/10/13 | 3:3% 5:3% 6:38% 7:56% | **3.5** (3.3–5.2) |
| 3C | unfav | 88 | 6/9/**9**/10/10 | 1:2% 6:39% 7:52% 8:7% | **6.1** (5.4–6.3) |
| 3D | fav | 344 | 2/5/**7**/8/9 | 5:4% 6:77% 7:19% | **4.4** (3.2–5.5) |
| 3D | none | 224 | 3/6/**8**/9/10 | <6:2% 6:53% 7:45% | **5.1** (4.0–5.1) |
| 3D | both | 261 | 6/7/**8**/8/10 | 6:10% 7:89% 8+:1% | **5.3** (4.3–6.0) |
| 3D | unfav | 119 | 5/5/**7**/8/10 | 6:22% 7:78% | **5.0** (4.8–5.2) |
| 3H | fav | 207 | 2/5/**6**/7/9 | <5:2% 5:3% 6:63% 7:15% 8:16% | **3.9** (2.8–4.5) |
| 3H | none | 127 | 5/5/**7**/8/9 | <6:2% 6:56% 7:42% | **4.8** (4.1–5.9) |
| 3H | both | 149 | 5/6/**8**/9/9 | <6:1% 6:3% 7:75% 8:20% | **3.6** (3.0–4.2) |
| 3H | unfav | 92 | 5/6/**7**/9/10 | 6:38% 7:60% 8:2% | **4.4** (3.3–6.6) |
| 3S | fav | 256 | 4/4/**7**/8/9 | 6:60% 7:40% | **3.9** (3.3–4.7) |
| 3S | none | 157 | 5/6/**7**/9/10 | 6:29% 7:69% | **6.3** (4.3–6.3) |
| 3S | both | 169 | 7/8/**9**/10/10 | 6:20% 7:80% | **4.8** (4.4–6.7) |
| 3S | unfav | 123 | 7/7/**7**/10/10 | 6:13% 7:85% | **7.1** (7.1–7.1) |
| 4C | fav | 52 | 5/5/**5**/9/10 | <6:4% 6:23% 7:23% 8:50% | **3.5** (3.5–4.1) |
| 4C | none | 25 | 5/8/**11**/13/14 | 3:36% 7:64% | **4.4** (3.6–5.4) |
| 4D | fav | 27 | 4/5/**5**/5/10 | 4:7% 6:15% 7:78% | **4.7** (3.0–4.7) |
| 4H | fav | 158 | 3/5/**6**/9/12 | 6:14% 7:49% 8:37% | **4.3** (3.5–5.7) |
| 4H | none | 81 | 4/5/**5**/10/16 | <6:1% 6:14% 7:49% 8:30% 9:6% | **4.8** (4.7–5.3) |
| 4H | both | 130 | 5/5/**11**/12/13 | 6:3% 7:15% 8:82% | **4.2** (4.2–7.9) |
| 4S | fav | 121 | 7/7/**9**/10/12 | 6:6% 7:85% 8:9% | **6.6** (4.1–6.7) |
| 4S | none | 115 | 6/9/**9**/9/9 | 7:43% 8:56% 9+:2% | **5.9** (5.9–6.3) |
| 4S | both | 59 | 8/8/**9**/12/16 | <6:2% 6:42% 7:25% 8:24% 9:7% | **4.8** (4.4–6.7) |
| 4S | unfav | 131 | 9/10/**11**/11/14 | 7:63% 8:37% | **6.4** (5.5–7.5) |

## Direct seat: RHO opens, we act — (opening) ?

Every opening 1C–4S with enough data. For 1C/1D the tables face a NATURAL opening (strong-club and nebulous-1D openers tabulated separately below); (2D) faces a weak 2D. Suit actions over (1NT) are largely conventional — 2C = both majors, 2D = one long major (multi-style), 2M = the major + a minor — and their derived rules detect those shapes from the hands instead of reading the bid at face value.

### (1C) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 49.1% | 10335 | 1475 | 2/6/**7**/9/13 | — | — | 65% |
| 1S | 12.3% | 2596 | 356 | 7/9/**11**/12/15 | <5:2% 5:80% 6:16% 7:2% | **4.3** (3.2–5.0) | 33% |
| 1H | 10.7% | 2258 | 385 | 7/9/**11**/13/16 | 4:3% 5:66% 6:23% 7:7% | **4.6** (3.7–5.4) | 16% |
| X | 8.2% | 1735 | 308 | 10/13/**14**/17/20 | theirs: <1:1% 1:17% 2:28% 3:40% 4:12% 5+:2% | — | 66% |
| 1D | 7.3% | 1540 | 348 | 7/9/**12**/13/15 | 4:5% 5:58% 6:28% 7:5% 8:2% | **4.8** (4.0–5.7) | 26% |
| 1NT | 3.3% | 699 | 152 | 14/15/**15**/16/17 | — | — | 87% |
| 2H | 1.8% | 389 | 94 | 4/7/**8**/8/12 | <5:1% 5:5% 6:80% 7:13% | **4.9** (3.8–5.4) | 1% |
| 2S | 1.5% | 315 | 75 | 4/5/**7**/9/12 | 5:7% 6:90% 7:3% | **4.2** (3.8–5.0) | 3% |
| 2C | 1.2% | 248 | 128 | 7/9/**11**/13/14 | 0:3% 1:26% 2:9% 3:3% 5:15% 6:33% 7:11% | **4.3** (0.9–6.3) | 4% |
| 2D | 1.0% | 219 | 104 | 5/7/**10**/12/14 | <1:2% 1:12% 2:32% 3:5% 5:8% 6:40% | **4.1** (1.7–5.4) | 2% |
| 3H | 0.9% | 193 | 34 | 4/6/**8**/8/12 | 6:39% 7:61% | **4.4** (4.3–5.4) | 0% |
| 3S | 0.5% | 109 | 23 | 4/6/**9**/10/11 | 6:39% 7:58% 8:4% | **6.1** (4.0–6.4) | 0% |
| 2NT | 0.5% | 109 | 25 | 9/10/**13**/13/14 | — | — | 0% |
| 3D | 0.3% | 71 | 32 | 6/7/**9**/10/12 | 6:75% 7:18% 8:7% | **5.0** (4.0–5.4) | 0% |
| 4H | 0.3% | 73 | 22 | 6/11/**11**/13/15 | 6:7% 7:63% 8:30% | **5.8** (4.5–8.9) | 0% |
| 3C | 0.2% | 35 | 31 | 5/9/**11**/12/15 | 0:3% 1:49% 2:14% 6:11% 7:20% 8:3% | **1.7** (0.0–4.3) | 0% |
| 4S | 0.2% | 43 | 16 | 6/8/**10**/12/15 | 6:7% 7:67% 8:26% | **6.1** (4.9–7.6) | 0% |
| 5D | 0.2% | 46 | 7 | 12/12/**12**/12/14 | 6:7% 7:2% 8:91% | **7.0** (7.0–7.0) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1S | none | 645 | 7/9/**11**/13/15 |
| 1S | fav | 559 | 8/9/**9**/12/16 |
| 1S | unfav | 695 | 7/10/**12**/13/15 |
| 1S | both | 697 | 7/9/**10**/12/14 |
| 1H | none | 652 | 7/9/**10**/13/15 |
| 1H | fav | 485 | 8/9/**10**/12/15 |
| 1H | unfav | 601 | 7/9/**10**/13/17 |
| 1H | both | 520 | 7/9/**11**/13/16 |
| X | none | 529 | 10/12/**14**/17/19 |
| X | fav | 285 | 11/13/**14**/18/20 |
| X | unfav | 499 | 11/13/**14**/17/20 |
| X | both | 422 | 11/13/**13**/15/18 |
| 1D | none | 534 | 7/9/**11**/14/15 |
| 1D | fav | 279 | 6/10/**12**/13/16 |
| 1D | unfav | 294 | 7/9/**12**/14/16 |
| 1D | both | 433 | 7/9/**12**/13/14 |
| 1NT | none | 157 | 14/15/**17**/17/18 |
| 1NT | fav | 65 | 14/15/**15**/16/18 |
| 1NT | unfav | 209 | 15/15/**15**/16/17 |
| 1NT | both | 268 | 14/15/**15**/16/17 |
| 2H | none | 136 | 5/7/**8**/8/11 |
| 2H | fav | 109 | 4/4/**7**/8/11 |
| 2H | unfav | 57 | 5/9/**10**/12/12 |
| 2H | both | 87 | 6/8/**8**/8/12 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 1S | 9/**11**/12 (643) | 9/**11**/14 (896) | 10/**10**/12 (727) | 8/**11**/14 (330) |
| 1H | 10/**11**/12 (556) | 9/**11**/13 (828) | 8/**10**/12 (430) | 9/**10**/13 (444) |
| X | 11/**13**/17 (326) | 13/**14**/16 (485) | 13/**14**/15 (688) | 13/**17**/18 (236) |
| 1D | 10/**12**/15 (257) | 9/**11**/13 (475) | 8/**11**/13 (389) | 10/**12**/14 (419) |

Anatomy of X: per HCP band, support held (both majors = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | both majors ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 97 | 99% | 76% | 96% | 94% |
| 11–13 | 631 | 98% | 40% | 100% | 43% |
| 14–16 | 554 | 91% | 15% | 99% | 45% |
| 17+ | 453 | 65% | 6% | 85% | 44% |

Dealer filters (paste into the custom filter box; derived from the data):

- `1S` → `s >= 5 and top(s,5) >= 1 and hcp in 7..15`
- `1H` → `h >= 5 and top(h,5) >= 1 and hcp in 7..16`
- `X` → `((hcp in 10..17 and c <= 2 and s >= 3 and h >= 3 and d >= 2) or (hcp in 12..17 and c in 3..4 and s >= 3 and h >= 3 and d >= 2) or hcp >= 18)`
- `1D` → `d >= 5 and top(d,5) >= 1 and ((hcp in 6..15 and c <= 2) or (hcp in 7..15 and c in 3..5))`
- `1NT` → `(has(c,a) or (has(c,k) and c >= 2) or (has(c,q) and c >= 3)) and hcp in 14..17` *(+ balanced)*
- `2H` → `h >= 6 and (hcp >= 11 or top(h,5) >= 1) and ((hcp in 4..12 and c <= 2) or (hcp in 6..12 and c == 3))`

### (1D) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 51.2% | 10276 | 1148 | 3/6/**8**/10/13 | — | — | 62% |
| 1S | 11.4% | 2288 | 327 | 7/9/**10**/12/15 | 4:3% 5:76% 6:18% 7:2% | **4.2** (3.0–5.4) | 27% |
| 1H | 11.3% | 2270 | 290 | 7/9/**11**/13/16 | 4:3% 5:65% 6:31% 7+:1% | **4.4** (3.5–5.8) | 20% |
| X | 10.1% | 2031 | 281 | 10/12/**14**/16/19 | theirs: 0:7% 1:14% 2:45% 3:30% 4:4% | — | 66% |
| 2C | 4.4% | 876 | 105 | 9/10/**11**/13/16 | 5:29% 6:55% 7:16% | **6.1** (4.6–7.0) | 9% |
| 1NT | 3.2% | 642 | 122 | 14/15/**16**/17/18 | — | — | 89% |
| 2D | 2.3% | 462 | 62 | 6/10/**10**/12/13 | 0:37% 1:49% 2:9% 6:2% 7+:1% | **0.0** (0.0–5.2) | 0% |
| 2H | 1.3% | 267 | 69 | 5/7/**8**/10/11 | <5:1% 5:7% 6:82% 7:9% | **5.0** (3.5–6.1) | 1% |
| 3H | 0.9% | 183 | 25 | 6/6/**7**/9/10 | 6:32% 7:68% | **5.3** (3.4–5.8) | 0% |
| 3S | 0.8% | 159 | 25 | 6/7/**7**/9/10 | 6:18% 7:82% | **4.2** (3.6–7.1) | 0% |
| 2S | 0.7% | 138 | 57 | 4/6/**7**/10/12 | <5:1% 5:6% 6:86% 7:7% | **4.2** (3.8–4.7) | 1% |
| 3C | 0.7% | 146 | 48 | 4/8/**10**/10/12 | <3:3% 3:2% 5:16% 6:51% 7:23% 8:4% | **5.0** (4.0–6.4) | 0% |
| 2NT | 0.5% | 110 | 22 | 9/9/**9**/10/13 | — | — | 0% |
| 4S | 0.5% | 107 | 12 | 6/10/**12**/13/15 | 7:62% 8:10% 9:28% | **7.4** (7.1–10.0) | 0% |
| 4H | 0.2% | 39 | 15 | 5/8/**10**/15/18 | 6:38% 7:33% 8:10% 9:18% | **5.4** (4.1–5.8) | 0% |
| 4C | 0.1% | 26 | 9 | 5/10/**10**/11/12 | 6:8% 7:27% 8:65% | **3.7** (3.7–6.0) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1S | none | 568 | 8/10/**11**/13/15 |
| 1S | fav | 654 | 8/9/**10**/11/14 |
| 1S | unfav | 605 | 7/8/**10**/15/17 |
| 1S | both | 461 | 8/8/**11**/12/15 |
| 1H | none | 452 | 7/8/**10**/13/14 |
| 1H | fav | 338 | 8/9/**11**/13/16 |
| 1H | unfav | 791 | 7/10/**11**/13/16 |
| 1H | both | 689 | 8/9/**12**/14/15 |
| X | none | 523 | 9/12/**13**/14/17 |
| X | fav | 592 | 10/13/**14**/18/20 |
| X | unfav | 345 | 11/12/**14**/18/18 |
| X | both | 571 | 11/13/**15**/15/19 |
| 2C | none | 182 | 9/10/**10**/11/13 |
| 2C | fav | 201 | 8/12/**13**/14/17 |
| 2C | unfav | 286 | 10/11/**11**/13/16 |
| 2C | both | 207 | 9/9/**11**/12/15 |
| 1NT | none | 93 | 14/16/**17**/17/18 |
| 1NT | fav | 209 | 14/16/**16**/17/18 |
| 1NT | unfav | 101 | 15/15/**16**/17/18 |
| 1NT | both | 239 | 15/15/**16**/18/18 |
| 2D | none | 207 | 6/10/**10**/10/10 |
| 2D | fav | 41 | 9/12/**13**/13/13 |
| 2D | unfav | 64 | 12/12/**12**/12/15 |
| 2D | both | 150 | 6/6/**10**/12/12 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 1S | 8/**9**/11 (503) | 9/**10**/12 (879) | 8/**12**/13 (527) | 10/**11**/12 (379) |
| 1H | 9/**10**/13 (466) | 10/**12**/13 (937) | 8/**10**/13 (497) | 10/**13**/14 (370) |
| X | 10/**15**/15 (420) | 12/**13**/15 (915) | 14/**14**/18 (601) | 14/**16**/18 (95) |
| 2C | 10/**10**/12 (136) | 10/**11**/14 (259) | 11/**11**/13 (302) | 10/**11**/14 (179) |

Anatomy of X: per HCP band, support held (both majors = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | both majors ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 140 | 99% | 61% | 99% | 99% |
| 11–13 | 676 | 99% | 28% | 99% | 79% |
| 14–16 | 712 | 95% | 24% | 100% | 55% |
| 17+ | 503 | 36% | 9% | 98% | 53% |

Dealer filters (paste into the custom filter box; derived from the data):

- `1S` → `s >= 5 and top(s,5) >= 1 and hcp in 7..15`
- `1H` → `h >= 5 and top(h,5) >= 1 and hcp in 7..16`
- `X` → `((hcp in 10..17 and d <= 2 and s >= 3 and h >= 3 and c >= 3) or (hcp in 12..17 and d == 3 and s >= 3 and h >= 3 and c >= 3) or hcp >= 18)`
- `2C` → `c >= 5 and top(c,5) >= 2 and hcp in 9..16`
- `1NT` → `(has(d,a) or (has(d,k) and d >= 2) or (has(d,q) and d >= 3)) and hcp in 14..18` *(+ balanced)*
- `2D` → `s >= 5 and h >= 5 and hcp in 6..13`

### (1H) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 57.7% | 7996 | 707 | 3/6/**8**/10/13 | — | — | 65% |
| 1S | 11.5% | 1591 | 187 | 7/9/**11**/13/16 | 4:3% 5:72% 6:21% 7:3% | **5.4** (3.7–6.5) | 32% |
| X | 11.3% | 1568 | 171 | 10/12/**14**/16/19 | theirs: <1:1% 1:30% 2:42% 3:25% 4+:2% | — | 56% |
| 2C | 3.8% | 528 | 75 | 9/10/**12**/15/17 | 5:20% 6:59% 7:20% | **5.6** (4.6–6.7) | 9% |
| 2D | 3.4% | 464 | 83 | 8/10/**11**/13/16 | 5:23% 6:62% 7:14% | **5.4** (4.4–6.2) | 8% |
| 2H | 2.8% | 394 | 33 | 8/10/**12**/13/14 | 0:39% 1:30% 2:30% | **0.0** (0.0–3.3) | 0% |
| 1NT | 2.8% | 393 | 57 | 14/15/**15**/16/17 | — | — | 84% |
| 2S | 1.9% | 266 | 39 | 6/6/**8**/9/12 | <5:1% 5:5% 6:94% | **4.9** (3.8–5.6) | 1% |
| 2NT | 1.5% | 201 | 21 | 6/11/**11**/11/13 | — | — | 0% |
| 3D | 0.9% | 124 | 22 | 4/7/**8**/10/11 | 5:2% 6:68% 7:30% | **5.2** (5.0–5.3) | 1% |
| 4S | 0.9% | 120 | 13 | 8/11/**11**/11/15 | 6:5% 7:38% 8:56% | **7.6** (5.6–7.6) | 0% |
| 3C | 0.6% | 85 | 30 | 6/9/**10**/12/14 | 0:5% 1:5% 2:16% 5:19% 6:14% 7:41% | **4.1** (2.7–6.4) | 0% |
| 3S | 0.5% | 68 | 16 | 6/6/**7**/8/11 | 6:68% 7:29% 8:3% | **4.7** (3.8–5.6) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1S | none | 227 | 7/8/**10**/12/14 |
| 1S | fav | 426 | 8/11/**12**/14/16 |
| 1S | unfav | 440 | 7/9/**10**/14/16 |
| 1S | both | 498 | 8/10/**12**/12/16 |
| X | none | 402 | 11/13/**13**/15/17 |
| X | fav | 413 | 10/12/**12**/15/17 |
| X | unfav | 430 | 11/13/**14**/18/22 |
| X | both | 323 | 11/11/**14**/16/22 |
| 2C | none | 149 | 8/14/**15**/15/17 |
| 2C | fav | 110 | 9/11/**11**/12/13 |
| 2C | unfav | 72 | 9/11/**11**/12/15 |
| 2C | both | 197 | 9/10/**10**/13/16 |
| 2D | none | 174 | 8/10/**13**/14/16 |
| 2D | fav | 74 | 9/10/**11**/12/13 |
| 2D | unfav | 83 | 9/11/**12**/13/15 |
| 2D | both | 133 | 10/10/**10**/11/16 |
| 2H | none | 50 | 10/13/**13**/13/13 |
| 2H | fav | 139 | 10/12/**12**/13/13 |
| 2H | unfav | 88 | 8/8/**14**/14/16 |
| 2H | both | 117 | 6/10/**10**/12/12 |
| 1NT | none | 94 | 14/15/**15**/15/17 |
| 1NT | fav | 110 | 15/15/**15**/17/17 |
| 1NT | unfav | 131 | 14/15/**15**/15/16 |
| 1NT | both | 58 | 15/17/**17**/17/17 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 1S | 7/**11**/13 (314) | 9/**10**/13 (568) | 11/**12**/13 (476) | 10/**13**/14 (233) |
| X | 11/**12**/14 (484) | 12/**13**/15 (665) | 15/**16**/17 (386) | 12/**14**/15 (33) |
| 2C | 10/**11**/15 (213) | 9/**12**/13 (101) | 10/**11**/14 (207) | — |
| 2D | 10/**12**/14 (169) | 10/**10**/11 (170) | 11/**11**/12 (62) | 11/**13**/13 (63) |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 89 | 100% | 91% | 100% | 99% |
| 11–13 | 673 | 100% | 81% | 99% | 86% |
| 14–16 | 495 | 100% | 63% | 98% | 67% |
| 17+ | 311 | 70% | 46% | 99% | 48% |

Dealer filters (paste into the custom filter box; derived from the data):

- `1S` → `s >= 5 and top(s,5) >= 1 and ((hcp in 6..16 and h <= 2) or (hcp in 8..16 and h in 3..4))`
- `X` → `((hcp in 10..17 and h <= 2 and s >= 3 and d >= 2 and c >= 2) or (hcp in 12..17 and h == 3 and s >= 3 and d >= 2 and c >= 2) or hcp >= 18)`
- `2C` → `c >= 5 and top(c,5) >= 2 and hcp in 9..17`
- `2D` → `d >= 5 and top(d,5) >= 1 and ((hcp in 8..16 and h <= 2) or (hcp in 10..16 and h in 3..4))`
- `2H` → `s >= 5 and ((hcp in 8..14 and d >= 5) or (hcp in 8..14 and c >= 5))`
- `1NT` → `hcp in 14..17` *(+ balanced)*

### (1S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 68.1% | 10272 | 808 | 4/6/**8**/10/13 | — | — | 60% |
| X | 7.4% | 1122 | 202 | 11/12/**13**/15/19 | theirs: 0:5% 1:23% 2:43% 3:23% 4:6% | — | 56% |
| 2H | 6.5% | 975 | 114 | 10/10/**12**/14/15 | 5:45% 6:50% 7:4% | **5.6** (4.3–6.4) | 12% |
| 2D | 5.7% | 857 | 89 | 8/10/**11**/13/16 | 5:24% 6:57% 7:19% | **6.3** (5.1–7.2) | 18% |
| 2C | 3.7% | 551 | 78 | 8/10/**11**/15/16 | 5:32% 6:52% 7:16% | **4.6** (4.4–6.3) | 11% |
| 1NT | 2.8% | 415 | 72 | 14/15/**16**/17/18 | — | — | 77% |
| 2S | 1.1% | 169 | 24 | 6/7/**12**/12/15 | 0:12% 1:75% 2:12% 3+:1% | **0.0** (0.0–0.0) | 1% |
| 3C | 1.1% | 161 | 40 | 4/5/**8**/10/12 | 1:11% 2:4% 3:5% 5:5% 6:24% 7:52% | **4.5** (4.1–5.2) | 0% |
| 3D | 1.0% | 153 | 26 | 7/8/**9**/10/11 | <6:2% 6:46% 7:49% 8:3% | **5.9** (5.1–6.7) | 1% |
| 3H | 0.9% | 140 | 20 | 4/8/**8**/10/12 | 6:46% 7:54% | **4.3** (4.0–7.0) | 0% |
| 2NT | 0.8% | 124 | 22 | 7/10/**11**/12/15 | — | — | 0% |
| 4H | 0.4% | 55 | 11 | 8/10/**12**/15/16 | 6:51% 7:36% 8:13% | **7.0** (6.3–7.1) | 0% |
| 4C | 0.2% | 35 | 5 | 4/4/**7**/8/8 | 7:94% 8:6% | **4.3** (4.1–5.2) | 0% |
| 4D | 0.2% | 30 | 6 | 7/7/**7**/10/13 | 6:13% 7:80% 8:7% | **6.0** (5.1–6.0) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 184 | 10/13/**14**/14/17 |
| X | fav | 230 | 10/13/**13**/16/21 |
| X | unfav | 274 | 11/13/**14**/15/18 |
| X | both | 434 | 11/12/**13**/15/19 |
| 2H | none | 371 | 11/11/**12**/14/15 |
| 2H | fav | 140 | 9/10/**10**/12/15 |
| 2H | unfav | 217 | 9/10/**13**/13/16 |
| 2H | both | 247 | 9/10/**11**/14/14 |
| 2D | none | 196 | 7/10/**11**/12/14 |
| 2D | fav | 165 | 9/10/**10**/13/15 |
| 2D | unfav | 332 | 10/10/**11**/13/17 |
| 2D | both | 164 | 8/10/**13**/13/15 |
| 2C | none | 65 | 10/11/**12**/13/14 |
| 2C | fav | 272 | 8/10/**11**/15/16 |
| 2C | unfav | 74 | 9/9/**11**/12/15 |
| 2C | both | 140 | 10/11/**14**/14/15 |
| 1NT | none | 87 | 14/15/**15**/17/18 |
| 1NT | fav | 166 | 15/15/**17**/17/17 |
| 1NT | unfav | 48 | 15/15/**16**/18/18 |
| 1NT | both | 114 | 15/15/**15**/16/17 |
| 2S | none | 94 | 7/7/**12**/12/12 |
| 2S | fav | 37 | 6/6/**10**/15/15 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 12/**13**/14 (309) | 12/**14**/15 (478) | 13/**14**/15 (263) | 13/**18**/19 (72) |
| 2H | 10/**11**/13 (357) | 11/**12**/14 (421) | 11/**12**/15 (148) | 11/**11**/13 (49) |
| 2D | 10/**11**/13 (275) | 10/**12**/12 (239) | 10/**13**/13 (237) | 10/**10**/11 (106) |
| 2C | 10/**11**/16 (181) | 10/**13**/15 (199) | 11/**12**/14 (91) | 10/**10**/12 (80) |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 42 | 93% | 81% | 81% | 88% |
| 11–13 | 527 | 100% | 80% | 99% | 72% |
| 14–16 | 419 | 98% | 53% | 100% | 74% |
| 17+ | 134 | 67% | 56% | 84% | 44% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 11..16 and s <= 2 and h >= 3 and d >= 2 and c >= 2) or (hcp in 12..16 and s == 3 and h >= 3 and d >= 2 and c >= 2) or hcp >= 17)`
- `2H` → `h >= 5 and top(h,5) >= 1 and (hcp >= 11 or top(h,5) >= 2) and ((hcp in 9..15 and s <= 2) or (hcp in 10..15 and s in 3..4))`
- `2D` → `d >= 5 and top(d,5) >= 2 and ((hcp in 8..16 and s <= 2) or (hcp in 10..16 and s in 3..4))`
- `2C` → `c >= 5 and top(c,5) >= 2 and ((hcp in 8..16 and s <= 2) or (hcp in 10..16 and s in 3..4))`
- `1NT` → `(has(s,a) or (has(s,k) and s >= 2) or (has(s,q) and s >= 3)) and hcp in 14..18`
- `2S` → `h >= 5 and ((hcp in 6..15 and d >= 5) or (hcp in 6..15 and c >= 5))`

### (1NT) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 78.1% | 13000 | 1392 | 3/6/**8**/10/14 | — | — | 57% |
| X | 5.7% | 949 | 303 | 9/12/**15**/17/19 | — | — | 33% |
| 2D | 4.9% | 818 | 180 | 6/9/**11**/12/16 | <1:1% 1:13% 2:40% 3:24% 4:13% 5:7% 6:3% | **3.8** (1.5–5.6) | 2% |
| 2C | 4.4% | 730 | 163 | 6/10/**12**/13/15 | 0:4% 1:30% 2:39% 3:20% 4:3% 5:3% | **1.1** (0.2–3.7) | 1% |
| 2H | 2.5% | 411 | 107 | 7/10/**12**/13/16 | <2:1% 2:3% 3:3% 4:3% 5:61% 6:27% 7:3% | **4.9** (3.8–5.9) | 1% |
| 2S | 1.7% | 286 | 82 | 8/10/**11**/13/15 | <5:2% 5:63% 6:31% 7:4% | **4.8** (4.0–5.0) | 1% |
| 3D | 0.7% | 109 | 28 | 6/9/**10**/11/15 | <6:2% 6:40% 7:42% 8:16% | **6.1** (4.4–6.6) | 0% |
| 3C | 0.5% | 81 | 24 | 5/8/**10**/11/14 | 5:2% 6:28% 7:52% 8:17% | **4.7** (4.1–5.8) | 0% |
| 3H | 0.4% | 59 | 14 | 3/3/**7**/10/13 | <6:2% 6:15% 7:81% 8+:2% | **4.1** (4.0–5.8) | 0% |
| 4D | 0.3% | 46 | 4 | 9/9/**9**/9/10 | 5:2% 7:2% 8:96% | **4.4** (4.4–4.4) | 0% |
| 2NT | 0.2% | 41 | 14 | 5/5/**10**/13/14 | — | — | 0% |
| 3S | 0.2% | 37 | 10 | 4/9/**10**/10/13 | 6:38% 7:62% | **4.7** (4.7–6.1) | 0% |
| 4H | 0.2% | 33 | 4 | 9/10/**10**/10/15 | 7:21% 8:79% | **6.5** (6.5–6.5) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 364 | 10/11/**14**/16/18 |
| X | fav | 101 | 9/10/**13**/15/18 |
| X | unfav | 297 | 11/14/**15**/17/19 |
| X | both | 187 | 9/14/**16**/19/19 |
| 2D | none | 242 | 3/9/**11**/13/17 |
| 2D | fav | 70 | 4/7/**10**/12/13 |
| 2D | unfav | 202 | 6/9/**10**/12/15 |
| 2D | both | 304 | 7/10/**11**/12/13 |
| 2C | none | 182 | 8/9/**11**/13/17 |
| 2C | fav | 250 | 6/11/**11**/13/14 |
| 2C | unfav | 106 | 7/10/**12**/12/15 |
| 2C | both | 192 | 6/11/**13**/13/15 |
| 2H | none | 162 | 5/11/**12**/15/17 |
| 2H | fav | 28 | 8/11/**11**/12/13 |
| 2H | unfav | 164 | 6/10/**12**/12/14 |
| 2H | both | 57 | 7/10/**11**/12/14 |
| 2S | none | 114 | 9/11/**11**/13/17 |
| 2S | fav | 42 | 8/8/**9**/10/11 |
| 2S | unfav | 65 | 8/10/**12**/14/16 |
| 2S | both | 65 | 7/10/**10**/13/13 |
| 3D | none | 57 | 9/10/**11**/11/11 |
| 3D | fav | 26 | 8/9/**9**/9/10 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 9..19`
- `2D` → `((hcp in 6..16 and s >= 5) or (hcp in 6..16 and h >= 5))`
- `2C` → `(hcp in 6..15 and s >= 4 and h >= 4)`
- `2H` → `h >= 4 and top(h,5) >= 1 and hcp in 7..16`
- `2S` → `s >= 5 and top(s,5) >= 1 and ((hcp in 8..15 and d >= 4) or (hcp in 8..15 and c >= 4))`
- `3D` → `d >= 6 and top(d,5) >= 2 and hcp in 6..15`

### (2C) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 73.3% | 1973 | 455 | 2/5/**7**/9/13 | — | — | 55% |
| X | 8.0% | 215 | 86 | 9/13/**15**/17/20 | theirs: 1:25% 2:40% 3:19% 4:6% 5:4% 6:6% | — | 54% |
| 2S | 5.5% | 147 | 64 | 4/8/**11**/13/15 | <5:1% 5:40% 6:49% 7:9% | **4.9** (3.7–5.9) | 16% |
| 2H | 5.4% | 145 | 49 | 7/10/**12**/14/17 | <5:1% 5:45% 6:45% 7:9% | **5.0** (4.4–5.4) | 12% |
| 2D | 2.4% | 65 | 38 | 7/8/**11**/15/17 | 0:3% 2:3% 3:3% 4:2% 5:45% 6:35% 7:2% 8:8% | **4.6** (4.0–6.2) | 20% |
| 2NT | 1.4% | 38 | 20 | 4/15/**16**/17/18 | — | — | 68% |
| 3D | 1.2% | 33 | 8 | 7/8/**8**/12/14 | 1:6% 6:27% 7:3% 8:64% | **4.0** (4.0–4.0) | 0% |
| 3C | 1.1% | 30 | 20 | 6/12/**13**/14/15 | 0:3% 1:33% 2:13% 5:10% 6:23% 7:10% 8:7% | **4.6** (1.7–6.6) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 67 | 10/12/**16**/17/21 |
| X | fav | 40 | 9/13/**16**/16/20 |
| X | unfav | 77 | 9/13/**15**/17/20 |
| X | both | 31 | 10/12/**14**/16/19 |
| 2S | none | 68 | 5/7/**11**/14/14 |
| 2S | unfav | 30 | 9/10/**12**/13/16 |
| 2S | both | 32 | 2/8/**10**/12/13 |
| 2H | none | 52 | 6/9/**12**/14/17 |
| 2H | unfav | 48 | 7/10/**10**/12/16 |
| 2H | both | 34 | 8/12/**13**/16/17 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 12/**14**/18 (55) | 15/**16**/17 (85) | 14/**15**/15 (41) | 9/**13**/16 (34) |
| 2S | 8/**9**/12 (54) | 10/**11**/14 (50) | 7/**12**/13 (29) | — |
| 2H | 8/**12**/13 (53) | 10/**12**/14 (66) | 13/**16**/17 (15) | — |

Anatomy of X: per HCP band, support held (both majors = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | both majors ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 16 | 63% | 25% | 69% | 31% |
| 11–13 | 51 | 88% | 49% | 96% | 65% |
| 14–16 | 80 | 94% | 43% | 100% | 61% |
| 17+ | 68 | 84% | 4% | 87% | 78% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 9..17 and c <= 4 and s >= 3 and h >= 3 and d >= 2) or hcp >= 18)`
- `2S` → `s >= 5 and top(s,5) >= 1 and ((hcp in 4..15 and c <= 2) or (hcp in 7..15 and c in 3..4))`
- `2H` → `h >= 5 and top(h,5) >= 1 and ((hcp in 7..17 and c <= 2) or (hcp in 8..17 and c in 3..4))`
- `2D` → `d >= 4 and top(d,5) >= 1 and hcp in 7..17`

### (2D) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 42.0% | 121 | 624 | 4/8/**9**/12/14 | — | — | 50% |
| X | 22.9% | 66 | 175 | 12/14/**16**/20/24 | theirs: <1:2% 1:17% 2:53% 3:18% 4:9% 5+:2% | — | 55% |
| 2S | 9.4% | 27 | 56 | 9/9/**11**/13/16 | 5:33% 6:37% 7:30% | **6.7** (5.6–7.0) | 26% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 30 | 11/14/**16**/24/24 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 12..17 and d <= 4 and s >= 3 and h >= 3 and c >= 2) or hcp >= 18)`

### (2H) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 56.9% | 1168 | 324 | 2/7/**10**/11/13 | — | — | 54% |
| X | 17.0% | 350 | 102 | 10/13/**14**/17/22 | theirs: 1:27% 2:45% 3:20% 4:6% 5:2% | — | 43% |
| 2S | 10.9% | 223 | 56 | 9/12/**14**/16/16 | <5:2% 5:62% 6:33% 7:3% | **6.3** (3.4–6.8) | 5% |
| 3C | 5.4% | 110 | 24 | 10/13/**13**/14/14 | 5:4% 6:87% 7:7% 8+:2% | **5.6** (4.8–6.7) | 0% |
| 2NT | 4.9% | 101 | 46 | 14/15/**16**/17/17 | — | — | 65% |
| 3D | 2.8% | 57 | 20 | 7/11/**12**/13/16 | 5:14% 6:47% 7:39% | **6.6** (5.3–6.6) | 5% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 110 | 10/13/**14**/17/20 |
| X | fav | 102 | 12/13/**13**/17/17 |
| X | unfav | 92 | 10/13/**14**/16/22 |
| X | both | 46 | 11/11/**16**/19/22 |
| 2S | none | 71 | 8/12/**14**/14/14 |
| 2S | fav | 62 | 12/15/**16**/16/17 |
| 2S | unfav | 42 | 10/12/**14**/14/16 |
| 2S | both | 48 | 8/10/**14**/16/16 |
| 3C | none | 37 | 8/13/**13**/14/17 |
| 3C | unfav | 44 | 13/13/**14**/14/14 |
| 2NT | unfav | 58 | 13/15/**16**/16/18 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 11/**13**/16 (94) | 13/**14**/17 (156) | 13/**13**/17 (71) | 14/**16**/19 (29) |
| 2S | 10/**14**/14 (60) | 13/**14**/16 (68) | 12/**13**/14 (48) | 16/**16**/16 (47) |
| 3C | 13/**13**/13 (37) | — | 13/**14**/14 (60) | — |
| 2NT | — | 16/**17**/17 (30) | 14/**16**/17 (38) | 15/**16**/16 (33) |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 18 | 94% | 94% | 100% | 94% |
| 11–13 | 124 | 96% | 89% | 98% | 66% |
| 14–16 | 109 | 90% | 66% | 94% | 81% |
| 17+ | 99 | 91% | 79% | 80% | 64% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 10..17 and h <= 2 and s >= 3 and d >= 2 and c >= 2) or (hcp in 13..17 and h == 3 and s >= 3 and d >= 2 and c >= 2) or hcp >= 18)`
- `2S` → `s >= 5 and top(s,5) >= 1 and ((hcp in 8..16 and h <= 2) or (hcp in 10..16 and h in 3..4))`
- `3C` → `c >= 6 and top(c,5) >= 2 and ((hcp in 8..14 and h <= 2) or (hcp in 12..14 and h == 3))`
- `2NT` → `(has(h,a) or (has(h,k) and h >= 2) or (has(h,q) and h >= 3)) and hcp in 14..17`
- `3D` → `d >= 5 and top(d,5) >= 2 and hcp in 7..16`

### (2S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 54.9% | 1382 | 270 | 3/7/**10**/11/14 | — | — | 47% |
| X | 21.9% | 551 | 88 | 11/13/**14**/16/20 | theirs: 0:5% 1:40% 2:38% 3:13% 4:4% | — | 32% |
| 3H | 9.4% | 236 | 45 | 10/11/**12**/13/16 | 5:21% 6:78% 7+:1% | **5.2** (4.0–6.7) | 7% |
| 2NT | 7.3% | 183 | 30 | 15/17/**17**/17/18 | — | — | 90% |
| 3C | 2.1% | 53 | 24 | 9/11/**12**/14/16 | 5:26% 6:55% 7:19% | **5.4** (4.5–6.3) | 4% |
| 3D | 2.1% | 53 | 13 | 10/13/**14**/14/16 | 5:6% 6:85% 7:8% 8+:2% | **6.5** (6.2–6.5) | 0% |
| 4H | 1.0% | 26 | 9 | 10/12/**13**/16/16 | 6:62% 7:15% 8:23% | **5.9** (5.4–6.7) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 113 | 12/14/**15**/16/20 |
| X | fav | 133 | 13/13/**15**/16/17 |
| X | unfav | 190 | 11/13/**14**/14/17 |
| X | both | 115 | 12/16/**16**/19/22 |
| 3H | none | 40 | 10/13/**13**/13/16 |
| 3H | fav | 52 | 11/11/**11**/12/15 |
| 3H | unfav | 64 | 10/12/**13**/15/17 |
| 3H | both | 80 | 10/11/**12**/12/14 |
| 2NT | fav | 34 | 16/17/**17**/17/18 |
| 2NT | unfav | 121 | 15/17/**17**/17/18 |
| 3C | both | 26 | 9/11/**13**/14/18 |
| 3D | none | 37 | 10/14/**14**/14/14 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 13/**14**/16 (246) | 14/**14**/16 (210) | 14/**16**/16 (73) | 17/**18**/18 (22) |
| 3H | 11/**12**/12 (95) | 11/**11**/14 (63) | 13/**13**/13 (67) | — |
| 2NT | — | — | 17/**17**/17 (121) | 16/**17**/17 (53) |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 15 | 100% | 87% | 87% | 93% |
| 11–13 | 131 | 100% | 80% | 99% | 91% |
| 14–16 | 306 | 100% | 58% | 100% | 84% |
| 17+ | 99 | 98% | 82% | 80% | 68% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 11..17 and s <= 2 and h >= 3 and d >= 2 and c >= 2) or (hcp in 13..17 and s == 3 and h >= 3 and d >= 2 and c >= 2) or hcp >= 18)`
- `3H` → `h >= 5 and top(h,5) >= 2 and ((hcp in 10..16 and s <= 2) or (hcp in 12..16 and s == 3))`
- `2NT` → `(has(s,a) or (has(s,k) and s >= 2) or (has(s,q) and s >= 3)) and hcp in 15..18` *(+ balanced)*
- `3C` → `c >= 5 and top(c,5) >= 2 and hcp in 9..16`
- `3D` → `d >= 6 and top(d,5) >= 2 and hcp in 10..16`

### (2NT) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 97.5% | 2245 | 243 | 2/4/**6**/8/12 | — | — | 51% |
| X | 1.1% | 26 | 14 | 12/14/**18**/21/21 | — | — | 58% |

### (3C) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 45.2% | 439 | 71 | 4/8/**10**/11/15 | — | — | 36% |
| X | 24.1% | 234 | 32 | 10/15/**16**/18/20 | theirs: 0:13% 1:22% 2:9% 3:49% 4:6% | — | 58% |
| 3H | 10.1% | 98 | 11 | 8/11/**11**/11/16 | 5:7% 6:93% | **5.1** (5.1–5.1) | 2% |
| 3NT | 8.4% | 82 | 14 | 15/16/**17**/18/18 | — | — | 67% |
| 3D | 4.1% | 40 | 9 | 8/11/**11**/15/15 | 0:3% 5:3% 6:83% 7:13% | **6.2** (5.9–6.2) | 0% |
| 4C | 4.0% | 39 | 4 | 14/14/**14**/14/14 | 0:85% 1:13% 2:3% | **0.0** (0.0–0.0) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 62 | 14/16/**17**/17/19 |
| X | unfav | 145 | 10/15/**15**/18/20 |
| 3H | none | 76 | 11/11/**11**/11/11 |
| 3NT | none | 34 | 16/16/**17**/17/19 |
| 3NT | unfav | 45 | 15/16/**18**/18/18 |
| 3D | unfav | 34 | 10/11/**11**/15/15 |
| 4C | unfav | 33 | 14/14/**14**/14/14 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 10/**16**/19 (82) | 15/**16**/17 (22) | 15/**15**/17 (114) | 15/**16**/16 (16) |

Anatomy of X: per HCP band, support held (both majors = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | both majors ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 29 | 97% | 97% | 100% | 100% |
| 14–16 | 92 | 97% | 63% | 90% | 23% |
| 17+ | 109 | 95% | 25% | 100% | 46% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 10..17 and c <= 2 and s >= 3 and h >= 3 and d >= 2) or (hcp in 15..17 and c == 3 and s >= 3 and h >= 3 and d >= 2) or hcp >= 18)`
- `3H` → `h >= 6 and top(h,5) >= 2 and hcp in 8..16`
- `3NT` → `(has(c,a) or (has(c,k) and c >= 2) or (has(c,q) and c >= 3)) and hcp in 15..18`

### (3D) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 46.7% | 534 | 83 | 7/9/**11**/12/14 | — | — | 52% |
| X | 16.5% | 189 | 46 | 9/13/**13**/16/20 | theirs: 0:12% 1:24% 2:56% 3:7% | — | 53% |
| 3H | 13.4% | 153 | 18 | 12/12/**12**/13/17 | 5:25% 6:74% 7+:1% | **6.2** (3.6–6.2) | 2% |
| 3S | 13.0% | 149 | 16 | 9/11/**11**/14/17 | 5:12% 6:71% 7:16% | **6.7** (6.7–7.8) | 12% |
| 3NT | 4.6% | 53 | 12 | 16/16/**16**/20/21 | — | — | 94% |
| 4S | 3.3% | 38 | 3 | 13/13/**14**/17/17 | 6:18% 7:50% 9:32% | **4.4** (4.4–10.0) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 101 | 12/13/**13**/13/20 |
| X | unfav | 58 | 9/9/**13**/17/19 |
| 3H | unfav | 66 | 10/12/**13**/15/17 |
| 3H | both | 79 | 12/12/**12**/12/17 |
| 3S | none | 34 | 9/9/**10**/13/13 |
| 3S | fav | 34 | 14/14/**14**/14/14 |
| 3S | both | 67 | 11/11/**11**/11/16 |
| 3NT | none | 41 | 16/16/**16**/20/20 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 9/**13**/17 (68) | 13/**13**/14 (106) | — | — |
| 3H | 13/**13**/15 (34) | 12/**12**/12 (84) | 12/**12**/12 (34) | — |
| 3S | — | 11/**11**/14 (125) | — | — |

Anatomy of X: per HCP band, support held (both majors = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | both majors ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 20 | 100% | 100% | 95% | 100% |
| 11–13 | 105 | 95% | 74% | 100% | 99% |
| 14–16 | 21 | 81% | 48% | 90% | 62% |
| 17+ | 43 | 67% | 0% | 100% | 86% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 9..17 and d <= 2 and s >= 3 and h >= 3 and c >= 3) or hcp >= 18)`
- `3H` → `h >= 5 and top(h,5) >= 1 and ((hcp in 10..17 and d <= 2) or (hcp in 12..17 and d == 3))`
- `3S` → `s >= 5 and top(s,5) >= 3 and hcp in 9..17`
- `3NT` → `(has(d,a) or (has(d,k) and d >= 2) or (has(d,q) and d >= 3)) and hcp in 16..21` *(+ balanced)*

### (3H) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 68.4% | 480 | 75 | 2/6/**10**/11/13 | — | — | 48% |
| X | 15.8% | 111 | 23 | 11/14/**15**/17/20 | theirs: 1:36% 2:58% 3:3% 4+:3% | — | 51% |
| 3S | 7.0% | 49 | 14 | 8/10/**10**/12/17 | 5:39% 6:49% 7:12% | **3.3** (3.0–5.9) | 8% |
| 3NT | 5.4% | 38 | 11 | 14/16/**18**/18/18 | — | — | 24% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 37 | 10/14/**14**/14/18 |
| X | fav | 39 | 13/15/**17**/17/20 |
| X | unfav | 32 | 11/14/**14**/16/16 |
| 3NT | unfav | 25 | 14/16/**18**/18/18 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 14/**14**/14 (41) | 14/**16**/17 (64) | — | — |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| 14–16 | 67 | 100% | 76% | 99% | 99% |
| 17+ | 30 | 93% | 93% | 93% | 93% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 11..16 and h <= 2 and s >= 3 and d >= 3 and c >= 3) or hcp >= 17)`

### (3S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 80.6% | 673 | 68 | 3/5/**10**/12/13 | — | — | 46% |
| X | 8.3% | 69 | 18 | 12/14/**16**/16/18 | theirs: <1:1% 1:12% 2:58% 3:22% 4:7% | — | 33% |
| 3NT | 6.7% | 56 | 8 | 11/17/**17**/17/18 | — | — | 77% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 3NT | unfav | 43 | 17/17/**17**/17/18 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 12..16 and s <= 3 and h >= 3 and d >= 2 and c >= 2) or hcp >= 17)`
- `3NT` → `(has(s,a) or (has(s,k) and s >= 2) or (has(s,q) and s >= 3)) and hcp in 11..18`

### (3NT) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 60.5% | 92 | 38 | 5/8/**10**/13/14 | — | — | 34% |
| X | 24.3% | 37 | 11 | 10/13/**13**/14/15 | — | — | 14% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | fav | 25 | 13/13/**13**/13/15 |

### (4H) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 80.5% | 368 | 42 | 4/9/**10**/11/15 | — | — | 50% |
| 4S | 13.8% | 63 | 8 | 8/9/**10**/12/14 | <5:2% 5:35% 6:63% | **6.7** (5.6–7.6) | 2% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 4S | unfav | 31 | 8/8/**12**/14/14 |

Dealer filters (paste into the custom filter box; derived from the data):

- `4S` → `s >= 5 and top(s,5) >= 2 and hcp in 8..14`

### (4S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 81.0% | 406 | 52 | 5/9/**10**/11/14 | — | — | 32% |
| 4NT | 8.0% | 40 | 6 | 10/15/**21**/21/21 | — | — | 0% |
| X | 6.6% | 33 | 10 | 11/15/**16**/17/21 | theirs: 1:24% 2:55% 3:3% 4:18% | — | 6% |

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
| 1C natural (3+) | 20298 | 49% | 8% | 39% | 4% | 51% |
| 1C short (2+) | 763 | 56% | 6% | 36% | 2% | 44% |
| 1C strong | 3287 | 62% | 4% | 32% | 2% | 38% |
| 1C Polish | 267 | 60% | 4% | 33% | 4% | 40% |
| 1D natural | 20068 | 51% | 10% | 35% | 4% | 49% |
| 1D nebulous | 1209 | 51% | 10% | 34% | 4% | 49% |
| 1H (any) | 13850 | 58% | 11% | 27% | 4% | 42% |
| 1S (any) | 15088 | 68% | 7% | 21% | 4% | 32% |

Action rate at fixed own strength (the fair comparison):

| opening faced | 6–8 HCP | 9–11 HCP | 12–14 HCP | 15+ HCP |
|---|---|---|---|---|
| 1C natural (3+) | 28% | 59% | 76% | 98% |
| 1C short (2+) | 26% | 48% | 72% | 93% |
| 1C strong | 33% | 48% | 67% | 69% |
| 1C Polish | 30% | 48% | 59% | — |
| 1D natural | 27% | 56% | 65% | 96% |
| 1D nebulous | 26% | 59% | 57% | 96% |
| 1H (any) | 21% | 41% | 65% | 96% |
| 1S (any) | 9% | 30% | 58% | 97% |

### (1C = strong, Precision-style) ? — for comparison

| action | n | HCP p5/p25/med/p75/p95 | bid-suit len | texture |
|---|---|---|---|---|
| P | 2050 | 2/5/**7**/9/13 | — | — |
| 1S | 256 | 5/8/**10**/12/15 | <4:4% 4:4% 5:77% 6:12% 7+:2% | **4.2** (3.2–5.3) |
| 1H | 271 | 5/7/**10**/12/14 | <2:1% 2:3% 3:2% 4:5% 5:70% 6:18% 7+:2% | **4.3** (3.3–5.9) |
| X | 116 | 6/8/**11**/14/19 | — | — |
| 1D | 178 | 6/7/**9**/11/15 | <2:1% 2:5% 3:6% 4:10% 5:51% 6:24% 7:3% 8+:1% | **4.6** (3.3–5.7) |
| 1NT | 48 | 4/7/**11**/15/16 | — | — |
| 2H | 41 | 3/6/**7**/10/13 | 0:5% 1:5% 3:5% 4:2% 5:20% 6:56% 7:7% | **4.0** (3.1–6.4) |
| 2S | 59 | 3/5/**6**/10/12 | <5:3% 5:15% 6:80% 7+:2% | **4.1** (3.8–5.0) |
| 2C | 80 | 6/8/**9**/12/14 | 1:11% 2:6% 3:1% 4:1% 5:31% 6:46% 7:3% | **5.7** (2.8–6.8) |
| 2D | 47 | 4/7/**8**/10/13 | 0:4% 1:4% 2:13% 3:17% 4:4% 5:9% 6:45% 7:4% | **4.1** (1.2–5.4) |
| 3D | 37 | 7/8/**9**/10/13 | 6:62% 7:5% 8:32% | **5.0** (4.0–6.4) |

## Balancing seat: (opening) P (P) ?

Includes balancing over weak twos and preempts — the classic "protect with less" seat.

### (1C) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| X | 34.6% | 85 | 27 | 10/11/**14**/17/18 | theirs: 1:40% 2:19% 3:35% 4:2% 5:2% 6+:1% | — | 46% |
| P | 26.0% | 64 | 31 | 7/8/**8**/10/13 | — | — | 72% |
| 1S | 15.4% | 38 | 10 | 10/10/**12**/14/14 | 5:95% 6:5% | **4.4** (2.6–4.6) | 37% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | unfav | 47 | 11/11/**12**/17/18 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 8..17 and c <= 2 and s >= 3 and h >= 3 and d >= 2) or (hcp in 10..17 and c == 3 and s >= 3 and h >= 3 and d >= 2) or hcp >= 18)`

### (1D) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| X | 36.2% | 172 | 45 | 8/9/**11**/16/19 | theirs: 0:6% 1:8% 2:46% 3:28% 4:7% 5:5% | — | 60% |
| P | 21.1% | 100 | 30 | 5/8/**8**/8/9 | — | — | 55% |
| 1H | 19.2% | 91 | 16 | 6/9/**14**/14/14 | <5:1% 5:97% 6:2% | **7.5** (4.1–7.5) | 1% |
| 1S | 9.7% | 46 | 12 | 8/10/**12**/12/15 | 5:100% | **4.6** (4.4–4.6) | 28% |
| 1NT | 6.9% | 33 | 13 | 11/11/**13**/14/16 | — | — | 100% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | fav | 44 | 9/12/**18**/19/19 |
| X | unfav | 47 | 8/11/**11**/16/17 |
| X | both | 59 | 8/9/**9**/9/15 |
| 1H | none | 62 | 12/14/**14**/14/14 |
| 1S | fav | 26 | 12/12/**12**/12/14 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 9/**14**/14 (24) | 9/**9**/12 (79) | 11/**12**/19 (48) | 17/**18**/18 (21) |

Anatomy of X: per HCP band, support held (both majors = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | both majors ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 67 | 93% | 18% | 100% | 96% |
| 11–13 | 35 | 97% | 20% | 100% | 20% |
| 14–16 | 32 | 63% | 25% | 100% | 91% |
| 17+ | 38 | 68% | 45% | 37% | 8% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 8..17 and d <= 2 and s >= 3 and h >= 3 and c >= 3) or (hcp in 11..17 and d in 3..4 and s >= 3 and h >= 3 and c >= 3) or hcp >= 18)`
- `1H` → `h >= 5 and top(h,5) >= 1 and hcp in 6..14`

### (1H) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 37.7% | 159 | 26 | 5/7/**9**/10/11 | — | — | 62% |
| X | 28.0% | 118 | 25 | 7/10/**15**/22/22 | theirs: 1:5% 2:38% 3:53% 4:4% | — | 48% |
| 1NT | 10.2% | 43 | 14 | 10/11/**11**/14/15 | — | — | 56% |
| 1S | 10.2% | 43 | 15 | 7/7/**8**/11/15 | 1:2% 5:58% 6:40% | **5.1** (2.2–5.4) | 47% |
| 3NT | 5.9% | 25 | 1 | 22/22/**22**/22/22 | — | — | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 48 | 7/22/**22**/22/22 |
| X | both | 44 | 10/10/**11**/15/16 |
| 1NT | both | 27 | 10/11/**11**/11/16 |
| 3NT | none | 25 | 22/22/**22**/22/22 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | — | 10/**10**/15 (45) | 16/**22**/22 (62) | — |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 34 | 100% | 38% | 100% | 88% |
| 14–16 | 37 | 100% | 68% | 62% | 43% |
| 17+ | 41 | 100% | 5% | 5% | 2% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 7..17 and h <= 2 and s >= 3) or (hcp in 15..17 and h == 3 and s >= 3) or hcp >= 18)`

### (1S) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| X | 41.4% | 221 | 35 | 9/9/**10**/16/16 | theirs: 1:47% 2:45% 3:5% 4+:2% | — | 38% |
| P | 33.0% | 176 | 45 | 5/5/**7**/9/11 | — | — | 60% |
| 1NT | 8.8% | 47 | 20 | 9/10/**11**/15/16 | — | — | 72% |
| 2C | 6.9% | 37 | 8 | 9/9/**13**/13/15 | 5:84% 6:16% | **6.0** (5.3–7.1) | 0% |
| 2H | 4.9% | 26 | 6 | 10/10/**10**/15/15 | 5:96% 7:4% | **5.8** (5.8–6.8) | 8% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 46 | 10/10/**10**/15/15 |
| X | fav | 72 | 10/15/**16**/16/17 |
| X | unfav | 26 | 7/10/**12**/15/15 |
| X | both | 77 | 9/9/**9**/9/13 |
| 2C | both | 28 | 9/9/**13**/13/13 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 9/**9**/10 (104) | 10/**15**/16 (100) | — | — |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 119 | 100% | 48% | 100% | 100% |
| 11–13 | 26 | 88% | 35% | 100% | 92% |
| 14–16 | 67 | 97% | 78% | 91% | 85% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 9..15 and s <= 2 and h >= 3 and d >= 3 and c >= 3) or hcp >= 16)`

### (1NT) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 61.8% | 1748 | 342 | 4/7/**9**/10/13 | — | — | 78% |
| X | 10.8% | 306 | 123 | 8/10/**12**/15/17 | — | — | 44% |
| 2D | 6.9% | 194 | 54 | 6/9/**9**/11/15 | <1:2% 1:5% 2:24% 3:31% 4:26% 5:10% 6:2% | **3.7** (1.1–4.4) | 13% |
| 2C | 6.4% | 181 | 64 | 6/7/**8**/10/13 | 0:11% 1:17% 2:14% 3:25% 4:19% 5:12% 6+:2% | **2.8** (0.2–4.5) | 16% |
| 2H | 5.9% | 166 | 43 | 7/8/**10**/11/13 | <4:3% 4:3% 5:80% 6:8% 7:5% | **4.4** (3.8–5.9) | 5% |
| 2S | 5.6% | 159 | 25 | 6/9/**11**/13/16 | 5:65% 6:34% | **4.0** (2.7–4.9) | 14% |
| 3H | 1.3% | 37 | 1 | 9/9/**9**/9/9 | 7:100% | **4.4** (4.4–4.4) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 105 | 8/10/**14**/15/17 |
| X | fav | 48 | 8/10/**11**/12/15 |
| X | unfav | 92 | 7/11/**14**/16/18 |
| X | both | 61 | 7/10/**10**/13/15 |
| 2D | none | 76 | 7/8/**9**/9/15 |
| 2D | unfav | 60 | 6/9/**11**/11/11 |
| 2D | both | 40 | 8/9/**9**/10/11 |
| 2C | none | 73 | 5/8/**8**/10/14 |
| 2C | fav | 35 | 7/8/**11**/12/14 |
| 2C | unfav | 28 | 7/7/**9**/12/13 |
| 2C | both | 45 | 7/7/**8**/10/10 |
| 2H | none | 36 | 7/7/**8**/8/15 |
| 2H | fav | 85 | 9/9/**11**/11/11 |
| 2H | unfav | 25 | 8/10/**10**/11/14 |
| 2S | none | 72 | 6/8/**9**/15/16 |
| 2S | unfav | 60 | 7/11/**13**/13/13 |
| 3H | both | 37 | 9/9/**9**/9/9 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 8..17`
- `2D` → `((hcp in 6..15 and s >= 5) or (hcp in 6..15 and h >= 5))`
- `2C` → `(hcp in 6..13 and s >= 4 and h >= 4)`
- `2H` → `h >= 5 and top(h,5) >= 2 and ((hcp in 7..13 and d >= 4) or (hcp in 7..13 and c >= 4))`
- `2S` → `s >= 5 and top(s,5) >= 1 and hcp in 6..16`

### (2D) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 44.4% | 63 | 41 | 4/7/**9**/11/12 | — | — | 71% |
| X | 28.2% | 40 | 29 | 8/11/**12**/18/19 | theirs: 0:3% 1:33% 2:33% 3:25% 4:8% | — | 50% |

### (2H) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 57.4% | 241 | 79 | 5/8/**9**/10/14 | — | — | 71% |
| X | 20.5% | 86 | 27 | 9/10/**11**/12/17 | theirs: <1:1% 1:13% 2:65% 3:13% 4:8% | — | 72% |
| 2NT | 6.4% | 27 | 9 | 14/14/**16**/17/17 | — | — | 93% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | unfav | 42 | 10/10/**11**/11/13 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 9..16 and h <= 3 and s >= 3 and d >= 3 and c >= 3) or hcp >= 17)`

### (2S) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 39.3% | 258 | 86 | 6/8/**9**/11/14 | — | — | 65% |
| X | 31.8% | 209 | 45 | 9/12/**14**/19/21 | theirs: 1:31% 2:29% 3:38% | — | 46% |
| 2NT | 10.2% | 67 | 15 | 14/15/**15**/15/17 | — | — | 87% |
| 3H | 7.0% | 46 | 10 | 9/14/**14**/14/15 | 5:24% 6:76% | **4.5** (4.5–4.5) | 4% |
| 3D | 5.2% | 34 | 8 | 8/11/**14**/16/16 | 5:3% 6:91% 7:6% | **6.4** (5.3–6.4) | 3% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 81 | 9/10/**14**/15/19 |
| X | fav | 46 | 10/16/**21**/21/21 |
| X | unfav | 45 | 10/11/**14**/20/20 |
| X | both | 37 | 9/12/**14**/14/15 |
| 2NT | none | 37 | 14/15/**15**/15/17 |
| 3H | none | 36 | 9/14/**14**/14/14 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 14/**14**/21 (66) | 9/**11**/16 (61) | 14/**15**/19 (80) | — |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 37 | 100% | 89% | 100% | 86% |
| 11–13 | 29 | 100% | 86% | 93% | 83% |
| 14–16 | 80 | 100% | 84% | 86% | 49% |
| 17+ | 63 | 100% | 59% | 81% | 51% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 9..17 and s <= 2 and h >= 4 and d >= 2 and c >= 2) or (hcp in 10..17 and s == 3 and h >= 4 and d >= 2 and c >= 2) or hcp >= 18)`
- `2NT` → `(has(s,a) or (has(s,k) and s >= 2) or (has(s,q) and s >= 3)) and hcp in 14..17` *(+ balanced)*

### (3C) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 38.6% | 118 | 33 | 2/7/**8**/9/13 | — | — | 74% |
| X | 28.1% | 86 | 16 | 10/14/**15**/17/19 | theirs: 0:3% 1:40% 2:26% 3:29% 4:2% | — | 42% |
| 3NT | 18.3% | 56 | 10 | 14/17/**17**/18/21 | — | — | 96% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 42 | 14/15/**15**/15/18 |
| X | unfav | 33 | 8/10/**14**/17/17 |
| 3NT | unfav | 36 | 17/17/**17**/17/21 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 8..17 and c <= 2 and s >= 3 and h >= 3 and d >= 3) or (hcp in 15..17 and c == 3 and s >= 3 and h >= 3 and d >= 3) or hcp >= 18)`
- `3NT` → `(has(c,a) or (has(c,k) and c >= 2) or (has(c,q) and c >= 3)) and hcp in 14..21` *(+ balanced)*

### (3D) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 60.9% | 181 | 40 | 6/8/**8**/11/12 | — | — | 66% |
| X | 18.5% | 55 | 24 | 8/11/**12**/18/20 | theirs: <1:2% 1:22% 2:60% 3:16% | — | 47% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | unfav | 28 | 8/12/**12**/13/20 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 8..17 and d <= 3 and s >= 3 and h >= 3 and c >= 2) or hcp >= 18)`

### (3H) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 55.1% | 113 | 33 | 7/8/**9**/11/16 | — | — | 74% |
| X | 15.1% | 31 | 12 | 9/11/**12**/14/17 | theirs: 1:55% 2:26% 3:6% 4:13% | — | 26% |
| 4S | 14.1% | 29 | 3 | 17/17/**17**/17/18 | 5:7% 6:90% 7:3% | **6.2** (6.2–6.2) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 4S | none | 27 | 17/17/**17**/17/17 |

### (3S) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 59.4% | 155 | 33 | 6/9/**10**/11/14 | — | — | 47% |
| 3NT | 13.8% | 36 | 9 | 11/11/**15**/19/20 | — | — | 44% |
| X | 12.3% | 32 | 13 | 10/13/**13**/14/19 | theirs: 1:69% 2:25% 3:6% | — | 13% |
| 4H | 9.6% | 25 | 4 | 14/14/**16**/16/20 | 5:16% 6:84% | **6.5** (4.5–6.5) | 16% |

### (4H) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 85.1% | 257 | 34 | 4/6/**7**/9/10 | — | — | 7% |

### (4S) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 90.7% | 353 | 48 | 5/8/**8**/10/13 | — | — | 54% |

## Responding after interference: partner opens, RHO acts

Key contexts: 1x (X) ? — redouble/new suits/jump raises; 1x (overcall) ? — negative doubles, raises, free bids. 1C contexts show STANDARD responders (transfer-response pairs are tabulated separately below); 1D contexts use natural openers. After 1M (X) much of the field plays transfers / graded raises (2M−1 constructive, 2M weak or vice versa), so read the **partner's suit** column: when most hands hold 3+ support, the bid is a raise in disguise and its derived rule keys on support + strength band, not the named suit.

### 1C (X) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♣ |
|---|---|---|---|---|---|---|---|---|
| P | 32.0% | 337 | 136 | 0/3/**4**/5/7 | — | — | 64% | 1:2% 2:44% 3:30% 4:19% 5:3% |
| 1D | 16.4% | 173 | 106 | 4/6/**7**/9/11 | <2:2% 2:8% 3:10% 4:15% 5:44% 6:21% | **4.0** (2.2–5.1) | 29% | 0:2% 1:17% 2:33% 3:18% 4:24% 5:2% 6:3% |
| 1H | 15.8% | 167 | 99 | 4/6/**7**/8/9 | 1:8% 2:8% 3:11% 4:47% 5:16% 6:8% | **3.4** (1.6–4.4) | 26% | 1:23% 2:25% 3:22% 4:14% 5:8% 6:7% |
| 1S | 15.8% | 167 | 86 | 4/6/**7**/8/10 | <2:2% 2:4% 3:13% 4:41% 5:25% 6:10% 7:5% | **3.2** (1.7–4.0) | 36% | 1:13% 2:35% 3:21% 4:11% 5:20% |
| XX | 7.7% | 81 | 69 | 9/10/**11**/12/14 | — | — | 60% | 0:6% 1:5% 2:16% 3:37% 4:21% 5:15% |
| 2C | 3.1% | 33 | 37 | 4/6/**7**/7/9 | 1:9% 4:42% 5:39% 6:9% | **2.5** (1.6–4.0) | 58% | 1:9% 4:42% 5:39% 6:9% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1D | none | 49 | 4/5/**8**/9/11 |
| 1D | fav | 68 | 4/6/**7**/8/10 |
| 1D | both | 33 | 4/5/**6**/8/10 |
| 1H | none | 55 | 5/6/**6**/7/8 |
| 1H | fav | 48 | 4/6/**8**/8/9 |
| 1H | unfav | 28 | 4/6/**8**/8/13 |
| 1H | both | 36 | 4/5/**7**/8/9 |
| 1S | none | 66 | 5/6/**7**/8/9 |
| 1S | fav | 30 | 1/6/**8**/8/10 |
| 1S | both | 47 | 5/7/**7**/9/11 |
| XX | both | 36 | 9/10/**11**/11/13 |

Dealer filters (paste into the custom filter box; derived from the data):

- `1D` → `d >= 3 and hcp in 4..11`
- `1H` → `hcp in 4..9`
- `1S` → `s >= 3 and hcp in 4..10`
- `XX` → `hcp in 9..14`

### 1D (X) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♦ |
|---|---|---|---|---|---|---|---|---|
| P | 23.6% | 477 | 112 | 0/1/**4**/5/8 | — | — | 47% | 0:3% 1:33% 2:30% 3:19% 4:10% 5:4% |
| 1H | 23.9% | 484 | 95 | 4/6/**8**/10/12 | <2:2% 2:5% 3:5% 4:32% 5:36% 6:11% 7:9% | **3.5** (2.3–4.7) | 25% | <1:2% 1:27% 2:22% 3:30% 4:17% 5+:2% |
| 1S | 20.2% | 409 | 76 | 3/6/**7**/9/10 | <4:2% 4:42% 5:41% 6:9% 7:6% | **4.2** (2.2–4.8) | 36% | 0:15% 1:18% 2:18% 3:16% 4:20% 5:12% 6+:1% |
| XX | 12.8% | 258 | 73 | 6/9/**11**/12/15 | — | — | 48% | 0:12% 1:11% 2:19% 3:29% 4:11% 5:17% 6+:2% |
| 3D | 5.1% | 104 | 37 | 3/5/**6**/8/9 | <4:2% 4:31% 5:58% 6:6% 7:4% | **2.5** (2.2–3.4) | 25% | <4:2% 4:31% 5:58% 6:6% 7:4% |
| 2D | 4.0% | 80 | 40 | 3/6/**7**/8/12 | 2:6% 3:9% 4:59% 5:23% 6:1% 7:3% | **2.6** (2.2–3.4) | 60% | 2:6% 3:9% 4:59% 5:23% 6:1% 7:3% |
| 2C | 1.9% | 38 | 24 | 4/6/**7**/8/13 | 1:3% 2:5% 3:5% 4:11% 5:11% 6:55% 7:11% | **2.9** (2.8–4.1) | 16% | 0:3% 1:37% 2:29% 3:13% 4:5% 5:11% 7:3% |
| 2S | 1.5% | 31 | 11 | 3/3/**3**/9/15 | 3:26% 5:6% 6:3% 7:65% | **3.4** (3.2–3.4) | 19% | 0:3% 1:58% 2:10% 4:3% 5:23% 6:3% |
| 2NT | 1.3% | 26 | 18 | 3/6/**8**/15/15 | — | — | 46% | 4:15% 5:73% 6:12% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1H | none | 112 | 4/5/**10**/11/11 |
| 1H | fav | 91 | 5/7/**7**/9/10 |
| 1H | unfav | 122 | 6/8/**10**/10/12 |
| 1H | both | 159 | 6/6/**7**/8/14 |
| 1S | none | 82 | 5/8/**10**/10/12 |
| 1S | fav | 68 | 4/6/**7**/10/10 |
| 1S | unfav | 94 | 1/3/**7**/8/12 |
| 1S | both | 165 | 5/6/**7**/8/9 |
| XX | none | 113 | 7/10/**11**/12/15 |
| XX | fav | 45 | 7/9/**9**/10/12 |
| XX | unfav | 60 | 6/11/**12**/13/15 |
| XX | both | 40 | 6/7/**8**/13/14 |
| 3D | unfav | 40 | 2/3/**6**/6/9 |
| 3D | both | 26 | 5/7/**7**/8/8 |

Dealer filters (paste into the custom filter box; derived from the data):

- `1H` → `h >= 3 and hcp in 4..12`
- `1S` → `s >= 4 and top(s,5) >= 1 and hcp in 3..10`
- `XX` → `hcp in 6..15`
- `3D` → `d >= 4 and top(d,5) >= 1 and hcp in 3..9`
- `2D` → `d >= 3 and top(d,5) >= 1 and hcp in 3..12`

### 1H (X) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♥ |
|---|---|---|---|---|---|---|---|---|
| P | 25.0% | 395 | 62 | 0/1/**3**/6/8 | — | — | 32% | <1:1% 1:51% 2:31% 3:16% 4+:1% |
| XX | 11.3% | 178 | 32 | 9/10/**10**/12/17 | — | — | 60% | 1:3% 2:86% 3:6% 4:3% 5+:1% |
| 2NT | 11.2% | 177 | 29 | 8/9/**10**/13/14 | — | — | 83% | <4:2% 4:90% 5:7% |
| 2H | 11.0% | 174 | 43 | 4/5/**6**/7/9 | <3:1% 3:84% 4:14% 5+:1% | **3.0** (1.1–4.0) | 89% | <3:1% 3:84% 4:14% 5+:1% |
| 1S | 10.1% | 160 | 35 | 5/7/**7**/10/12 | <3:2% 3:4% 4:44% 5:39% 6:11% | **4.4** (3.3–4.6) | 31% | 0:8% 1:19% 2:63% 3:8% 4+:2% |
| 4H | 7.7% | 122 | 25 | 4/6/**6**/7/13 | 3:4% 4:14% 5:75% 6:7% | **5.1** (3.2–5.1) | 20% | 3:4% 4:14% 5:75% 6:7% |
| 2D | 7.5% | 118 | 33 | 5/7/**8**/9/14 | <2:2% 2:32% 3:22% 4:15% 5:27% 6+:2% | **3.5** (0.9–4.9) | 70% | <2:3% 2:3% 3:66% 4:28% |
| 3H | 4.0% | 64 | 18 | 4/5/**7**/8/9 | 3:3% 4:91% 5:6% | **4.0** (1.9–4.5) | 66% | 3:3% 4:91% 5:6% |
| 1NT | 3.0% | 47 | 18 | 7/7/**8**/9/10 | — | — | 45% | 1:34% 2:47% 3:9% 4:6% 5:4% |
| 3C | 2.1% | 34 | 16 | 5/6/**8**/9/9 | 0:3% 1:15% 2:15% 3:32% 4:29% 5:6% | **1.1** (0.0–3.4) | 62% | 2:3% 3:6% 4:88% 6:3% |
| 2C | 2.1% | 34 | 11 | 6/6/**7**/7/9 | 0:9% 2:32% 3:35% 4:3% 5:3% 6:18% | **1.9** (1.9–3.0) | 29% | 0:3% 1:47% 2:9% 3:41% |
| 3D | 2.1% | 33 | 14 | 6/9/**9**/9/14 | 1:18% 2:12% 3:52% 4:6% 5:9% 6:3% | **2.3** (0.4–3.8) | 64% | 3:3% 4:79% 5:18% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| XX | none | 27 | 8/10/**13**/17/17 |
| XX | fav | 46 | 9/10/**12**/12/14 |
| XX | unfav | 44 | 9/10/**11**/12/12 |
| XX | both | 61 | 10/10/**10**/10/10 |
| 2NT | none | 57 | 8/13/**14**/14/14 |
| 2NT | unfav | 90 | 9/9/**9**/9/11 |
| 2H | none | 40 | 6/7/**7**/8/9 |
| 2H | fav | 50 | 5/5/**5**/5/7 |
| 2H | unfav | 29 | 4/5/**5**/9/9 |
| 2H | both | 55 | 3/4/**6**/7/9 |
| 1S | none | 62 | 5/7/**7**/7/8 |
| 1S | unfav | 39 | 6/7/**10**/12/12 |
| 1S | both | 40 | 2/6/**8**/10/10 |
| 4H | fav | 89 | 3/6/**6**/6/8 |
| 2D | none | 38 | 7/7/**7**/8/14 |
| 2D | unfav | 37 | 6/9/**9**/9/11 |
| 2D | both | 26 | 6/7/**7**/10/11 |

Dealer filters (paste into the custom filter box; derived from the data):

- `XX` → `hcp in 9..17`
- `2NT` → `h >= 4 and hcp in 8..14`
- `2H` → `h >= 3 and hcp in 4..9`
- `1S` → `s >= 4 and top(s,5) >= 1 and hcp in 5..12`
- `4H` → `h >= 4 and hcp in 4..13`
- `2D` → `h >= 3 and hcp in 5..14`

### 1S (X) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♠ |
|---|---|---|---|---|---|---|---|---|
| P | 24.1% | 268 | 70 | 2/3/**4**/6/8 | — | — | 43% | 0:12% 1:8% 2:44% 3:33% 4:2% |
| 2S | 16.7% | 186 | 49 | 3/4/**6**/8/8 | 3:92% 4:8% | **1.8** (1.3–3.3) | 62% | 3:92% 4:8% |
| 2H | 10.4% | 116 | 44 | 4/7/**8**/8/11 | 2:50% 3:22% 4:17% 5:9% 6+:2% | **2.4** (1.5–3.6) | 59% | <3:2% 3:78% 4:21% |
| 2NT | 9.0% | 100 | 24 | 8/10/**10**/11/13 | — | — | 70% | 3:4% 4:93% 5:1% 6:2% |
| XX | 7.3% | 81 | 33 | 9/10/**11**/13/15 | — | — | 74% | 1:2% 2:46% 3:44% 4:6% 5+:1% |
| 1NT | 7.1% | 79 | 31 | 6/6/**7**/8/10 | — | — | 16% | <1:1% 1:52% 2:27% 3:19% 4+:1% |
| 3S | 6.8% | 76 | 20 | 1/2/**5**/6/8 | 3:3% 4:78% 5:20% | **2.6** (1.1–3.4) | 71% | 3:3% 4:78% 5:20% |
| 4S | 6.5% | 72 | 22 | 5/6/**8**/9/13 | 3:11% 4:64% 5:22% 6:3% | **3.4** (2.9–4.6) | 31% | 3:11% 4:64% 5:22% 6:3% |
| 2C | 4.7% | 52 | 17 | 4/6/**6**/7/10 | 1:10% 2:4% 3:60% 5:4% 6:12% 8:12% | **4.3** (3.9–4.4) | 8% | 0:52% 1:17% 2:21% 3:4% 4:6% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2S | none | 25 | 3/5/**7**/8/9 |
| 2S | fav | 36 | 1/4/**4**/5/7 |
| 2S | unfav | 68 | 4/4/**4**/7/8 |
| 2S | both | 57 | 3/6/**8**/8/8 |
| 2H | both | 61 | 7/8/**8**/8/10 |
| 2NT | unfav | 25 | 10/10/**10**/10/12 |
| 2NT | both | 47 | 7/8/**10**/11/13 |
| XX | fav | 29 | 9/11/**13**/13/14 |
| 1NT | none | 38 | 6/6/**6**/6/9 |
| 3S | fav | 51 | 1/1/**2**/5/6 |

Dealer filters (paste into the custom filter box; derived from the data):

- `2S` → `s >= 3 and hcp in 3..8`
- `2H` → `s >= 3 and hcp in 4..11`
- `2NT` → `s >= 4 and hcp in 8..13`
- `XX` → `hcp in 9..15`
- `1NT` → `hcp in 6..10`
- `3S` → `s >= 4 and hcp in 1..8`

### 1C (1S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♣ |
|---|---|---|---|---|---|---|---|---|
| X | 40.7% | 615 | 175 | 5/8/**9**/11/16 | theirs: <1:2% 1:19% 2:35% 3:27% 4:15% | — | 50% | <1:1% 1:15% 2:20% 3:44% 4:10% 5:9% |
| P | 27.1% | 409 | 158 | 1/4/**5**/6/8 | — | — | 58% | 1:9% 2:31% 3:28% 4:25% 5:5% 6+:1% |
| 1NT | 8.4% | 127 | 43 | 7/8/**10**/10/10 | — | — | 97% | <2:2% 2:3% 3:64% 4:25% 5:6% |
| 2H | 6.6% | 99 | 63 | 6/10/**10**/11/14 | 2:2% 3:13% 5:35% 6:29% 7:10% 8:10% | **4.3** (3.1–5.5) | 19% | 0:8% 1:18% 2:31% 3:32% 4:8% 5+:2% |
| 2D | 5.3% | 80 | 53 | 6/8/**10**/13/14 | 1:5% 2:28% 3:13% 4:19% 5:29% 6:5% 7:3% | **3.3** (1.7–5.4) | 28% | 0:3% 1:28% 2:20% 3:45% 4:5% |
| 2C | 3.9% | 59 | 56 | 4/6/**7**/10/14 | <2:2% 2:8% 3:19% 4:42% 5:24% 6:5% | **2.8** (1.8–4.4) | 39% | <2:2% 2:8% 3:19% 4:42% 5:24% 6:5% |
| 2S | 2.2% | 33 | 28 | 8/11/**13**/13/17 | 0:3% 1:21% 2:42% 3:21% 4:12% | **0.2** (0.2–3.0) | 64% | 1:6% 3:15% 4:52% 5:3% 6:24% |
| 3NT | 2.1% | 31 | 10 | 14/14/**14**/14/17 | — | — | 94% | 1:6% 2:3% 3:81% 4:10% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 125 | 6/8/**9**/11/14 |
| X | fav | 78 | 5/5/**6**/10/11 |
| X | unfav | 190 | 9/10/**10**/11/16 |
| X | both | 222 | 6/7/**8**/9/15 |
| 1NT | fav | 42 | 8/8/**8**/8/9 |
| 1NT | both | 66 | 10/10/**10**/10/10 |
| 2H | none | 37 | 6/8/**10**/10/15 |
| 2D | none | 35 | 6/8/**10**/13/15 |
| 2S | none | 25 | 8/10/**13**/13/17 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 9/**9**/11 (128) | 7/**8**/11 (217) | 7/**10**/11 (169) | 8/**9**/10 (101) |
| 1NT | — | — | 8/**8**/10 (71) | 10/**10**/10 (53) |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 5..16`
- `1NT` → `(has(s,a) or (has(s,k) and s >= 2) or (has(s,q) and s >= 3)) and hcp in 7..10` *(+ balanced)*
- `2H` → `h >= 3 and top(h,5) >= 1 and (hcp >= 11 or top(h,5) >= 2) and ((hcp in 6..14 and s <= 2) or (hcp in 7..14 and s in 3..4))`
- `2D` → `hcp in 6..14`
- `2C` → `hcp in 4..14`

### 1D (1S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♦ |
|---|---|---|---|---|---|---|---|---|
| X | 40.3% | 915 | 144 | 6/7/**9**/10/12 | theirs: 0:5% 1:17% 2:30% 3:30% 4:11% 5:8% | — | 44% | 1:9% 2:33% 3:21% 4:21% 5:15% |
| P | 29.5% | 670 | 119 | 1/3/**6**/7/13 | — | — | 60% | 1:14% 2:38% 3:39% 4:7% 5+:2% |
| 1NT | 6.2% | 141 | 49 | 6/8/**8**/10/10 | — | — | 77% | 1:15% 2:36% 3:29% 4:16% 5:4% |
| 2D | 5.9% | 135 | 64 | 5/6/**6**/8/11 | 1:5% 2:10% 3:16% 4:52% 5:15% 6+:1% | **2.2** (1.0–3.0) | 59% | 1:5% 2:10% 3:16% 4:52% 5:15% 6+:1% |
| 2H | 4.8% | 109 | 57 | 6/8/**10**/11/14 | 3:8% 5:33% 6:50% 7:7% | **4.6** (3.2–5.5) | 19% | 1:25% 2:40% 3:15% 4:15% 5:5% |
| 2C | 4.0% | 90 | 54 | 6/7/**9**/10/13 | 1:4% 2:9% 3:26% 4:13% 5:42% 6:6% | **5.2** (2.6–5.8) | 44% | 1:6% 2:20% 3:34% 4:27% 5:13% |
| 2S | 3.3% | 74 | 25 | 9/10/**10**/12/14 | 0:8% 1:41% 2:26% 3:11% 4:14% 5+:1% | **4.1** (0.0–5.6) | 32% | 4:54% 5:42% 6:4% |
| 3D | 2.6% | 58 | 18 | 5/6/**6**/6/9 | 4:40% 5:53% 6:7% | **1.9** (1.7–2.4) | 66% | 4:40% 5:53% 6:7% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 264 | 6/7/**9**/10/11 |
| X | fav | 168 | 6/6/**10**/10/13 |
| X | unfav | 267 | 6/7/**10**/10/12 |
| X | both | 216 | 6/7/**7**/9/15 |
| 1NT | fav | 32 | 6/6/**9**/9/11 |
| 1NT | unfav | 75 | 6/8/**8**/10/10 |
| 2D | none | 31 | 3/5/**7**/10/11 |
| 2D | fav | 53 | 5/6/**6**/7/9 |
| 2D | unfav | 25 | 4/6/**6**/8/9 |
| 2D | both | 26 | 6/6/**7**/9/13 |
| 2H | none | 41 | 6/8/**10**/10/12 |
| 2H | both | 30 | 6/9/**9**/13/13 |
| 2C | fav | 49 | 6/7/**7**/10/14 |
| 2S | fav | 29 | 10/10/**10**/14/14 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 7/**10**/10 (203) | 7/**9**/11 (272) | 6/**7**/10 (271) | 7/**9**/11 (169) |
| 1NT | — | — | 7/**8**/10 (49) | 8/**8**/9 (90) |
| 2D | — | 6/**6**/7 (48) | 6/**6**/8 (44) | 5/**7**/8 (31) |
| 2H | 8/**8**/14 (21) | 9/**10**/10 (41) | 7/**9**/10 (29) | 8/**11**/13 (18) |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 6..12`
- `1NT` → `hcp in 6..10`
- `2D` → `((hcp in 3..11 and s <= 2) or (hcp in 5..11 and s in 3..5))`
- `2H` → `h >= 4 and top(h,5) >= 1 and hcp in 6..14`
- `2C` → `top(c,5) >= 1 and hcp in 6..13`
- `2S` → `((hcp in 9..11 and s >= 4) or (hcp in 9..14 and s <= 3 and h <= 3) or (hcp in 12..14 and d >= 5) or (hcp in 12..14 and c >= 5))`

### 1H (1S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♥ |
|---|---|---|---|---|---|---|---|---|
| 2H | 26.0% | 412 | 47 | 4/6/**7**/8/10 | 3:80% 4:19% | **3.5** (1.3–4.6) | 58% | 3:80% 4:19% |
| P | 14.4% | 228 | 51 | 2/5/**6**/6/9 | — | — | 21% | 1:29% 2:57% 3:11% 4:3% |
| X | 11.4% | 181 | 44 | 6/7/**9**/10/13 | theirs: 1:15% 2:38% 3:22% 4:24% | — | 24% | 1:38% 2:51% 3:10% |
| 2NT | 10.2% | 161 | 37 | 8/11/**13**/14/17 | — | — | 43% | 3:14% 4:46% 5:40% |
| 2S | 9.7% | 154 | 43 | 8/10/**12**/14/17 | 1:15% 2:19% 3:33% 4:27% 5:4% | **3.9** (2.5–5.9) | 60% | 3:60% 4:17% 5:21% |
| 3H | 9.1% | 144 | 19 | 2/4/**6**/6/8 | 3:4% 4:94% 5+:1% | **3.4** (0.7–3.5) | 58% | 3:4% 4:94% 5+:1% |
| 2D | 5.7% | 90 | 34 | 6/8/**9**/11/17 | 1:2% 2:4% 3:14% 4:8% 5:11% 6:18% 7:42% | **5.1** (3.3–5.6) | 26% | <1:1% 1:8% 2:54% 3:27% 4:7% 5:3% |
| 1NT | 3.4% | 54 | 21 | 7/9/**9**/10/11 | — | — | 48% | 1:41% 2:50% 3:7% 4+:2% |
| 4H | 3.2% | 50 | 26 | 4/6/**8**/12/14 | 3:4% 4:60% 5:30% 6:6% | **3.4** (3.0–4.4) | 28% | 3:4% 4:60% 5:30% 6:6% |
| 2C | 2.3% | 37 | 18 | 6/7/**9**/13/17 | 1:8% 2:14% 3:14% 4:14% 5:24% 6:14% 7:14% | **3.8** (2.9–6.5) | 24% | 1:19% 2:59% 3:22% |
| 3D | 1.7% | 27 | 14 | 6/6/**7**/9/9 | 2:7% 4:15% 5:37% 6:11% 7:30% | **3.7** (3.3–5.4) | 11% | 1:15% 2:15% 3:7% 4:59% 5:4% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2H | none | 52 | 6/6/**6**/6/7 |
| 2H | fav | 125 | 4/7/**7**/8/9 |
| 2H | unfav | 82 | 6/6/**6**/8/10 |
| 2H | both | 153 | 4/5/**8**/8/8 |
| X | none | 38 | 6/9/**13**/13/18 |
| X | fav | 26 | 7/8/**8**/9/17 |
| X | unfav | 70 | 6/6/**7**/7/10 |
| X | both | 47 | 7/9/**10**/10/13 |
| 2NT | none | 33 | 9/12/**14**/14/17 |
| 2NT | fav | 76 | 8/11/**14**/14/17 |
| 2NT | unfav | 29 | 11/11/**12**/12/14 |
| 2S | none | 39 | 7/11/**14**/17/18 |
| 2S | fav | 59 | 9/9/**14**/14/17 |
| 2S | both | 37 | 6/10/**11**/12/13 |
| 3H | fav | 39 | 3/4/**4**/5/7 |
| 3H | unfav | 39 | 6/6/**6**/6/7 |
| 3H | both | 51 | 4/5/**6**/6/8 |
| 2D | unfav | 48 | 6/9/**9**/9/10 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 2H | 6/**6**/9 (89) | 4/**5**/7 (68) | 6/**8**/8 (155) | 7/**7**/7 (100) |
| X | 7/**7**/9 (28) | 7/**8**/10 (69) | 6/**8**/10 (39) | 9/**13**/13 (45) |
| 2NT | — | 9/**12**/12 (20) | 9/**11**/12 (43) | 13/**14**/14 (90) |
| 2S | 9/**9**/9 (24) | 10/**12**/12 (30) | 10/**13**/17 (51) | 11/**14**/14 (49) |

Dealer filters (paste into the custom filter box; derived from the data):

- `2H` → `((hcp in 4..11 and h >= 4) or (hcp in 4..11 and s >= 4) or (hcp in 4..11 and s <= 3 and h <= 3))`
- `X` → `hcp in 6..13`
- `2NT` → `hcp in 8..17`
- `2S` → `((hcp in 8..17 and h >= 4) or (hcp in 8..17 and s <= 3 and h <= 3))`
- `3H` → `h >= 4 and hcp in 2..8`
- `2D` → `d >= 3 and top(d,5) >= 1 and hcp in 6..17`

### 1C (1H) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♣ |
|---|---|---|---|---|---|---|---|---|
| X | 31.6% | 414 | 180 | 6/7/**9**/10/15 | theirs: 1:14% 2:50% 3:26% 4:7% 5:3% | — | 57% | 1:4% 2:29% 3:34% 4:29% 5:4% |
| 1S | 19.0% | 249 | 134 | 6/7/**9**/10/14 | 1:2% 2:19% 3:26% 4:8% 5:29% 6:16% | **3.3** (2.3–4.9) | 40% | 1:6% 2:17% 3:19% 4:50% 5:8% |
| P | 15.4% | 202 | 128 | 2/4/**5**/7/7 | — | — | 57% | 1:3% 2:11% 3:38% 4:37% 5:11% |
| 2C | 7.6% | 100 | 62 | 5/7/**7**/9/12 | 1:2% 2:4% 3:4% 4:38% 5:52% | **3.1** (2.4–3.7) | 13% | 1:2% 2:4% 3:4% 4:38% 5:52% |
| 2H | 6.2% | 81 | 55 | 8/9/**11**/13/15 | 0:2% 1:28% 2:19% 3:42% 4:9% | **3.3** (0.9–4.7) | 33% | 1:7% 2:10% 3:16% 4:32% 5:33% 6+:1% |
| 1NT | 5.8% | 76 | 42 | 7/8/**9**/9/10 | — | — | 74% | 2:3% 3:14% 4:55% 5:28% |
| 2D | 5.5% | 72 | 39 | 6/10/**12**/12/15 | <5:3% 5:50% 6:39% 7:8% | **4.3** (3.7–4.8) | 14% | 1:7% 2:19% 3:8% 4:51% 5:13% 6+:1% |
| 3C | 4.9% | 64 | 16 | 5/5/**6**/8/8 | 4:6% 5:91% 6:3% | **3.2** (2.3–6.2) | 0% | 4:6% 5:91% 6:3% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 83 | 6/7/**8**/9/11 |
| X | fav | 126 | 6/7/**9**/11/17 |
| X | unfav | 94 | 6/8/**9**/10/13 |
| X | both | 111 | 6/8/**9**/12/15 |
| 1S | none | 89 | 6/7/**9**/11/14 |
| 1S | fav | 77 | 7/7/**10**/11/15 |
| 1S | unfav | 31 | 6/8/**9**/10/12 |
| 1S | both | 52 | 7/7/**8**/9/10 |
| 2C | fav | 31 | 5/7/**7**/7/10 |
| 2C | unfav | 30 | 6/6/**8**/8/11 |
| 2H | none | 31 | 9/10/**12**/14/14 |
| 1NT | none | 45 | 7/9/**9**/9/10 |
| 1NT | both | 26 | 7/8/**8**/8/10 |
| 2D | none | 41 | 10/10/**12**/12/14 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 6/**8**/10 (61) | 8/**9**/10 (205) | 7/**9**/10 (109) | 9/**10**/12 (39) |
| 1S | 8/**9**/11 (58) | 7/**7**/10 (95) | 8/**9**/11 (66) | 7/**7**/9 (30) |
| 2C | 6/**8**/8 (29) | 7/**7**/10 (38) | 5/**7**/9 (16) | 7/**9**/9 (17) |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 6..15`
- `1S` → `((hcp in 6..14 and h <= 2) or (hcp in 7..14 and h in 3..4))`
- `2C` → `c >= 4 and top(c,5) >= 1 and hcp in 5..12`
- `2H` → `((hcp in 8..11 and s >= 4) or (hcp in 8..15 and s <= 3 and h <= 3) or (hcp in 12..15 and d >= 5) or (hcp in 12..15 and c >= 5))`
- `1NT` → `(has(h,a) or (has(h,k) and h >= 2) or (has(h,q) and h >= 3)) and hcp in 7..10`
- `2D` → `d >= 5 and top(d,5) >= 1 and hcp in 6..15`

### 1D (1H) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♦ |
|---|---|---|---|---|---|---|---|---|
| X | 37.4% | 838 | 132 | 5/7/**8**/9/12 | theirs: 1:11% 2:34% 3:39% 4:13% 5:2% | — | 47% | <1:2% 1:20% 2:25% 3:29% 4:15% 5:9% |
| P | 20.0% | 447 | 88 | 2/3/**4**/6/9 | — | — | 55% | 1:14% 2:65% 3:9% 4:12% 5+:1% |
| 1S | 17.5% | 393 | 117 | 4/7/**9**/11/13 | <2:2% 2:5% 3:31% 4:10% 5:34% 6:14% 7:5% | **4.2** (2.4–5.2) | 39% | 0:5% 1:6% 2:34% 3:39% 4:10% 5:5% |
| 2D | 5.8% | 131 | 42 | 4/7/**7**/8/11 | 2:3% 3:5% 4:71% 5:17% 6:3% | **3.3** (2.2–3.6) | 38% | 2:3% 3:5% 4:71% 5:17% 6:3% |
| 2C | 4.2% | 94 | 32 | 7/10/**11**/13/19 | <2:1% 2:5% 3:3% 4:2% 5:12% 6:29% 7:9% 8:39% | **7.1** (5.0–7.1) | 11% | 0:5% 1:4% 2:66% 3:9% 4:6% 5:10% |
| 2H | 4.4% | 98 | 39 | 7/8/**10**/12/13 | <1:1% 1:9% 2:12% 3:34% 4:23% 5:20% | **2.0** (0.0–3.8) | 36% | 0:11% 1:10% 2:11% 3:34% 4:16% 5:16% 6+:1% |
| 1NT | 3.7% | 83 | 32 | 7/7/**9**/9/11 | — | — | 89% | 2:34% 3:40% 4:6% 5:20% |
| 3D | 3.2% | 71 | 20 | 4/6/**7**/7/9 | 4:70% 5:20% 6:10% | **3.0** (2.2–3.6) | 27% | 4:70% 5:20% 6:10% |
| 2S | 1.3% | 29 | 18 | 7/9/**10**/11/13 | 1:34% 2:3% 3:31% 4:3% 6:28% | **2.1** (0.4–4.4) | 24% | 0:7% 1:7% 2:41% 3:3% 4:7% 5:31% 6:3% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 174 | 4/7/**9**/11/13 |
| X | fav | 334 | 6/7/**7**/9/12 |
| X | unfav | 154 | 6/8/**9**/10/13 |
| X | both | 176 | 5/6/**7**/9/11 |
| 1S | none | 102 | 4/7/**9**/10/13 |
| 1S | fav | 170 | 4/8/**10**/12/12 |
| 1S | unfav | 50 | 5/7/**9**/10/15 |
| 1S | both | 71 | 5/6/**6**/8/12 |
| 2D | fav | 38 | 7/7/**9**/9/12 |
| 2D | both | 64 | 4/4/**7**/7/9 |
| 2C | both | 47 | 7/11/**11**/11/15 |
| 2H | fav | 61 | 8/9/**10**/12/12 |
| 1NT | fav | 57 | 7/7/**9**/9/10 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 6/**8**/8 (94) | 8/**9**/9 (284) | 7/**7**/9 (328) | 8/**10**/12 (132) |
| 1S | 7/**7**/8 (35) | 6/**9**/9 (156) | 7/**9**/12 (101) | 8/**10**/12 (101) |
| 2D | — | 7/**7**/9 (31) | 9/**9**/9 (25) | 5/**7**/8 (72) |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 5..12`
- `1S` → `s >= 3 and hcp in 4..13`
- `2D` → `d >= 4 and top(d,5) >= 1 and hcp in 4..11`
- `2C` → `c >= 4 and top(c,5) >= 1 and hcp in 7..19`
- `2H` → `((hcp in 7..13 and h >= 4) or (hcp in 7..13 and s >= 4) or (hcp in 7..11 and s <= 3 and h <= 3))`
- `1NT` → `(has(h,a) or (has(h,k) and h >= 2) or (has(h,q) and h >= 3)) and hcp in 7..11` *(+ balanced)*

### 1S (2H) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♠ |
|---|---|---|---|---|---|---|---|---|
| P | 32.1% | 327 | 46 | 2/3/**5**/7/10 | — | — | 37% | 0:13% 1:10% 2:45% 3:31% 4+:2% |
| 2S | 22.4% | 228 | 34 | 4/5/**6**/7/9 | <3:1% 3:66% 4:31% 5+:2% | **1.6** (0.7–2.4) | 75% | <3:1% 3:66% 4:31% 5+:2% |
| X | 9.0% | 92 | 31 | 7/8/**10**/11/15 | theirs: <1:1% 1:2% 2:30% 3:29% 4:37% | — | 62% | 0:4% 1:17% 2:62% 3:14% 4:2% |
| 3H | 8.7% | 89 | 24 | 8/9/**10**/11/13 | 0:13% 1:18% 2:47% 3:19% 4:2% | **0.0** (0.0–2.7) | 65% | 3:75% 4:19% 5:6% |
| 3S | 8.6% | 88 | 13 | 1/6/**6**/7/7 | 3:3% 4:91% 5:6% | **0.7** (0.7–1.9) | 91% | 3:3% 4:91% 5:6% |
| 4S | 7.0% | 71 | 20 | 4/5/**9**/9/12 | 3:13% 4:23% 5:65% | **2.3** (1.8–2.3) | 23% | 3:13% 4:23% 5:65% |
| 2NT | 5.1% | 52 | 18 | 7/9/**9**/10/13 | — | — | 65% | 3:31% 4:46% 5:23% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2S | none | 139 | 5/5/**6**/7/9 |
| 2S | fav | 50 | 6/6/**7**/8/9 |
| 2S | both | 28 | 2/2/**6**/6/10 |
| X | none | 33 | 7/7/**9**/13/15 |
| X | unfav | 33 | 7/10/**10**/10/15 |
| 3H | unfav | 37 | 9/10/**10**/10/11 |
| 3S | none | 32 | 7/7/**7**/7/7 |
| 3S | fav | 47 | 1/6/**6**/6/7 |
| 4S | none | 37 | 9/9/**9**/9/10 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 2S | 5/**5**/5 (42) | 6/**6**/8 (67) | 7/**7**/9 (78) | 4/**6**/6 (41) |

Dealer filters (paste into the custom filter box; derived from the data):

- `2S` → `((hcp in 4..11 and h >= 4) or (hcp in 4..11 and s >= 4) or (hcp in 4..11 and s <= 3 and h <= 3))`
- `X` → `hcp in 7..15`
- `3H` → `((hcp in 8..11 and s >= 4) or (hcp in 8..11 and s <= 3 and h <= 3))`
- `3S` → `s >= 4 and hcp in 1..7`
- `4S` → `s >= 3 and hcp in 4..12`
- `2NT` → `hcp in 7..13`

### 1H (2D) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♥ |
|---|---|---|---|---|---|---|---|---|
| X | 30.5% | 148 | 23 | 5/7/**8**/10/14 | theirs: 0:7% 1:5% 2:11% 3:57% 4:19% 5:2% | — | 64% | 1:8% 2:86% 3:5% |
| P | 22.1% | 107 | 28 | 1/5/**7**/8/14 | — | — | 52% | 1:7% 2:72% 3:16% 4:5% |
| 2H | 13.2% | 64 | 22 | 6/6/**8**/10/10 | 2:5% 3:92% 4:3% | **2.4** (2.3–4.1) | 92% | 2:5% 3:92% 4:3% |
| 2S | 11.1% | 54 | 12 | 6/10/**10**/14/14 | <5:2% 5:50% 6:7% 7:41% | **5.4** (3.2–6.9) | 2% | 1:48% 2:50% 3+:2% |
| 3D | 7.0% | 34 | 17 | 8/9/**10**/11/14 | 1:15% 2:29% 3:32% 5:24% | **2.2** (0.7–3.5) | 53% | 1:6% 3:71% 4:18% 5:6% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 64 | 5/8/**8**/10/14 |
| X | both | 49 | 7/7/**7**/10/12 |
| 2S | none | 42 | 10/10/**10**/14/14 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 5/**5**/5 (17) | 8/**9**/10 (16) | 7/**8**/8 (84) | 10/**12**/14 (31) |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 5..14`
- `2H` → `((hcp in 6..11 and s >= 4) or (hcp in 6..11 and s <= 3 and h <= 3))`
- `2S` → `s >= 5 and top(s,5) >= 2 and hcp in 6..14`

### 1S (2D) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♠ |
|---|---|---|---|---|---|---|---|---|
| P | 24.4% | 212 | 33 | 2/4/**5**/8/8 | — | — | 15% | 0:6% 1:41% 2:37% 3:12% 4:4% |
| 2S | 17.6% | 153 | 26 | 4/4/**6**/7/8 | 2:4% 3:80% 4:14% 5+:2% | **2.6** (1.5–3.2) | 62% | 2:4% 3:80% 4:14% 5+:2% |
| 4S | 14.6% | 127 | 9 | 5/5/**6**/6/7 | 4:13% 5:86% | **2.7** (2.2–2.7) | 4% | 4:13% 5:86% |
| X | 14.3% | 124 | 19 | 6/7/**8**/9/11 | theirs: 1:2% 2:44% 3:40% 4:4% 5:8% | — | 20% | 0:42% 1:19% 2:36% 3:3% |
| 2H | 10.0% | 87 | 14 | 5/8/**9**/11/13 | <5:1% 5:23% 6:55% 7:21% | **5.2** (3.5–8.1) | 2% | 0:20% 1:8% 2:68% 3:5% |
| 3S | 6.9% | 60 | 7 | 1/5/**5**/6/7 | 3:5% 4:63% 5:32% | **3.0** (2.7–5.1) | 55% | 3:5% 4:63% 5:32% |
| 2NT | 4.5% | 39 | 8 | 7/7/**13**/13/13 | — | — | 72% | 3:5% 4:87% 5:8% |
| 3D | 3.7% | 32 | 18 | 7/9/**11**/13/13 | 0:9% 1:22% 2:9% 3:31% 4:28% | **0.9** (0.2–3.0) | 63% | 2:9% 3:28% 4:50% 5:13% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2S | none | 44 | 6/6/**7**/7/9 |
| 2S | fav | 47 | 4/4/**4**/8/10 |
| 2S | unfav | 39 | 1/6/**6**/6/6 |
| 4S | none | 58 | 6/6/**6**/6/6 |
| 4S | both | 64 | 5/5/**5**/5/7 |
| X | fav | 79 | 5/8/**8**/8/11 |
| 2H | fav | 53 | 5/8/**9**/9/10 |
| 3S | fav | 30 | 4/5/**5**/5/5 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 2S | 4/**4**/4 (43) | 6/**7**/7 (57) | 6/**6**/6 (47) | — |
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
| X | 23.0% | 126 | 30 | 6/9/**9**/10/13 | theirs: 1:5% 2:48% 3:27% 4:18% | — | 29% | 0:6% 1:17% 2:69% 3:6% |
| P | 19.2% | 105 | 23 | 4/6/**7**/8/10 | — | — | 40% | 0:5% 1:48% 2:40% 3:6% 4+:2% |
| 3C | 10.4% | 57 | 16 | 7/10/**11**/12/13 | 0:9% 1:14% 2:44% 3:33% | **0.2** (0.2–1.6) | 32% | 3:40% 4:53% 5:5% 6+:2% |
| 2NT | 10.1% | 55 | 12 | 7/10/**11**/11/13 | — | — | 20% | 3:15% 4:76% 5:9% |
| 2S | 7.7% | 42 | 11 | 6/9/**12**/12/13 | 5:50% 6:29% 7:21% | **4.5** (4.3–5.5) | 45% | 0:5% 2:57% 3:31% 4:7% |
| 2H | 6.9% | 38 | 12 | 3/7/**7**/7/9 | 2:3% 3:68% 4:29% | **1.6** (1.5–3.6) | 24% | 2:3% 3:68% 4:29% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | both | 80 | 6/9/**9**/10/13 |
| 3C | none | 29 | 7/10/**11**/11/11 |
| 2NT | none | 33 | 10/11/**11**/11/11 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | — | 9/**9**/9 (61) | 10/**11**/12 (34) | 7/**10**/10 (24) |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 6..13`
- `3C` → `((hcp in 7..11 and h >= 4) or (hcp in 7..13 and s >= 4))`
- `2NT` → `hcp in 7..13`

### 1S (2C) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♠ |
|---|---|---|---|---|---|---|---|---|
| P | 41.9% | 234 | 26 | 1/1/**3**/6/7 | — | — | 40% | 0:8% 1:24% 2:53% 3:15% |
| X | 17.0% | 95 | 23 | 6/7/**9**/11/12 | theirs: 1:4% 2:31% 3:51% 4:14% 5+:1% | — | 40% | 0:6% 1:36% 2:42% 3:15% 4+:1% |
| 2S | 12.2% | 68 | 12 | 4/6/**6**/6/10 | 3:91% 4:9% | **1.6** (1.6–1.6) | 32% | 3:91% 4:9% |
| 2H | 7.2% | 40 | 11 | 6/8/**9**/12/12 | 5:28% 6:68% 7:5% | **4.6** (3.3–4.9) | 5% | 0:10% 1:70% 2:18% 3:3% |
| 3C | 5.5% | 31 | 13 | 8/10/**11**/12/13 | 1:10% 2:48% 3:32% 4:10% | **1.5** (1.5–3.3) | 84% | 3:68% 4:26% 5:3% 6:3% |
| 2NT | 4.8% | 27 | 14 | 7/8/**8**/11/15 | — | — | 52% | 3:22% 4:67% 5:11% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | unfav | 53 | 6/6/**11**/11/12 |
| 2S | both | 56 | 5/6/**6**/6/9 |
| 2H | unfav | 26 | 6/9/**9**/12/12 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 6..12`
- `2S` → `(hcp in 4..11 and h >= 4)`

### 1D (2C) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♦ |
|---|---|---|---|---|---|---|---|---|
| X | 38.2% | 335 | 60 | 6/8/**9**/10/12 | theirs: 1:9% 2:36% 3:53% 4+:1% | — | 51% | 1:12% 2:32% 3:24% 4:23% 5:9% |
| P | 31.0% | 272 | 50 | 3/5/**5**/6/8 | — | — | 63% | 1:24% 2:23% 3:45% 4:7% 5+:1% |
| 2H | 14.5% | 127 | 24 | 7/9/**10**/10/12 | <5:4% 5:87% 6:9% | **4.3** (3.4–6.3) | 61% | 1:11% 2:58% 3:19% 4:6% 6:5% |
| 2D | 6.8% | 60 | 33 | 5/5/**7**/10/11 | 1:5% 2:17% 3:27% 4:47% 5:2% 6:3% | **1.8** (0.2–3.0) | 57% | 1:5% 2:17% 3:27% 4:47% 5:2% 6:3% |
| 3C | 3.3% | 29 | 8 | 9/12/**12**/15/15 | 0:3% 1:3% 2:21% 3:72% | **3.2** (2.1–3.6) | 76% | 2:3% 4:38% 5:55% 6:3% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 59 | 5/7/**7**/9/10 |
| X | fav | 171 | 8/8/**10**/12/12 |
| X | unfav | 47 | 7/9/**9**/10/11 |
| X | both | 58 | 6/9/**9**/10/10 |
| 2H | fav | 34 | 7/8/**9**/10/10 |
| 2H | unfav | 59 | 9/10/**10**/11/12 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 7/**8**/9 (32) | 8/**9**/9 (120) | 9/**10**/12 (179) | — |
| 2H | — | 7/**10**/11 (34) | 10/**10**/10 (76) | — |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 6..12`
- `2H` → `h >= 5 and top(h,5) >= 1 and hcp in 7..12`
- `2D` → `hcp in 5..11`

### 1NT (X) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 38.0% | 375 | 145 | 2/4/**6**/7/10 | — | — | 75% |
| XX | 17.0% | 168 | 111 | 1/4/**7**/9/12 | — | — | 44% |
| 2C | 11.8% | 116 | 72 | 1/3/**6**/7/9 | <1:2% 1:9% 2:17% 3:18% 4:29% 5:20% 6:5% | **2.2** (1.3–3.9) | 38% |
| 2H | 11.8% | 116 | 59 | 1/4/**5**/7/10 | 1:6% 2:4% 3:32% 4:7% 5:43% 6:6% | **2.3** (1.3–4.1) | 34% |
| 2D | 11.4% | 112 | 45 | 1/3/**6**/6/8 | <2:4% 2:5% 3:15% 4:37% 5:37% 6:3% | **2.3** (1.5–3.3) | 40% |
| 2S | 4.5% | 44 | 27 | 1/4/**6**/7/10 | 1:2% 2:2% 3:9% 5:57% 6:30% | **2.7** (1.5–3.7) | 16% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| XX | none | 62 | 2/6/**8**/9/10 |
| XX | fav | 69 | 1/4/**7**/9/13 |
| XX | both | 26 | 1/2/**4**/9/12 |
| 2C | none | 34 | 1/4/**6**/8/10 |
| 2C | fav | 53 | 1/3/**6**/7/9 |
| 2H | none | 36 | 5/6/**6**/8/11 |
| 2H | fav | 44 | 1/3/**4**/8/10 |
| 2D | none | 53 | 2/5/**6**/6/8 |
| 2D | fav | 30 | 2/4/**6**/7/9 |

Dealer filters (paste into the custom filter box; derived from the data):

- `XX` → `hcp in 1..12`
- `2C` → `hcp in 1..9`
- `2H` → `hcp in 1..10`
- `2D` → `d >= 3 and hcp in 1..8`

## Transfer responses over interference: 1C (…) ? by transfer-walsh pairs

Pairs whose 1C responses are transfers keep them on over a double or 1D overcall: X/1D = hearts, 1H = spades, 1S = no major. The derived rules key on the suit actually held.

### 1C (X) ? — transfer responders

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♣ |
|---|---|---|---|---|---|---|---|---|
| P | 32.0% | 149 | 136 | 1/3/**4**/5/8 | — | — | 68% | 1:2% 2:43% 3:31% 4:20% 5:3% |
| 1D | 17.2% | 80 | 106 | 3/5/**8**/9/12 | 1:5% 2:34% 3:28% 4:15% 5:13% 6:6% | **2.1** (0.9–4.0) | 15% | 1:20% 2:45% 3:11% 4:10% 5:3% 6:11% |
| 1H | 18.9% | 88 | 99 | 3/6/**7**/8/9 | 1:18% 2:20% 3:44% 4:15% 5:2% | **3.6** (0.4–4.7) | 42% | <1:1% 1:11% 2:34% 3:33% 4:8% 5:13% |
| 1S | 11.6% | 54 | 86 | 4/6/**7**/7/10 | 1:6% 2:26% 3:54% 4:6% 5:6% 6:4% | **2.3** (1.1–3.5) | 57% | 1:13% 2:7% 3:24% 4:39% 5:17% |
| XX | 9.0% | 42 | 69 | 4/8/**11**/11/16 | — | — | 48% | 0:14% 1:5% 2:10% 3:31% 4:14% 5:26% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1D | fav | 33 | 4/6/**8**/8/10 |
| 1H | none | 32 | 3/6/**7**/8/8 |
| 1H | both | 25 | 5/7/**7**/8/11 |

Dealer filters (paste into the custom filter box; derived from the data):

- `1D` → `(hcp in 3..11 and h >= 4)`
- `1H` → `(hcp in 3..11 and s >= 4)`
- `1S` → `(hcp in 4..11 and s <= 3 and h <= 3)`

### 1C (1D) ? — transfer responders

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♣ |
|---|---|---|---|---|---|---|---|---|
| X | 32.6% | 130 | 133 | 4/7/**9**/10/13 | theirs: 1:15% 2:52% 3:18% 4:13% 5:2% | — | 55% | 1:8% 2:18% 3:48% 4:13% 5:5% 6:8% |
| 1H | 24.1% | 96 | 116 | 6/8/**9**/10/12 | 1:4% 2:21% 3:45% 4:19% 5:8% 6:3% | **3.5** (0.7–4.7) | 42% | 1:3% 2:26% 3:48% 4:8% 5:10% 6:4% |
| 1S | 10.0% | 40 | 94 | 6/7/**8**/10/11 | 1:8% 2:5% 3:43% 4:33% 5:8% 6:5% | **3.0** (1.5–5.5) | 63% | 1:5% 2:18% 3:20% 4:13% 5:45% |
| P | 12.5% | 50 | 105 | 2/3/**4**/7/10 | — | — | 58% | 2:20% 3:36% 4:28% 5:12% 6:4% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 44 | 5/7/**8**/9/12 |
| X | fav | 35 | 4/7/**8**/10/13 |
| X | both | 29 | 4/9/**11**/11/12 |
| 1H | none | 36 | 6/7/**8**/9/14 |
| 1H | unfav | 27 | 6/8/**10**/11/12 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 4/**7**/8 (19) | 8/**9**/11 (68) | 9/**9**/12 (23) | 6/**6**/7 (20) |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 4..13`
- `1H` → `(hcp in 6..12 and s >= 4)`

### 1C (1H) ? — transfer responders

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♣ |
|---|---|---|---|---|---|---|---|---|
| X | 40.5% | 261 | 180 | 5/7/**9**/10/13 | theirs: <1:1% 1:17% 2:46% 3:26% 4:7% 5:3% | — | 48% | 1:8% 2:31% 3:34% 4:23% 5:4% |
| 1S | 19.7% | 127 | 134 | 6/7/**9**/10/13 | <1:2% 1:6% 2:38% 3:43% 4:5% 5:4% 6:2% | **2.4** (0.6–3.9) | 50% | 2:8% 3:12% 4:54% 5:26% |
| P | 14.1% | 91 | 128 | 2/4/**6**/7/8 | — | — | 69% | <2:1% 2:18% 3:34% 4:34% 5:12% 6+:1% |
| 2C | 6.2% | 40 | 62 | 6/7/**10**/12/14 | 1:5% 2:18% 3:8% 4:35% 5:30% 6:3% 8:3% | **3.4** (2.5–5.7) | 15% | 1:5% 2:18% 3:8% 4:35% 5:30% 6:3% 8:3% |
| 2H | 3.9% | 25 | 55 | 9/9/**10**/12/13 | 1:16% 2:16% 3:52% 4:16% | **3.3** (2.4–4.0) | 4% | 2:36% 3:32% 4:8% 5:24% |
| 1NT | 4.3% | 28 | 42 | 7/7/**8**/9/10 | — | — | 57% | 2:4% 3:18% 4:39% 5:39% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 78 | 5/7/**8**/9/12 |
| X | fav | 76 | 5/7/**9**/10/14 |
| X | unfav | 57 | 6/8/**9**/10/13 |
| X | both | 50 | 6/7/**9**/11/15 |
| 1S | none | 28 | 7/9/**10**/12/16 |
| 1S | fav | 42 | 7/7/**9**/13/13 |
| 1S | unfav | 26 | 6/7/**8**/10/12 |
| 1S | both | 31 | 6/7/**8**/10/12 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 6/**7**/10 (47) | 8/**9**/10 (121) | 7/**9**/10 (67) | 7/**8**/10 (26) |
| 1S | 8/**8**/12 (23) | 7/**9**/10 (35) | 7/**9**/13 (44) | 7/**7**/9 (25) |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 5..13`
- `1S` → `((hcp in 6..11 and h >= 4) or (hcp in 6..11 and s <= 3 and h <= 3))`

## Advancing partner’s direct action: (1x) act (…) ?

Includes advances of overcalls and of takeout doubles (partner doubled, RHO passed or raised). 1C/1D contexts face natural openers only.

### (1C) 1H (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♥ |
|---|---|---|---|---|---|---|---|---|
| 1S | 30.2% | 107 | 30 | 4/9/**11**/11/12 | <4:2% 4:20% 5:51% 6:18% 7:9% | **3.4** (3.2–4.0) | 20% | 1:46% 2:39% 3:14% |
| P | 14.7% | 52 | 39 | 1/5/**5**/6/8 | — | — | 54% | 1:25% 2:44% 3:29% 4+:2% |
| 2H | 14.4% | 51 | 24 | 5/5/**7**/8/10 | 3:73% 4:27% | **3.4** (1.8–3.8) | 78% | 3:73% 4:27% |
| 2C | 10.7% | 38 | 27 | 9/10/**11**/14/16 | 0:3% 2:16% 3:42% 4:13% 5:26% | **3.9** (2.9–6.3) | 79% | 1:13% 2:5% 3:76% 4:3% 5:3% |
| 2D | 9.9% | 35 | 14 | 7/9/**12**/12/14 | 2:3% 3:3% 4:6% 5:17% 6:51% 8:20% | **3.3** (2.2–5.7) | 11% | 0:3% 1:49% 2:34% 3:14% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1S | both | 53 | 6/11/**11**/11/11 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 1S | 4/**5**/6 (16) | 9/**9**/12 (32) | 11/**11**/11 (48) | — |

Dealer filters (paste into the custom filter box; derived from the data):

- `1S` → `s >= 4 and top(s,5) >= 1 and ((hcp in 4..12 and c <= 2) or (hcp in 7..12 and c in 3..4))`
- `2H` → `h >= 3 and hcp in 5..10`

### (1C) 1S (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♠ |
|---|---|---|---|---|---|---|---|---|
| P | 25.5% | 182 | 53 | 2/4/**6**/6/9 | — | — | 37% | 0:28% 1:16% 2:47% 3:8% |
| 1NT | 19.4% | 139 | 36 | 8/10/**10**/10/11 | — | — | 23% | 0:5% 1:57% 2:37% 3+:1% |
| 2S | 15.9% | 114 | 38 | 6/7/**7**/8/9 | 3:96% 4:4% | **4.1** (3.0–4.1) | 96% | 3:96% 4:4% |
| 2C | 14.5% | 104 | 28 | 9/10/**11**/12/16 | 0:4% 2:8% 3:39% 4:45% 5:4% | **2.5** (2.3–3.4) | 84% | 1:8% 2:5% 3:84% 4+:3% |
| 2H | 9.7% | 69 | 25 | 8/9/**10**/11/12 | 1:3% 3:4% 4:3% 5:26% 6:46% 7:17% | **5.9** (4.9–5.9) | 13% | 0:3% 1:32% 2:54% 3:12% |
| 2D | 7.8% | 56 | 17 | 8/9/**11**/11/12 | 1:11% 2:2% 3:11% 4:4% 5:11% 6:52% 8:11% | **3.4** (2.4–7.5) | 5% | 0:36% 1:25% 2:34% 3:4% 4+:2% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1NT | none | 27 | 9/9/**9**/10/11 |
| 1NT | unfav | 102 | 9/10/**10**/10/11 |
| 2S | fav | 71 | 7/7/**7**/7/10 |
| 2C | unfav | 53 | 11/11/**11**/12/16 |
| 2H | none | 43 | 9/9/**9**/11/11 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 1NT | — | — | — | 10/**10**/10 (122) |
| 2S | — | 7/**8**/8 (19) | 7/**7**/7 (73) | 7/**8**/9 (22) |
| 2C | — | — | 11/**12**/12 (41) | 10/**11**/11 (51) |

Dealer filters (paste into the custom filter box; derived from the data):

- `1NT` → `hcp in 8..11`
- `2S` → `s >= 3 and top(s,5) >= 1 and hcp in 6..9`
- `2C` → `hcp in 9..16`
- `2H` → `h >= 4 and top(h,5) >= 1 and (hcp >= 11 or top(h,5) >= 2) and hcp in 8..12`
- `2D` → `hcp in 8..12`

### (1D) 1H (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♥ |
|---|---|---|---|---|---|---|---|---|
| 1NT | 17.9% | 83 | 13 | 9/10/**11**/11/11 | — | — | 16% | 1:17% 2:83% |
| 1S | 15.7% | 73 | 31 | 6/9/**10**/10/13 | 4:33% 5:52% 6:10% 7:4% 8+:1% | **5.9** (4.5–6.9) | 37% | 1:14% 2:74% 3:12% |
| P | 16.6% | 77 | 19 | 2/5/**7**/7/9 | — | — | 17% | 1:29% 2:62% 3:8% 4+:1% |
| 2H | 14.7% | 68 | 22 | 7/7/**7**/9/10 | 2:3% 3:84% 4:13% | **3.6** (1.6–4.2) | 93% | 2:3% 3:84% 4:13% |
| 2D | 14.4% | 67 | 21 | 8/10/**10**/11/14 | <3:1% 3:64% 4:21% 5:9% 6:4% | **2.3** (1.9–3.2) | 79% | <2:1% 2:16% 3:72% 4:10% |
| 2C | 13.1% | 61 | 11 | 7/9/**9**/9/14 | 2:5% 3:3% 4:2% 5:5% 6:85% | **3.1** (3.1–5.2) | 8% | 1:64% 2:26% 3:8% 4+:2% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1NT | fav | 41 | 11/11/**11**/11/11 |
| 1NT | both | 26 | 7/9/**9**/10/11 |
| 1S | none | 29 | 7/9/**10**/10/11 |
| 1S | both | 28 | 7/10/**10**/10/10 |
| 2H | both | 40 | 7/7/**7**/7/9 |
| 2C | both | 54 | 7/9/**9**/9/12 |

Dealer filters (paste into the custom filter box; derived from the data):

- `1NT` → `hcp in 9..11`
- `1S` → `s >= 4 and top(s,5) >= 1 and ((hcp in 4..13 and d <= 2) or (hcp in 7..13 and d in 3..4))`
- `2H` → `h >= 3 and top(h,5) >= 1 and hcp in 7..10`
- `2D` → `hcp in 8..14`
- `2C` → `c >= 5 and top(c,5) >= 2 and hcp in 7..14`

### (1D) 1S (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♠ |
|---|---|---|---|---|---|---|---|---|
| P | 26.1% | 176 | 36 | 5/6/**6**/7/8 | — | — | 32% | <1:2% 1:57% 2:35% 3:6% |
| 2D | 22.1% | 149 | 33 | 10/10/**11**/12/16 | 0:11% 1:8% 2:53% 3:12% 4:15% 5+:1% | **2.3** (0.9–3.9) | 60% | 0:3% 1:5% 2:9% 3:72% 4:9% 5+:1% |
| 2H | 15.4% | 104 | 23 | 10/11/**11**/14/14 | 3:7% 4:7% 5:29% 6:20% 7:38% | **5.7** (5.6–6.3) | 9% | 0:18% 1:58% 2:11% 3:13% |
| 1NT | 12.5% | 84 | 29 | 6/8/**10**/10/11 | — | — | 25% | 0:2% 1:63% 2:35% |
| 2S | 8.5% | 57 | 18 | 5/7/**9**/10/10 | 3:93% 4:7% | **2.3** (1.5–3.2) | 96% | 3:93% 4:7% |
| 2C | 6.4% | 43 | 17 | 8/8/**10**/12/16 | 0:2% 2:5% 3:9% 4:5% 5:21% 6:58% | **4.1** (2.2–5.0) | 21% | 1:42% 2:23% 3:28% 4:7% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2D | fav | 99 | 10/10/**10**/12/16 |
| 2D | both | 27 | 9/10/**13**/14/16 |
| 2H | none | 58 | 11/11/**11**/12/14 |
| 2H | fav | 36 | 10/12/**14**/14/14 |
| 1NT | none | 27 | 9/10/**10**/10/10 |
| 1NT | unfav | 41 | 6/7/**10**/10/10 |
| 2S | fav | 26 | 7/10/**10**/10/10 |
| 2C | both | 26 | 8/8/**8**/10/14 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 2D | 11/**12**/12 (28) | 10/**10**/10 (79) | 11/**14**/14 (18) | 13/**16**/16 (24) |
| 2H | — | 12/**12**/12 (30) | 11/**11**/11 (45) | 14/**14**/14 (22) |

Dealer filters (paste into the custom filter box; derived from the data):

- `2D` → `hcp in 10..16`
- `2H` → `h >= 4 and top(h,5) >= 2 and ((hcp in 9..14 and d <= 2) or (hcp in 10..14 and d in 3..4))`
- `1NT` → `hcp in 6..11`
- `2S` → `s >= 3 and top(s,5) >= 1 and hcp in 5..10`

### (1H) 1S (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♠ |
|---|---|---|---|---|---|---|---|---|
| 2S | 39.3% | 96 | 13 | 4/7/**7**/8/9 | 3:89% 4:11% | **2.4** (1.5–2.4) | 93% | 3:89% 4:11% |
| P | 21.7% | 53 | 15 | 3/4/**6**/7/9 | — | — | 34% | 0:26% 1:28% 2:28% 3:17% |
| 1NT | 14.8% | 36 | 8 | 8/9/**9**/9/10 | — | — | 17% | 1:81% 2:19% |
| 2H | 10.2% | 25 | 12 | 8/9/**9**/12/16 | 1:24% 2:24% 3:36% 5:16% | **3.0** (0.0–5.3) | 64% | 2:16% 3:48% 4:36% |

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
| P | 42.3% | 41 | 12 | 3/6/**6**/9/9 | — | — | 5% | 0:10% 1:80% 2:5% 3:2% 4:2% |

### (1S) 2C (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♣ |
|---|---|---|---|---|---|---|---|---|
| 3C | 31.4% | 71 | 11 | 7/7/**7**/9/10 | 2:6% 3:27% 4:65% 5:3% | **1.9** (1.9–3.0) | 90% | 2:6% 3:27% 4:65% 5:3% |
| P | 23.5% | 53 | 14 | 6/6/**8**/8/10 | — | — | 57% | 1:6% 2:77% 3:11% 4:6% |
| 2NT | 16.4% | 37 | 5 | 8/10/**10**/10/10 | — | — | 19% | 2:68% 3:16% 5:16% |
| 2H | 14.2% | 32 | 3 | 7/8/**10**/10/10 | 5:100% | **2.2** (2.2–2.5) | 25% | 2:100% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 3C | fav | 49 | 7/7/**7**/7/10 |
| 2NT | fav | 31 | 10/10/**10**/10/10 |
| 2H | fav | 32 | 7/8/**10**/10/10 |

Dealer filters (paste into the custom filter box; derived from the data):

- `3C` → `c >= 3 and top(c,5) >= 1 and hcp in 7..10`

### (1S) 2H (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♥ |
|---|---|---|---|---|---|---|---|---|
| P | 45.0% | 134 | 22 | 4/7/**7**/8/10 | — | — | 74% | 1:11% 2:81% 3:7% |
| 2S | 17.1% | 51 | 10 | 9/10/**13**/13/16 | 1:4% 2:16% 3:63% 4:10% 5:8% | **0.2** (0.2–3.7) | 78% | 2:61% 3:39% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2S | none | 30 | 10/13/**13**/13/13 |

Dealer filters (paste into the custom filter box; derived from the data):

- `2S` → `((hcp in 9..16 and d >= 4) or (hcp in 9..16 and c >= 4))`

### (1C) X (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 1H | 18.9% | 102 | 36 | 4/5/**8**/8/8 | 4:61% 5:36% 6:3% | **4.3** (3.3–5.2) | 68% |
| 1S | 14.3% | 77 | 30 | 1/4/**5**/8/10 | 4:49% 5:51% | **3.3** (1.5–4.3) | 65% |
| 2C | 11.3% | 61 | 17 | 8/10/**11**/14/14 | <1:2% 1:3% 2:21% 3:67% 4:5% 5+:2% | **1.3** (0.2–3.0) | 67% |
| 1NT | 11.9% | 64 | 14 | 8/9/**10**/10/10 | — | — | 81% |
| 1D | 9.8% | 53 | 21 | 2/3/**6**/7/9 | 3:6% 4:72% 5:15% 6:8% | **2.7** (2.5–3.7) | 83% |
| 2H | 8.5% | 46 | 13 | 7/8/**8**/8/9 | 4:22% 5:76% 6:2% | **6.0** (4.9–6.0) | 43% |
| 2S | 7.6% | 41 | 20 | 7/9/**10**/10/11 | 4:44% 5:56% | **3.6** (2.6–3.6) | 78% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1H | none | 45 | 4/7/**8**/8/8 |
| 1H | unfav | 30 | 5/5/**6**/8/8 |
| 1S | none | 33 | 5/5/**7**/8/8 |
| 2C | none | 38 | 8/14/**14**/14/14 |
| 1NT | both | 36 | 8/8/**10**/10/10 |
| 1D | fav | 29 | 3/3/**5**/7/7 |
| 2H | unfav | 26 | 8/8/**8**/8/8 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 1H | — | 6/**8**/8 (63) | 5/**6**/8 (29) | — |

Dealer filters (paste into the custom filter box; derived from the data):

- `1H` → `h >= 4 and top(h,5) >= 1 and hcp in 4..8`
- `1S` → `s >= 4 and hcp in 1..10`
- `2C` → `hcp in 8..14`
- `1NT` → `hcp in 8..10` *(+ balanced)*
- `1D` → `d >= 4 and top(d,5) >= 1 and hcp in 2..9`

### (1D) X (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 1H | 28.8% | 137 | 29 | 4/6/**8**/9/10 | 3:12% 4:71% 5:18% | **3.9** (2.7–4.1) | 78% |
| 1S | 15.2% | 72 | 28 | 0/4/**5**/8/10 | 3:6% 4:53% 5:42% | **2.0** (1.3–4.0) | 71% |
| 1NT | 13.9% | 66 | 19 | 7/7/**10**/10/10 | — | — | 92% |
| 2H | 13.1% | 62 | 14 | 8/9/**10**/10/10 | 4:95% 5:5% | **2.7** (2.7–3.5) | 84% |
| 2D | 8.0% | 38 | 20 | 9/9/**9**/10/11 | 0:3% 1:47% 2:18% 3:11% 4:21% | **5.6** (2.9–5.6) | 34% |
| 2S | 6.1% | 29 | 17 | 5/7/**9**/10/11 | 4:28% 5:72% | **3.7** (1.6–5.9) | 62% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1H | none | 26 | 7/10/**10**/10/10 |
| 1H | fav | 68 | 5/5/**8**/8/8 |
| 1H | both | 34 | 4/6/**7**/9/9 |
| 1S | both | 28 | 0/3/**3**/9/9 |
| 1NT | none | 31 | 5/7/**7**/10/10 |
| 1NT | fav | 27 | 9/9/**10**/10/10 |
| 2H | none | 39 | 10/10/**10**/10/10 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 1H | — | — | 4/**6**/7 (27) | 8/**8**/9 (97) |

Dealer filters (paste into the custom filter box; derived from the data):

- `1H` → `h >= 3 and top(h,5) >= 1 and hcp in 4..10`
- `1S` → `s >= 4 and hcp in 0..10`
- `1NT` → `hcp in 7..10` *(+ balanced)*
- `2H` → `h >= 4 and top(h,5) >= 1 and hcp in 8..10`

### (1H) X (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 1S | 36.8% | 147 | 25 | 4/4/**5**/7/9 | 3:4% 4:84% 5:12% | **1.7** (1.7–3.0) | 73% |
| 1NT | 26.0% | 104 | 12 | 6/8/**9**/10/10 | — | — | 56% |
| 2C | 11.8% | 47 | 9 | 2/5/**5**/8/11 | 3:11% 4:60% 5:30% | **3.2** (1.0–3.8) | 47% |
| 2S | 7.0% | 28 | 12 | 7/7/**8**/9/10 | 4:57% 5:43% | **1.9** (1.5–2.2) | 71% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1S | none | 52 | 2/5/**5**/6/9 |
| 1S | unfav | 48 | 4/4/**4**/4/8 |
| 1S | both | 27 | 3/5/**6**/7/7 |
| 1NT | fav | 43 | 8/8/**8**/8/9 |
| 1NT | unfav | 52 | 7/10/**10**/10/10 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 1S | — | 6/**6**/7 (36) | 4/**5**/5 (93) | 7/**7**/7 (18) |
| 1NT | — | — | — | 8/**9**/10 (100) |

Dealer filters (paste into the custom filter box; derived from the data):

- `1S` → `s >= 4 and hcp in 4..9`
- `1NT` → `(has(h,a) or (has(h,k) and h >= 2) or (has(h,q) and h >= 3)) and hcp in 6..10`

### (1S) X (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 2H | 24.4% | 66 | 13 | 5/7/**9**/9/10 | 4:82% 5:18% | **4.7** (2.9–4.7) | 85% |
| 1NT | 22.1% | 60 | 15 | 5/7/**8**/8/10 | — | — | 98% |
| 3H | 14.4% | 39 | 13 | 6/9/**10**/10/11 | 4:74% 5:21% 6:3% 7:3% | **3.5** (3.0–4.7) | 33% |
| 2D | 12.5% | 34 | 12 | 3/4/**5**/7/7 | 4:18% 5:82% | **4.4** (2.5–4.6) | 47% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2H | both | 54 | 7/9/**9**/9/9 |
| 1NT | unfav | 29 | 7/8/**8**/8/8 |
| 2D | fav | 25 | 3/4/**4**/7/7 |

Dealer filters (paste into the custom filter box; derived from the data):

- `2H` → `h >= 4 and top(h,5) >= 1 and hcp in 5..10`
- `1NT` → `(has(s,a) or (has(s,k) and s >= 2) or (has(s,q) and s >= 3)) and hcp in 5..10` *(+ balanced)*

### (1H) X (2H) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 30.6% | 53 | 18 | 0/0/**1**/5/8 | — | — | 74% |
| X | 14.5% | 25 | 9 | 9/10/**11**/11/11 | theirs: 2:80% 3:8% 4:12% | — | 96% |
| 2S | 14.5% | 25 | 13 | 5/6/**7**/8/9 | 4:84% 5:16% | **3.5** (3.3–4.6) | 80% |

### (1S) X (2S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 27.7% | 53 | 20 | 2/2/**4**/5/10 | — | — | 60% |
| 3H | 22.0% | 42 | 12 | 6/9/**10**/10/10 | 4:31% 5:62% 6:5% 7:2% | **4.9** (3.5–5.3) | 48% |
| 4H | 16.8% | 32 | 8 | 6/9/**10**/10/10 | 4:3% 5:91% 6:3% 7:3% | **4.9** (4.8–5.3) | 34% |

## Uncontested responses: 1x (P) ?

Partner opened (natural style), RHO passed. Responder ranges. The 1C row shows STANDARD responders; transfer-walsh pairs (1D = ♥, 1H = ♠, 1S = no-major NT-ish) are tabulated separately below.

### 1C (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 1H | 33.0% | 2089 | 813 | 5/7/**10**/12/15 | 4:61% 5:26% 6:9% 7:3% | **3.8** (2.7–4.9) | 52% |
| 1D | 24.4% | 1540 | 827 | 3/5/**9**/13/17 | <2:3% 2:6% 3:12% 4:28% 5:29% 6:16% 7:6% | **4.1** (2.3–5.4) | 56% |
| 1S | 28.3% | 1787 | 642 | 5/8/**10**/12/16 | 4:48% 5:38% 6:10% 7+:3% | **3.8** (2.9–5.1) | 49% |
| 1NT | 4.7% | 300 | 263 | 7/8/**9**/10/15 | — | — | 95% |
| 2C | 2.8% | 175 | 171 | 8/12/**15**/15/20 | <2:2% 2:5% 3:5% 4:23% 5:37% 6:26% 7:2% | **5.5** (4.0–7.6) | 59% |
| 2D | 1.3% | 84 | 140 | 5/9/**13**/16/19 | 1:6% 2:5% 3:11% 5:29% 6:40% 7:10% | **5.1** (3.9–5.7) | 21% |
| P | 1.9% | 118 | 68 | 2/2/**4**/4/5 | — | — | 74% |
| 2H | 1.0% | 63 | 90 | 6/8/**12**/15/15 | 2:22% 3:30% 4:16% 5:5% 6:16% 7:11% | **4.6** (2.4–5.5) | 46% |
| 2NT | 0.6% | 35 | 65 | 10/11/**12**/14/15 | — | — | 91% |
| 2S | 0.7% | 44 | 57 | 4/10/**11**/12/17 | 2:11% 3:32% 5:14% 6:23% 7:9% 8:11% | **4.4** (2.4–5.0) | 36% |
| 3NT | 0.5% | 31 | 24 | 12/12/**14**/15/15 | — | — | 100% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1H | none | 416 | 6/8/**10**/14/15 |
| 1H | fav | 742 | 6/7/**9**/11/15 |
| 1H | unfav | 303 | 6/9/**10**/12/14 |
| 1H | both | 628 | 4/7/**10**/13/16 |
| 1D | none | 377 | 3/5/**7**/13/17 |
| 1D | fav | 442 | 2/5/**11**/13/17 |
| 1D | unfav | 275 | 4/6/**12**/15/19 |
| 1D | both | 446 | 3/6/**9**/12/16 |
| 1S | none | 419 | 6/8/**10**/12/14 |
| 1S | fav | 635 | 4/8/**10**/12/18 |
| 1S | unfav | 317 | 4/8/**10**/11/16 |
| 1S | both | 416 | 6/9/**10**/12/16 |
| 1NT | none | 136 | 7/9/**10**/10/11 |
| 1NT | fav | 30 | 7/9/**9**/11/18 |
| 1NT | unfav | 46 | 8/8/**8**/10/19 |
| 1NT | both | 88 | 7/8/**10**/10/15 |
| 2C | none | 27 | 7/9/**13**/14/21 |
| 2C | fav | 44 | 7/13/**14**/15/18 |
| 2C | unfav | 78 | 12/15/**15**/15/20 |
| 2C | both | 26 | 8/10/**12**/15/15 |

Dealer filters (paste into the custom filter box; derived from the data):

- `1H` → `h >= 4 and top(h,5) >= 1 and hcp in 5..15`
- `1D` → `d >= 3 and hcp in 3..17`
- `1S` → `s >= 4 and top(s,5) >= 1 and hcp in 5..16`
- `1NT` → `hcp in 7..15` *(+ balanced)*
- `2C` → `c >= 3 and top(c,5) >= 1 and hcp in 8..20`
- `2D` → `hcp in 5..19`

### 1D (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 1S | 37.8% | 3841 | 464 | 5/8/**10**/12/15 | 4:45% 5:43% 6:10% 7+:2% | **4.0** (2.4–5.2) | 53% |
| 1H | 36.5% | 3703 | 586 | 5/7/**9**/11/15 | <4:2% 4:56% 5:31% 6:8% 7:3% | **3.6** (2.2–4.7) | 45% |
| 1NT | 6.3% | 640 | 161 | 5/8/**8**/9/13 | — | — | 70% |
| 2C | 5.8% | 588 | 135 | 10/11/**13**/15/19 | <3:2% 3:7% 4:15% 5:27% 6:38% 7:10% | **5.5** (3.8–6.3) | 38% |
| P | 4.5% | 457 | 90 | 0/3/**4**/4/5 | — | — | 75% |
| 2D | 3.6% | 370 | 107 | 7/10/**14**/15/17 | <3:2% 3:3% 4:59% 5:28% 6:7% | **4.7** (3.7–6.9) | 78% |
| 2H | 1.1% | 114 | 50 | 4/6/**6**/9/12 | 2:4% 3:3% 4:18% 5:27% 6:38% 7:8% 8+:2% | **3.8** (2.7–4.7) | 7% |
| 2NT | 0.9% | 93 | 52 | 6/11/**12**/13/15 | — | — | 92% |
| 2S | 0.8% | 83 | 46 | 5/8/**9**/10/12 | 1:5% 2:8% 3:27% 4:2% 5:11% 6:30% 7:17% | **3.4** (1.9–4.3) | 12% |
| 3C | 0.7% | 72 | 31 | 8/9/**9**/10/15 | 2:6% 3:17% 4:8% 5:8% 6:10% 7:51% | **5.8** (3.7–8.4) | 24% |
| 3NT | 0.6% | 60 | 19 | 10/12/**14**/15/15 | — | — | 95% |
| 3D | 0.6% | 60 | 27 | 3/5/**8**/9/10 | 4:45% 5:25% 6:30% | **3.2** (2.3–4.1) | 40% |
| 4H | 0.3% | 32 | 9 | 8/8/**8**/10/11 | 2:6% 7:88% 8:6% | **4.4** (4.4–5.1) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1S | none | 1167 | 5/7/**10**/12/14 |
| 1S | fav | 1030 | 5/8/**9**/11/15 |
| 1S | unfav | 778 | 5/7/**9**/11/16 |
| 1S | both | 866 | 6/8/**10**/12/14 |
| 1H | none | 529 | 5/7/**8**/10/15 |
| 1H | fav | 1216 | 5/7/**9**/12/17 |
| 1H | unfav | 752 | 5/7/**8**/11/13 |
| 1H | both | 1206 | 4/7/**9**/12/15 |
| 1NT | none | 122 | 5/6/**9**/10/10 |
| 1NT | fav | 183 | 5/7/**9**/9/14 |
| 1NT | unfav | 115 | 6/8/**9**/9/13 |
| 1NT | both | 220 | 6/8/**8**/9/11 |
| 2C | none | 156 | 9/13/**15**/19/19 |
| 2C | fav | 195 | 10/10/**14**/14/18 |
| 2C | unfav | 116 | 8/11/**12**/15/17 |
| 2C | both | 121 | 9/11/**12**/12/16 |
| 2D | none | 47 | 7/12/**15**/15/15 |
| 2D | fav | 185 | 8/10/**14**/15/18 |
| 2D | unfav | 118 | 8/11/**15**/17/17 |
| 2H | fav | 39 | 6/6/**6**/8/15 |
| 2H | unfav | 28 | 6/7/**8**/9/11 |
| 2H | both | 32 | 4/6/**6**/6/12 |

Dealer filters (paste into the custom filter box; derived from the data):

- `1S` → `s >= 4 and top(s,5) >= 1 and hcp in 5..15`
- `1H` → `h >= 4 and top(h,5) >= 1 and hcp in 5..15`
- `1NT` → `hcp in 5..13`
- `2C` → `c >= 4 and top(c,5) >= 1 and hcp in 10..19`
- `2D` → `d >= 4 and top(d,5) >= 1 and hcp in 7..17`
- `2H` → `h >= 4 and top(h,5) >= 1 and hcp in 4..12`

### 1H (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 1S | 34.2% | 2251 | 316 | 5/7/**10**/12/17 | <4:1% 4:41% 5:45% 6:10% 7:3% | **3.8** (2.6–5.2) | 38% |
| 2C | 15.4% | 1015 | 203 | 9/11/**13**/15/18 | 1:4% 2:14% 3:24% 4:24% 5:22% 6:10% 7+:3% | **4.2** (2.7–5.7) | 67% |
| 1NT | 12.3% | 813 | 230 | 4/7/**9**/10/13 | — | — | 45% |
| 2H | 11.3% | 746 | 107 | 5/7/**8**/9/10 | 3:91% 4:9% | **1.7** (0.4–4.1) | 94% |
| 2NT | 6.9% | 453 | 102 | 8/10/**12**/14/15 | — | — | 61% |
| 2D | 6.4% | 422 | 105 | 9/11/**13**/14/17 | <3:2% 3:5% 4:7% 5:49% 6:36% | **5.2** (4.0–6.5) | 39% |
| P | 5.0% | 327 | 61 | 0/2/**2**/4/5 | — | — | 61% |
| 2S | 1.9% | 122 | 63 | 3/6/**8**/11/13 | 2:4% 3:20% 4:14% 5:12% 6:39% 7:10% | **4.4** (3.6–5.2) | 24% |
| 3C | 1.9% | 123 | 53 | 6/8/**10**/11/12 | 1:17% 2:20% 3:24% 4:29% 5:5% 6:2% 7:2% | **3.4** (1.5–4.2) | 59% |
| 3D | 1.7% | 111 | 53 | 7/9/**10**/11/12 | 1:11% 2:37% 3:19% 4:16% 5:5% 6:13% | **3.2** (2.0–5.4) | 53% |
| 3H | 1.3% | 84 | 34 | 2/2/**6**/9/10 | 3:7% 4:92% 5+:1% | **1.5** (1.5–3.7) | 35% |
| 4H | 0.5% | 36 | 40 | 6/7/**8**/9/13 | 3:11% 4:42% 5:19% 6:28% | **4.3** (2.3–4.6) | 14% |
| 3NT | 0.4% | 29 | 22 | 10/11/**13**/13/14 | — | — | 79% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1S | none | 377 | 5/10/**11**/13/16 |
| 1S | fav | 756 | 6/7/**9**/10/14 |
| 1S | unfav | 436 | 5/8/**12**/16/18 |
| 1S | both | 682 | 3/6/**9**/11/13 |
| 2C | none | 163 | 8/12/**14**/16/18 |
| 2C | fav | 257 | 8/10/**13**/14/18 |
| 2C | unfav | 343 | 9/11/**13**/14/16 |
| 2C | both | 252 | 9/13/**15**/16/17 |
| 1NT | none | 152 | 2/6/**8**/10/14 |
| 1NT | fav | 301 | 4/5/**9**/10/11 |
| 1NT | unfav | 205 | 5/8/**9**/11/13 |
| 1NT | both | 155 | 6/8/**9**/10/13 |
| 2H | none | 305 | 6/7/**9**/9/9 |
| 2H | fav | 115 | 5/6/**7**/9/10 |
| 2H | unfav | 181 | 6/7/**8**/8/9 |
| 2H | both | 145 | 7/7/**7**/9/10 |
| 2NT | none | 108 | 10/13/**13**/14/17 |
| 2NT | fav | 165 | 7/10/**12**/13/14 |
| 2NT | unfav | 110 | 9/11/**13**/15/15 |
| 2NT | both | 70 | 8/10/**10**/10/14 |
| 2D | none | 30 | 6/10/**13**/17/18 |
| 2D | fav | 43 | 7/9/**10**/11/15 |
| 2D | unfav | 124 | 9/13/**13**/13/14 |
| 2D | both | 225 | 10/11/**13**/14/17 |

Dealer filters (paste into the custom filter box; derived from the data):

- `1S` → `s >= 4 and hcp in 5..17`
- `2C` → `hcp in 9..18`
- `1NT` → `hcp in 4..13`
- `2H` → `((hcp in 5..11 and s >= 4) or (hcp in 5..11 and s <= 3 and h <= 3))`
- `2NT` → `hcp in 8..15`
- `2D` → `d >= 4 and top(d,5) >= 1 and hcp in 9..17`

### 1S (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 1NT | 30.7% | 2596 | 403 | 4/7/**8**/9/11 | — | — | 30% |
| 2C | 21.1% | 1787 | 298 | 9/11/**13**/15/17 | <2:2% 2:14% 3:18% 4:40% 5:11% 6:11% 7:5% | **4.5** (2.9–6.0) | 66% |
| 2S | 9.7% | 817 | 147 | 4/6/**8**/9/10 | 3:91% 4:9% | **1.6** (0.9–4.3) | 79% |
| 2D | 8.5% | 715 | 138 | 9/13/**14**/15/18 | 2:3% 3:4% 4:8% 5:49% 6:33% 7+:2% | **4.8** (3.9–6.5) | 24% |
| 2NT | 7.4% | 630 | 141 | 8/10/**12**/14/15 | — | — | 51% |
| 2H | 6.7% | 570 | 132 | 10/12/**13**/16/17 | <5:4% 5:54% 6:37% 7:2% 8:3% | **5.7** (4.2–6.2) | 21% |
| P | 4.8% | 403 | 87 | 1/3/**4**/4/5 | — | — | 41% |
| 4S | 1.9% | 161 | 52 | 0/5/**6**/8/9 | <4:1% 4:22% 5:48% 6:29% | **3.0** (1.7–4.5) | 2% |
| 3C | 2.4% | 202 | 92 | 6/8/**10**/10/13 | 1:18% 2:20% 3:20% 4:17% 5:2% 6:20% 7+:2% | **3.0** (0.9–5.3) | 38% |
| 3D | 2.1% | 177 | 76 | 6/8/**9**/10/12 | 1:10% 2:21% 3:23% 4:15% 5:19% 6:2% 7:10% | **3.6** (1.5–4.7) | 41% |
| 3S | 1.2% | 102 | 48 | 0/5/**6**/8/10 | 3:6% 4:74% 5:21% | **2.5** (1.7–3.2) | 32% |
| 4C | 1.0% | 84 | 16 | 9/10/**12**/12/14 | 0:7% 1:89% 2:2% 3+:1% | **0.4** (0.0–0.9) | 0% |
| 3NT | 1.0% | 86 | 34 | 6/9/**10**/12/14 | — | — | 31% |
| 3H | 0.9% | 78 | 45 | 6/8/**10**/11/13 | 1:8% 2:14% 3:15% 4:28% 5:5% 6:29% | **4.5** (2.7–5.4) | 36% |
| 4D | 0.4% | 35 | 9 | 8/9/**10**/12/13 | 0:9% 1:89% 4:3% | **0.4** (0.0–0.4) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1NT | none | 429 | 4/7/**8**/9/11 |
| 1NT | fav | 732 | 4/6/**7**/8/11 |
| 1NT | unfav | 614 | 4/7/**9**/9/11 |
| 1NT | both | 821 | 6/7/**8**/9/11 |
| 2C | none | 306 | 9/12/**13**/14/15 |
| 2C | fav | 480 | 9/11/**13**/14/20 |
| 2C | unfav | 419 | 10/13/**13**/16/17 |
| 2C | both | 582 | 9/11/**12**/14/17 |
| 2S | none | 142 | 4/8/**10**/10/10 |
| 2S | fav | 259 | 4/6/**7**/9/9 |
| 2S | unfav | 130 | 4/7/**8**/9/9 |
| 2S | both | 286 | 6/7/**8**/9/10 |
| 2D | none | 105 | 10/13/**15**/15/15 |
| 2D | fav | 326 | 8/13/**14**/14/17 |
| 2D | unfav | 95 | 10/13/**13**/14/17 |
| 2D | both | 189 | 9/11/**14**/17/18 |
| 2NT | none | 133 | 9/11/**12**/14/15 |
| 2NT | fav | 269 | 8/9/**12**/14/15 |
| 2NT | unfav | 57 | 7/10/**12**/13/13 |
| 2NT | both | 171 | 9/10/**11**/12/15 |
| 2H | none | 121 | 10/12/**13**/17/17 |
| 2H | fav | 160 | 9/11/**13**/14/14 |
| 2H | unfav | 232 | 11/12/**12**/16/18 |
| 2H | both | 57 | 8/10/**14**/14/18 |

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
| 2C | 28.2% | 3027 | 633 | 6/8/**9**/11/14 | <1:2% 1:13% 2:28% 3:29% 4:21% 5:5% 6:3% | **2.7** (0.9–4.5) | 47% |
| P | 20.7% | 2225 | 445 | 3/4/**6**/7/8 | — | — | 74% |
| 2H | 13.3% | 1427 | 277 | 3/6/**9**/12/16 | 0:4% 1:12% 2:36% 3:41% 4:3% 5:4% | **1.9** (0.2–3.9) | 41% |
| 2D | 12.6% | 1352 | 277 | 3/5/**7**/10/16 | 1:22% 2:26% 3:31% 4:15% 5:6% | **1.9** (0.7–3.7) | 27% |
| 3NT | 9.2% | 986 | 216 | 8/10/**10**/12/14 | — | — | 77% |
| 2NT | 3.7% | 392 | 200 | 5/9/**11**/12/16 | — | — | 54% |
| 3C | 3.6% | 391 | 170 | 6/10/**11**/12/16 | <1:2% 1:12% 2:28% 3:20% 4:21% 5:10% 6:7% | **3.8** (1.8–5.4) | 62% |
| 2S | 2.5% | 264 | 145 | 6/9/**10**/12/21 | 1:26% 2:11% 3:54% 4:5% 5:2% | **3.0** (0.4–5.4) | 37% |
| 4D | 1.8% | 191 | 56 | 7/8/**9**/10/15 | <1:2% 1:17% 2:32% 3:43% 4:4% 5:2% | **1.5** (0.9–4.2) | 1% |
| 4H | 1.1% | 123 | 42 | 7/9/**9**/9/17 | 0:2% 1:6% 2:34% 3:54% 4:2% 6:2% | **2.4** (1.3–3.5) | 1% |
| 4C | 0.9% | 99 | 27 | 7/8/**9**/10/19 | 1:31% 2:22% 3:40% 4:1% 5:5% | **3.8** (0.0–4.7) | 1% |
| 3S | 0.7% | 72 | 35 | 9/10/**10**/11/16 | 1:81% 2:1% 3:10% 4:6% 5+:3% | **0.0** (0.0–3.9) | 7% |
| 3D | 0.7% | 71 | 54 | 6/9/**11**/12/16 | 1:35% 2:15% 3:10% 4:10% 5:17% 6:13% | **3.1** (0.0–4.2) | 21% |
| 3H | 0.4% | 47 | 25 | 8/10/**12**/21/21 | 1:79% 2:13% 3:9% | **5.6** (3.9–10.0) | 6% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2C | none | 749 | 6/8/**9**/10/14 |
| 2C | fav | 866 | 3/8/**10**/13/16 |
| 2C | unfav | 663 | 5/8/**10**/11/14 |
| 2C | both | 749 | 6/7/**9**/10/14 |
| 2H | none | 415 | 3/7/**9**/13/14 |
| 2H | fav | 510 | 4/6/**10**/12/15 |
| 2H | unfav | 230 | 3/9/**12**/17/17 |
| 2H | both | 272 | 1/5/**6**/9/12 |
| 2D | none | 441 | 3/5/**7**/9/17 |
| 2D | fav | 314 | 3/7/**8**/12/16 |
| 2D | unfav | 231 | 2/5/**6**/10/12 |
| 2D | both | 366 | 4/6/**7**/10/14 |
| 3NT | none | 389 | 9/10/**10**/12/15 |
| 3NT | fav | 311 | 8/10/**10**/12/14 |
| 3NT | unfav | 157 | 8/10/**11**/12/13 |
| 3NT | both | 129 | 8/9/**11**/11/15 |
| 2NT | none | 102 | 5/9/**11**/14/16 |
| 2NT | fav | 135 | 8/10/**11**/13/16 |
| 2NT | unfav | 60 | 8/9/**11**/11/15 |
| 2NT | both | 95 | 2/7/**9**/11/12 |
| 3C | none | 110 | 8/10/**12**/14/19 |
| 3C | fav | 136 | 8/10/**11**/13/17 |
| 3C | unfav | 62 | 9/10/**11**/12/15 |
| 3C | both | 83 | 2/8/**10**/11/14 |

Dealer filters (paste into the custom filter box; derived from the data):

- `2C` → `((hcp in 6..11 and h >= 4) or (hcp in 6..11 and s >= 4))`
- `2H` → `(hcp in 3..16 and s >= 4)`
- `2D` → `(hcp in 3..16 and h >= 4)`
- `3NT` → `hcp in 8..14`
- `2NT` → `hcp in 5..16`
- `3C` → `((hcp in 6..11 and h >= 4) or (hcp in 6..16 and s >= 4) or (hcp in 6..16 and s <= 3 and h <= 3))`

## Transfer responses to 1C: 1C (P) ? by transfer-walsh pairs

Detected per partnership from the hands (4+ of the next suit in essentially every 1D/1H response). The derived rules key on the suit actually shown: 1D = hearts, 1H = spades. The field’s 1S is multi-way — see the decision matrices below for its components.

### 1C (P) ? — transfer responders

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 1H | 34.3% | 1065 | 813 | 4/7/**10**/11/15 | 0:2% 1:8% 2:26% 3:50% 4:10% 5:3% | **3.0** (0.9–4.5) | 49% |
| 1D | 34.8% | 1079 | 827 | 4/7/**9**/12/15 | 1:9% 2:25% 3:27% 4:27% 5:9% 6:3% | **3.0** (1.5–4.9) | 52% |
| 1S | 15.9% | 493 | 642 | 4/8/**10**/13/17 | 0:2% 1:3% 2:25% 3:62% 4:4% 5:3% 6+:1% | **3.0** (1.5–4.3) | 64% |
| 1NT | 4.0% | 123 | 263 | 8/10/**12**/14/19 | — | — | 88% |
| 2C | 3.5% | 108 | 171 | 8/12/**13**/15/20 | 0:4% 1:11% 2:19% 3:9% 4:6% 5:27% 6:23% | **4.3** (2.5–6.2) | 31% |
| 2D | 1.7% | 54 | 140 | 4/9/**13**/15/19 | <2:2% 2:24% 3:26% 4:6% 5:26% 6:7% 7:9% | **4.8** (3.3–5.6) | 24% |
| P | 2.3% | 71 | 68 | 1/2/**4**/4/5 | — | — | 76% |
| 2H | 1.1% | 34 | 90 | 4/6/**8**/11/17 | 0:6% 1:6% 2:24% 3:15% 4:18% 5:15% 6:15% 7:3% | **2.2** (0.5–4.6) | 3% |
| 2NT | 0.8% | 26 | 65 | 12/13/**14**/15/16 | — | — | 88% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1H | none | 259 | 5/7/**10**/12/14 |
| 1H | fav | 347 | 3/7/**9**/11/17 |
| 1H | unfav | 203 | 5/7/**9**/11/14 |
| 1H | both | 256 | 6/8/**10**/12/16 |
| 1D | none | 205 | 5/8/**9**/13/15 |
| 1D | fav | 377 | 5/7/**9**/11/16 |
| 1D | unfav | 161 | 5/8/**10**/12/14 |
| 1D | both | 336 | 4/6/**10**/12/15 |
| 1S | none | 136 | 5/7/**10**/13/17 |
| 1S | fav | 141 | 4/8/**11**/13/17 |
| 1S | unfav | 96 | 5/8/**11**/15/19 |
| 1S | both | 120 | 4/8/**9**/12/13 |
| 1NT | none | 34 | 8/10/**11**/13/19 |
| 1NT | fav | 37 | 6/11/**13**/15/18 |
| 1NT | both | 28 | 8/10/**10**/11/16 |
| 2C | fav | 33 | 6/11/**13**/14/17 |
| 2C | unfav | 37 | 8/13/**15**/15/20 |

Dealer filters (paste into the custom filter box; derived from the data):

- `1H` → `(hcp in 4..15 and s >= 4)`
- `1D` → `(hcp in 4..15 and h >= 4)`
- `1S` → `(hcp in 4..17 and s <= 3 and h <= 3)`
- `1NT` → `hcp in 8..19` *(+ balanced)*
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
| ≤4 HCP | 442 | 14% | 17% | 44% | · | · | 22% | 1% | 2% |
| 5–11 · 4♥ only | 1098 | 88% | · | 9% | · | · | 1% | · | 1% |
| 5–11 · 4♠ only | 1197 | · | 84% | 14% | · | · | · | 1% | 1% |
| 5–11 · 4-4+ majors | 622 | 62% | 27% | 7% | · | · | · | · | 3% |
| 5–11 · no 4M | 843 | · | · | 55% | 31% | 2% | 1% | 2% | 8% |
| 12+ · 4♥ only | 662 | 66% | · | 29% | · | 1% | · | 2% | 2% |
| 12+ · 4♠ only | 575 | · | 83% | 10% | 1% | 1% | · | 1% | 3% |
| 12+ · 4-4+ majors | 305 | 75% | 17% | 3% | 2% | 3% | · | · | · |
| 12+ · no 4M bal | 426 | · | · | 54% | 3% | 19% | · | 4% | 19% |
| 12+ · no 4M unbal | 151 | · | 1% | 54% | · | 31% | · | 11% | 2% |

### 1C (X) ? — standard responders

| hand type | n | P | 1D | 1H | 1S | XX | 2C | 2D | other |
|---|---|---|---|---|---|---|---|---|---|
| ≤4 HCP | 287 | 78% | 8% | 3% | 3% | · | 1% | 1% | 6% |
| 5–11 · 4♥ only | 205 | 15% | 27% | 40% | 1% | 4% | 1% | 5% | 6% |
| 5–11 · 4♠ only | 245 | 11% | 7% | 18% | 44% | 13% | · | · | 6% |
| 5–11 · 4-4+ majors | 62 | 10% | 10% | 47% | 26% | 6% | 2% | · | · |
| 5–11 · no 4M | 223 | 22% | 29% | · | 13% | 7% | 11% | 4% | 13% |

### 1C (1D) ? — standard responders

| hand type | n | 1H | X | 1S | P | 3C | 2C | 2D | other |
|---|---|---|---|---|---|---|---|---|---|
| ≤4 HCP | 107 | 9% | 7% | 3% | 62% | 2% | 1% | 6% | 11% |
| 5–11 · 4♥ only | 168 | 45% | 40% | · | 7% | · | · | 5% | 4% |
| 5–11 · 4♠ only | 168 | 29% | 4% | 42% | 8% | · | · | 1% | 17% |
| 5–11 · 4-4+ majors | 170 | 15% | 47% | 20% | 3% | · | 11% | 1% | 3% |
| 5–11 · no 4M | 199 | · | · | 13% | 14% | 36% | 25% | 3% | 10% |
| 12+ · 4♠ only | 42 | 40% | 12% | 43% | · | · | · | · | 5% |

### 1C (P) ? — transfer-walsh responders

| hand type | n | 1D | 1H | 1S | 1NT | 2C | P | 2D | other |
|---|---|---|---|---|---|---|---|---|---|
| ≤4 HCP | 209 | 26% | 27% | 12% | · | · | 29% | 1% | 3% |
| 5–11 · 4♥ only | 491 | 94% | 2% | 1% | · | · | · | 2% | 1% |
| 5–11 · 4♠ only | 677 | 1% | 94% | 2% | · | 1% | · | · | 2% |
| 5–11 · 4-4+ majors | 348 | 66% | 28% | · | · | 1% | · | 1% | 3% |
| 5–11 · no 4M | 359 | 3% | 1% | 70% | 15% | 3% | 2% | 1% | 6% |
| 12+ · 4♥ only | 308 | 63% | 2% | 18% | 3% | 7% | · | 4% | 3% |
| 12+ · 4♠ only | 302 | 2% | 77% | 8% | 6% | 1% | · | 1% | 5% |
| 12+ · 4-4+ majors | 142 | 73% | 18% | · | 5% | 1% | · | 1% | 2% |
| 12+ · no 4M bal | 194 | 4% | · | 49% | 13% | 14% | · | 6% | 13% |
| 12+ · no 4M unbal | 75 | 3% | · | 36% | 3% | 41% | · | 13% | 4% |

### 1C (X) ? — transfer-walsh responders

| hand type | n | P | 1H | 1D | 1S | XX | 2H | 2S | other |
|---|---|---|---|---|---|---|---|---|---|
| ≤4 HCP | 142 | 70% | 7% | 7% | 3% | 2% | 4% | 4% | 2% |
| 5–11 · 4♥ only | 88 | 19% | 2% | 57% | 1% | 7% | 2% | · | 11% |
| 5–11 · 4♠ only | 102 | 16% | 61% | · | 5% | 13% | 3% | 1% | 2% |
| 5–11 · 4-4+ majors | 27 | 7% | 44% | 30% | 4% | 4% | 7% | · | 4% |
| 5–11 · no 4M | 84 | 17% | · | 2% | 50% | 11% | · | 4% | 17% |

### 1C (1D) ? — transfer-walsh responders

| hand type | n | X | 1H | P | 1S | 2C | 3C | 2H | other |
|---|---|---|---|---|---|---|---|---|---|
| ≤4 HCP | 40 | 18% | · | 63% | 3% | 3% | · | 5% | 10% |
| 5–11 · 4♥ only | 81 | 78% | 5% | 4% | 1% | · | · | 1% | 11% |
| 5–11 · 4♠ only | 87 | 2% | 68% | 9% | 7% | · | · | 9% | 5% |
| 5–11 · 4-4+ majors | 82 | 50% | 26% | · | 12% | 9% | · | · | 4% |
| 5–11 · no 4M | 74 | 1% | · | 16% | 28% | 20% | 19% | · | 15% |

## Book vs field

"Book" is the SAYC/2-over-1 teaching range (ACBL SAYC card/booklet). "Field" is
this dataset: p5–p95 (median). The field is systematically lighter than the book
at the bottom of ranges, and vulnerability is the biggest modifier for preempts.

| context | book | field |
|---|---|---|
| 1M opening (seats 1–2) | 12–21 (light 11s common in practice) | 10–17 (med 13), n=18831 |
| 1NT opening (strong-NT pairs) | 15–17 | 14–17 (med 15), n=13484 |
| 2NT opening | 20–21 | 19–21 (med 20), n=2013 |
| weak 2S (seats 1–3) | 5–11, 6-card suit | 5–11 (med 8), n=2019 |
| 1-level overcall (1C) 1H | 8–16 (down to ~8) | 7–16 (med 11), n=2258 |
| 2-level overcall (1S) 2H | 10–17ish, good suit | 10–15 (med 12), n=975 |
| 1NT overcall (1H) 1NT | 15–18 | 14–17 (med 15), n=393 |
| takeout double (1S) X | opening values (12+) or shape | 11–19 (med 13), n=1122 |
| weak jump overcall (1C) 2H | ~6–10, 6-card suit | 4–12 (med 8), n=389 |
| Michaels (1H) 2H | 8–12 or 16+, 5-5 | 8–14 (med 12), n=394 |
| unusual 2NT (1S) 2NT | weak or 17+, 5-5 minors | 7–15 (med 11), n=124 |
| negative double 1S (2H) X | 7+ (level-adjusted) | 7–15 (med 10), n=92 |
| new suit response 1C (P) 1H (std responders) | 6+ | 5–15 (med 10), n=2089 |

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
  "n": 1568,
  "hcp": {
    "mean": 14.07,
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
      "n": 665,
      "p": [
        11,
        11,
        12,
        13,
        15,
        17,
        18
      ]
    },
    "3": {
      "n": 386,
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
      "n": 484,
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
      "n": 33,
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

