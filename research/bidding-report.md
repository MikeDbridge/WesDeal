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

- 333262 table results scanned; 124562 carry an auction; 124510 auctions
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
| usbc26/RR | 2107 |
| herning25/SF | 1703 |
| marrakech23/SF | 1518 |
| herning25/FF | 1310 |
| marrakech23/FF | 1271 |
| prague26tn/16 | 868 |
| strasbourg23tn/16 | 839 |
| usbc26/QF | 682 |
| herning25tn/16 | 512 |
| strasbourg23tn/QF | 448 |
| prague26tn/QF | 447 |
| usbc26/SF | 320 |
| herning25tn/QF | 256 |
| prague26tn/SF | 224 |
| herning25tn/SF | 222 |
| strasbourg23tn/SF | 222 |
| herning25tn/FF | 195 |
| usbc26/FF | 174 |
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
  natural 1C carry a median suit texture of 4.1/10; sound ones (11+) get away
  with 5.1/10 — the values carry a moderate suit. The derived filters
  encode exactly that: a quality floor everyone meets, plus a higher bar that
  only applies below 11 HCP (`hcp >= 11 or top(h,5) >= …`).
- **Takeout doubles are opening-strength, not 12+**: (1S) X runs 11–19 (med 13);
  the light tail (10–11) comes with shape.
- **The 1NT overcall is a strong NT**: (1H) 1NT = 14–17 (med 15); balancing
  (1H) P (P) 1NT is 4 HCP lighter at 9–15 (med 11).
- **Vulnerability moves preempts, not constructive bids.** Weak jump overcalls
  swing hardest: (1C) 2H is median 7 at favourable but 10 at unfavourable.
  Simple overcalls and doubles barely move (±1 HCP).
- **Two-suited bids are universal**: (1H) 2H (Michaels) = 8–14 (med 12) with ≤2
  hearts 99% of the time; (1M) 2NT is the two lowest suits, unbalanced.
- **Negative doubles start at ~7**: 1S (2H) X = 7–15 (med 10). Redouble after
  1C (X) shows 6–16 (med 11).
- **Transfer responses to 1C are mainstream**: of classified natural-club pairs,
  141 play transfers vs 355 standard. Their 1C (P) 1D holds 4+ hearts 96%
  of the time (5–15 (med 9) HCP), and 1S is the no-major hand (79% with no 4-card major, 5–17 (med 10)) — the
  derived rules follow the shown suit, and the treatment carries on over a
  double or 1D overcall (see the transfer-responder sections).
- **Defence to 1NT is conventional and the data shows it**: (1NT) 2C holds both
  majors 4+ 90% of the time (clubs are incidental); (1NT) 2D has a 5+
  major 93% (6+ 85%) — multi-style; 2M shows the major plus a 4+ minor.
  The derived rules detect these shapes instead of reading the bid suit at
  face value (see the (1NT) ? section).
- **At this level 2D is multi** (277 pairs multi vs 51 weak among classified),
  2C strong is standard, and strong-club pairs are 14% of the field (127 of 893).
- **Shortage in their suit buys lighter action.** (1D) 1S overcallers with ≤2
  diamonds are median 10 HCP (p5 7); with 3+ diamonds median 11 (p5 7).
  The same gradient shows up in every overcall and double context (see the
  per-context cross-tabs), so the derived filters split their-suit shortage
  from length.
- **Doubles are support-first below 17, shape-free above.** Under 17 HCP, (1H) X
  holds 3+ spades 100% of the time (4+ 75%) and 2+ in both
  minors 99%; (1C) X holds both majors 3+ 95%. At 17+ those rates
  drop to 70% / 64% — the strong double is its own animal, and the derived
  filters carry it as a separate shape-free branch.
- **Action rates need a fixed-strength lens** (a strong 1C depletes the seats
  behind it). Holding 9–11 HCP, the direct seat acts 59% over a natural 1C, 56% over 1D, 48% over a strong 1C.
  See the action-rate section for the full grid.

## Partnership system census

Each partnership is classified from its own openings (min 6 samples per bid).

- 1C style: natural 655, strong 127, unknown 90, short 14, polish 7
- 1D style: natural 742, unknown 110, nebulous 41
- 1NT range: strong 673, unknown 135, weak 85
- 2C style: unknown 611, strong 157, natural 125
- 2D style: unknown 475, multi 277, other 90, weak 51
- natural base (1C natural/short and 1D not nebulous): yes 667, no 226
- 1C response style (natural/short openers, from their own 1D/1H responses):
  standard 355, transfer-walsh 141, insufficient data 161

## Openings (natural-base pairs)

HCP shown as p5/p25/**median**/p75/p95. Length is the bid suit, p5–p95 (median).
Style filter: 1C/1D/1NT/2C/2D rows use pairs whose that-bid style is natural
(1C natural or short-club; 1D natural; 2C strong excluded from "natural" row…);
1M and preempts use natural-base pairs.

### Seat 1 + Seat 2

| opening | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|
| 1C | 16783 | 1508 | 11/12/**13**/14/18 | 2:6% 3:22% 4:30% 5:23% 6:13% 7:4% | **4.8** (3.5–6.2) | 59% |
| 1D | 15442 | 1241 | 10/12/**13**/14/18 | <3:1% 3:5% 4:30% 5:38% 6:21% 7:4% | **4.8** (3.6–6.2) | 36% |
| 1H | 9026 | 666 | 10/11/**13**/15/17 | 5:72% 6:23% 7:2% 8+:1% | **5.1** (3.8–6.3) | 17% |
| 1S | 9492 | 705 | 10/11/**13**/15/17 | 5:61% 6:33% 7:5% | **4.9** (3.7–6.3) | 18% |
| 1NT | 9747 | 1199 | 13/14/**15**/16/17 | — | — | 84% |
| 2C | 724 | 443 | 6/14/**20**/21/24 | <1:1% 1:8% 2:22% 3:35% 4:20% 5:8% 6:4% | **5.4** (3.0–7.5) | 42% |
| 2D | 270 | 708 | 4/6/**8**/9/13 | <5:4% 5:7% 6:80% 7:9% | **3.9** (2.9–5.2) | 2% |
| 2H | 1440 | 422 | 5/7/**8**/9/11 | <2:1% 2:3% 3:2% 4:6% 5:33% 6:52% 7:3% | **4.2** (2.9–5.4) | 5% |
| 2S | 1849 | 302 | 5/7/**8**/9/11 | 5:34% 6:64% 7+:1% | **4.4** (3.1–5.6) | 3% |
| 2NT | 1542 | 154 | 19/19/**20**/21/21 | — | — | 84% |
| 3C | 558 | 76 | 5/5/**7**/9/10 | <5:2% 5:3% 6:65% 7:28% 8+:2% | **4.4** (4.0–5.6) | 2% |
| 3D | 877 | 108 | 3/5/**8**/8/10 | <6:2% 6:43% 7:55% | **5.0** (4.1–5.5) | 0% |
| 3H | 501 | 77 | 3/5/**6**/8/9 | <6:3% 6:39% 7:45% 8:13% | **3.9** (3.0–4.8) | 1% |
| 3S | 671 | 64 | 4/6/**8**/9/10 | 6:34% 7:66% | **5.0** (3.9–6.7) | 0% |
| 3NT | 110 | 27 | 10/11/**11**/13/14 | — | — | 0% |
| 4C | 71 | 20 | 5/5/**9**/12/14 | 2:13% 3:13% 4:3% 6:4% 7:24% 8:44% | **3.5** (3.5–4.1) | 0% |
| 4D | 42 | 16 | 5/5/**6**/10/15 | 1:7% 3:19% 4:5% 6:7% 7:55% 8:7% | **4.7** (2.3–4.7) | 0% |
| 4H | 313 | 29 | 3/5/**5**/10/12 | 6:2% 7:41% 8:55% 9+:2% | **4.7** (4.2–5.8) | 0% |
| 4S | 343 | 36 | 7/8/**9**/10/11 | 6:5% 7:54% 8:39% 9+:2% | **5.9** (4.7–6.6) | 0% |

### Seat 3

| opening | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|
| 1C | 3014 | 415 | 10/12/**13**/16/19 | 2:8% 3:19% 4:25% 5:30% 6:15% 7:2% | **5.0** (3.6–6.3) | 53% |
| 1D | 3558 | 320 | 10/12/**13**/15/18 | 3:4% 4:37% 5:39% 6:18% | **4.9** (3.7–6.1) | 45% |
| 1H | 1649 | 179 | 9/11/**13**/14/17 | 4:3% 5:68% 6:28% | **4.8** (3.5–6.2) | 25% |
| 1S | 2301 | 199 | 9/11/**13**/16/18 | 4:3% 5:68% 6:25% 7:3% | **5.3** (4.0–6.0) | 23% |
| 1NT | 2483 | 251 | 14/15/**15**/16/17 | — | — | 82% |
| 2C | 211 | 110 | 10/19/**21**/24/26 | 1:4% 2:14% 3:28% 4:19% 5:9% 6:16% 7:9% | **7.2** (5.1–7.9) | 31% |
| 2H | 181 | 49 | 6/7/**9**/10/11 | <3:2% 3:2% 4:2% 5:36% 6:56% 7+:2% | **3.5** (3.2–5.3) | 3% |
| 2S | 137 | 37 | 5/8/**9**/10/13 | <5:1% 5:26% 6:72% | **4.3** (3.7–6.2) | 4% |
| 2NT | 354 | 51 | 18/19/**20**/20/21 | — | — | 59% |
| 3C | 203 | 22 | 6/8/**9**/10/10 | 5:13% 6:55% 7:32% | **5.7** (4.4–6.2) | 0% |
| 3D | 63 | 16 | 4/6/**7**/8/12 | 5:10% 6:83% 7:8% | **3.8** (3.8–4.9) | 0% |
| 3H | 64 | 15 | 5/7/**9**/10/11 | <6:2% 6:63% 7:36% | **4.4** (3.5–6.9) | 0% |
| 4C | 25 | 9 | 8/8/**9**/11/11 | 6:40% 7:60% | **5.7** (4.4–6.2) | 0% |
| 4H | 71 | 14 | 10/12/**13**/13/16 | <6:1% 6:41% 7:23% 8:35% | **5.7** (3.8–6.6) | 0% |
| 4S | 74 | 10 | 11/11/**12**/12/15 | 6:19% 7:77% 8:4% | **7.8** (6.7–8.1) | 0% |

### Seat 4

| opening | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|
| 1C | 1008 | 171 | 12/13/**14**/18/20 | <2:1% 2:9% 3:36% 4:27% 5:13% 6:10% 7:4% | **5.3** (3.4–7.0) | 73% |
| 1D | 538 | 95 | 12/14/**15**/18/20 | 2:2% 3:6% 4:67% 5:9% 6:12% 7:4% | **4.8** (4.0–6.2) | 59% |
| 1H | 560 | 55 | 12/13/**15**/17/18 | 5:58% 6:41% 7+:1% | **5.0** (3.5–6.5) | 10% |
| 1S | 382 | 57 | 12/14/**16**/16/19 | <5:1% 5:52% 6:36% 7:10% | **5.4** (4.9–6.1) | 12% |
| 1NT | 904 | 95 | 14/15/**16**/16/17 | — | — | 87% |
| 2C | 59 | 37 | 16/18/**21**/23/23 | 1:7% 2:12% 3:53% 4:27% 5+:2% | **7.0** (4.5–8.2) | 83% |
| 2NT | 97 | 25 | 18/20/**20**/21/21 | — | — | 87% |

### Preempts by vulnerability (all seats, natural-base pairs)

| opening | vul | n | HCP p5/p25/med/p75/p95 | bid-suit len | texture |
|---|---|---|---|---|---|
| 2H | fav | 499 | 4/6/**7**/9/11 | <2:1% 2:3% 3:2% 4:8% 5:47% 6:38% 7+:1% | **3.9** (2.8–4.8) |
| 2H | none | 439 | 5/7/**8**/9/11 | <2:1% 2:3% 3:1% 4:8% 5:33% 6:53% | **4.4** (2.4–5.3) |
| 2H | both | 292 | 6/7/**8**/9/13 | <2:2% 2:3% 3:3% 4:3% 5:28% 6:54% 7:6% | **4.2** (3.0–5.7) |
| 2H | unfav | 403 | 5/8/**8**/10/12 | <2:1% 2:2% 3:2% 4:2% 5:18% 6:68% 7:4% | **4.4** (3.5–5.9) |
| 2S | fav | 684 | 4/7/**8**/9/11 | <5:1% 5:44% 6:54% | **4.3** (2.7–5.3) |
| 2S | none | 497 | 5/6/**9**/9/10 | <5:1% 5:41% 6:56% 7+:1% | **4.3** (3.2–5.8) |
| 2S | both | 449 | 5/7/**8**/9/11 | <5:1% 5:20% 6:77% 7+:1% | **4.4** (3.1–5.0) |
| 2S | unfav | 364 | 6/7/**9**/10/12 | 5:18% 6:80% 7+:2% | **4.9** (3.7–5.7) |
| 3C | fav | 407 | 5/6/**9**/9/10 | 5:10% 6:77% 7:12% 8+:1% | **5.2** (4.1–5.7) |
| 3C | none | 241 | 5/5/**8**/8/10 | <6:2% 6:49% 7:49% | **4.4** (4.3–5.5) |
| 3C | both | 34 | 2/7/**7**/9/13 | 3:3% 5:3% 6:41% 7:53% | **3.5** (3.5–4.3) |
| 3C | unfav | 82 | 6/9/**9**/10/10 | 1:2% 6:40% 7:50% 8:7% | **6.1** (5.5–6.3) |
| 3D | fav | 341 | 2/5/**7**/8/9 | 5:4% 6:77% 7:19% | **4.4** (3.2–5.5) |
| 3D | none | 219 | 3/6/**8**/9/10 | <6:2% 6:54% 7:44% | **5.1** (4.0–5.1) |
| 3D | both | 261 | 6/7/**8**/8/10 | 6:10% 7:89% 8+:1% | **5.3** (4.3–6.0) |
| 3D | unfav | 119 | 5/5/**7**/8/10 | 6:22% 7:78% | **5.0** (4.8–5.2) |
| 3H | fav | 205 | 2/5/**6**/7/9 | <5:2% 5:3% 6:62% 7:16% 8:17% | **3.9** (2.8–4.5) |
| 3H | none | 124 | 5/5/**7**/8/9 | <6:2% 6:55% 7:43% | **4.8** (4.1–5.9) |
| 3H | both | 144 | 5/6/**8**/9/9 | 6:3% 7:75% 8:21% | **3.6** (3.0–4.2) |
| 3H | unfav | 92 | 5/6/**7**/9/10 | 6:38% 7:60% 8:2% | **4.4** (3.3–6.6) |
| 3S | fav | 252 | 4/4/**7**/8/9 | 6:60% 7:40% | **3.9** (3.3–4.7) |
| 3S | none | 151 | 5/6/**7**/9/10 | 6:30% 7:69% | **6.3** (4.3–6.3) |
| 3S | both | 169 | 7/8/**9**/10/10 | 6:20% 7:80% | **4.8** (4.4–6.7) |
| 3S | unfav | 121 | 7/7/**7**/9/10 | 6:13% 7:86% | **7.1** (7.1–7.1) |
| 4C | fav | 52 | 5/5/**5**/9/10 | <6:4% 6:23% 7:23% 8:50% | **3.5** (3.5–4.1) |
| 4C | none | 25 | 5/8/**11**/13/14 | 3:36% 7:64% | **4.4** (3.6–5.4) |
| 4D | fav | 27 | 4/5/**5**/5/10 | 4:7% 6:15% 7:78% | **4.7** (3.0–4.7) |
| 4H | fav | 157 | 3/5/**6**/9/12 | 6:14% 7:49% 8:37% | **4.3** (3.5–5.7) |
| 4H | none | 79 | 4/5/**5**/10/16 | 6:13% 7:51% 8:30% 9:6% | **4.8** (4.7–5.3) |
| 4H | both | 129 | 5/5/**11**/12/13 | 6:3% 7:14% 8:82% | **5.4** (4.2–7.9) |
| 4S | fav | 117 | 7/7/**10**/10/12 | 6:6% 7:85% 8:9% | **6.7** (4.1–6.7) |
| 4S | none | 115 | 6/9/**9**/9/9 | 7:43% 8:56% 9+:2% | **5.9** (5.9–6.3) |
| 4S | both | 59 | 8/8/**9**/12/16 | <6:2% 6:42% 7:25% 8:24% 9:7% | **4.8** (4.4–6.7) |
| 4S | unfav | 131 | 9/10/**11**/11/14 | 7:63% 8:37% | **6.4** (5.5–7.5) |

## Direct seat: RHO opens, we act — (opening) ?

Every opening 1C–4S with enough data. For 1C/1D the tables face a NATURAL opening (strong-club and nebulous-1D openers tabulated separately below); (2D) faces a weak 2D. Suit actions over (1NT) are largely conventional — 2C = both majors, 2D = one long major (multi-style), 2M = the major + a minor — and their derived rules detect those shapes from the hands instead of reading the bid at face value.

### (1C) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 49.0% | 10140 | 1253 | 2/6/**7**/9/13 | — | — | 65% |
| 1S | 12.3% | 2538 | 303 | 7/9/**11**/12/15 | <5:2% 5:80% 6:16% 7:2% | **4.3** (3.2–5.0) | 33% |
| 1H | 10.7% | 2220 | 342 | 7/9/**11**/13/16 | 4:3% 5:66% 6:23% 7:7% | **4.6** (3.7–5.4) | 16% |
| X | 8.2% | 1705 | 284 | 10/13/**14**/17/20 | theirs: <1:1% 1:17% 2:28% 3:40% 4:12% 5+:2% | — | 66% |
| 1D | 7.3% | 1515 | 311 | 7/9/**12**/13/15 | 4:5% 5:58% 6:28% 7:6% 8:2% | **4.8** (4.0–5.7) | 26% |
| 1NT | 3.3% | 687 | 133 | 14/15/**15**/16/17 | — | — | 87% |
| 2H | 1.9% | 387 | 89 | 4/7/**8**/8/12 | <5:1% 5:5% 6:80% 7:13% | **4.9** (3.8–5.4) | 1% |
| 2S | 1.5% | 314 | 72 | 4/5/**7**/9/12 | 5:6% 6:90% 7:4% | **4.2** (3.8–5.0) | 3% |
| 2C | 1.2% | 247 | 124 | 7/9/**11**/13/14 | 0:3% 1:26% 2:9% 3:3% 5:14% 6:34% 7:11% | **4.3** (0.9–6.3) | 4% |
| 2D | 1.0% | 207 | 90 | 6/7/**10**/12/14 | 1:12% 2:31% 3:5% 5:9% 6:41% | **4.1** (2.1–5.4) | 2% |
| 3H | 0.9% | 192 | 31 | 4/6/**8**/8/12 | 6:39% 7:60% | **4.4** (4.3–5.4) | 0% |
| 3S | 0.5% | 109 | 23 | 4/6/**9**/10/11 | 6:39% 7:58% 8:4% | **6.1** (4.0–6.4) | 0% |
| 2NT | 0.5% | 109 | 24 | 9/10/**13**/13/14 | — | — | 0% |
| 3D | 0.3% | 70 | 30 | 6/7/**9**/10/12 | 6:74% 7:19% 8:7% | **5.0** (4.0–5.4) | 0% |
| 4H | 0.3% | 72 | 19 | 6/11/**11**/13/15 | 6:7% 7:63% 8:31% | **5.8** (4.3–8.9) | 0% |
| 5D | 0.2% | 46 | 7 | 12/12/**12**/12/14 | 6:7% 7:2% 8:91% | **7.0** (7.0–7.0) | 0% |
| 3C | 0.2% | 33 | 27 | 5/9/**11**/12/14 | 1:52% 2:15% 6:12% 7:18% 8:3% | **1.7** (0.0–4.3) | 0% |
| 4S | 0.2% | 42 | 14 | 6/8/**10**/12/15 | 6:7% 7:69% 8:24% | **6.1** (4.9–7.6) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1S | none | 620 | 7/9/**11**/14/15 |
| 1S | fav | 545 | 8/9/**9**/12/16 |
| 1S | unfav | 683 | 7/10/**12**/13/14 |
| 1S | both | 690 | 7/9/**10**/12/14 |
| 1H | none | 635 | 7/9/**10**/13/15 |
| 1H | fav | 472 | 8/9/**10**/12/15 |
| 1H | unfav | 599 | 7/9/**10**/13/17 |
| 1H | both | 514 | 7/9/**11**/13/16 |
| X | none | 529 | 10/12/**14**/17/19 |
| X | fav | 275 | 11/13/**14**/18/24 |
| X | unfav | 491 | 11/13/**14**/17/20 |
| X | both | 410 | 11/13/**13**/15/18 |
| 1D | none | 527 | 7/9/**11**/14/15 |
| 1D | fav | 277 | 6/10/**12**/13/16 |
| 1D | unfav | 289 | 7/9/**12**/14/16 |
| 1D | both | 422 | 7/9/**12**/13/14 |
| 1NT | none | 155 | 14/15/**17**/17/18 |
| 1NT | fav | 59 | 13/15/**15**/16/18 |
| 1NT | unfav | 208 | 15/15/**15**/16/17 |
| 1NT | both | 265 | 14/15/**15**/16/17 |
| 2H | none | 136 | 5/7/**8**/8/11 |
| 2H | fav | 108 | 4/4/**7**/8/11 |
| 2H | unfav | 56 | 5/9/**10**/12/12 |
| 2H | both | 87 | 6/8/**8**/8/12 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 1S | 9/**11**/12 (630) | 9/**11**/14 (877) | 10/**10**/12 (711) | 8/**11**/14 (320) |
| 1H | 10/**11**/12 (549) | 9/**11**/13 (818) | 8/**10**/12 (409) | 9/**10**/13 (444) |
| X | 11/**13**/17 (317) | 13/**14**/16 (480) | 13/**14**/15 (675) | 13/**17**/18 (233) |
| 1D | 10/**12**/15 (253) | 9/**11**/13 (471) | 8/**11**/13 (377) | 10/**12**/14 (414) |

Anatomy of X: per HCP band, support held (both majors = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | both majors ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 97 | 99% | 76% | 96% | 94% |
| 11–13 | 619 | 98% | 40% | 100% | 42% |
| 14–16 | 544 | 91% | 15% | 99% | 46% |
| 17+ | 445 | 64% | 5% | 85% | 44% |

Dealer filters (paste into the custom filter box; derived from the data):

- `1S` → `s >= 5 and top(s,5) >= 1 and hcp in 7..15`
- `1H` → `h >= 5 and top(h,5) >= 1 and hcp in 7..16`
- `X` → `((hcp in 10..17 and c <= 2 and s >= 3 and h >= 3 and d >= 2) or (hcp in 12..17 and c in 3..4 and s >= 3 and h >= 3 and d >= 2) or hcp >= 18)`
- `1D` → `d >= 5 and top(d,5) >= 1 and hcp in 7..15`
- `1NT` → `(has(c,a) or (has(c,k) and c >= 2) or (has(c,q) and c >= 3)) and hcp in 14..17` *(+ balanced)*
- `2H` → `h >= 6 and (hcp >= 11 or top(h,5) >= 1) and ((hcp in 4..12 and c <= 2) or (hcp in 6..12 and c == 3))`

### (1D) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 51.3% | 10129 | 980 | 3/6/**8**/10/13 | — | — | 62% |
| 1S | 11.4% | 2241 | 278 | 7/9/**10**/12/15 | 4:3% 5:76% 6:18% 7:3% | **4.2** (3.0–5.4) | 27% |
| 1H | 11.3% | 2230 | 243 | 7/9/**11**/13/16 | 4:3% 5:65% 6:31% 7+:1% | **4.4** (3.5–5.8) | 20% |
| X | 10.0% | 1967 | 238 | 10/12/**14**/16/19 | theirs: 0:7% 1:14% 2:46% 3:29% 4:4% | — | 66% |
| 2C | 4.4% | 869 | 91 | 9/10/**11**/13/15 | 5:29% 6:55% 7:16% | **6.1** (4.6–7.0) | 9% |
| 1NT | 3.2% | 631 | 110 | 14/15/**16**/17/18 | — | — | 90% |
| 2D | 2.3% | 455 | 53 | 6/10/**10**/12/13 | 0:37% 1:49% 2:9% 6:2% 7+:1% | **0.0** (0.0–5.4) | 0% |
| 2H | 1.3% | 265 | 62 | 5/7/**8**/10/11 | <5:2% 5:7% 6:82% 7:9% | **5.0** (3.5–6.1) | 2% |
| 3H | 0.9% | 182 | 22 | 6/6/**7**/9/10 | 6:32% 7:68% | **5.3** (3.4–5.8) | 0% |
| 3S | 0.8% | 158 | 23 | 6/7/**7**/9/10 | 6:17% 7:83% | **4.2** (3.6–7.1) | 0% |
| 2S | 0.7% | 138 | 52 | 4/6/**7**/10/12 | <5:1% 5:6% 6:86% 7:7% | **4.2** (3.8–4.7) | 1% |
| 3C | 0.7% | 145 | 45 | 4/8/**10**/10/12 | <3:3% 3:2% 5:17% 6:51% 7:23% 8:4% | **5.0** (4.0–6.4) | 0% |
| 2NT | 0.6% | 110 | 22 | 9/9/**9**/10/13 | — | — | 0% |
| 4S | 0.5% | 106 | 11 | 6/10/**12**/13/15 | 7:62% 8:9% 9:28% | **7.4** (7.1–10.0) | 0% |
| 4H | 0.2% | 39 | 15 | 5/8/**10**/15/18 | 6:38% 7:33% 8:10% 9:18% | **5.4** (4.1–5.8) | 0% |
| 4C | 0.1% | 25 | 8 | 5/10/**10**/11/12 | 6:8% 7:24% 8:68% | **3.7** (3.7–5.1) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1S | none | 550 | 8/10/**11**/13/15 |
| 1S | fav | 646 | 8/9/**10**/11/14 |
| 1S | unfav | 593 | 7/8/**10**/15/17 |
| 1S | both | 452 | 8/8/**11**/12/15 |
| 1H | none | 435 | 7/8/**10**/13/14 |
| 1H | fav | 335 | 8/9/**11**/13/16 |
| 1H | unfav | 780 | 7/10/**11**/13/16 |
| 1H | both | 680 | 8/9/**12**/14/15 |
| X | none | 507 | 9/12/**13**/14/17 |
| X | fav | 579 | 10/13/**14**/18/20 |
| X | unfav | 335 | 11/12/**14**/18/18 |
| X | both | 546 | 10/13/**15**/15/19 |
| 2C | none | 182 | 9/10/**10**/11/13 |
| 2C | fav | 198 | 8/12/**13**/14/17 |
| 2C | unfav | 283 | 10/10/**11**/13/16 |
| 2C | both | 206 | 9/9/**11**/12/15 |
| 1NT | none | 93 | 14/16/**17**/17/18 |
| 1NT | fav | 207 | 14/16/**16**/17/18 |
| 1NT | unfav | 94 | 15/15/**16**/17/18 |
| 1NT | both | 237 | 15/15/**16**/18/18 |
| 2D | none | 205 | 6/10/**10**/10/10 |
| 2D | fav | 41 | 9/12/**13**/13/13 |
| 2D | unfav | 62 | 12/12/**12**/12/14 |
| 2D | both | 147 | 6/6/**10**/12/12 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 1S | 8/**9**/11 (490) | 9/**10**/12 (859) | 8/**12**/13 (518) | 10/**11**/12 (374) |
| 1H | 9/**10**/13 (456) | 10/**11**/13 (927) | 8/**10**/13 (486) | 11/**13**/14 (361) |
| X | 10/**15**/15 (403) | 12/**13**/15 (896) | 14/**14**/18 (576) | 14/**16**/18 (92) |
| 2C | 10/**10**/12 (134) | 10/**11**/14 (258) | 11/**11**/13 (301) | 10/**11**/13 (176) |

Anatomy of X: per HCP band, support held (both majors = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | both majors ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 137 | 99% | 61% | 99% | 99% |
| 11–13 | 643 | 99% | 27% | 99% | 81% |
| 14–16 | 701 | 95% | 24% | 100% | 55% |
| 17+ | 486 | 34% | 7% | 99% | 52% |

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
| P | 57.8% | 7739 | 605 | 3/6/**8**/10/13 | — | — | 65% |
| X | 11.4% | 1522 | 145 | 10/12/**14**/16/19 | theirs: <1:1% 1:30% 2:42% 3:25% 4+:2% | — | 56% |
| 1S | 11.2% | 1502 | 149 | 7/9/**11**/13/16 | 4:3% 5:73% 6:21% 7:3% | **5.4** (3.7–6.5) | 33% |
| 2C | 3.9% | 518 | 68 | 9/10/**12**/15/17 | 5:20% 6:59% 7:20% | **5.6** (4.7–6.7) | 9% |
| 2D | 3.4% | 449 | 72 | 8/10/**11**/13/16 | 5:22% 6:62% 7:14% | **5.3** (4.4–6.2) | 7% |
| 2H | 2.9% | 386 | 30 | 8/10/**12**/13/14 | 0:39% 1:30% 2:30% | **0.0** (0.0–4.5) | 0% |
| 1NT | 2.8% | 380 | 47 | 14/15/**15**/16/17 | — | — | 85% |
| 2S | 2.0% | 262 | 36 | 6/6/**8**/9/11 | <5:1% 5:5% 6:94% | **4.9** (3.8–5.6) | 1% |
| 2NT | 1.5% | 200 | 20 | 6/11/**11**/11/13 | — | — | 0% |
| 3D | 0.9% | 119 | 18 | 4/7/**8**/10/11 | <6:2% 6:69% 7:29% | **5.2** (5.2–5.3) | 1% |
| 4S | 0.9% | 118 | 11 | 8/11/**11**/11/15 | 6:4% 7:39% 8:56% | **7.6** (5.6–7.6) | 0% |
| 3C | 0.6% | 84 | 29 | 6/9/**10**/12/14 | 0:5% 1:5% 2:17% 5:19% 6:13% 7:42% | **4.1** (2.7–6.4) | 0% |
| 3S | 0.5% | 67 | 15 | 6/6/**7**/8/11 | 6:69% 7:28% 8:3% | **4.7** (3.8–5.6) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 385 | 11/13/**13**/15/17 |
| X | fav | 412 | 10/12/**12**/15/17 |
| X | unfav | 411 | 11/13/**14**/18/22 |
| X | both | 314 | 11/11/**14**/17/22 |
| 1S | none | 211 | 6/8/**10**/12/14 |
| 1S | fav | 404 | 8/11/**13**/14/16 |
| 1S | unfav | 411 | 7/9/**10**/14/16 |
| 1S | both | 476 | 8/10/**12**/12/16 |
| 2C | none | 148 | 8/14/**15**/15/17 |
| 2C | fav | 105 | 9/11/**11**/12/13 |
| 2C | unfav | 68 | 9/11/**11**/12/15 |
| 2C | both | 197 | 9/10/**10**/13/16 |
| 2D | none | 171 | 8/10/**13**/14/16 |
| 2D | fav | 70 | 9/10/**11**/12/13 |
| 2D | unfav | 77 | 9/11/**12**/13/15 |
| 2D | both | 131 | 10/10/**10**/11/16 |
| 2H | none | 50 | 10/13/**13**/13/13 |
| 2H | fav | 136 | 12/12/**12**/13/13 |
| 2H | unfav | 86 | 8/8/**14**/14/16 |
| 2H | both | 114 | 6/10/**10**/12/12 |
| 1NT | none | 86 | 14/15/**15**/15/17 |
| 1NT | fav | 109 | 15/15/**15**/17/17 |
| 1NT | unfav | 130 | 14/15/**15**/15/16 |
| 1NT | both | 55 | 15/17/**17**/17/17 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 11/**12**/14 (473) | 12/**13**/15 (638) | 15/**16**/17 (381) | 12/**14**/15 (30) |
| 1S | 7/**12**/13 (301) | 9/**10**/14 (521) | 11/**12**/13 (453) | 10/**13**/14 (227) |
| 2C | 10/**11**/15 (212) | 9/**12**/13 (94) | 10/**11**/14 (205) | — |
| 2D | 10/**12**/14 (166) | 10/**10**/11 (168) | 11/**11**/12 (54) | 11/**13**/13 (61) |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 85 | 100% | 92% | 100% | 99% |
| 11–13 | 655 | 100% | 81% | 99% | 87% |
| 14–16 | 481 | 100% | 63% | 98% | 67% |
| 17+ | 301 | 70% | 46% | 99% | 47% |

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
| P | 68.5% | 9980 | 701 | 4/6/**8**/10/13 | — | — | 60% |
| X | 7.3% | 1070 | 178 | 11/12/**13**/15/19 | theirs: 0:4% 1:21% 2:44% 3:24% 4:6% | — | 57% |
| 2H | 6.3% | 921 | 92 | 10/10/**12**/14/15 | 5:45% 6:51% 7:4% | **5.4** (4.3–6.3) | 11% |
| 2D | 5.6% | 823 | 74 | 8/10/**11**/13/15 | 5:24% 6:57% 7:19% | **6.3** (5.1–7.2) | 18% |
| 2C | 3.6% | 529 | 65 | 8/10/**11**/15/16 | 5:33% 6:51% 7:16% | **4.6** (4.4–6.3) | 11% |
| 1NT | 2.8% | 401 | 61 | 15/15/**16**/17/18 | — | — | 78% |
| 2S | 1.1% | 161 | 19 | 6/7/**12**/12/15 | 0:12% 1:74% 2:13% 3+:1% | **0.0** (0.0–0.0) | 1% |
| 3C | 1.0% | 153 | 33 | 4/5/**8**/10/12 | 1:10% 2:3% 3:5% 5:4% 6:24% 7:54% | **4.5** (4.1–5.2) | 0% |
| 3D | 1.0% | 150 | 23 | 7/8/**9**/10/11 | <6:1% 6:46% 7:49% 8:3% | **5.9** (5.1–6.7) | 1% |
| 3H | 0.9% | 138 | 18 | 4/8/**8**/10/12 | 6:46% 7:54% | **4.3** (4.0–7.0) | 0% |
| 2NT | 0.8% | 111 | 18 | 7/10/**11**/12/21 | — | — | 0% |
| 4H | 0.4% | 53 | 10 | 8/10/**12**/15/16 | 6:53% 7:34% 8:13% | **7.0** (6.3–7.1) | 0% |
| 4C | 0.2% | 32 | 3 | 4/4/**7**/8/8 | 7:100% | **4.1** (4.1–5.2) | 0% |
| 4D | 0.2% | 30 | 6 | 7/7/**7**/10/13 | 6:13% 7:80% 8:7% | **6.0** (5.1–6.0) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 178 | 10/13/**14**/14/17 |
| X | fav | 219 | 10/13/**13**/16/21 |
| X | unfav | 265 | 11/13/**14**/15/18 |
| X | both | 408 | 11/12/**13**/15/19 |
| 2H | none | 366 | 11/11/**12**/14/15 |
| 2H | fav | 114 | 10/10/**10**/12/15 |
| 2H | unfav | 202 | 9/10/**13**/13/16 |
| 2H | both | 239 | 10/10/**11**/14/14 |
| 2D | none | 191 | 7/10/**11**/12/14 |
| 2D | fav | 159 | 9/10/**10**/13/15 |
| 2D | unfav | 319 | 10/10/**11**/13/17 |
| 2D | both | 154 | 8/10/**13**/13/15 |
| 2C | none | 64 | 10/11/**12**/13/14 |
| 2C | fav | 258 | 8/10/**11**/15/16 |
| 2C | unfav | 72 | 9/9/**10**/12/15 |
| 2C | both | 135 | 11/11/**14**/14/15 |
| 1NT | none | 83 | 14/15/**15**/17/18 |
| 1NT | fav | 162 | 15/15/**17**/17/17 |
| 1NT | unfav | 43 | 15/15/**16**/18/18 |
| 1NT | both | 113 | 15/15/**15**/16/17 |
| 2S | none | 93 | 7/7/**12**/12/12 |
| 2S | fav | 35 | 6/6/**12**/15/15 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 12/**13**/14 (276) | 12/**14**/15 (470) | 13/**14**/15 (254) | 13/**18**/19 (70) |
| 2H | 10/**11**/13 (351) | 11/**12**/14 (391) | 11/**12**/15 (141) | 11/**11**/11 (38) |
| 2D | 10/**11**/13 (265) | 10/**12**/12 (222) | 10/**13**/13 (232) | 10/**10**/11 (104) |
| 2C | 10/**11**/16 (173) | 11/**13**/15 (188) | 11/**12**/14 (90) | 10/**10**/12 (78) |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 38 | 92% | 79% | 79% | 87% |
| 11–13 | 510 | 100% | 79% | 99% | 72% |
| 14–16 | 403 | 98% | 53% | 100% | 74% |
| 17+ | 119 | 65% | 54% | 84% | 41% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 11..16 and s <= 2 and h >= 3 and d >= 2 and c >= 2) or (hcp in 12..16 and s == 3 and h >= 3 and d >= 2 and c >= 2) or hcp >= 17)`
- `2H` → `h >= 5 and top(h,5) >= 1 and (hcp >= 11 or top(h,5) >= 2) and hcp in 10..15`
- `2D` → `d >= 5 and top(d,5) >= 2 and ((hcp in 8..15 and s <= 2) or (hcp in 10..15 and s in 3..4))`
- `2C` → `c >= 5 and top(c,5) >= 2 and ((hcp in 8..16 and s <= 2) or (hcp in 10..16 and s in 3..4))`
- `1NT` → `(has(s,a) or (has(s,k) and s >= 2) or (has(s,q) and s >= 3)) and hcp in 15..18`
- `2S` → `h >= 5 and ((hcp in 6..15 and d >= 5) or (hcp in 6..15 and c >= 5))`

### (1NT) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 78.2% | 12471 | 1169 | 3/6/**8**/10/13 | — | — | 57% |
| X | 5.7% | 912 | 277 | 9/12/**15**/17/19 | — | — | 33% |
| 2D | 4.9% | 783 | 160 | 6/9/**11**/12/16 | <1:1% 1:12% 2:40% 3:24% 4:13% 5:7% 6:3% | **3.9** (1.5–5.7) | 2% |
| 2C | 4.3% | 691 | 140 | 6/10/**12**/13/15 | 0:4% 1:29% 2:40% 3:19% 4:3% 5:3% | **1.1** (0.2–3.6) | 1% |
| 2H | 2.5% | 397 | 96 | 7/10/**12**/13/16 | <2:1% 2:3% 3:3% 4:3% 5:61% 6:26% 7:3% | **4.9** (3.8–5.9) | 1% |
| 2S | 1.7% | 273 | 76 | 8/10/**11**/13/15 | <5:2% 5:61% 6:33% 7:4% | **4.7** (3.8–4.9) | 1% |
| 3D | 0.7% | 104 | 26 | 6/9/**10**/11/13 | <6:2% 6:40% 7:41% 8:16% | **6.4** (4.4–6.6) | 0% |
| 3C | 0.5% | 78 | 22 | 5/8/**10**/11/14 | 5:3% 6:26% 7:54% 8:18% | **4.7** (4.1–5.8) | 0% |
| 3H | 0.4% | 56 | 11 | 3/3/**7**/10/13 | <6:2% 6:14% 7:84% | **4.1** (4.0–5.8) | 0% |
| 4D | 0.3% | 46 | 4 | 9/9/**9**/9/10 | 5:2% 7:2% 8:96% | **4.4** (4.4–4.4) | 0% |
| 2NT | 0.3% | 40 | 13 | 5/5/**10**/13/14 | — | — | 0% |
| 3S | 0.2% | 37 | 10 | 4/9/**10**/10/13 | 6:38% 7:62% | **4.7** (4.7–6.1) | 0% |
| 4H | 0.2% | 32 | 3 | 10/10/**10**/10/15 | 7:19% 8:81% | **6.5** (6.5–6.5) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 351 | 10/11/**14**/16/18 |
| X | fav | 96 | 9/10/**12**/14/18 |
| X | unfav | 285 | 11/14/**15**/17/19 |
| X | both | 180 | 9/13/**16**/19/19 |
| 2D | none | 233 | 3/9/**11**/12/17 |
| 2D | fav | 66 | 4/7/**10**/11/12 |
| 2D | unfav | 189 | 7/9/**10**/12/15 |
| 2D | both | 295 | 7/10/**11**/13/13 |
| 2C | none | 163 | 8/9/**11**/13/17 |
| 2C | fav | 244 | 6/11/**11**/13/14 |
| 2C | unfav | 101 | 7/10/**12**/12/15 |
| 2C | both | 183 | 6/11/**13**/13/15 |
| 2H | none | 154 | 5/11/**12**/15/17 |
| 2H | unfav | 162 | 6/10/**12**/12/13 |
| 2H | both | 57 | 7/10/**11**/12/14 |
| 2S | none | 114 | 9/11/**11**/13/17 |
| 2S | fav | 42 | 8/8/**9**/10/11 |
| 2S | unfav | 60 | 8/10/**12**/14/15 |
| 2S | both | 57 | 7/10/**10**/11/13 |
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
| P | 73.0% | 1908 | 412 | 2/5/**7**/9/13 | — | — | 55% |
| X | 8.1% | 211 | 83 | 9/13/**15**/17/20 | theirs: 1:25% 2:40% 3:18% 4:6% 5:4% 6:5% | — | 54% |
| 2S | 5.5% | 145 | 62 | 4/8/**11**/13/15 | <5:1% 5:41% 6:49% 7:8% | **4.9** (3.8–5.8) | 17% |
| 2H | 5.5% | 143 | 47 | 7/10/**12**/14/17 | <5:1% 5:44% 6:45% 7:9% | **5.0** (4.4–5.4) | 12% |
| 2D | 2.4% | 62 | 36 | 7/8/**11**/15/17 | 0:3% 2:3% 3:3% 4:2% 5:47% 6:32% 7:2% 8:8% | **4.6** (4.0–6.2) | 21% |
| 2NT | 1.4% | 37 | 19 | 4/15/**16**/17/18 | — | — | 68% |
| 3D | 1.3% | 33 | 8 | 7/8/**8**/12/14 | 1:6% 6:27% 7:3% 8:64% | **4.0** (4.0–4.0) | 0% |
| 3C | 1.1% | 29 | 19 | 6/12/**13**/14/15 | 0:3% 1:34% 2:14% 5:10% 6:24% 7:7% 8:7% | **4.6** (1.7–5.9) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 67 | 10/12/**16**/17/21 |
| X | fav | 40 | 9/13/**16**/16/20 |
| X | unfav | 76 | 9/13/**15**/17/20 |
| X | both | 28 | 10/12/**14**/16/19 |
| 2S | none | 68 | 5/7/**11**/14/14 |
| 2S | unfav | 28 | 9/10/**12**/13/16 |
| 2S | both | 32 | 2/8/**10**/12/13 |
| 2H | none | 52 | 6/9/**12**/14/17 |
| 2H | unfav | 46 | 7/10/**10**/12/16 |
| 2H | both | 34 | 8/12/**13**/16/17 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 12/**14**/18 (55) | 14/**16**/17 (84) | 14/**15**/15 (39) | 9/**13**/16 (33) |
| 2S | 8/**9**/12 (53) | 10/**11**/14 (49) | 7/**12**/13 (29) | — |
| 2H | 8/**12**/13 (53) | 10/**12**/14 (65) | — | — |

Anatomy of X: per HCP band, support held (both majors = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | both majors ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 15 | 60% | 27% | 73% | 33% |
| 11–13 | 51 | 88% | 49% | 96% | 65% |
| 14–16 | 79 | 94% | 43% | 100% | 62% |
| 17+ | 66 | 85% | 3% | 86% | 79% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 9..17 and c <= 4 and s >= 3 and h >= 3 and d >= 2) or hcp >= 18)`
- `2S` → `s >= 5 and top(s,5) >= 1 and ((hcp in 4..15 and c <= 2) or (hcp in 7..15 and c in 3..4))`
- `2H` → `h >= 5 and top(h,5) >= 1 and ((hcp in 7..17 and c <= 2) or (hcp in 8..17 and c in 3..4))`
- `2D` → `d >= 4 and top(d,5) >= 1 and hcp in 7..17`

### (2D) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 42.0% | 121 | 570 | 4/8/**9**/12/14 | — | — | 50% |
| X | 22.9% | 66 | 164 | 12/14/**16**/20/24 | theirs: <1:2% 1:17% 2:53% 3:18% 4:9% 5+:2% | — | 55% |
| 2S | 9.4% | 27 | 49 | 9/9/**11**/13/16 | 5:33% 6:37% 7:30% | **6.7** (5.6–7.0) | 26% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 30 | 11/14/**16**/24/24 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 12..17 and d <= 4 and s >= 3 and h >= 3 and c >= 2) or hcp >= 18)`

### (2H) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 56.8% | 1124 | 297 | 2/7/**10**/11/13 | — | — | 55% |
| X | 17.3% | 342 | 96 | 10/13/**14**/17/22 | theirs: 1:27% 2:45% 3:20% 4:6% 5:2% | — | 43% |
| 2S | 10.6% | 210 | 51 | 9/12/**14**/16/17 | <5:2% 5:64% 6:30% 7:3% | **6.3** (3.8–7.0) | 6% |
| 3C | 5.6% | 110 | 24 | 10/13/**13**/14/14 | 5:4% 6:87% 7:7% 8+:2% | **5.6** (4.8–6.7) | 0% |
| 2NT | 4.9% | 96 | 43 | 13/15/**16**/17/18 | — | — | 64% |
| 3D | 2.7% | 53 | 17 | 7/11/**11**/13/16 | 5:15% 6:43% 7:42% | **6.6** (5.3–6.6) | 6% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 108 | 10/13/**14**/17/20 |
| X | fav | 100 | 11/13/**13**/17/17 |
| X | unfav | 90 | 10/13/**14**/16/22 |
| X | both | 44 | 11/11/**16**/19/22 |
| 2S | none | 71 | 8/12/**14**/14/14 |
| 2S | fav | 57 | 12/16/**16**/16/17 |
| 2S | unfav | 36 | 10/13/**14**/14/16 |
| 2S | both | 46 | 9/10/**15**/16/16 |
| 3C | none | 37 | 8/13/**13**/14/17 |
| 3C | unfav | 44 | 13/13/**14**/14/14 |
| 2NT | unfav | 58 | 13/15/**16**/16/18 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 11/**13**/16 (92) | 13/**14**/17 (154) | 13/**13**/17 (68) | 13/**16**/19 (28) |
| 2S | 10/**14**/14 (58) | 13/**14**/16 (62) | 12/**13**/14 (43) | 16/**16**/16 (47) |
| 3C | 13/**13**/13 (37) | — | 13/**14**/14 (60) | — |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 18 | 94% | 94% | 100% | 94% |
| 11–13 | 122 | 96% | 89% | 98% | 66% |
| 14–16 | 106 | 90% | 65% | 94% | 82% |
| 17+ | 96 | 91% | 79% | 80% | 65% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 10..17 and h <= 2 and s >= 3 and d >= 2 and c >= 2) or (hcp in 13..17 and h == 3 and s >= 3 and d >= 2 and c >= 2) or hcp >= 18)`
- `2S` → `s >= 5 and top(s,5) >= 1 and ((hcp in 8..17 and h <= 2) or (hcp in 10..17 and h in 3..4))`
- `3C` → `c >= 6 and top(c,5) >= 2 and ((hcp in 8..14 and h <= 2) or (hcp in 12..14 and h == 3))`
- `2NT` → `(has(h,a) or (has(h,k) and h >= 2) or (has(h,q) and h >= 3)) and hcp in 13..18`
- `3D` → `d >= 5 and top(d,5) >= 2 and hcp in 7..16`

### (2S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 54.8% | 1331 | 237 | 3/7/**10**/11/14 | — | — | 48% |
| X | 22.0% | 534 | 79 | 11/13/**15**/16/20 | theirs: 0:5% 1:39% 2:39% 3:13% 4:4% | — | 32% |
| 3H | 9.6% | 232 | 41 | 10/11/**12**/13/16 | 5:20% 6:79% 7+:1% | **5.2** (4.0–6.7) | 6% |
| 2NT | 7.5% | 181 | 28 | 15/17/**17**/17/18 | — | — | 90% |
| 3D | 2.1% | 51 | 12 | 10/13/**14**/14/16 | 5:6% 6:84% 7:8% 8+:2% | **6.5** (6.3–6.5) | 0% |
| 3C | 2.0% | 48 | 21 | 9/11/**13**/14/16 | 5:29% 6:50% 7:21% | **4.8** (4.3–6.3) | 4% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 109 | 12/14/**15**/16/20 |
| X | fav | 133 | 13/13/**15**/16/17 |
| X | unfav | 185 | 11/13/**14**/14/17 |
| X | both | 107 | 12/16/**16**/19/21 |
| 3H | none | 39 | 10/13/**13**/13/16 |
| 3H | fav | 51 | 11/11/**11**/12/13 |
| 3H | unfav | 63 | 10/12/**13**/15/17 |
| 3H | both | 79 | 10/11/**12**/12/16 |
| 2NT | fav | 34 | 16/17/**17**/17/18 |
| 2NT | unfav | 120 | 15/17/**17**/17/18 |
| 3D | none | 35 | 10/13/**14**/14/14 |
| 3C | both | 26 | 9/11/**13**/14/18 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 13/**15**/16 (237) | 14/**14**/16 (207) | 14/**16**/16 (68) | 17/**18**/18 (22) |
| 3H | 11/**12**/12 (94) | 11/**11**/12 (61) | 13/**13**/13 (67) | — |
| 2NT | — | — | 17/**17**/17 (119) | 16/**17**/17 (53) |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| 11–13 | 129 | 100% | 80% | 99% | 91% |
| 14–16 | 300 | 100% | 58% | 100% | 84% |
| 17+ | 95 | 98% | 81% | 79% | 69% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 11..17 and s <= 2 and h >= 3 and d >= 2 and c >= 2) or (hcp in 13..17 and s == 3 and h >= 3 and d >= 2 and c >= 2) or hcp >= 18)`
- `3H` → `h >= 5 and top(h,5) >= 2 and ((hcp in 10..16 and s <= 2) or (hcp in 12..16 and s == 3))`
- `2NT` → `(has(s,a) or (has(s,k) and s >= 2) or (has(s,q) and s >= 3)) and hcp in 15..18` *(+ balanced)*
- `3D` → `d >= 6 and top(d,5) >= 2 and hcp in 10..16`

### (2NT) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 97.5% | 2187 | 211 | 2/4/**6**/8/12 | — | — | 51% |
| X | 1.2% | 26 | 14 | 12/14/**18**/21/21 | — | — | 58% |

### (3C) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 44.2% | 401 | 58 | 4/8/**10**/11/16 | — | — | 36% |
| X | 23.9% | 217 | 28 | 10/15/**16**/18/20 | theirs: 0:14% 1:20% 2:6% 3:52% 4:6% | — | 58% |
| 3H | 10.8% | 98 | 11 | 8/11/**11**/11/16 | 5:7% 6:93% | **5.1** (5.1–5.1) | 2% |
| 3NT | 8.7% | 79 | 11 | 15/16/**17**/18/18 | — | — | 66% |
| 4C | 4.3% | 39 | 4 | 14/14/**14**/14/14 | 0:85% 1:13% 2:3% | **0.0** (0.0–0.0) | 0% |
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
| X | 10/**17**/19 (74) | — | 15/**15**/17 (113) | 15/**16**/16 (16) |

Anatomy of X: per HCP band, support held (both majors = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | both majors ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 29 | 97% | 97% | 100% | 100% |
| 14–16 | 83 | 98% | 60% | 89% | 16% |
| 17+ | 101 | 95% | 23% | 100% | 42% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 10..17 and c <= 2 and s >= 3 and h >= 3 and d >= 2) or (hcp in 15..17 and c == 3 and s >= 3 and h >= 3 and d >= 2) or hcp >= 18)`
- `3H` → `h >= 6 and top(h,5) >= 2 and hcp in 8..16`
- `3NT` → `(has(c,a) or (has(c,k) and c >= 2) or (has(c,q) and c >= 3)) and hcp in 15..18`

### (3D) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 46.5% | 520 | 74 | 7/9/**11**/12/14 | — | — | 52% |
| X | 16.1% | 180 | 42 | 9/13/**13**/15/20 | theirs: 0:12% 1:22% 2:59% 3:7% | — | 55% |
| 3H | 13.6% | 152 | 17 | 12/12/**12**/13/17 | 5:25% 6:74% 7+:1% | **6.2** (3.6–6.2) | 2% |
| 3S | 13.3% | 149 | 16 | 9/11/**11**/14/17 | 5:12% 6:71% 7:16% | **6.7** (6.7–7.8) | 12% |
| 3NT | 4.7% | 52 | 11 | 16/16/**16**/20/21 | — | — | 94% |
| 4S | 3.4% | 38 | 3 | 13/13/**14**/17/17 | 6:18% 7:50% 9:32% | **4.4** (4.4–10.0) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 95 | 12/13/**13**/13/20 |
| X | unfav | 55 | 9/9/**13**/17/19 |
| 3H | unfav | 66 | 10/12/**13**/15/17 |
| 3H | both | 78 | 12/12/**12**/12/17 |
| 3S | none | 34 | 9/9/**10**/13/13 |
| 3S | fav | 34 | 14/14/**14**/14/14 |
| 3S | both | 67 | 11/11/**11**/11/16 |
| 3NT | none | 41 | 16/16/**16**/20/20 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 9/**13**/13 (61) | 13/**13**/14 (106) | — | — |
| 3H | 13/**13**/15 (34) | 12/**12**/12 (84) | 12/**12**/12 (33) | — |
| 3S | — | 11/**11**/14 (125) | — | — |

Anatomy of X: per HCP band, support held (both majors = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | both majors ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 20 | 100% | 100% | 95% | 100% |
| 11–13 | 105 | 95% | 74% | 100% | 99% |
| 14–16 | 18 | 83% | 50% | 94% | 67% |
| 17+ | 37 | 62% | 0% | 100% | 84% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 9..17 and d <= 2 and s >= 3 and h >= 3 and c >= 3) or hcp >= 18)`
- `3H` → `h >= 5 and top(h,5) >= 1 and ((hcp in 10..17 and d <= 2) or (hcp in 12..17 and d == 3))`
- `3S` → `s >= 5 and top(s,5) >= 3 and hcp in 9..17`
- `3NT` → `(has(d,a) or (has(d,k) and d >= 2) or (has(d,q) and d >= 3)) and hcp in 16..21` *(+ balanced)*

### (3H) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 68.3% | 464 | 66 | 2/6/**10**/11/13 | — | — | 50% |
| X | 15.9% | 108 | 21 | 11/14/**15**/17/20 | theirs: 1:37% 2:57% 3:3% 4+:3% | — | 51% |
| 3S | 7.1% | 48 | 13 | 8/10/**10**/12/17 | 5:40% 6:48% 7:13% | **3.3** (3.0–5.9) | 8% |
| 3NT | 5.3% | 36 | 9 | 14/16/**18**/18/18 | — | — | 22% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 37 | 10/14/**14**/14/18 |
| X | fav | 38 | 13/15/**17**/17/20 |
| X | unfav | 32 | 11/14/**14**/16/16 |
| 3NT | unfav | 25 | 14/16/**18**/18/18 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 14/**14**/14 (40) | 14/**16**/17 (62) | — | — |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| 14–16 | 64 | 100% | 78% | 98% | 98% |
| 17+ | 30 | 93% | 93% | 93% | 93% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 11..17 and h <= 2 and s >= 3 and d >= 3 and c >= 3) or hcp >= 18)`

### (3S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 82.0% | 658 | 57 | 3/5/**10**/12/13 | — | — | 46% |
| X | 8.1% | 65 | 15 | 12/14/**16**/16/18 | theirs: <1:2% 1:9% 2:58% 3:23% 4:8% | — | 34% |
| 3NT | 6.6% | 53 | 6 | 11/17/**17**/17/18 | — | — | 75% |

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
| P | 80.4% | 360 | 35 | 6/9/**10**/11/15 | — | — | 50% |
| 4S | 14.1% | 63 | 8 | 8/9/**10**/12/14 | <5:2% 5:35% 6:63% | **6.7** (5.6–7.6) | 2% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 4S | unfav | 31 | 8/8/**12**/14/14 |

Dealer filters (paste into the custom filter box; derived from the data):

- `4S` → `s >= 5 and top(s,5) >= 2 and hcp in 8..14`

### (4S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 81.2% | 398 | 46 | 5/9/**10**/11/14 | — | — | 31% |
| 4NT | 7.8% | 38 | 5 | 10/15/**21**/21/21 | — | — | 0% |
| X | 6.5% | 32 | 9 | 11/15/**16**/16/18 | theirs: 1:25% 2:53% 3:3% 4:19% | — | 3% |

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
| 1C natural (3+) | 19965 | 49% | 8% | 39% | 4% | 51% |
| 1C short (2+) | 716 | 57% | 5% | 36% | 2% | 43% |
| 1C strong | 3173 | 62% | 4% | 32% | 2% | 38% |
| 1C Polish | 267 | 60% | 4% | 33% | 4% | 40% |
| 1D natural | 19737 | 51% | 10% | 35% | 4% | 49% |
| 1D nebulous | 1160 | 51% | 10% | 34% | 5% | 49% |
| 1H (any) | 13397 | 58% | 11% | 26% | 4% | 42% |
| 1S (any) | 14579 | 68% | 7% | 21% | 4% | 32% |

Action rate at fixed own strength (the fair comparison):

| opening faced | 6–8 HCP | 9–11 HCP | 12–14 HCP | 15+ HCP |
|---|---|---|---|---|
| 1C natural (3+) | 29% | 59% | 76% | 97% |
| 1C short (2+) | 26% | 50% | 70% | — |
| 1C strong | 33% | 48% | 68% | 69% |
| 1C Polish | 30% | 48% | 59% | — |
| 1D natural | 27% | 56% | 65% | 96% |
| 1D nebulous | 26% | 59% | 57% | 97% |
| 1H (any) | 21% | 41% | 65% | 96% |
| 1S (any) | 9% | 30% | 58% | 97% |

### (1C = strong, Precision-style) ? — for comparison

| action | n | HCP p5/p25/med/p75/p95 | bid-suit len | texture |
|---|---|---|---|---|
| P | 1972 | 2/5/**7**/9/13 | — | — |
| 1S | 242 | 5/8/**10**/12/15 | <4:4% 4:4% 5:77% 6:12% 7:2% | **4.2** (3.2–5.3) |
| 1H | 267 | 5/7/**10**/12/14 | <2:1% 2:3% 3:2% 4:5% 5:70% 6:18% 7+:2% | **4.4** (3.3–5.9) |
| X | 114 | 6/8/**11**/14/19 | — | — |
| 1D | 173 | 6/7/**9**/11/15 | 2:5% 3:6% 4:10% 5:50% 6:24% 7:3% 8+:1% | **4.6** (3.3–5.8) |
| 1NT | 46 | 4/7/**11**/15/16 | — | — |
| 2H | 39 | 1/6/**7**/10/13 | 0:5% 1:5% 3:5% 4:3% 5:21% 6:54% 7:8% | **4.0** (3.0–6.4) |
| 2S | 57 | 3/5/**6**/10/12 | <5:4% 5:14% 6:81% 7+:2% | **4.1** (3.9–4.9) |
| 2C | 79 | 6/8/**9**/12/14 | 1:11% 2:6% 3:1% 4:1% 5:30% 6:47% 7:3% | **5.7** (2.8–6.8) |
| 2D | 45 | 4/7/**8**/10/13 | 0:4% 1:4% 2:11% 3:16% 4:4% 5:9% 6:47% 7:4% | **4.1** (1.3–5.4) |
| 3D | 37 | 7/8/**9**/10/13 | 6:62% 7:5% 8:32% | **5.0** (4.0–6.4) |

## Balancing seat: (opening) P (P) ?

Includes balancing over weak twos and preempts — the classic "protect with less" seat.

### (1C) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| X | 34.0% | 82 | 25 | 10/11/**14**/17/18 | theirs: 1:41% 2:20% 3:33% 4:2% 5:2% 6+:1% | — | 44% |
| P | 26.1% | 63 | 30 | 7/8/**8**/10/13 | — | — | 71% |
| 1S | 15.8% | 38 | 10 | 10/10/**12**/14/14 | 5:95% 6:5% | **4.4** (2.6–4.6) | 37% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | unfav | 47 | 11/11/**12**/17/18 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 8..17 and c <= 2 and s >= 3 and h >= 3 and d >= 2) or (hcp in 10..17 and c == 3 and s >= 3 and h >= 3 and d >= 2) or hcp >= 18)`

### (1D) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| X | 36.2% | 170 | 42 | 8/9/**11**/16/19 | theirs: 0:6% 1:8% 2:46% 3:27% 4:7% 5:5% | — | 60% |
| P | 21.3% | 100 | 29 | 5/8/**8**/8/9 | — | — | 55% |
| 1H | 19.0% | 89 | 14 | 6/9/**14**/14/14 | 5:98% 6:2% | **7.5** (4.1–7.5) | 1% |
| 1S | 9.8% | 46 | 12 | 8/10/**12**/12/15 | 5:100% | **4.6** (4.4–4.6) | 28% |
| 1NT | 6.6% | 31 | 11 | 11/11/**13**/14/16 | — | — | 100% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | fav | 43 | 9/12/**18**/19/19 |
| X | unfav | 47 | 8/11/**11**/16/17 |
| X | both | 58 | 8/9/**9**/9/15 |
| 1H | none | 62 | 12/14/**14**/14/14 |
| 1S | fav | 26 | 12/12/**12**/12/14 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 9/**14**/14 (24) | 9/**9**/12 (79) | 11/**13**/19 (46) | 17/**18**/18 (21) |

Anatomy of X: per HCP band, support held (both majors = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | both majors ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 67 | 93% | 18% | 100% | 96% |
| 11–13 | 33 | 100% | 18% | 100% | 21% |
| 14–16 | 32 | 63% | 25% | 100% | 91% |
| 17+ | 38 | 68% | 45% | 37% | 8% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 8..17 and d <= 2 and s >= 3 and h >= 3 and c >= 3) or (hcp in 11..17 and d in 3..4 and s >= 3 and h >= 3 and c >= 3) or hcp >= 18)`
- `1H` → `h >= 5 and top(h,5) >= 1 and hcp in 6..14`

### (1H) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 39.0% | 158 | 25 | 5/7/**9**/10/11 | — | — | 61% |
| X | 27.9% | 113 | 22 | 7/10/**15**/22/22 | theirs: 1:4% 2:37% 3:54% 4:4% | — | 47% |
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
| X | 41.5% | 216 | 31 | 9/9/**10**/15/16 | theirs: 1:48% 2:46% 3:4% 4+:1% | — | 38% |
| P | 32.3% | 168 | 42 | 5/5/**7**/9/11 | — | — | 59% |
| 1NT | 8.8% | 46 | 19 | 9/10/**11**/15/16 | — | — | 72% |
| 2C | 7.1% | 37 | 8 | 9/9/**13**/13/15 | 5:84% 6:16% | **6.0** (5.3–7.1) | 0% |
| 2H | 5.0% | 26 | 6 | 10/10/**10**/15/15 | 5:96% 7:4% | **5.8** (5.8–6.8) | 8% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 45 | 10/10/**10**/11/15 |
| X | fav | 68 | 10/15/**16**/16/17 |
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
| 11–13 | 25 | 88% | 36% | 100% | 96% |
| 14–16 | 66 | 97% | 79% | 91% | 86% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 9..15 and s <= 2 and h >= 3 and d >= 3 and c >= 3) or hcp >= 16)`

### (1NT) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 60.7% | 1623 | 292 | 4/7/**9**/10/13 | — | — | 77% |
| X | 11.1% | 297 | 116 | 8/10/**12**/15/17 | — | — | 44% |
| 2D | 7.0% | 186 | 47 | 6/9/**9**/11/15 | <1:2% 1:5% 2:24% 3:31% 4:26% 5:10% 6:2% | **3.7** (1.1–4.4) | 13% |
| 2C | 6.6% | 177 | 60 | 6/7/**8**/10/14 | 0:11% 1:18% 2:15% 3:25% 4:19% 5:12% 6+:1% | **2.8** (0.2–5.2) | 16% |
| 2H | 6.1% | 163 | 40 | 7/8/**10**/11/13 | <4:2% 4:2% 5:81% 6:9% 7:6% | **4.4** (3.8–5.9) | 4% |
| 2S | 5.8% | 156 | 23 | 6/9/**11**/13/16 | 5:66% 6:33% | **4.0** (2.7–4.9) | 15% |
| 3H | 1.4% | 37 | 1 | 9/9/**9**/9/9 | 7:100% | **4.4** (4.4–4.4) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 104 | 8/10/**14**/15/17 |
| X | fav | 46 | 9/11/**11**/12/15 |
| X | unfav | 92 | 7/11/**14**/16/18 |
| X | both | 55 | 7/10/**10**/11/15 |
| 2D | none | 73 | 7/8/**9**/9/15 |
| 2D | unfav | 58 | 6/10/**11**/11/11 |
| 2D | both | 37 | 8/9/**9**/10/14 |
| 2C | none | 72 | 5/8/**8**/10/14 |
| 2C | fav | 35 | 7/8/**11**/12/14 |
| 2C | unfav | 27 | 7/8/**9**/12/13 |
| 2C | both | 43 | 7/7/**7**/9/10 |
| 2H | none | 35 | 7/7/**8**/8/15 |
| 2H | fav | 84 | 9/9/**11**/11/11 |
| 2H | unfav | 25 | 8/10/**10**/11/14 |
| 2S | none | 69 | 6/8/**9**/15/16 |
| 2S | unfav | 60 | 7/11/**13**/13/13 |
| 3H | both | 37 | 9/9/**9**/9/9 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 8..17`
- `2D` → `((hcp in 6..15 and s >= 5) or (hcp in 6..15 and h >= 5))`
- `2C` → `(hcp in 6..14 and s >= 4 and h >= 4)`
- `2H` → `h >= 5 and top(h,5) >= 2 and ((hcp in 7..13 and d >= 4) or (hcp in 7..13 and c >= 4))`
- `2S` → `s >= 5 and top(s,5) >= 1 and hcp in 6..16`

### (2D) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 44.9% | 61 | 39 | 4/8/**9**/11/12 | — | — | 72% |
| X | 27.2% | 37 | 27 | 8/11/**12**/18/20 | theirs: 0:3% 1:30% 2:35% 3:27% 4:5% | — | 54% |

### (2H) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 57.4% | 232 | 72 | 5/8/**9**/10/14 | — | — | 70% |
| X | 21.0% | 85 | 26 | 9/10/**11**/12/17 | theirs: 1:13% 2:66% 3:13% 4:8% | — | 73% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | unfav | 41 | 10/10/**11**/11/13 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 9..16 and h <= 3 and s >= 3 and d >= 3 and c >= 3) or hcp >= 17)`

### (2S) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 38.8% | 244 | 80 | 6/8/**9**/11/14 | — | — | 65% |
| X | 32.9% | 207 | 43 | 9/12/**14**/19/21 | theirs: 1:31% 2:29% 3:39% | — | 46% |
| 2NT | 10.3% | 65 | 14 | 14/15/**15**/15/17 | — | — | 86% |
| 3H | 7.0% | 44 | 8 | 9/14/**14**/14/15 | 5:25% 6:75% | **4.5** (4.5–4.5) | 5% |
| 3D | 5.4% | 34 | 8 | 8/11/**14**/16/16 | 5:3% 6:91% 7:6% | **6.4** (5.3–6.4) | 3% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 81 | 9/10/**14**/15/19 |
| X | fav | 45 | 16/16/**21**/21/21 |
| X | unfav | 44 | 10/11/**14**/20/20 |
| X | both | 37 | 9/12/**14**/14/15 |
| 2NT | none | 35 | 14/15/**15**/15/17 |
| 3H | none | 35 | 9/14/**14**/14/14 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 14/**14**/21 (65) | 9/**11**/16 (60) | 14/**15**/19 (80) | — |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 36 | 100% | 92% | 100% | 86% |
| 11–13 | 29 | 100% | 86% | 93% | 83% |
| 14–16 | 79 | 100% | 85% | 86% | 48% |
| 17+ | 63 | 100% | 59% | 81% | 51% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 9..17 and s <= 2 and h >= 4 and d >= 2 and c >= 2) or (hcp in 10..17 and s == 3 and h >= 4 and d >= 2 and c >= 2) or hcp >= 18)`
- `2NT` → `(has(s,a) or (has(s,k) and s >= 2) or (has(s,q) and s >= 3)) and hcp in 14..17` *(+ balanced)*

### (3C) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 38.3% | 108 | 29 | 2/7/**8**/9/13 | — | — | 76% |
| X | 29.1% | 82 | 14 | 10/14/**15**/17/19 | theirs: 0:4% 1:38% 2:26% 3:30% 4:2% | — | 44% |
| 3NT | 16.7% | 47 | 6 | 14/17/**17**/18/18 | — | — | 96% |

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
| P | 60.8% | 174 | 36 | 6/8/**8**/11/12 | — | — | 64% |
| X | 18.2% | 52 | 21 | 8/12/**12**/18/20 | theirs: <1:2% 1:21% 2:62% 3:15% | — | 48% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | unfav | 27 | 8/12/**12**/18/20 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 8..17 and d <= 3 and s >= 3 and h >= 3 and c >= 2) or hcp >= 18)`

### (3H) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 55.7% | 112 | 32 | 7/8/**9**/11/16 | — | — | 74% |
| X | 14.4% | 29 | 10 | 10/12/**12**/14/17 | theirs: 1:55% 2:28% 3:3% 4:14% | — | 24% |
| 4S | 14.4% | 29 | 3 | 17/17/**17**/17/18 | 5:7% 6:90% 7:3% | **6.2** (6.2–6.2) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 4S | none | 27 | 17/17/**17**/17/17 |

### (3S) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 59.2% | 151 | 29 | 6/9/**10**/11/14 | — | — | 46% |
| 3NT | 14.1% | 36 | 9 | 11/11/**15**/19/20 | — | — | 44% |
| X | 11.8% | 30 | 11 | 10/13/**13**/14/19 | theirs: 1:67% 2:27% 3:7% | — | 13% |
| 4H | 9.8% | 25 | 4 | 14/14/**16**/16/20 | 5:16% 6:84% | **6.5** (4.5–6.5) | 16% |

### (4H) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 85.1% | 251 | 29 | 4/6/**7**/9/10 | — | — | 6% |

### (4S) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 90.6% | 345 | 42 | 5/8/**8**/10/13 | — | — | 54% |

## Responding after interference: partner opens, RHO acts

Key contexts: 1x (X) ? — redouble/new suits/jump raises; 1x (overcall) ? — negative doubles, raises, free bids. 1C contexts show STANDARD responders (transfer-response pairs are tabulated separately below); 1D contexts use natural openers. After 1M (X) much of the field plays transfers / graded raises (2M−1 constructive, 2M weak or vice versa), so read the **partner's suit** column: when most hands hold 3+ support, the bid is a raise in disguise and its derived rule keys on support + strength band, not the named suit.

### 1C (X) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♣ |
|---|---|---|---|---|---|---|---|---|
| P | 31.9% | 335 | 123 | 0/3/**4**/5/7 | — | — | 64% | 1:2% 2:44% 3:30% 4:19% 5:3% |
| 1D | 16.5% | 173 | 101 | 4/6/**7**/9/11 | <2:2% 2:8% 3:10% 4:15% 5:44% 6:21% | **4.0** (2.2–5.1) | 29% | 0:2% 1:17% 2:33% 3:18% 4:24% 5:2% 6:3% |
| 1H | 15.8% | 166 | 97 | 4/6/**7**/8/9 | 1:8% 2:8% 3:11% 4:47% 5:16% 6:8% | **3.4** (1.6–4.4) | 26% | 1:23% 2:25% 3:22% 4:14% 5:8% 6:7% |
| 1S | 15.9% | 167 | 83 | 4/6/**7**/8/10 | <2:2% 2:4% 3:13% 4:41% 5:25% 6:10% 7:5% | **3.2** (1.7–4.0) | 36% | 1:13% 2:35% 3:21% 4:11% 5:20% |
| XX | 7.7% | 81 | 68 | 9/10/**11**/12/14 | — | — | 60% | 0:6% 1:5% 2:16% 3:37% 4:21% 5:15% |
| 2C | 3.1% | 33 | 36 | 4/6/**7**/7/9 | 1:9% 4:42% 5:39% 6:9% | **2.5** (1.6–4.0) | 58% | 1:9% 4:42% 5:39% 6:9% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1D | none | 49 | 4/5/**8**/9/11 |
| 1D | fav | 68 | 4/6/**7**/8/10 |
| 1D | both | 33 | 4/5/**6**/8/10 |
| 1H | none | 55 | 5/6/**6**/7/8 |
| 1H | fav | 47 | 4/6/**8**/8/9 |
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
| 1H | 24.3% | 476 | 87 | 4/6/**8**/10/12 | <2:2% 2:4% 3:5% 4:32% 5:36% 6:11% 7:9% | **3.5** (2.3–4.7) | 23% | <1:2% 1:27% 2:22% 3:29% 4:17% 5+:2% |
| P | 23.2% | 454 | 99 | 0/1/**4**/5/7 | — | — | 45% | 0:3% 1:34% 2:31% 3:17% 4:9% 5:5% |
| 1S | 20.7% | 406 | 65 | 3/6/**7**/9/10 | <4:2% 4:42% 5:41% 6:9% 7:6% | **4.2** (2.1–4.8) | 35% | 0:16% 1:18% 2:17% 3:16% 4:20% 5:13% 6+:1% |
| XX | 12.6% | 246 | 62 | 6/9/**11**/12/15 | — | — | 47% | 0:12% 1:11% 2:18% 3:28% 4:11% 5:18% 6:2% |
| 3D | 5.3% | 103 | 34 | 3/5/**6**/8/9 | <4:2% 4:30% 5:58% 6:6% 7:4% | **2.5** (2.2–3.4) | 24% | <4:2% 4:30% 5:58% 6:6% 7:4% |
| 2D | 4.0% | 78 | 38 | 3/6/**7**/9/15 | 2:6% 3:9% 4:58% 5:23% 6:1% 7:3% | **2.6** (2.2–3.4) | 59% | 2:6% 3:9% 4:58% 5:23% 6:1% 7:3% |
| 2C | 1.6% | 32 | 20 | 4/7/**7**/8/13 | 1:3% 2:6% 3:6% 4:13% 5:13% 6:47% 7:13% | **2.9** (2.9–4.1) | 19% | 0:3% 1:44% 2:25% 3:6% 4:6% 5:13% 7:3% |
| 2S | 1.6% | 31 | 11 | 3/3/**3**/9/15 | 3:26% 5:6% 6:3% 7:65% | **3.4** (3.2–3.4) | 19% | 0:3% 1:58% 2:10% 4:3% 5:23% 6:3% |
| 2NT | 1.3% | 26 | 17 | 3/6/**8**/15/15 | — | — | 46% | 4:15% 5:73% 6:12% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1H | none | 110 | 4/5/**10**/11/11 |
| 1H | fav | 91 | 5/7/**7**/9/10 |
| 1H | unfav | 120 | 6/8/**10**/10/12 |
| 1H | both | 155 | 6/6/**7**/8/14 |
| 1S | none | 80 | 5/8/**10**/10/12 |
| 1S | fav | 68 | 4/6/**7**/10/10 |
| 1S | unfav | 93 | 1/3/**7**/8/12 |
| 1S | both | 165 | 5/6/**7**/8/9 |
| XX | none | 111 | 7/10/**11**/12/15 |
| XX | fav | 41 | 7/8/**9**/10/10 |
| XX | unfav | 56 | 8/12/**12**/13/15 |
| XX | both | 38 | 6/7/**8**/14/14 |
| 3D | unfav | 40 | 2/3/**6**/6/9 |
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
| P | 25.2% | 387 | 59 | 0/1/**3**/6/8 | — | — | 31% | <1:1% 1:51% 2:32% 3:15% 4+:1% |
| 2NT | 11.3% | 173 | 27 | 8/9/**9**/13/14 | — | — | 83% | <4:1% 4:91% 5:8% |
| XX | 11.2% | 172 | 27 | 9/10/**10**/12/17 | — | — | 61% | <2:2% 2:88% 3:6% 4:3% 5+:1% |
| 2H | 11.0% | 169 | 39 | 4/5/**6**/7/9 | <3:1% 3:83% 4:14% 5+:1% | **3.2** (1.1–4.0) | 89% | <3:1% 3:83% 4:14% 5+:1% |
| 1S | 10.3% | 158 | 33 | 5/7/**7**/10/12 | <3:2% 3:3% 4:45% 5:39% 6:11% | **4.4** (3.3–4.6) | 31% | 0:8% 1:19% 2:64% 3:8% 4+:1% |
| 4H | 7.5% | 115 | 21 | 6/6/**6**/8/13 | 3:3% 4:15% 5:74% 6:8% | **5.1** (3.2–5.1) | 17% | 3:3% 4:15% 5:74% 6:8% |
| 2D | 7.4% | 114 | 31 | 5/7/**8**/9/14 | <2:2% 2:33% 3:21% 4:16% 5:26% 6+:2% | **3.5** (0.9–4.9) | 71% | <2:3% 2:3% 3:65% 4:29% |
| 3H | 4.1% | 63 | 17 | 4/5/**7**/9/9 | 3:3% 4:90% 5:6% | **4.0** (1.9–4.6) | 65% | 3:3% 4:90% 5:6% |
| 1NT | 2.9% | 45 | 17 | 7/7/**7**/9/10 | — | — | 42% | 1:36% 2:49% 3:4% 4:7% 5:4% |
| 2C | 2.2% | 34 | 11 | 6/6/**7**/7/9 | 0:9% 2:32% 3:35% 4:3% 5:3% 6:18% | **1.9** (1.9–3.0) | 29% | 0:3% 1:47% 2:9% 3:41% |
| 3D | 2.1% | 32 | 13 | 6/8/**9**/9/14 | 1:19% 2:13% 3:53% 4:6% 5:9% | **1.7** (0.4–3.5) | 66% | 3:3% 4:81% 5:16% |
| 3C | 2.0% | 31 | 13 | 5/6/**8**/9/9 | 0:3% 1:13% 2:16% 3:35% 4:29% 5:3% | **1.1** (0.0–3.4) | 68% | 3:6% 4:94% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2NT | none | 55 | 8/13/**14**/14/14 |
| 2NT | unfav | 90 | 9/9/**9**/9/11 |
| XX | fav | 43 | 10/10/**12**/12/14 |
| XX | unfav | 44 | 9/10/**11**/12/12 |
| XX | both | 61 | 10/10/**10**/10/10 |
| 2H | none | 37 | 6/7/**7**/7/9 |
| 2H | fav | 50 | 5/5/**5**/5/7 |
| 2H | unfav | 28 | 4/5/**5**/9/9 |
| 2H | both | 54 | 3/4/**6**/7/9 |
| 1S | none | 62 | 5/7/**7**/7/8 |
| 1S | unfav | 39 | 6/7/**10**/12/12 |
| 1S | both | 40 | 2/6/**8**/10/10 |
| 4H | fav | 83 | 6/6/**6**/6/8 |
| 2D | none | 35 | 7/7/**7**/9/14 |
| 2D | unfav | 37 | 6/9/**9**/9/11 |
| 2D | both | 26 | 6/7/**7**/10/11 |

Dealer filters (paste into the custom filter box; derived from the data):

- `2NT` → `h >= 4 and hcp in 8..14`
- `XX` → `hcp in 9..17`
- `2H` → `h >= 3 and hcp in 4..9`
- `1S` → `s >= 4 and top(s,5) >= 1 and hcp in 5..12`
- `4H` → `h >= 4 and hcp in 6..13`
- `2D` → `h >= 3 and hcp in 5..14`

### 1S (X) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♠ |
|---|---|---|---|---|---|---|---|---|
| P | 24.0% | 254 | 60 | 2/3/**4**/6/8 | — | — | 43% | 0:13% 1:7% 2:43% 3:35% 4:2% |
| 2S | 16.1% | 170 | 42 | 3/4/**5**/7/8 | 3:92% 4:8% | **1.6** (1.3–3.3) | 60% | 3:92% 4:8% |
| 2H | 10.7% | 113 | 42 | 4/7/**8**/9/11 | 2:50% 3:22% 4:17% 5:10% 6+:2% | **2.4** (1.5–3.6) | 58% | <3:2% 3:77% 4:21% |
| 2NT | 9.4% | 100 | 24 | 8/10/**10**/11/13 | — | — | 70% | 3:4% 4:93% 5:1% 6:2% |
| 3S | 7.2% | 76 | 20 | 1/2/**5**/6/8 | 3:3% 4:78% 5:20% | **2.6** (1.1–3.4) | 71% | 3:3% 4:78% 5:20% |
| XX | 7.1% | 75 | 30 | 9/10/**11**/13/15 | — | — | 72% | 1:3% 2:45% 3:44% 4:7% 5+:1% |
| 1NT | 6.9% | 73 | 26 | 6/6/**7**/8/10 | — | — | 14% | <1:1% 1:52% 2:27% 3:18% 4+:1% |
| 4S | 6.8% | 72 | 22 | 5/6/**8**/9/13 | 3:11% 4:64% 5:22% 6:3% | **3.4** (2.9–4.6) | 31% | 3:11% 4:64% 5:22% 6:3% |
| 2C | 4.7% | 50 | 16 | 4/6/**6**/8/10 | 1:10% 2:4% 3:58% 5:4% 6:12% 8:12% | **4.3** (4.3–4.4) | 4% | 0:54% 1:18% 2:18% 3:4% 4:6% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2S | fav | 35 | 1/4/**4**/5/7 |
| 2S | unfav | 63 | 4/4/**4**/7/8 |
| 2S | both | 48 | 3/6/**7**/8/8 |
| 2H | both | 58 | 6/8/**8**/8/10 |
| 2NT | unfav | 25 | 10/10/**10**/10/12 |
| 2NT | both | 47 | 7/8/**10**/11/13 |
| 3S | fav | 51 | 1/1/**2**/5/6 |
| 1NT | none | 37 | 6/6/**6**/6/9 |

Dealer filters (paste into the custom filter box; derived from the data):

- `2S` → `s >= 3 and hcp in 3..8`
- `2H` → `s >= 3 and hcp in 4..11`
- `2NT` → `s >= 4 and hcp in 8..13`
- `3S` → `s >= 4 and hcp in 1..8`
- `XX` → `hcp in 9..15`
- `1NT` → `hcp in 6..10`

### 1C (1S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♣ |
|---|---|---|---|---|---|---|---|---|
| X | 40.6% | 610 | 155 | 5/8/**9**/11/16 | theirs: <1:2% 1:19% 2:35% 3:28% 4:15% | — | 50% | <1:1% 1:15% 2:20% 3:44% 4:10% 5:9% |
| P | 27.2% | 408 | 140 | 1/4/**5**/6/8 | — | — | 58% | 1:9% 2:31% 3:28% 4:25% 5:5% 6+:1% |
| 1NT | 8.3% | 124 | 36 | 7/8/**10**/10/10 | — | — | 97% | <2:2% 2:3% 3:65% 4:23% 5:6% |
| 2H | 6.6% | 99 | 55 | 6/10/**10**/11/14 | 2:2% 3:13% 5:35% 6:29% 7:10% 8:10% | **4.3** (3.1–5.5) | 19% | 0:8% 1:18% 2:31% 3:32% 4:8% 5+:2% |
| 2D | 5.3% | 79 | 47 | 6/8/**10**/13/14 | 1:5% 2:28% 3:13% 4:19% 5:28% 6:5% 7:3% | **3.3** (1.7–5.4) | 27% | 0:3% 1:28% 2:19% 3:46% 4:5% |
| 2C | 3.9% | 59 | 50 | 4/6/**7**/10/14 | <2:2% 2:8% 3:19% 4:42% 5:24% 6:5% | **2.8** (1.8–4.4) | 39% | <2:2% 2:8% 3:19% 4:42% 5:24% 6:5% |
| 2S | 2.2% | 33 | 25 | 8/11/**13**/13/17 | 0:3% 1:21% 2:42% 3:21% 4:12% | **0.2** (0.2–3.0) | 64% | 1:6% 3:15% 4:52% 5:3% 6:24% |
| 3NT | 2.1% | 31 | 9 | 14/14/**14**/14/17 | — | — | 94% | 1:6% 2:3% 3:81% 4:10% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 123 | 6/8/**9**/11/14 |
| X | fav | 75 | 5/5/**6**/10/11 |
| X | unfav | 190 | 9/10/**10**/11/16 |
| X | both | 222 | 6/7/**8**/9/15 |
| 1NT | fav | 40 | 7/8/**8**/8/8 |
| 1NT | both | 66 | 10/10/**10**/10/10 |
| 2H | none | 37 | 6/8/**10**/10/15 |
| 2D | none | 35 | 6/8/**10**/13/15 |
| 2S | none | 25 | 8/10/**13**/13/17 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 9/**9**/11 (128) | 7/**8**/11 (214) | 7/**10**/11 (168) | 8/**9**/10 (100) |
| 1NT | — | — | 8/**8**/10 (70) | 10/**10**/10 (53) |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 5..16`
- `1NT` → `(has(s,a) or (has(s,k) and s >= 2) or (has(s,q) and s >= 3)) and hcp in 7..10` *(+ balanced)*
- `2H` → `h >= 3 and top(h,5) >= 1 and (hcp >= 11 or top(h,5) >= 2) and ((hcp in 6..14 and s <= 2) or (hcp in 7..14 and s in 3..4))`
- `2D` → `hcp in 6..14`
- `2C` → `hcp in 4..14`

### 1D (1S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♦ |
|---|---|---|---|---|---|---|---|---|
| X | 40.3% | 897 | 126 | 6/7/**9**/10/12 | theirs: 0:5% 1:17% 2:29% 3:30% 4:11% 5:8% | — | 44% | 1:9% 2:34% 3:21% 4:21% 5:15% 6+:1% |
| P | 29.6% | 659 | 104 | 1/3/**6**/7/13 | — | — | 60% | 1:14% 2:38% 3:39% 4:7% 5+:2% |
| 1NT | 6.1% | 135 | 43 | 6/8/**8**/10/10 | — | — | 76% | 1:15% 2:38% 3:27% 4:16% 5:4% |
| 2D | 5.9% | 131 | 58 | 5/6/**6**/8/10 | 1:5% 2:11% 3:16% 4:53% 5:15% | **2.1** (1.0–2.9) | 58% | 1:5% 2:11% 3:16% 4:53% 5:15% |
| 2H | 4.8% | 107 | 53 | 6/8/**10**/11/14 | 3:7% 5:34% 6:50% 7:7% | **4.9** (3.4–5.5) | 20% | 1:24% 2:40% 3:15% 4:15% 5:5% |
| 2C | 3.9% | 87 | 46 | 6/7/**10**/10/13 | 1:5% 2:8% 3:26% 4:13% 5:43% 6:6% | **5.4** (2.6–5.8) | 44% | 1:6% 2:20% 3:33% 4:28% 5:14% |
| 2S | 3.2% | 72 | 23 | 9/10/**11**/12/14 | 0:8% 1:42% 2:26% 3:8% 4:14% 5+:1% | **3.6** (0.0–5.6) | 31% | 4:56% 5:40% 6:4% |
| 3D | 2.6% | 57 | 17 | 5/6/**6**/6/8 | 4:40% 5:53% 6:7% | **1.9** (1.7–2.4) | 65% | 4:40% 5:53% 6:7% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 258 | 6/7/**9**/10/11 |
| X | fav | 163 | 6/6/**10**/10/13 |
| X | unfav | 263 | 6/7/**10**/10/12 |
| X | both | 213 | 6/7/**7**/9/15 |
| 1NT | fav | 32 | 6/6/**9**/9/11 |
| 1NT | unfav | 73 | 6/8/**8**/10/10 |
| 2D | none | 30 | 3/5/**7**/10/10 |
| 2D | fav | 51 | 5/6/**6**/7/9 |
| 2D | unfav | 25 | 4/6/**6**/8/9 |
| 2D | both | 25 | 6/6/**7**/8/13 |
| 2H | none | 40 | 6/7/**10**/10/12 |
| 2H | both | 30 | 6/9/**9**/13/13 |
| 2C | fav | 48 | 6/7/**7**/10/14 |
| 2S | fav | 29 | 10/10/**10**/14/14 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 7/**10**/10 (200) | 7/**9**/11 (264) | 6/**7**/10 (265) | 7/**9**/11 (168) |
| 1NT | — | — | 6/**8**/10 (48) | 8/**8**/9 (85) |
| 2D | — | 6/**6**/8 (47) | 6/**6**/8 (42) | 5/**7**/8 (30) |
| 2H | 6/**8**/14 (20) | 9/**10**/10 (41) | 7/**9**/10 (28) | 8/**11**/13 (18) |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 6..12`
- `1NT` → `hcp in 6..10`
- `2D` → `((hcp in 3..10 and s <= 2) or (hcp in 5..10 and s in 3..5))`
- `2H` → `h >= 5 and top(h,5) >= 1 and hcp in 6..14`
- `2C` → `top(c,5) >= 1 and hcp in 6..13`
- `2S` → `((hcp in 9..11 and s >= 4) or (hcp in 9..14 and s <= 3 and h <= 3) or (hcp in 12..14 and d >= 5) or (hcp in 12..14 and c >= 5))`

### 1H (1S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♥ |
|---|---|---|---|---|---|---|---|---|
| 2H | 26.7% | 400 | 40 | 4/6/**7**/8/10 | 3:80% 4:19% | **3.5** (1.3–4.6) | 56% | 3:80% 4:19% |
| P | 13.8% | 206 | 43 | 2/5/**6**/6/8 | — | — | 17% | 1:33% 2:53% 3:10% 4:3% |
| X | 11.3% | 169 | 36 | 6/7/**9**/10/14 | theirs: 1:16% 2:38% 3:21% 4:24% | — | 23% | 1:40% 2:50% 3:10% |
| 2NT | 10.2% | 153 | 32 | 8/11/**13**/14/17 | — | — | 41% | 3:15% 4:43% 5:42% |
| 2S | 9.8% | 147 | 38 | 9/10/**12**/14/17 | 1:16% 2:18% 3:35% 4:27% 5:4% | **4.0** (2.6–5.9) | 58% | 3:61% 4:16% 5:22% |
| 3H | 9.3% | 139 | 15 | 2/4/**6**/6/8 | 3:4% 4:94% 5+:1% | **3.4** (0.7–3.5) | 58% | 3:4% 4:94% 5+:1% |
| 2D | 5.9% | 89 | 33 | 6/8/**9**/10/17 | 1:2% 2:4% 3:15% 4:8% 5:11% 6:17% 7:43% | **5.1** (3.3–5.6) | 26% | 1:8% 2:55% 3:27% 4:7% 5:3% |
| 4H | 3.1% | 46 | 22 | 4/6/**8**/12/14 | 3:4% 4:61% 5:30% 6:4% | **3.4** (3.0–4.3) | 28% | 3:4% 4:61% 5:30% 6:4% |
| 1NT | 2.9% | 44 | 16 | 8/9/**9**/10/11 | — | — | 43% | 1:50% 2:41% 3:7% 4:2% |
| 2C | 2.4% | 36 | 17 | 6/6/**9**/13/17 | 1:8% 2:14% 3:14% 4:14% 5:25% 6:14% 7:11% | **3.8** (2.3–6.5) | 25% | 1:19% 2:58% 3:22% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2H | none | 50 | 6/6/**6**/6/6 |
| 2H | fav | 120 | 4/7/**7**/9/9 |
| 2H | unfav | 78 | 6/6/**6**/8/10 |
| 2H | both | 152 | 4/5/**8**/8/8 |
| X | none | 35 | 6/13/**13**/13/18 |
| X | unfav | 68 | 6/6/**7**/7/9 |
| X | both | 43 | 7/9/**10**/10/13 |
| 2NT | none | 31 | 9/12/**14**/14/17 |
| 2NT | fav | 73 | 8/11/**14**/14/17 |
| 2NT | unfav | 26 | 11/11/**12**/12/13 |
| 2S | none | 38 | 7/11/**14**/17/18 |
| 2S | fav | 56 | 9/9/**14**/14/17 |
| 2S | both | 34 | 6/10/**10**/12/13 |
| 3H | fav | 35 | 3/4/**4**/4/6 |
| 3H | unfav | 39 | 6/6/**6**/6/7 |
| 3H | both | 50 | 4/6/**6**/6/8 |
| 2D | unfav | 47 | 6/9/**9**/9/10 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 2H | 6/**6**/9 (89) | 4/**5**/8 (64) | 6/**8**/8 (155) | 7/**7**/7 (92) |
| X | 7/**7**/9 (27) | 7/**7**/10 (65) | 6/**6**/8 (36) | 9/**13**/13 (41) |
| 2NT | — | 9/**12**/12 (18) | 10/**11**/12 (41) | 13/**14**/14 (87) |
| 2S | 9/**9**/9 (24) | 10/**12**/12 (26) | 10/**13**/17 (51) | 11/**14**/14 (46) |

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
| X | 31.6% | 413 | 165 | 6/7/**9**/10/15 | theirs: 1:15% 2:49% 3:26% 4:7% 5:3% | — | 57% | 1:4% 2:28% 3:34% 4:29% 5:4% |
| 1S | 18.9% | 248 | 123 | 7/7/**9**/10/14 | 1:2% 2:19% 3:26% 4:8% 5:29% 6:16% | **3.3** (2.3–4.9) | 40% | 1:6% 2:17% 3:19% 4:50% 5:8% |
| P | 15.4% | 202 | 112 | 2/4/**5**/7/7 | — | — | 57% | 1:3% 2:11% 3:38% 4:37% 5:11% |
| 2C | 7.6% | 100 | 60 | 5/7/**7**/9/12 | 1:2% 2:4% 3:4% 4:38% 5:52% | **3.1** (2.4–3.7) | 13% | 1:2% 2:4% 3:4% 4:38% 5:52% |
| 2H | 6.2% | 81 | 50 | 8/9/**11**/13/15 | 0:2% 1:28% 2:19% 3:42% 4:9% | **3.3** (0.9–4.7) | 33% | 1:7% 2:10% 3:16% 4:32% 5:33% 6+:1% |
| 1NT | 5.8% | 76 | 40 | 7/8/**9**/9/10 | — | — | 74% | 2:3% 3:14% 4:55% 5:28% |
| 2D | 5.5% | 72 | 38 | 6/10/**12**/12/15 | <5:3% 5:50% 6:39% 7:8% | **4.3** (3.7–4.8) | 14% | 1:7% 2:19% 3:8% 4:51% 5:13% 6+:1% |
| 3C | 4.9% | 64 | 15 | 5/5/**6**/8/8 | 4:6% 5:91% 6:3% | **3.2** (2.3–6.2) | 0% | 4:6% 5:91% 6:3% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 82 | 6/7/**8**/9/11 |
| X | fav | 126 | 6/7/**9**/11/17 |
| X | unfav | 94 | 6/8/**9**/10/13 |
| X | both | 111 | 6/8/**9**/12/15 |
| 1S | none | 88 | 7/7/**9**/11/14 |
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
| X | 6/**8**/10 (61) | 8/**9**/10 (204) | 7/**9**/10 (109) | 9/**10**/12 (39) |
| 1S | 8/**9**/11 (58) | 7/**7**/10 (95) | 8/**9**/11 (65) | 7/**7**/9 (30) |
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
| X | 37.3% | 820 | 116 | 5/7/**8**/9/12 | theirs: 1:11% 2:34% 3:39% 4:14% 5:2% | — | 47% | <1:2% 1:20% 2:25% 3:29% 4:15% 5:9% |
| P | 20.0% | 441 | 76 | 2/3/**4**/6/9 | — | — | 55% | 1:14% 2:65% 3:9% 4:11% |
| 1S | 17.7% | 389 | 105 | 4/7/**9**/11/13 | <2:2% 2:5% 3:30% 4:10% 5:34% 6:14% 7:5% | **4.2** (2.4–5.2) | 39% | 0:5% 1:6% 2:35% 3:39% 4:10% 5:5% |
| 2D | 5.9% | 130 | 39 | 4/7/**7**/8/11 | 2:3% 3:5% 4:72% 5:17% 6:3% | **3.3** (2.3–3.6) | 38% | 2:3% 3:5% 4:72% 5:17% 6:3% |
| 2H | 4.4% | 97 | 38 | 7/8/**10**/12/13 | <1:1% 1:8% 2:12% 3:34% 4:24% 5:21% | **2.0** (0.7–3.8) | 36% | 0:11% 1:10% 2:11% 3:33% 4:16% 5:16% 6+:1% |
| 2C | 4.1% | 91 | 28 | 7/9/**11**/14/19 | <2:1% 2:5% 3:3% 4:2% 5:9% 6:30% 7:9% 8:41% | **7.1** (4.8–7.1) | 11% | 0:5% 1:1% 2:68% 3:9% 4:7% 5:10% |
| 1NT | 3.6% | 80 | 27 | 7/7/**9**/9/11 | — | — | 89% | 2:35% 3:39% 4:5% 5:21% |
| 3D | 3.1% | 69 | 18 | 4/6/**7**/7/9 | 4:72% 5:17% 6:10% | **3.0** (2.2–3.6) | 28% | 4:72% 5:17% 6:10% |
| 2S | 1.3% | 29 | 18 | 7/9/**10**/11/13 | 1:34% 2:3% 3:31% 4:3% 6:28% | **2.1** (0.4–4.4) | 24% | 0:7% 1:7% 2:41% 3:3% 4:7% 5:31% 6:3% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 162 | 4/8/**9**/11/13 |
| X | fav | 333 | 6/7/**7**/9/12 |
| X | unfav | 152 | 6/8/**9**/10/13 |
| X | both | 173 | 5/6/**7**/9/11 |
| 1S | none | 100 | 4/7/**9**/10/13 |
| 1S | fav | 168 | 4/8/**10**/12/12 |
| 1S | unfav | 50 | 5/7/**9**/10/15 |
| 1S | both | 71 | 5/6/**6**/8/12 |
| 2D | fav | 37 | 7/7/**9**/9/12 |
| 2D | both | 64 | 4/4/**7**/7/9 |
| 2H | fav | 60 | 8/9/**10**/12/12 |
| 2C | both | 44 | 7/11/**11**/11/15 |
| 1NT | fav | 54 | 7/7/**9**/9/9 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 6/**8**/8 (91) | 8/**9**/9 (278) | 7/**7**/9 (320) | 8/**10**/12 (131) |
| 1S | 7/**7**/8 (34) | 6/**9**/9 (155) | 7/**9**/12 (100) | 8/**10**/12 (100) |
| 2D | — | 7/**7**/9 (31) | 9/**9**/9 (25) | 5/**7**/8 (71) |

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
| P | 31.5% | 304 | 36 | 2/3/**5**/7/10 | — | — | 36% | 0:13% 1:8% 2:47% 3:30% 4+:2% |
| 2S | 22.7% | 219 | 29 | 4/5/**6**/7/9 | <3:1% 3:65% 4:32% 5+:2% | **1.6** (0.7–2.8) | 75% | <3:1% 3:65% 4:32% 5+:2% |
| X | 9.0% | 87 | 27 | 7/8/**10**/11/15 | theirs: <1:1% 1:2% 2:30% 3:28% 4:39% | — | 62% | 0:5% 1:16% 2:63% 3:14% 4:2% |
| 3S | 9.0% | 87 | 12 | 1/6/**6**/7/7 | 3:3% 4:91% 5:6% | **0.7** (0.7–1.9) | 91% | 3:3% 4:91% 5:6% |
| 3H | 8.8% | 85 | 21 | 8/10/**10**/11/13 | 0:14% 1:19% 2:45% 3:20% 4:2% | **0.0** (0.0–2.7) | 64% | 3:76% 4:18% 5:6% |
| 4S | 7.1% | 69 | 18 | 4/6/**9**/9/11 | 3:12% 4:23% 5:65% | **2.3** (1.8–2.3) | 20% | 3:12% 4:23% 5:65% |
| 2NT | 4.7% | 45 | 16 | 7/9/**9**/10/13 | — | — | 60% | 3:36% 4:38% 5:27% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2S | none | 137 | 5/5/**6**/7/9 |
| 2S | fav | 50 | 6/6/**7**/8/9 |
| 2S | both | 27 | 2/2/**6**/6/10 |
| X | none | 32 | 7/7/**9**/13/15 |
| X | unfav | 33 | 7/10/**10**/10/15 |
| 3S | none | 32 | 7/7/**7**/7/7 |
| 3S | fav | 46 | 1/6/**6**/6/6 |
| 3H | unfav | 36 | 9/10/**10**/10/11 |
| 4S | none | 37 | 9/9/**9**/9/10 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 2S | 5/**5**/5 (41) | 5/**6**/8 (64) | 7/**7**/8 (74) | 4/**6**/6 (40) |

Dealer filters (paste into the custom filter box; derived from the data):

- `2S` → `((hcp in 4..11 and h >= 4) or (hcp in 4..11 and s >= 4) or (hcp in 4..11 and s <= 3 and h <= 3))`
- `X` → `hcp in 7..15`
- `3S` → `s >= 4 and hcp in 1..7`
- `3H` → `((hcp in 8..11 and s >= 4) or (hcp in 8..11 and s <= 3 and h <= 3))`
- `4S` → `s >= 3 and hcp in 4..11`

### 1H (2D) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♥ |
|---|---|---|---|---|---|---|---|---|
| X | 30.6% | 144 | 20 | 5/7/**8**/10/14 | theirs: 0:6% 1:5% 2:10% 3:57% 4:19% 5:2% | — | 63% | 1:8% 2:87% 3:5% |
| P | 22.6% | 106 | 27 | 1/5/**7**/8/14 | — | — | 53% | 1:6% 2:73% 3:16% 4:5% |
| 2H | 12.6% | 59 | 18 | 6/6/**8**/10/10 | 2:5% 3:92% 4:3% | **2.4** (2.3–4.7) | 95% | 2:5% 3:92% 4:3% |
| 2S | 11.1% | 52 | 10 | 7/10/**10**/14/14 | <5:2% 5:52% 6:4% 7:42% | **5.4** (3.2–6.9) | 2% | 1:48% 2:52% |
| 3D | 6.8% | 32 | 15 | 8/9/**10**/10/14 | 1:16% 2:28% 3:34% 5:22% | **2.2** (0.7–3.0) | 53% | 1:6% 3:72% 4:16% 5:6% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 63 | 5/8/**8**/14/14 |
| X | both | 49 | 7/7/**7**/10/12 |
| 2S | none | 42 | 10/10/**10**/14/14 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 5/**5**/5 (16) | 8/**9**/10 (15) | 7/**8**/8 (82) | 10/**12**/14 (31) |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 5..14`
- `2H` → `((hcp in 6..11 and s >= 4) or (hcp in 6..11 and s <= 3 and h <= 3))`
- `2S` → `s >= 5 and top(s,5) >= 2 and hcp in 7..14`

### 1S (2D) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♠ |
|---|---|---|---|---|---|---|---|---|
| P | 23.9% | 199 | 28 | 2/4/**5**/8/8 | — | — | 14% | 0:7% 1:44% 2:34% 3:11% 4:5% |
| 2S | 17.4% | 145 | 22 | 4/4/**6**/7/8 | 2:4% 3:79% 4:15% 5:2% | **2.6** (1.5–3.2) | 60% | 2:4% 3:79% 4:15% 5:2% |
| 4S | 15.0% | 125 | 7 | 5/5/**6**/6/7 | 4:13% 5:87% | **2.7** (2.2–2.7) | 2% | 4:13% 5:87% |
| X | 14.9% | 124 | 19 | 6/7/**8**/9/11 | theirs: 1:2% 2:44% 3:40% 4:4% 5:8% | — | 20% | 0:42% 1:19% 2:36% 3:3% |
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
| X | 22.9% | 123 | 29 | 6/9/**9**/10/13 | theirs: 1:5% 2:47% 3:28% 4:19% | — | 30% | 0:7% 1:18% 2:68% 3:7% |
| P | 19.4% | 104 | 22 | 4/6/**7**/8/10 | — | — | 40% | 0:5% 1:48% 2:39% 3:6% 4+:2% |
| 3C | 10.4% | 56 | 15 | 7/9/**11**/12/13 | 0:9% 1:13% 2:45% 3:34% | **0.2** (0.2–1.6) | 32% | 3:39% 4:54% 5:5% 6+:2% |
| 2NT | 10.1% | 54 | 11 | 7/10/**11**/11/13 | — | — | 19% | 3:15% 4:76% 5:9% |
| 2S | 7.6% | 41 | 10 | 6/9/**12**/12/13 | 5:49% 6:29% 7:22% | **4.5** (4.3–5.5) | 46% | 0:5% 2:56% 3:32% 4:7% |
| 2H | 6.7% | 36 | 10 | 3/7/**7**/7/9 | 2:3% 3:67% 4:31% | **1.6** (1.3–3.6) | 25% | 2:3% 3:67% 4:31% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | both | 80 | 6/9/**9**/10/13 |
| 3C | none | 28 | 7/10/**11**/11/11 |
| 2NT | none | 33 | 10/11/**11**/11/11 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | — | 9/**9**/9 (58) | 10/**11**/12 (34) | 7/**10**/10 (24) |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 6..13`
- `3C` → `((hcp in 7..11 and h >= 4) or (hcp in 7..13 and s >= 4))`
- `2NT` → `hcp in 7..13`

### 1S (2C) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♠ |
|---|---|---|---|---|---|---|---|---|
| P | 42.3% | 227 | 20 | 1/1/**3**/6/7 | — | — | 41% | 0:8% 1:23% 2:52% 3:16% |
| X | 16.6% | 89 | 20 | 6/7/**9**/11/12 | theirs: 1:4% 2:28% 3:53% 4:13% 5+:1% | — | 40% | 0:7% 1:38% 2:38% 3:16% 4+:1% |
| 2S | 12.7% | 68 | 12 | 4/6/**6**/6/10 | 3:91% 4:9% | **1.6** (1.6–1.6) | 32% | 3:91% 4:9% |
| 2H | 7.4% | 40 | 11 | 6/8/**9**/12/12 | 5:28% 6:68% 7:5% | **4.6** (3.3–4.9) | 5% | 0:10% 1:70% 2:18% 3:3% |
| 3C | 5.8% | 31 | 13 | 8/10/**11**/12/13 | 1:10% 2:48% 3:32% 4:10% | **1.5** (1.5–3.3) | 84% | 3:68% 4:26% 5:3% 6:3% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | unfav | 49 | 6/6/**11**/11/12 |
| 2S | both | 56 | 5/6/**6**/6/9 |
| 2H | unfav | 26 | 6/9/**9**/12/12 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 6..12`
- `2S` → `(hcp in 4..11 and h >= 4)`

### 1D (2C) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♦ |
|---|---|---|---|---|---|---|---|---|
| X | 38.2% | 333 | 55 | 6/8/**9**/10/12 | theirs: 1:9% 2:36% 3:53% 4+:1% | — | 52% | 1:12% 2:32% 3:25% 4:23% 5:9% |
| P | 30.8% | 268 | 44 | 3/5/**5**/6/8 | — | — | 63% | 1:24% 2:22% 3:45% 4:7% 5+:1% |
| 2H | 14.6% | 127 | 23 | 7/9/**10**/10/12 | <5:4% 5:87% 6:9% | **4.3** (3.4–6.3) | 61% | 1:11% 2:58% 3:19% 4:6% 6:5% |
| 2D | 6.9% | 60 | 31 | 5/5/**7**/10/11 | 1:5% 2:17% 3:27% 4:47% 5:2% 6:3% | **1.8** (0.2–3.0) | 57% | 1:5% 2:17% 3:27% 4:47% 5:2% 6:3% |
| 3C | 3.3% | 29 | 8 | 9/12/**12**/15/15 | 0:3% 1:3% 2:21% 3:72% | **3.2** (2.1–3.6) | 76% | 2:3% 4:38% 5:55% 6:3% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 59 | 5/7/**7**/9/10 |
| X | fav | 171 | 8/8/**10**/12/12 |
| X | unfav | 46 | 7/9/**9**/10/11 |
| X | both | 57 | 6/9/**9**/10/10 |
| 2H | fav | 34 | 7/8/**9**/10/10 |
| 2H | unfav | 59 | 9/10/**10**/11/12 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 7/**8**/9 (31) | 8/**9**/9 (120) | 9/**10**/12 (178) | — |
| 2H | — | 7/**10**/11 (34) | 10/**10**/10 (76) | — |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 6..12`
- `2H` → `h >= 5 and top(h,5) >= 1 and hcp in 7..12`
- `2D` → `hcp in 5..11`

### 1NT (X) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 38.3% | 363 | 135 | 2/4/**6**/7/10 | — | — | 75% |
| XX | 16.9% | 160 | 105 | 1/5/**7**/9/12 | — | — | 44% |
| 2C | 11.9% | 113 | 69 | 1/3/**6**/7/9 | <1:2% 1:9% 2:18% 3:18% 4:29% 5:20% 6:4% | **2.2** (1.3–3.9) | 38% |
| 2H | 11.8% | 112 | 56 | 1/4/**5**/7/10 | 1:4% 2:4% 3:33% 4:6% 5:45% 6:6% | **2.4** (1.3–4.1) | 36% |
| 2D | 11.5% | 109 | 42 | 1/3/**6**/6/8 | <2:3% 2:6% 3:16% 4:37% 5:37% 6:3% | **2.3** (1.5–3.3) | 41% |
| 2S | 4.2% | 40 | 24 | 1/4/**6**/7/8 | 1:3% 2:3% 3:8% 5:55% 6:33% | **2.7** (1.5–3.1) | 18% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| XX | none | 60 | 2/6/**8**/9/10 |
| XX | fav | 67 | 1/4/**7**/9/13 |
| 2C | none | 33 | 1/4/**6**/8/9 |
| 2C | fav | 52 | 1/3/**6**/7/9 |
| 2H | none | 35 | 5/6/**6**/8/11 |
| 2H | fav | 42 | 1/3/**4**/8/10 |
| 2D | none | 52 | 2/5/**6**/6/8 |
| 2D | fav | 29 | 2/4/**6**/7/9 |

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
| P | 31.0% | 140 | 123 | 0/3/**4**/5/8 | — | — | 66% | <2:1% 2:46% 3:31% 4:17% 5:4% |
| 1D | 17.5% | 79 | 101 | 4/5/**8**/9/12 | 1:5% 2:33% 3:28% 4:15% 5:13% 6:6% | **2.8** (0.9–4.0) | 14% | 1:20% 2:46% 3:10% 4:10% 5:3% 6:11% |
| 1H | 19.5% | 88 | 97 | 3/6/**7**/8/9 | 1:18% 2:20% 3:44% 4:15% 5:2% | **3.6** (0.4–4.7) | 42% | <1:1% 1:11% 2:34% 3:33% 4:8% 5:13% |
| 1S | 11.8% | 53 | 83 | 4/6/**7**/7/10 | 1:6% 2:26% 3:53% 4:6% 5:6% 6:4% | **2.3** (1.5–3.5) | 57% | 1:13% 2:8% 3:25% 4:38% 5:17% |
| XX | 9.3% | 42 | 68 | 4/8/**11**/11/16 | — | — | 48% | 0:14% 1:5% 2:10% 3:31% 4:14% 5:26% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1D | fav | 33 | 4/6/**8**/8/10 |
| 1H | none | 32 | 3/6/**7**/8/8 |
| 1H | both | 25 | 5/7/**7**/8/11 |

Dealer filters (paste into the custom filter box; derived from the data):

- `1D` → `(hcp in 4..11 and h >= 4)`
- `1H` → `(hcp in 3..11 and s >= 4)`
- `1S` → `(hcp in 4..11 and s <= 3 and h <= 3)`

### 1C (1D) ? — transfer responders

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♣ |
|---|---|---|---|---|---|---|---|---|
| X | 32.8% | 128 | 123 | 4/7/**9**/10/13 | theirs: 1:15% 2:52% 3:18% 4:13% 5:2% | — | 54% | 1:8% 2:19% 3:48% 4:13% 5:5% 6:8% |
| 1H | 24.1% | 94 | 109 | 6/8/**9**/11/12 | 1:4% 2:20% 3:45% 4:19% 5:9% 6:3% | **3.2** (0.7–4.7) | 40% | 1:3% 2:27% 3:47% 4:9% 5:11% 6:4% |
| 1S | 10.0% | 39 | 84 | 6/7/**8**/10/11 | 1:8% 2:5% 3:41% 4:33% 5:8% 6:5% | **3.0** (1.5–5.6) | 62% | 1:5% 2:18% 3:21% 4:10% 5:46% |
| P | 12.3% | 48 | 98 | 2/3/**4**/7/10 | — | — | 60% | 2:19% 3:38% 4:27% 5:13% 6:4% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 44 | 5/7/**8**/9/12 |
| X | fav | 35 | 4/7/**8**/10/13 |
| X | both | 27 | 4/7/**10**/11/11 |
| 1H | none | 35 | 6/7/**8**/9/14 |
| 1H | unfav | 27 | 6/8/**10**/11/12 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 4/**7**/8 (19) | 8/**9**/11 (66) | 9/**9**/12 (23) | 6/**6**/7 (20) |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 4..13`
- `1H` → `(hcp in 6..12 and s >= 4)`

### 1C (1H) ? — transfer responders

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♣ |
|---|---|---|---|---|---|---|---|---|
| X | 40.4% | 255 | 165 | 5/7/**9**/10/14 | theirs: <1:1% 1:17% 2:45% 3:26% 4:7% 5:3% | — | 48% | 1:7% 2:31% 3:34% 4:23% 5:4% |
| 1S | 20.0% | 126 | 123 | 6/7/**9**/10/13 | <1:2% 1:6% 2:38% 3:43% 4:5% 5:4% 6:2% | **2.4** (0.6–3.9) | 49% | 2:8% 3:11% 4:54% 5:26% |
| P | 13.9% | 88 | 112 | 2/4/**6**/7/8 | — | — | 69% | <2:1% 2:17% 3:34% 4:34% 5:13% 6+:1% |
| 2C | 6.3% | 40 | 60 | 6/7/**10**/12/14 | 1:5% 2:18% 3:8% 4:35% 5:30% 6:3% 8:3% | **3.4** (2.5–5.7) | 15% | 1:5% 2:18% 3:8% 4:35% 5:30% 6:3% 8:3% |
| 1NT | 4.4% | 28 | 40 | 7/7/**8**/9/10 | — | — | 57% | 2:4% 3:18% 4:39% 5:39% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 76 | 5/7/**8**/9/12 |
| X | fav | 75 | 5/7/**9**/10/14 |
| X | unfav | 54 | 6/8/**9**/10/13 |
| X | both | 50 | 6/7/**9**/11/15 |
| 1S | none | 27 | 7/9/**10**/12/14 |
| 1S | fav | 42 | 7/7/**9**/13/13 |
| 1S | unfav | 26 | 6/7/**8**/10/12 |
| 1S | both | 31 | 6/7/**8**/10/12 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 6/**7**/10 (47) | 8/**9**/10 (116) | 7/**9**/10 (66) | 7/**8**/10 (26) |
| 1S | 8/**8**/12 (23) | 7/**9**/10 (35) | 7/**9**/13 (44) | 7/**7**/9 (24) |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 5..14`
- `1S` → `((hcp in 6..11 and h >= 4) or (hcp in 6..11 and s <= 3 and h <= 3))`

## Advancing partner’s direct action: (1x) act (…) ?

Includes advances of overcalls and of takeout doubles (partner doubled, RHO passed or raised). 1C/1D contexts face natural openers only.

### (1C) 1H (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♥ |
|---|---|---|---|---|---|---|---|---|
| 1S | 31.1% | 106 | 28 | 4/9/**11**/11/12 | <4:2% 4:19% 5:52% 6:18% 7:9% | **3.4** (3.2–4.0) | 19% | 1:46% 2:39% 3:14% |
| P | 14.4% | 49 | 35 | 1/5/**5**/6/8 | — | — | 51% | 1:27% 2:45% 3:27% 6:2% |
| 2H | 13.8% | 47 | 21 | 5/5/**7**/8/10 | 3:70% 4:30% | **3.5** (2.1–3.8) | 77% | 3:70% 4:30% |
| 2C | 10.0% | 34 | 21 | 9/11/**11**/14/16 | 0:3% 2:18% 3:41% 4:9% 5:29% | **4.0** (2.6–6.3) | 76% | 1:15% 2:6% 3:74% 4:3% 5:3% |
| 2D | 10.0% | 34 | 13 | 9/9/**12**/12/14 | 2:3% 3:3% 4:6% 5:18% 6:50% 8:21% | **2.7** (2.2–5.7) | 12% | 0:3% 1:47% 2:35% 3:15% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1S | both | 53 | 6/11/**11**/11/11 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 1S | 4/**5**/6 (16) | 9/**9**/12 (32) | 11/**11**/11 (47) | — |

Dealer filters (paste into the custom filter box; derived from the data):

- `1S` → `s >= 4 and top(s,5) >= 1 and ((hcp in 4..12 and c <= 2) or (hcp in 7..12 and c in 3..4))`

### (1C) 1S (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♠ |
|---|---|---|---|---|---|---|---|---|
| P | 25.4% | 178 | 47 | 2/4/**6**/6/9 | — | — | 38% | 0:29% 1:16% 2:47% 3:8% |
| 1NT | 19.4% | 136 | 33 | 8/10/**10**/10/11 | — | — | 23% | 0:5% 1:58% 2:35% 3+:1% |
| 2S | 15.9% | 111 | 34 | 6/7/**7**/8/9 | 3:95% 4:5% | **4.1** (3.0–4.1) | 95% | 3:95% 4:5% |
| 2C | 14.4% | 101 | 26 | 9/11/**11**/12/16 | 0:4% 2:6% 3:40% 4:47% 5:4% | **2.5** (2.3–2.9) | 83% | 1:8% 2:5% 3:84% 4+:2% |
| 2H | 9.6% | 67 | 22 | 8/9/**10**/11/12 | 1:3% 3:4% 4:3% 5:24% 6:48% 7:18% | **5.9** (4.9–5.9) | 13% | 0:3% 1:33% 2:55% 3:9% |
| 2D | 8.0% | 56 | 17 | 8/9/**11**/11/12 | 1:11% 2:2% 3:11% 4:4% 5:11% 6:52% 8:11% | **3.4** (2.4–7.5) | 5% | 0:36% 1:25% 2:34% 3:4% 4+:2% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1NT | none | 25 | 9/9/**9**/10/11 |
| 1NT | unfav | 102 | 9/10/**10**/10/11 |
| 2S | fav | 71 | 7/7/**7**/7/10 |
| 2C | unfav | 53 | 11/11/**11**/12/16 |
| 2H | none | 42 | 9/9/**9**/11/11 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 1NT | — | — | — | 10/**10**/10 (122) |
| 2S | — | 7/**8**/8 (18) | 7/**7**/7 (73) | 8/**8**/9 (20) |
| 2C | — | — | 10/**12**/12 (40) | 10/**11**/11 (51) |

Dealer filters (paste into the custom filter box; derived from the data):

- `1NT` → `hcp in 8..11`
- `2S` → `s >= 3 and top(s,5) >= 1 and hcp in 6..9`
- `2C` → `hcp in 9..16`
- `2H` → `h >= 4 and top(h,5) >= 1 and (hcp >= 11 or top(h,5) >= 2) and hcp in 8..12`
- `2D` → `hcp in 8..12`

### (1D) 1H (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♥ |
|---|---|---|---|---|---|---|---|---|
| 1NT | 18.1% | 83 | 11 | 9/10/**11**/11/11 | — | — | 16% | 1:17% 2:83% |
| P | 16.8% | 77 | 19 | 2/5/**7**/7/9 | — | — | 17% | 1:29% 2:62% 3:8% 4+:1% |
| 1S | 15.5% | 71 | 27 | 6/9/**10**/10/11 | 4:34% 5:51% 6:10% 7:4% 8+:1% | **5.9** (4.5–7.6) | 35% | 1:14% 2:73% 3:13% |
| 2H | 14.4% | 66 | 18 | 7/7/**7**/9/10 | 2:3% 3:83% 4:14% | **3.6** (1.6–4.2) | 92% | 2:3% 3:83% 4:14% |
| 2D | 14.2% | 65 | 19 | 8/10/**10**/11/14 | <3:2% 3:65% 4:20% 5:9% 6:5% | **2.3** (1.9–3.2) | 78% | <2:2% 2:15% 3:72% 4:11% |
| 2C | 13.3% | 61 | 11 | 7/9/**9**/9/14 | 2:5% 3:3% 4:2% 5:5% 6:85% | **3.1** (3.1–5.2) | 8% | 1:64% 2:26% 3:8% 4+:2% |

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
- `2H` → `h >= 3 and top(h,5) >= 1 and hcp in 7..10`
- `2D` → `hcp in 8..14`
- `2C` → `c >= 5 and top(c,5) >= 2 and hcp in 7..14`

### (1D) 1S (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♠ |
|---|---|---|---|---|---|---|---|---|
| P | 26.4% | 175 | 32 | 5/6/**6**/7/8 | — | — | 33% | <1:2% 1:58% 2:34% 3:6% |
| 2D | 22.0% | 146 | 30 | 10/10/**11**/12/16 | 0:11% 1:8% 2:54% 3:12% 4:14% 5+:1% | **2.3** (0.9–3.9) | 60% | 0:3% 1:5% 2:10% 3:73% 4:8% 5+:1% |
| 2H | 15.4% | 102 | 21 | 10/11/**11**/14/14 | 3:7% 4:7% 5:29% 6:19% 7:38% | **5.6** (5.6–6.3) | 9% | 0:19% 1:59% 2:9% 3:13% |
| 1NT | 12.7% | 84 | 29 | 6/8/**10**/10/11 | — | — | 25% | 0:2% 1:63% 2:35% |
| 2S | 8.6% | 57 | 16 | 5/7/**9**/10/10 | 3:93% 4:7% | **2.3** (1.5–3.2) | 96% | 3:93% 4:7% |
| 2C | 6.3% | 42 | 16 | 8/8/**10**/12/16 | 0:2% 2:5% 3:10% 4:5% 5:21% 6:57% | **4.1** (2.2–5.0) | 21% | 1:43% 2:21% 3:29% 4:7% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2D | fav | 98 | 10/10/**10**/12/16 |
| 2D | both | 27 | 9/10/**13**/14/16 |
| 2H | none | 56 | 11/11/**11**/12/12 |
| 2H | fav | 36 | 10/12/**14**/14/14 |
| 1NT | none | 27 | 9/10/**10**/10/10 |
| 1NT | unfav | 41 | 6/7/**10**/10/10 |
| 2S | fav | 26 | 7/10/**10**/10/10 |
| 2C | both | 25 | 8/8/**8**/10/14 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 2D | 11/**12**/12 (27) | 10/**10**/10 (79) | 11/**14**/14 (17) | 13/**16**/16 (23) |
| 2H | — | 12/**12**/12 (30) | 11/**11**/11 (43) | 14/**14**/14 (22) |

Dealer filters (paste into the custom filter box; derived from the data):

- `2D` → `hcp in 10..16`
- `2H` → `h >= 4 and top(h,5) >= 2 and ((hcp in 9..14 and d <= 2) or (hcp in 10..14 and d in 3..4))`
- `1NT` → `hcp in 6..11`
- `2S` → `s >= 3 and top(s,5) >= 1 and hcp in 5..10`

### (1H) 1S (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♠ |
|---|---|---|---|---|---|---|---|---|
| 2S | 42.8% | 95 | 12 | 4/7/**7**/9/9 | 3:88% 4:12% | **2.4** (1.7–2.4) | 93% | 3:88% 4:12% |
| P | 18.9% | 42 | 11 | 4/4/**5**/7/9 | — | — | 36% | 0:33% 1:17% 2:31% 3:19% |
| 1NT | 14.0% | 31 | 6 | 9/9/**9**/9/10 | — | — | 19% | 1:81% 2:19% |

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
| 3C | 32.0% | 70 | 10 | 7/7/**7**/9/10 | 2:6% 3:26% 4:66% 5:3% | **1.9** (1.9–3.0) | 90% | 2:6% 3:26% 4:66% 5:3% |
| P | 21.9% | 48 | 9 | 6/6/**8**/8/10 | — | — | 60% | 2:83% 3:10% 4:6% |
| 2NT | 16.9% | 37 | 5 | 8/10/**10**/10/10 | — | — | 19% | 2:68% 3:16% 5:16% |
| 2H | 14.6% | 32 | 3 | 7/8/**10**/10/10 | 5:100% | **2.2** (2.2–2.5) | 25% | 2:100% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 3C | fav | 48 | 7/7/**7**/7/10 |
| 2NT | fav | 31 | 10/10/**10**/10/10 |
| 2H | fav | 32 | 7/8/**10**/10/10 |

Dealer filters (paste into the custom filter box; derived from the data):

- `3C` → `c >= 3 and top(c,5) >= 1 and hcp in 7..10`

### (1S) 2H (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♥ |
|---|---|---|---|---|---|---|---|---|
| P | 45.5% | 125 | 19 | 4/7/**7**/8/10 | — | — | 79% | 1:10% 2:82% 3:8% |
| 2S | 17.1% | 47 | 8 | 9/10/**13**/13/15 | 2:17% 3:64% 4:11% 5:9% | **0.2** (0.2–3.7) | 81% | 2:66% 3:34% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2S | none | 30 | 10/13/**13**/13/13 |

### (1C) X (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 1H | 19.3% | 101 | 34 | 4/5/**8**/8/8 | 4:60% 5:37% 6:3% | **4.3** (3.3–5.2) | 67% |
| 1S | 13.4% | 70 | 26 | 4/5/**6**/8/10 | 4:44% 5:56% | **3.6** (1.5–4.3) | 61% |
| 2C | 11.5% | 60 | 15 | 8/10/**11**/14/14 | 1:3% 2:22% 3:68% 4:5% 5+:2% | **1.3** (0.2–3.0) | 68% |
| 1NT | 12.2% | 64 | 14 | 8/9/**10**/10/10 | — | — | 81% |
| 1D | 9.8% | 51 | 19 | 2/3/**6**/7/9 | 3:6% 4:73% 5:16% 6:6% | **2.7** (2.5–3.6) | 84% |
| 2H | 8.8% | 46 | 13 | 7/8/**8**/8/9 | 4:22% 5:76% 6:2% | **6.0** (4.9–6.0) | 43% |
| 2S | 7.5% | 39 | 17 | 4/9/**10**/10/11 | 4:46% 5:54% | **3.6** (1.5–3.6) | 77% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1H | none | 45 | 4/7/**8**/8/8 |
| 1H | unfav | 29 | 5/5/**6**/8/8 |
| 1S | none | 33 | 5/5/**7**/8/8 |
| 2C | none | 38 | 8/14/**14**/14/14 |
| 1NT | both | 36 | 8/8/**10**/10/10 |
| 1D | fav | 29 | 3/3/**5**/7/7 |
| 2H | unfav | 26 | 8/8/**8**/8/8 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 1H | — | 6/**8**/8 (63) | 5/**6**/8 (28) | — |

Dealer filters (paste into the custom filter box; derived from the data):

- `1H` → `h >= 4 and top(h,5) >= 1 and hcp in 4..8`
- `1S` → `s >= 4 and hcp in 4..10`
- `2C` → `hcp in 8..14`
- `1NT` → `hcp in 8..10` *(+ balanced)*
- `1D` → `d >= 4 and top(d,5) >= 1 and hcp in 2..9`

### (1D) X (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 1H | 29.9% | 135 | 28 | 4/6/**8**/9/10 | 3:12% 4:70% 5:18% | **3.7** (2.7–4.1) | 79% |
| 1S | 14.4% | 65 | 24 | 0/4/**5**/8/9 | 3:6% 4:49% 5:45% | **2.9** (1.3–4.0) | 68% |
| 1NT | 14.4% | 65 | 17 | 7/7/**10**/10/10 | — | — | 92% |
| 2H | 13.5% | 61 | 13 | 8/9/**10**/10/10 | 4:95% 5:5% | **2.7** (2.7–3.5) | 85% |
| 2D | 7.7% | 35 | 17 | 9/9/**9**/10/11 | 0:3% 1:51% 2:17% 3:11% 4:17% | **5.6** (2.9–5.6) | 34% |
| 2S | 6.2% | 28 | 16 | 5/7/**9**/9/11 | 4:29% 5:71% | **3.6** (1.6–5.9) | 61% |

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
| 1H | — | — | 4/**6**/7 (27) | 8/**8**/9 (97) |

Dealer filters (paste into the custom filter box; derived from the data):

- `1H` → `h >= 3 and top(h,5) >= 1 and hcp in 4..10`
- `1S` → `s >= 4 and hcp in 0..9`
- `1NT` → `hcp in 7..10` *(+ balanced)*
- `2H` → `h >= 4 and top(h,5) >= 1 and hcp in 8..10`

### (1H) X (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 1S | 36.0% | 141 | 23 | 4/4/**5**/7/9 | 3:4% 4:84% 5:12% | **1.7** (1.7–3.0) | 74% |
| 1NT | 26.5% | 104 | 12 | 6/8/**9**/10/10 | — | — | 56% |
| 2C | 12.0% | 47 | 9 | 2/5/**5**/8/11 | 3:11% 4:60% 5:30% | **3.2** (1.0–3.8) | 47% |
| 2S | 6.9% | 27 | 11 | 7/7/**8**/9/10 | 4:59% 5:41% | **1.9** (1.5–2.2) | 74% |

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
| 2H | 24.9% | 64 | 11 | 7/9/**9**/9/10 | 4:84% 5:16% | **4.7** (3.0–4.7) | 88% |
| 1NT | 21.8% | 56 | 13 | 7/7/**8**/8/10 | — | — | 98% |
| 3H | 14.0% | 36 | 11 | 6/9/**10**/10/11 | 4:72% 5:22% 6:3% 7:3% | **3.5** (3.0–4.7) | 33% |
| 2D | 12.5% | 32 | 10 | 3/4/**5**/7/7 | 4:16% 5:84% | **4.4** (2.2–4.6) | 47% |

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
| P | 29.2% | 49 | 15 | 0/0/**1**/5/7 | — | — | 71% |
| 2S | 14.9% | 25 | 13 | 5/6/**7**/8/9 | 4:84% 5:16% | **3.5** (3.3–4.6) | 80% |

### (1S) X (2S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 24.6% | 43 | 15 | 2/2/**4**/5/10 | — | — | 63% |
| 3H | 22.9% | 40 | 11 | 5/9/**10**/10/10 | 4:28% 5:65% 6:5% 7:3% | **4.9** (3.0–5.3) | 45% |
| 4H | 18.3% | 32 | 8 | 6/9/**10**/10/10 | 4:3% 5:91% 6:3% 7:3% | **4.9** (4.8–5.3) | 34% |

## Uncontested responses: 1x (P) ?

Partner opened (natural style), RHO passed. Responder ranges. The 1C row shows STANDARD responders; transfer-walsh pairs (1D = ♥, 1H = ♠, 1S = no-major NT-ish) are tabulated separately below.

### 1C (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 1H | 33.0% | 2073 | 720 | 5/7/**10**/12/15 | 4:61% 5:26% 6:9% 7:3% | **3.8** (2.7–4.9) | 52% |
| 1D | 24.4% | 1537 | 741 | 3/5/**9**/13/17 | <2:3% 2:6% 3:12% 4:28% 5:29% 6:16% 7:6% | **4.1** (2.3–5.4) | 56% |
| 1S | 28.3% | 1777 | 583 | 5/8/**10**/12/16 | 4:48% 5:38% 6:10% 7+:3% | **3.8** (2.9–5.1) | 49% |
| 1NT | 4.8% | 299 | 241 | 7/8/**10**/10/15 | — | — | 95% |
| 2C | 2.8% | 173 | 158 | 8/12/**15**/15/20 | <2:2% 2:5% 3:5% 4:23% 5:36% 6:27% 7:2% | **5.5** (4.0–7.6) | 60% |
| 2D | 1.3% | 84 | 135 | 5/9/**13**/16/19 | 1:6% 2:5% 3:11% 5:29% 6:40% 7:10% | **5.1** (3.9–5.7) | 21% |
| P | 1.9% | 118 | 63 | 2/2/**4**/4/5 | — | — | 74% |
| 2H | 1.0% | 63 | 85 | 6/8/**12**/15/15 | 2:22% 3:30% 4:16% 5:5% 6:16% 7:11% | **4.6** (2.4–5.5) | 46% |
| 2NT | 0.6% | 35 | 60 | 10/11/**12**/14/15 | — | — | 91% |
| 2S | 0.7% | 44 | 53 | 4/10/**11**/12/17 | 2:11% 3:32% 5:14% 6:23% 7:9% 8:11% | **4.4** (2.4–5.0) | 36% |
| 3NT | 0.5% | 31 | 22 | 12/12/**14**/15/15 | — | — | 100% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1H | none | 410 | 6/8/**10**/14/15 |
| 1H | fav | 738 | 6/7/**9**/11/15 |
| 1H | unfav | 300 | 6/9/**10**/12/14 |
| 1H | both | 625 | 4/7/**10**/13/16 |
| 1D | none | 377 | 3/5/**7**/13/17 |
| 1D | fav | 441 | 2/5/**11**/13/17 |
| 1D | unfav | 275 | 4/6/**12**/15/19 |
| 1D | both | 444 | 3/6/**9**/12/16 |
| 1S | none | 415 | 6/8/**10**/12/14 |
| 1S | fav | 635 | 4/8/**10**/12/18 |
| 1S | unfav | 316 | 4/8/**10**/11/16 |
| 1S | both | 411 | 6/9/**10**/12/16 |
| 1NT | none | 136 | 7/9/**10**/10/11 |
| 1NT | fav | 30 | 7/9/**9**/11/18 |
| 1NT | unfav | 46 | 8/8/**8**/10/19 |
| 1NT | both | 87 | 8/8/**10**/10/15 |
| 2C | none | 27 | 7/9/**13**/14/21 |
| 2C | fav | 44 | 7/13/**14**/15/18 |
| 2C | unfav | 76 | 12/15/**15**/15/20 |
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
| 1S | 37.9% | 3791 | 405 | 5/8/**10**/12/15 | 4:45% 5:42% 6:9% 7+:2% | **4.0** (2.4–5.1) | 53% |
| 1H | 36.5% | 3648 | 515 | 5/7/**9**/11/15 | <4:2% 4:56% 5:31% 6:7% 7:4% | **3.6** (2.2–4.7) | 45% |
| 1NT | 6.3% | 628 | 145 | 5/8/**8**/9/13 | — | — | 69% |
| 2C | 5.8% | 577 | 117 | 10/11/**13**/15/19 | <3:2% 3:7% 4:15% 5:27% 6:38% 7:10% | **5.5** (3.8–6.3) | 39% |
| P | 4.5% | 451 | 82 | 0/3/**4**/4/5 | — | — | 75% |
| 2D | 3.7% | 366 | 102 | 7/10/**14**/15/17 | <3:2% 3:3% 4:60% 5:28% 6:7% | **4.7** (3.7–6.9) | 79% |
| 2H | 1.1% | 109 | 46 | 4/6/**6**/9/12 | 2:5% 3:3% 4:17% 5:27% 6:39% 7:8% 8+:2% | **3.8** (2.7–4.5) | 7% |
| 2NT | 0.9% | 91 | 48 | 6/11/**12**/13/15 | — | — | 92% |
| 2S | 0.8% | 83 | 45 | 5/8/**9**/10/12 | 1:5% 2:8% 3:27% 4:2% 5:11% 6:30% 7:17% | **3.4** (1.9–4.3) | 12% |
| 3C | 0.7% | 70 | 26 | 8/9/**9**/10/15 | 2:6% 3:17% 4:9% 5:9% 6:7% 7:53% | **5.8** (3.7–8.4) | 24% |
| 3NT | 0.6% | 60 | 19 | 10/12/**14**/15/15 | — | — | 95% |
| 3D | 0.6% | 60 | 26 | 3/5/**8**/9/10 | 4:45% 5:25% 6:30% | **3.2** (2.3–4.1) | 40% |
| 4H | 0.3% | 32 | 9 | 8/8/**8**/10/11 | 2:6% 7:88% 8:6% | **4.4** (4.4–5.1) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1S | none | 1155 | 5/7/**10**/12/14 |
| 1S | fav | 1014 | 5/8/**9**/11/15 |
| 1S | unfav | 765 | 5/7/**9**/11/16 |
| 1S | both | 857 | 6/8/**10**/12/14 |
| 1H | none | 516 | 5/7/**8**/10/15 |
| 1H | fav | 1196 | 5/7/**9**/12/17 |
| 1H | unfav | 741 | 5/7/**8**/11/13 |
| 1H | both | 1195 | 4/7/**9**/12/15 |
| 1NT | none | 118 | 5/6/**9**/10/10 |
| 1NT | fav | 182 | 5/7/**8**/9/14 |
| 1NT | unfav | 114 | 6/8/**9**/9/13 |
| 1NT | both | 214 | 6/8/**8**/9/12 |
| 2C | none | 150 | 9/13/**15**/19/19 |
| 2C | fav | 194 | 10/10/**14**/14/18 |
| 2C | unfav | 113 | 8/11/**12**/15/17 |
| 2C | both | 120 | 9/11/**12**/12/16 |
| 2D | none | 46 | 7/12/**15**/15/15 |
| 2D | fav | 184 | 8/10/**14**/15/18 |
| 2D | unfav | 118 | 8/11/**15**/17/17 |
| 2H | fav | 36 | 6/6/**6**/8/15 |
| 2H | unfav | 26 | 6/7/**8**/9/11 |
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
| 1S | 34.5% | 2232 | 286 | 5/7/**10**/12/17 | <4:1% 4:41% 5:45% 6:10% 7:3% | **3.8** (2.6–5.2) | 38% |
| 2C | 15.4% | 1000 | 184 | 9/11/**13**/15/18 | 1:4% 2:14% 3:24% 4:24% 5:22% 6:10% 7+:3% | **4.2** (2.7–5.7) | 67% |
| 1NT | 12.3% | 797 | 206 | 4/7/**9**/10/12 | — | — | 44% |
| 2H | 11.2% | 725 | 89 | 5/7/**8**/9/10 | 3:91% 4:9% | **1.7** (0.4–4.1) | 94% |
| 2NT | 6.9% | 449 | 95 | 8/10/**12**/14/15 | — | — | 61% |
| 2D | 6.4% | 413 | 96 | 9/11/**13**/13/17 | <3:2% 3:5% 4:8% 5:49% 6:37% | **5.0** (4.0–6.5) | 39% |
| P | 4.9% | 317 | 51 | 0/2/**2**/4/5 | — | — | 62% |
| 3C | 1.9% | 121 | 51 | 6/8/**10**/11/12 | 1:17% 2:21% 3:23% 4:29% 5:5% 6:2% 7:2% | **3.4** (1.5–4.2) | 59% |
| 2S | 1.8% | 115 | 58 | 3/6/**8**/11/13 | 2:4% 3:22% 4:14% 5:13% 6:36% 7:10% | **4.3** (3.6–5.1) | 25% |
| 3D | 1.7% | 111 | 50 | 7/9/**10**/11/12 | 1:11% 2:37% 3:19% 4:16% 5:5% 6:13% | **3.2** (2.0–5.4) | 53% |
| 3H | 1.3% | 83 | 31 | 2/2/**6**/9/10 | 3:7% 4:92% 5+:1% | **1.5** (1.5–3.8) | 35% |
| 4H | 0.5% | 33 | 34 | 6/7/**8**/9/13 | 3:12% 4:45% 5:12% 6:30% | **4.3** (2.3–4.6) | 15% |
| 3NT | 0.4% | 27 | 21 | 10/11/**13**/13/14 | — | — | 85% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1S | none | 373 | 6/10/**11**/13/16 |
| 1S | fav | 753 | 6/7/**9**/10/14 |
| 1S | unfav | 429 | 5/8/**12**/16/18 |
| 1S | both | 677 | 3/6/**9**/11/13 |
| 2C | none | 157 | 8/12/**13**/16/18 |
| 2C | fav | 254 | 8/10/**13**/14/18 |
| 2C | unfav | 339 | 9/11/**13**/14/16 |
| 2C | both | 250 | 9/13/**15**/16/17 |
| 1NT | none | 148 | 2/6/**8**/10/14 |
| 1NT | fav | 298 | 4/5/**9**/10/11 |
| 1NT | unfav | 203 | 6/8/**9**/11/13 |
| 1NT | both | 148 | 6/8/**9**/10/12 |
| 2H | none | 302 | 6/7/**9**/9/9 |
| 2H | fav | 108 | 5/6/**7**/9/10 |
| 2H | unfav | 176 | 5/8/**8**/8/9 |
| 2H | both | 139 | 7/7/**7**/9/10 |
| 2NT | none | 108 | 10/13/**13**/14/17 |
| 2NT | fav | 163 | 7/10/**12**/13/14 |
| 2NT | unfav | 109 | 9/11/**13**/15/15 |
| 2NT | both | 69 | 8/10/**10**/10/14 |
| 2D | none | 30 | 6/10/**13**/17/18 |
| 2D | fav | 42 | 7/9/**10**/11/15 |
| 2D | unfav | 118 | 9/13/**13**/13/14 |
| 2D | both | 223 | 10/11/**13**/14/17 |

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
| 1NT | 30.7% | 2557 | 363 | 4/7/**8**/9/11 | — | — | 30% |
| 2C | 21.0% | 1747 | 260 | 9/11/**13**/15/17 | <2:2% 2:14% 3:17% 4:40% 5:11% 6:11% 7:5% | **4.5** (2.9–6.0) | 66% |
| 2S | 9.6% | 800 | 130 | 4/6/**8**/9/10 | 3:91% 4:9% | **1.6** (0.9–4.3) | 80% |
| 2D | 8.5% | 710 | 129 | 9/13/**14**/15/18 | 2:3% 3:4% 4:8% 5:50% 6:33% 7+:2% | **4.8** (3.9–6.5) | 24% |
| 2NT | 7.4% | 620 | 130 | 8/10/**12**/14/15 | — | — | 51% |
| 2H | 6.7% | 561 | 122 | 10/11/**13**/15/17 | <5:4% 5:55% 6:36% 7:2% 8:3% | **5.7** (4.1–6.0) | 21% |
| P | 4.8% | 396 | 80 | 1/3/**4**/4/5 | — | — | 41% |
| 4S | 1.9% | 161 | 51 | 0/5/**6**/8/9 | <4:1% 4:22% 5:48% 6:29% | **3.0** (1.7–4.5) | 2% |
| 3C | 2.4% | 201 | 91 | 6/8/**10**/10/13 | 1:18% 2:20% 3:19% 4:17% 5:2% 6:20% 7+:2% | **3.0** (0.9–5.3) | 38% |
| 3D | 2.1% | 176 | 74 | 6/8/**9**/10/12 | 1:10% 2:22% 3:23% 4:14% 5:19% 6:2% 7:10% | **3.6** (1.5–4.7) | 41% |
| 3S | 1.2% | 102 | 48 | 0/5/**6**/8/10 | 3:6% 4:74% 5:21% | **2.5** (1.7–3.2) | 32% |
| 4C | 1.0% | 84 | 16 | 9/10/**12**/12/14 | 0:7% 1:89% 2:2% 3+:1% | **0.4** (0.0–0.9) | 0% |
| 3NT | 1.0% | 86 | 32 | 6/9/**10**/12/14 | — | — | 31% |
| 3H | 0.9% | 78 | 44 | 6/8/**10**/11/13 | 1:8% 2:14% 3:15% 4:28% 5:5% 6:29% | **4.5** (2.7–5.4) | 36% |
| 4D | 0.4% | 35 | 9 | 8/9/**10**/12/13 | 0:9% 1:89% 4:3% | **0.4** (0.0–0.4) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1NT | none | 414 | 4/7/**8**/9/11 |
| 1NT | fav | 725 | 4/6/**7**/8/11 |
| 1NT | unfav | 608 | 4/7/**9**/10/11 |
| 1NT | both | 810 | 6/7/**8**/9/11 |
| 2C | none | 293 | 9/12/**13**/14/15 |
| 2C | fav | 475 | 9/11/**13**/14/20 |
| 2C | unfav | 411 | 10/13/**13**/16/17 |
| 2C | both | 568 | 9/11/**11**/14/17 |
| 2S | none | 141 | 4/8/**10**/10/10 |
| 2S | fav | 252 | 4/6/**7**/9/9 |
| 2S | unfav | 126 | 4/7/**8**/9/9 |
| 2S | both | 281 | 6/7/**8**/9/10 |
| 2D | none | 104 | 10/13/**15**/15/15 |
| 2D | fav | 323 | 8/13/**14**/14/17 |
| 2D | unfav | 95 | 10/13/**13**/14/17 |
| 2D | both | 188 | 9/11/**14**/17/18 |
| 2NT | none | 131 | 9/11/**12**/14/14 |
| 2NT | fav | 268 | 8/9/**12**/14/15 |
| 2NT | unfav | 52 | 7/10/**12**/13/13 |
| 2NT | both | 169 | 9/10/**11**/12/15 |
| 2H | none | 119 | 10/12/**13**/17/17 |
| 2H | fav | 160 | 9/11/**13**/14/14 |
| 2H | unfav | 232 | 11/12/**12**/16/18 |
| 2H | both | 50 | 8/10/**14**/14/17 |

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
| 2C | 28.3% | 2961 | 562 | 6/8/**9**/11/14 | <1:1% 1:13% 2:28% 3:29% 4:21% 5:5% 6:3% | **2.8** (0.9–4.5) | 47% |
| P | 20.5% | 2142 | 378 | 3/4/**6**/7/8 | — | — | 74% |
| 2H | 13.4% | 1407 | 254 | 3/6/**9**/13/16 | 0:4% 1:11% 2:36% 3:41% 4:3% 5:3% | **1.9** (0.2–3.9) | 40% |
| 2D | 12.7% | 1325 | 248 | 3/5/**7**/10/16 | 1:22% 2:25% 3:31% 4:15% 5:6% | **1.9** (0.7–3.6) | 27% |
| 3NT | 9.1% | 956 | 187 | 8/10/**10**/12/14 | — | — | 76% |
| 2NT | 3.6% | 373 | 182 | 5/9/**11**/12/16 | — | — | 54% |
| 3C | 3.6% | 381 | 158 | 7/10/**11**/12/16 | <1:2% 1:12% 2:28% 3:20% 4:21% 5:10% 6:7% | **3.8** (1.8–5.4) | 62% |
| 2S | 2.5% | 259 | 130 | 6/9/**10**/12/21 | 1:27% 2:11% 3:54% 4:5% 5:2% | **3.0** (0.4–5.4) | 36% |
| 4D | 1.8% | 191 | 55 | 7/8/**9**/10/15 | <1:2% 1:17% 2:32% 3:43% 4:4% 5:2% | **1.5** (0.9–4.2) | 1% |
| 4H | 1.2% | 122 | 39 | 7/9/**9**/9/17 | 0:2% 1:6% 2:34% 3:54% 4:2% 6:2% | **2.4** (1.3–3.5) | 1% |
| 4C | 0.9% | 99 | 27 | 7/8/**9**/10/19 | 1:31% 2:22% 3:40% 4:1% 5:5% | **3.8** (0.0–4.7) | 1% |
| 3S | 0.7% | 72 | 33 | 9/10/**10**/11/16 | 1:81% 2:1% 3:10% 4:6% 5+:3% | **0.0** (0.0–3.9) | 7% |
| 3D | 0.6% | 68 | 49 | 6/8/**11**/12/16 | 1:32% 2:16% 3:10% 4:10% 5:18% 6:13% | **3.1** (0.0–4.2) | 22% |
| 3H | 0.4% | 44 | 22 | 8/11/**12**/21/21 | 1:77% 2:14% 3:9% | **5.6** (3.9–10.0) | 7% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2C | none | 730 | 6/8/**9**/10/14 |
| 2C | fav | 845 | 3/8/**10**/13/16 |
| 2C | unfav | 653 | 6/8/**10**/11/14 |
| 2C | both | 733 | 6/7/**9**/10/14 |
| 2H | none | 409 | 3/7/**9**/13/14 |
| 2H | fav | 506 | 4/6/**10**/12/15 |
| 2H | unfav | 229 | 3/9/**12**/17/17 |
| 2H | both | 263 | 1/5/**6**/9/12 |
| 2D | none | 435 | 3/5/**7**/9/17 |
| 2D | fav | 309 | 3/7/**8**/12/16 |
| 2D | unfav | 225 | 2/5/**6**/10/12 |
| 2D | both | 356 | 4/6/**7**/10/14 |
| 3NT | none | 389 | 9/10/**10**/12/15 |
| 3NT | fav | 292 | 8/10/**10**/12/14 |
| 3NT | unfav | 152 | 8/10/**11**/12/13 |
| 3NT | both | 123 | 8/9/**11**/11/15 |
| 2NT | none | 98 | 5/9/**11**/14/16 |
| 2NT | fav | 128 | 8/10/**11**/13/16 |
| 2NT | unfav | 57 | 8/9/**11**/11/15 |
| 2NT | both | 90 | 2/7/**9**/10/12 |
| 3C | none | 107 | 9/10/**12**/14/16 |
| 3C | fav | 132 | 8/10/**11**/13/17 |
| 3C | unfav | 60 | 9/10/**11**/12/15 |
| 3C | both | 82 | 2/8/**10**/11/14 |

Dealer filters (paste into the custom filter box; derived from the data):

- `2C` → `((hcp in 6..11 and h >= 4) or (hcp in 6..11 and s >= 4))`
- `2H` → `(hcp in 3..16 and s >= 4)`
- `2D` → `(hcp in 3..16 and h >= 4)`
- `3NT` → `hcp in 8..14`
- `2NT` → `hcp in 5..16`
- `3C` → `((hcp in 7..11 and h >= 4) or (hcp in 7..16 and s >= 4) or (hcp in 7..16 and s <= 3 and h <= 3))`

## Transfer responses to 1C: 1C (P) ? by transfer-walsh pairs

Detected per partnership from the hands (4+ of the next suit in essentially every 1D/1H response). The derived rules key on the suit actually shown: 1D = hearts, 1H = spades. The field’s 1S is multi-way — see the decision matrices below for its components.

### 1C (P) ? — transfer responders

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 1H | 34.2% | 1033 | 720 | 4/7/**10**/11/15 | 0:2% 1:9% 2:27% 3:50% 4:10% 5:3% | **3.0** (1.0–4.5) | 49% |
| 1D | 34.7% | 1050 | 741 | 5/7/**9**/12/15 | 1:9% 2:25% 3:26% 4:28% 5:9% 6:3% | **2.9** (1.5–4.9) | 52% |
| 1S | 16.0% | 483 | 583 | 5/8/**10**/13/17 | 0:2% 1:4% 2:24% 3:62% 4:4% 5:3% 6+:1% | **3.2** (1.5–4.3) | 64% |
| 1NT | 4.0% | 120 | 241 | 8/10/**11**/14/18 | — | — | 88% |
| 2C | 3.5% | 106 | 158 | 8/12/**13**/15/20 | 0:4% 1:11% 2:20% 3:9% 4:6% 5:25% 6:24% | **4.3** (2.5–6.3) | 31% |
| 2D | 1.8% | 54 | 135 | 4/9/**13**/15/19 | <2:2% 2:24% 3:26% 4:6% 5:26% 6:7% 7:9% | **4.8** (3.3–5.6) | 24% |
| P | 2.3% | 70 | 63 | 1/2/**4**/4/5 | — | — | 76% |
| 2H | 1.1% | 33 | 85 | 4/6/**8**/11/15 | 0:6% 1:6% 2:24% 3:15% 4:18% 5:12% 6:15% 7:3% | **2.2** (0.5–3.5) | 3% |
| 2NT | 0.8% | 25 | 60 | 12/13/**14**/15/16 | — | — | 88% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1H | none | 253 | 5/7/**10**/12/14 |
| 1H | fav | 335 | 3/7/**9**/11/17 |
| 1H | unfav | 198 | 5/7/**9**/11/14 |
| 1H | both | 247 | 6/8/**10**/12/16 |
| 1D | none | 202 | 5/8/**9**/13/15 |
| 1D | fav | 371 | 5/7/**9**/11/16 |
| 1D | unfav | 155 | 5/8/**10**/12/15 |
| 1D | both | 322 | 4/7/**10**/12/15 |
| 1S | none | 132 | 5/7/**10**/13/17 |
| 1S | fav | 137 | 4/8/**11**/13/17 |
| 1S | unfav | 95 | 5/8/**11**/15/19 |
| 1S | both | 119 | 4/8/**9**/12/16 |
| 1NT | none | 32 | 8/10/**11**/12/14 |
| 1NT | fav | 36 | 6/10/**13**/15/18 |
| 1NT | both | 28 | 8/10/**10**/11/16 |
| 2C | fav | 33 | 6/11/**13**/14/17 |
| 2C | unfav | 36 | 10/13/**15**/15/20 |

Dealer filters (paste into the custom filter box; derived from the data):

- `1H` → `(hcp in 4..15 and s >= 4)`
- `1D` → `(hcp in 5..15 and h >= 4)`
- `1S` → `(hcp in 5..17 and s <= 3 and h <= 3)`
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
| ≤4 HCP | 441 | 14% | 17% | 44% | · | · | 22% | 1% | 2% |
| 5–11 · 4♥ only | 1088 | 88% | · | 9% | · | · | 1% | · | 1% |
| 5–11 · 4♠ only | 1187 | · | 84% | 14% | · | · | · | 1% | 1% |
| 5–11 · 4-4+ majors | 618 | 62% | 27% | 7% | · | · | · | · | 3% |
| 5–11 · no 4M | 840 | · | · | 55% | 31% | 2% | 1% | 2% | 8% |
| 12+ · 4♥ only | 660 | 66% | · | 29% | · | 1% | · | 2% | 2% |
| 12+ · 4♠ only | 575 | · | 83% | 10% | 1% | 1% | · | 1% | 3% |
| 12+ · 4-4+ majors | 305 | 75% | 17% | 3% | 2% | 3% | · | · | · |
| 12+ · no 4M bal | 426 | · | · | 54% | 3% | 19% | · | 4% | 19% |
| 12+ · no 4M unbal | 149 | · | 1% | 55% | · | 30% | · | 11% | 2% |

### 1C (X) ? — standard responders

| hand type | n | P | 1D | 1S | 1H | XX | 2C | 2D | other |
|---|---|---|---|---|---|---|---|---|---|
| ≤4 HCP | 285 | 78% | 8% | 4% | 3% | · | 1% | 1% | 5% |
| 5–11 · 4♥ only | 203 | 15% | 28% | 1% | 39% | 4% | 1% | 5% | 6% |
| 5–11 · 4♠ only | 245 | 11% | 7% | 44% | 18% | 13% | · | · | 6% |
| 5–11 · 4-4+ majors | 62 | 10% | 10% | 26% | 47% | 6% | 2% | · | · |
| 5–11 · no 4M | 223 | 22% | 29% | 13% | · | 7% | 11% | 4% | 13% |

### 1C (1D) ? — standard responders

| hand type | n | 1H | X | 1S | P | 3C | 2C | 2D | other |
|---|---|---|---|---|---|---|---|---|---|
| ≤4 HCP | 107 | 9% | 7% | 3% | 62% | 2% | 1% | 6% | 11% |
| 5–11 · 4♥ only | 168 | 45% | 40% | · | 7% | · | · | 5% | 4% |
| 5–11 · 4♠ only | 168 | 29% | 4% | 42% | 8% | · | · | 1% | 17% |
| 5–11 · 4-4+ majors | 169 | 15% | 47% | 20% | 3% | · | 11% | 1% | 3% |
| 5–11 · no 4M | 199 | · | · | 13% | 14% | 36% | 25% | 3% | 10% |
| 12+ · 4♠ only | 41 | 41% | 12% | 41% | · | · | · | · | 5% |

### 1C (P) ? — transfer-walsh responders

| hand type | n | 1D | 1H | 1S | 1NT | 2C | P | 2D | other |
|---|---|---|---|---|---|---|---|---|---|
| ≤4 HCP | 203 | 25% | 28% | 12% | · | · | 29% | 1% | 3% |
| 5–11 · 4♥ only | 477 | 94% | 2% | 1% | · | · | · | 2% | 1% |
| 5–11 · 4♠ only | 659 | 2% | 93% | 2% | · | 1% | · | · | 2% |
| 5–11 · 4-4+ majors | 336 | 66% | 28% | · | · | 1% | · | 1% | 3% |
| 5–11 · no 4M | 349 | 3% | 1% | 70% | 16% | 3% | 2% | 1% | 5% |
| 12+ · 4♥ only | 304 | 63% | 2% | 18% | 3% | 8% | · | 4% | 2% |
| 12+ · 4♠ only | 293 | 2% | 77% | 8% | 6% | 1% | · | 1% | 5% |
| 12+ · 4-4+ majors | 138 | 73% | 18% | · | 5% | 1% | · | 1% | 2% |
| 12+ · no 4M bal | 189 | 4% | · | 49% | 14% | 14% | · | 6% | 13% |
| 12+ · no 4M unbal | 75 | 3% | · | 36% | 3% | 41% | · | 13% | 4% |

### 1C (X) ? — transfer-walsh responders

| hand type | n | P | 1H | 1D | 1S | XX | 2H | 2S | other |
|---|---|---|---|---|---|---|---|---|---|
| ≤4 HCP | 131 | 70% | 8% | 7% | 3% | 2% | 5% | 5% | 1% |
| 5–11 · 4♥ only | 87 | 18% | 2% | 57% | 1% | 7% | 2% | · | 11% |
| 5–11 · 4♠ only | 102 | 16% | 61% | · | 5% | 13% | 3% | 1% | 2% |
| 5–11 · 4-4+ majors | 27 | 7% | 44% | 30% | 4% | 4% | 7% | · | 4% |
| 5–11 · no 4M | 81 | 17% | · | 2% | 51% | 11% | · | 1% | 17% |

### 1C (1D) ? — transfer-walsh responders

| hand type | n | X | 1H | P | 1S | 2C | 3C | 2H | other |
|---|---|---|---|---|---|---|---|---|---|
| ≤4 HCP | 38 | 18% | · | 63% | 3% | 3% | · | 5% | 8% |
| 5–11 · 4♥ only | 80 | 79% | 5% | 3% | 1% | · | · | 1% | 11% |
| 5–11 · 4♠ only | 85 | 2% | 67% | 9% | 7% | · | · | 9% | 5% |
| 5–11 · 4-4+ majors | 81 | 51% | 26% | · | 12% | 7% | · | · | 4% |
| 5–11 · no 4M | 73 | 1% | · | 16% | 27% | 21% | 19% | · | 15% |

## Book vs field

"Book" is the SAYC/2-over-1 teaching range (ACBL SAYC card/booklet). "Field" is
this dataset: p5–p95 (median). The field is systematically lighter than the book
at the bottom of ranges, and vulnerability is the biggest modifier for preempts.

| context | book | field |
|---|---|---|
| 1M opening (seats 1–2) | 12–21 (light 11s common in practice) | 10–17 (med 13), n=18518 |
| 1NT opening (strong-NT pairs) | 15–17 | 14–17 (med 15), n=13134 |
| 2NT opening | 20–21 | 19–21 (med 20), n=1993 |
| weak 2S (seats 1–3) | 5–11, 6-card suit | 5–11 (med 8), n=1986 |
| 1-level overcall (1C) 1H | 8–16 (down to ~8) | 7–16 (med 11), n=2220 |
| 2-level overcall (1S) 2H | 10–17ish, good suit | 10–15 (med 12), n=921 |
| 1NT overcall (1H) 1NT | 15–18 | 14–17 (med 15), n=380 |
| takeout double (1S) X | opening values (12+) or shape | 11–19 (med 13), n=1070 |
| weak jump overcall (1C) 2H | ~6–10, 6-card suit | 4–12 (med 8), n=387 |
| Michaels (1H) 2H | 8–12 or 16+, 5-5 | 8–14 (med 12), n=386 |
| unusual 2NT (1S) 2NT | weak or 17+, 5-5 minors | 7–21 (med 11), n=111 |
| negative double 1S (2H) X | 7+ (level-adjusted) | 7–15 (med 10), n=87 |
| new suit response 1C (P) 1H (std responders) | 6+ | 5–15 (med 10), n=2073 |

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
  "n": 1522,
  "hcp": {
    "mean": 14.07,
    "sd": 2.84,
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
      "n": 638,
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
      "n": 381,
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
      "n": 473,
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

