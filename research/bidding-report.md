# What championship players actually hold for every bid

Empirical hand ranges for every call — opening, overcall, double, response through
the four level — from every auction in recent World, European and US team
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

Generated from the championship scrape — re-run `npm run research:bidding`.

## Data

- 555232 table results scanned; 166692 carry an auction; 166563 auctions
  replay as legal sequences consistent with the recorded contract, doubling
  state, and declarer (the rest are site glitches, e.g. card tokens inside
  the bidding tooltip).
- Rejected: calls-after-end 76, contract-mismatch 44, double-mismatch 5, no-bid 3, insufficient 1.
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
| soloway2016/KO | 1363 |
| soloway2017/KO | 1359 |
| herning25/FF | 1310 |
| marrakech23/FF | 1271 |
| soloway2018/KO | 1181 |
| soloway2015/KO | 1156 |
| soloway2022/QF | 1084 |
| prague26tn/16 | 868 |
| strasbourg23tn/16 | 839 |
| vanderbilt2023/QF | 712 |
| spingold2015/KO | 706 |
| usbc26/QF | 682 |
| spingold2023/QF | 594 |
| spingold2017/16 | 535 |
| vanderbilt25/16 | 530 |
| soloway25/KO | 528 |
| herning25tn/16 | 512 |
| soloway2015/FF | 509 |
| vanderbilt2024/16 | 484 |
| soloway2019/SF | 480 |
| vanderbilt2024/QF | 480 |
| vanderbilt25/QF | 478 |
| spingold2017/QF | 477 |
| spingold2019/16 | 476 |
| vanderbilt2018/16 | 476 |
| vanderbilt2018/32 | 475 |
| spingold2016/QF | 474 |
| spingold2017/32 | 471 |
| spingold2024/32 | 469 |
| vanderbilt2015/KO | 467 |
| spingold2024/QF | 466 |
| spingold25/QF | 466 |
| vanderbilt2019/32 | 450 |
| vanderbilt2022/QF | 449 |
| spingold2019/QF | 448 |
| strasbourg23tn/QF | 448 |
| vanderbilt2019/QF | 448 |
| prague26tn/QF | 447 |
| spingold2018/QF | 447 |
| vanderbilt2017/QF | 446 |
| soloway2024/16 | 443 |
| spingold2022/QF | 441 |
| spingold2019/32 | 440 |
| vanderbilt2016/32 | 434 |
| soloway2023/16 | 428 |
| vanderbilt2019/16 | 420 |
| spingold2016/16 | 419 |
| vanderbilt2016/QF | 419 |
| vanderbilt2017/16 | 417 |
| vanderbilt2016/16 | 415 |
| spingold2018/16 | 413 |
| vanderbilt2018/QF | 411 |
| soloway2024/32 | 398 |
| soloway2023/QF | 373 |
| soloway2024/QF | 366 |
| spingold2018/32 | 358 |
| vanderbilt2022/16 | 358 |
| spingold2022/16 | 356 |
| spingold25/KO | 345 |
| spingold2023/FF | 328 |
| vanderbilt2024/32 | 328 |
| soloway2019/QF | 327 |
| spingold2024/16 | 327 |
| vanderbilt2017/32 | 327 |
| spingold2018/KO | 324 |
| soloway2019/16 | 321 |
| usbc26/SF | 320 |
| soloway2018/FF | 300 |
| soloway2023/KO | 285 |
| spingold2015/16 | 278 |
| spingold25/16 | 270 |
| spingold2024/KO | 269 |
| soloway2016/FF | 266 |
| soloway2022/SF | 266 |
| spingold2022/32 | 259 |
| herning25tn/QF | 256 |
| soloway2019/KO | 254 |
| soloway2024/SF | 240 |
| vanderbilt2017/SF | 240 |
| vanderbilt2022/SF | 240 |
| vanderbilt2023/SF | 240 |
| vanderbilt25/SF | 240 |
| spingold2016/SF | 239 |
| vanderbilt2019/KO | 239 |
| vanderbilt2024/SF | 238 |
| spingold2016/32 | 237 |
| spingold25/32 | 237 |
| vanderbilt2022/32 | 237 |
| spingold2018/SF | 236 |
| vanderbilt2018/SF | 236 |
| spingold25/SF | 235 |
| soloway2023/SF | 234 |
| spingold2019/SF | 234 |
| spingold2024/SF | 231 |
| vanderbilt2015/16 | 225 |
| prague26tn/SF | 224 |
| herning25tn/SF | 222 |
| strasbourg23tn/SF | 222 |
| spingold2022/SF | 213 |
| soloway2019/FF | 209 |
| spingold2017/SF | 209 |
| vanderbilt2016/SF | 209 |
| soloway2023/32 | 201 |
| herning25tn/FF | 195 |
| soloway2022/KO | 193 |
| soloway2019/32 | 179 |
| vanderbilt2019/SF | 178 |
| usbc26/FF | 174 |
| vanderbilt25/FF | 158 |
| spingold2019/KO | 154 |
| soloway2022/FF | 152 |
| vanderbilt2018/KO | 150 |
| vanderbilt2023/32 | 150 |
| vanderbilt2016/KO | 149 |
| soloway2017/FF | 144 |
| spingold2015/FF | 141 |
| vanderbilt2018/FF | 140 |
| spingold2022/KO | 139 |
| vanderbilt2019/FF | 139 |
| vanderbilt2016/FF | 134 |
| soloway25/FF | 130 |
| vanderbilt2022/FF | 130 |
| vanderbilt2017/FF | 121 |
| soloway2023/FF | 120 |
| spingold2018/FF | 120 |
| spingold2024/FF | 120 |
| spingold25/FF | 120 |
| vanderbilt2023/FF | 120 |
| vanderbilt2024/FF | 120 |
| spingold2016/FF | 119 |
| spingold2019/FF | 119 |
| spingold2022/FF | 119 |
| vanderbilt2015/FF | 119 |
| spingold2017/FF | 117 |
| prague26tn/FF | 112 |
| strasbourg23tn/FF | 112 |
| soloway2024/FF | 102 |
| soloway2016/SF | 90 |
| spingold2017/KO | 79 |
| soloway2016/16 | 71 |
| spingold2016/KO | 63 |
| soloway25/QF | 61 |
| spingold2015/32 | 60 |
| vanderbilt2017/KO | 60 |
| vanderbilt2023/16 | 46 |
| soloway2015/16 | 32 |
| soloway2022/16 | 30 |
| vanderbilt2023/KO | 30 |
| soloway2024/KO | 25 |
| soloway2017/16 | 22 |
| soloway2017/SF | 16 |
| soloway25/16 | 6 |

- Strength filter: the bottom 4 teams of each event (by average
  round-robin VP) are excluded as actors — 220 teams, 80481
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
- **Takeout doubles are opening-strength, not 12+**: (1S) X runs 11–19 (med 14);
  the light tail (10–11) comes with shape.
- **The 1NT overcall is a strong NT**: (1H) 1NT = 14–17 (med 15); balancing
  (1H) P (P) 1NT is 4 HCP lighter at 10–16 (med 11).
- **Vulnerability moves preempts, not constructive bids.** Weak jump overcalls
  swing hardest: (1C) 2H is median 7 at favourable but 10 at unfavourable.
  Simple overcalls and doubles barely move (±1 HCP).
- **Two-suited bids are universal**: (1H) 2H (Michaels) = 8–15 (med 12) with ≤2
  hearts 99% of the time; (1M) 2NT is the two lowest suits, unbalanced.
- **Negative doubles start at ~7**: 1S (2H) X = 7–15 (med 10). Redouble after
  1C (X) shows 6–16 (med 11).
- **Transfer responses to 1C are mainstream**: of classified natural-club pairs,
  185 play transfers vs 437 standard. Their 1C (P) 1D holds 4+ hearts 96%
  of the time (4–16 (med 9) HCP), and 1S is the no-major hand (77% with no 4-card major, 5–17 (med 10)) — the
  derived rules follow the shown suit, and the treatment carries on over a
  double or 1D overcall (see the transfer-responder sections).
- **Defence to 1NT is conventional and the data shows it**: (1NT) 2C holds both
  majors 4+ 87% of the time (clubs are incidental); (1NT) 2D has a 5+
  major 92% (6+ 81%) — multi-style; 2M shows the major plus a 4+ minor.
  The derived rules detect these shapes instead of reading the bid suit at
  face value (see the (1NT) ? section).
- **At this level 2D is multi** (309 pairs multi vs 64 weak among classified),
  2C strong is standard, and strong-club pairs are 9% of the field (207 of 2254).
- **Shortage in their suit buys lighter action.** (1D) 1S overcallers with ≤2
  diamonds are median 10 HCP (p5 7); with 3+ diamonds median 11 (p5 7).
  The same gradient shows up in every overcall and double context (see the
  per-context cross-tabs), so the derived filters split their-suit shortage
  from length.
- **Doubles are support-first below 17, shape-free above.** Under 17 HCP, (1H) X
  holds 3+ spades 100% of the time (4+ 72%) and 2+ in both
  minors 98%; (1C) X holds both majors 3+ 95%. At 17+ those rates
  drop to 75% / 65% — the strong double is its own animal, and the derived
  filters carry it as a separate shape-free branch.
- **Action rates need a fixed-strength lens** (a strong 1C depletes the seats
  behind it). Holding 9–11 HCP, the direct seat acts 57% over a natural 1C, 53% over 1D, 48% over a strong 1C.
  See the action-rate section for the full grid.

## Partnership system census

Each partnership is classified from its own openings (min 6 samples per bid).

- 1C style: unknown 1127, natural 884, strong 207, short 25, polish 11
- 1D style: unknown 1173, natural 1005, nebulous 76
- 1NT range: unknown 1240, strong 892, weak 122
- 2C style: unknown 1907, strong 193, natural 154
- 2D style: unknown 1760, multi 309, other 121, weak 64
- natural base (1C natural/short and 1D not nebulous): no 1348, yes 906
- 1C response style (natural/short openers, from their own 1D/1H responses):
  standard 437, transfer-walsh 185, insufficient data 267

## Openings (natural-base pairs)

HCP shown as p5/p25/**median**/p75/p95. Length is the bid suit, p5–p95 (median).
Style filter: 1C/1D/1NT/2C/2D rows use pairs whose that-bid style is natural
(1C natural or short-club; 1D natural; 2C strong excluded from "natural" row…);
1M and preempts use natural-base pairs.

### Seat 1 + Seat 2

| opening | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|
| 1C | 21429 | 6651 | 11/12/**13**/14/18 | 2:6% 3:22% 4:30% 5:24% 6:13% 7:4% | **4.8** (3.5–6.2) | 59% |
| 1D | 19972 | 5607 | 10/12/**13**/14/18 | <3:2% 3:6% 4:30% 5:37% 6:20% 7:4% | **4.8** (3.6–6.2) | 37% |
| 1H | 11495 | 3107 | 10/12/**13**/15/18 | <5:1% 5:70% 6:25% 7:3% 8+:1% | **5.2** (3.8–6.3) | 17% |
| 1S | 12264 | 3283 | 10/11/**13**/15/18 | 5:62% 6:31% 7:5% | **4.9** (3.8–6.3) | 17% |
| 1NT | 13031 | 4630 | 13/14/**15**/16/17 | — | — | 84% |
| 2C | 875 | 1064 | 6/16/**20**/22/24 | <1:1% 1:8% 2:22% 3:34% 4:21% 5:8% 6:4% 7+:1% | **5.6** (3.4–7.5) | 44% |
| 2D | 338 | 1567 | 4/6/**8**/9/13 | <5:4% 5:9% 6:80% 7:7% | **4.1** (3.0–5.3) | 3% |
| 2H | 1894 | 1029 | 5/7/**8**/9/11 | <2:1% 2:2% 3:2% 4:5% 5:32% 6:55% 7:3% | **4.3** (3.0–5.3) | 5% |
| 2S | 2333 | 946 | 5/7/**8**/9/11 | <5:1% 5:32% 6:65% 7:2% | **4.4** (3.1–5.5) | 3% |
| 2NT | 1878 | 565 | 19/19/**20**/21/21 | — | — | 84% |
| 3C | 752 | 296 | 4/5/**7**/9/10 | <5:1% 5:3% 6:61% 7:33% 8+:2% | **4.4** (3.9–5.6) | 2% |
| 3D | 1034 | 304 | 3/5/**8**/8/10 | <6:2% 6:44% 7:53% | **5.0** (4.1–5.5) | 0% |
| 3H | 605 | 223 | 3/5/**7**/8/9 | <6:3% 6:42% 7:44% 8:11% | **3.9** (3.0–4.8) | 1% |
| 3S | 797 | 227 | 4/6/**7**/9/10 | 6:34% 7:65% | **4.8** (3.9–6.4) | 0% |
| 3NT | 152 | 91 | 9/11/**11**/13/15 | — | — | 5% |
| 4C | 94 | 57 | 5/5/**9**/12/14 | <2:1% 2:11% 3:12% 4:4% 5:1% 6:4% 7:28% 8:38% 9+:1% | **3.5** (3.5–4.5) | 0% |
| 4D | 67 | 47 | 5/5/**7**/9/15 | 1:6% 3:13% 4:3% 6:6% 7:52% 8:16% 9:3% | **4.7** (3.0–4.9) | 0% |
| 4H | 388 | 125 | 3/5/**6**/10/12 | <6:2% 6:4% 7:43% 8:50% 9+:2% | **4.8** (4.2–6.3) | 1% |
| 4S | 418 | 118 | 6/8/**9**/10/11 | <6:2% 6:6% 7:53% 8:38% 9+:2% | **5.9** (4.7–6.6) | 1% |

### Seat 3

| opening | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|
| 1C | 3970 | 1562 | 10/12/**13**/16/19 | 2:7% 3:20% 4:26% 5:29% 6:15% 7:2% | **5.0** (3.5–6.3) | 55% |
| 1D | 4428 | 1252 | 10/12/**13**/14/18 | 3:5% 4:36% 5:39% 6:18% | **4.8** (3.7–6.1) | 44% |
| 1H | 2264 | 826 | 9/11/**13**/14/18 | 4:4% 5:69% 6:26% | **4.8** (3.6–6.2) | 25% |
| 1S | 2943 | 877 | 9/11/**13**/16/18 | 4:4% 5:69% 6:24% 7:3% | **5.3** (4.0–6.0) | 23% |
| 1NT | 3273 | 1024 | 14/15/**15**/16/17 | — | — | 83% |
| 2C | 269 | 265 | 11/19/**21**/23/25 | 1:5% 2:15% 3:29% 4:21% 5:10% 6:14% 7:7% | **6.8** (5.1–7.6) | 36% |
| 2D | 33 | 250 | 5/7/**9**/11/14 | 3:3% 5:30% 6:61% 7:6% | **3.8** (3.1–5.0) | 0% |
| 2H | 229 | 127 | 5/7/**9**/10/12 | <5:5% 5:38% 6:56% 7+:1% | **3.5** (3.2–5.3) | 3% |
| 2S | 164 | 91 | 6/7/**9**/10/13 | <5:1% 5:26% 6:73% | **4.3** (3.7–6.0) | 3% |
| 2NT | 461 | 178 | 18/19/**20**/21/21 | — | — | 65% |
| 3C | 235 | 61 | 5/8/**9**/10/11 | 5:14% 6:57% 7:29% | **5.7** (4.4–6.2) | 0% |
| 3D | 91 | 56 | 4/6/**7**/10/13 | 4:2% 5:9% 6:79% 7:10% | **3.8** (3.8–5.0) | 0% |
| 3H | 80 | 37 | 5/7/**9**/10/11 | 5:3% 6:59% 7:39% | **4.4** (3.7–6.4) | 0% |
| 3S | 38 | 29 | 6/7/**7**/9/11 | 4:3% 5:5% 6:66% 7:26% | **6.7** (4.0–7.1) | 3% |
| 4C | 29 | 13 | 8/8/**9**/11/11 | 3:3% 4:3% 6:38% 7:52% 8:3% | **5.7** (4.4–6.3) | 3% |
| 4H | 95 | 54 | 8/11/**12**/13/16 | <5:2% 5:4% 6:34% 7:29% 8:31% | **5.7** (3.8–6.9) | 1% |
| 4S | 98 | 37 | 6/11/**12**/12/15 | <6:3% 6:20% 7:71% 8:5% | **7.8** (6.1–8.1) | 1% |

### Seat 4

| opening | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|
| 1C | 1273 | 578 | 12/13/**14**/18/20 | <2:1% 2:9% 3:33% 4:28% 5:15% 6:10% 7:3% | **5.3** (3.4–7.0) | 71% |
| 1D | 723 | 317 | 12/14/**15**/18/19 | <3:2% 3:7% 4:59% 5:17% 6:13% 7:3% | **4.8** (4.0–6.2) | 56% |
| 1H | 663 | 192 | 12/13/**15**/17/18 | 5:60% 6:38% 7+:2% | **5.0** (3.6–6.5) | 13% |
| 1S | 504 | 196 | 12/14/**16**/16/19 | <5:1% 5:58% 6:32% 7:8% | **5.4** (4.8–6.2) | 15% |
| 1NT | 1174 | 383 | 14/15/**16**/16/17 | — | — | 87% |
| 2C | 100 | 109 | 17/19/**21**/23/24 | 1:8% 2:18% 3:43% 4:24% 5:5% 6+:2% | **6.6** (4.5–8.2) | 76% |
| 2NT | 168 | 110 | 18/20/**20**/21/22 | — | — | 88% |

### Preempts by vulnerability (all seats, natural-base pairs)

| opening | vul | n | HCP p5/p25/med/p75/p95 | bid-suit len | texture |
|---|---|---|---|---|---|
| 2H | fav | 651 | 4/6/**7**/9/11 | 2:2% 3:2% 4:6% 5:48% 6:39% 7+:1% | **3.9** (2.8–4.8) |
| 2H | none | 618 | 5/7/**8**/9/11 | <4:3% 4:6% 5:32% 6:58% 7+:1% | **4.3** (3.0–5.1) |
| 2H | both | 392 | 6/7/**8**/9/12 | <2:2% 2:2% 3:3% 4:3% 5:26% 6:59% 7:5% | **4.2** (3.2–5.7) |
| 2H | unfav | 478 | 5/8/**8**/10/12 | <2:1% 2:2% 3:2% 4:2% 5:18% 6:70% 7:5% | **4.4** (3.5–5.7) |
| 2S | fav | 854 | 4/7/**8**/9/11 | <5:1% 5:42% 6:56% | **4.1** (2.7–5.3) |
| 2S | none | 642 | 5/6/**8**/9/10 | <5:2% 5:38% 6:59% 7+:1% | **4.3** (3.2–5.8) |
| 2S | both | 564 | 5/7/**8**/9/11 | 5:20% 6:77% 7:2% | **4.4** (3.4–5.1) |
| 2S | unfav | 448 | 6/7/**9**/10/12 | 5:17% 6:78% 7:5% | **4.6** (3.7–5.7) |
| 3C | fav | 500 | 4/5/**7**/9/10 | 5:9% 6:75% 7:14% 8+:1% | **4.9** (4.0–5.7) |
| 3C | none | 318 | 5/5/**8**/8/10 | <6:2% 6:51% 7:47% | **4.4** (4.3–5.2) |
| 3C | both | 70 | 2/7/**7**/10/11 | 3:3% 5:1% 6:33% 7:60% 8:3% | **4.3** (3.5–5.6) |
| 3C | unfav | 102 | 6/9/**9**/10/10 | <6:2% 6:35% 7:57% 8:6% | **6.1** (5.2–6.3) |
| 3D | fav | 423 | 2/5/**7**/8/9 | 5:4% 6:75% 7:20% | **4.1** (3.1–5.5) |
| 3D | none | 276 | 3/6/**8**/9/10 | <6:2% 6:55% 7:43% | **5.1** (4.0–5.2) |
| 3D | both | 285 | 6/7/**8**/8/10 | <6:1% 6:11% 7:87% 8+:1% | **5.3** (4.3–6.0) |
| 3D | unfav | 141 | 5/5/**7**/9/10 | 6:20% 7:78% 8:2% | **5.0** (4.9–5.4) |
| 3H | fav | 256 | 2/5/**6**/7/10 | <5:2% 5:4% 6:67% 7:15% 8:13% | **3.9** (2.9–4.6) |
| 3H | none | 150 | 5/5/**7**/8/9 | <6:2% 6:56% 7:41% | **4.8** (4.1–5.9) |
| 3H | both | 175 | 5/6/**7**/9/10 | <6:2% 6:5% 7:75% 8:17% | **3.6** (3.0–4.2) |
| 3H | unfav | 105 | 5/6/**7**/9/10 | 6:36% 7:60% 8:4% | **4.4** (3.5–6.6) |
| 3S | fav | 309 | 4/4/**7**/8/9 | 6:60% 7:40% | **3.9** (3.3–4.7) |
| 3S | none | 193 | 5/6/**7**/9/10 | <6:1% 6:31% 7:67% | **6.3** (4.3–6.3) |
| 3S | both | 197 | 6/8/**9**/10/10 | 6:18% 7:80% 8+:2% | **4.8** (4.4–6.7) |
| 3S | unfav | 136 | 7/7/**7**/10/10 | <6:1% 6:13% 7:85% 8+:1% | **7.1** (6.4–7.1) |
| 4C | fav | 62 | 5/5/**6**/9/13 | <4:5% 4:6% 6:21% 7:26% 8:42% | **3.7** (3.5–5.1) |
| 4C | none | 31 | 5/8/**11**/13/14 | 2:3% 3:29% 7:65% 8:3% | **4.4** (3.6–4.8) |
| 4D | fav | 40 | 4/5/**5**/8/10 | 1:3% 3:3% 4:5% 6:10% 7:73% 8:8% | **4.7** (3.8–4.7) |
| 4H | fav | 182 | 3/5/**6**/10/12 | <6:1% 6:15% 7:49% 8:34% | **4.3** (3.5–5.8) |
| 4H | none | 113 | 4/5/**6**/12/16 | 4:5% 6:12% 7:48% 8:29% 9:4% | **4.8** (4.7–5.5) |
| 4H | both | 160 | 5/8/**11**/12/13 | 6:3% 7:24% 8:73% | **5.6** (4.2–7.7) |
| 4H | unfav | 36 | 5/5/**9**/10/16 | 4:3% 5:3% 6:11% 7:44% 8:39% | **6.0** (5.2–6.6) |
| 4S | fav | 164 | 6/7/**9**/10/12 | <6:3% 6:7% 7:78% 8:11% 9+:1% | **5.8** (4.1–6.7) |
| 4S | none | 137 | 6/9/**9**/9/11 | <6:1% 6:2% 7:41% 8:54% 9+:1% | **5.9** (5.9–6.3) |
| 4S | both | 79 | 7/8/**9**/12/16 | 3:3% 5:3% 6:32% 7:34% 8:24% 9:5% | **5.6** (4.4–6.7) |
| 4S | unfav | 144 | 9/10/**11**/11/14 | <6:1% 6:3% 7:58% 8:37% | **6.4** (5.5–7.5) |

## Direct seat: RHO opens, we act — (opening) ?

Every opening 1C–4S with enough data. For 1C/1D the tables face a NATURAL opening (strong-club and nebulous-1D openers tabulated separately below); (2D) faces a weak 2D. Suit actions over (1NT) are largely conventional — 2C = both majors, 2D = one long major (multi-style), 2M = the major + a minor — and their derived rules detect those shapes from the hands instead of reading the bid at face value.

### (1C) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 49.2% | 13049 | 4890 | 2/6/**7**/10/13 | — | — | 66% |
| 1S | 12.0% | 3186 | 1073 | 7/9/**11**/13/15 | <5:2% 5:78% 6:17% 7:2% | **4.4** (3.2–5.2) | 31% |
| 1H | 10.7% | 2844 | 1049 | 7/9/**11**/13/16 | <4:1% 4:3% 5:66% 6:23% 7:6% | **4.6** (3.7–5.6) | 19% |
| X | 8.3% | 2214 | 833 | 10/12/**14**/17/20 | theirs: <1:2% 1:18% 2:31% 3:37% 4:11% 5+:2% | — | 66% |
| 1D | 7.7% | 2050 | 922 | 7/9/**11**/13/15 | 4:5% 5:59% 6:28% 7:5% 8+:2% | **4.8** (3.9–5.9) | 26% |
| 1NT | 3.3% | 886 | 369 | 14/15/**15**/16/17 | — | — | 86% |
| 2H | 1.7% | 453 | 179 | 4/7/**8**/9/12 | <5:2% 5:6% 6:80% 7:12% | **4.9** (3.8–5.4) | 1% |
| 2S | 1.4% | 379 | 173 | 4/5/**7**/9/12 | 5:7% 6:88% 7:5% | **4.3** (3.8–5.2) | 2% |
| 2C | 1.2% | 312 | 257 | 7/9/**11**/13/15 | 0:3% 1:25% 2:11% 3:3% 5:13% 6:34% 7:10% | **4.3** (1.5–6.3) | 3% |
| 2D | 1.0% | 269 | 193 | 5/7/**10**/12/14 | 0:3% 1:12% 2:32% 3:6% 5:8% 6:38% 7+:1% | **4.1** (1.7–5.4) | 2% |
| 3H | 0.8% | 221 | 80 | 4/6/**8**/9/12 | 6:43% 7:57% | **4.5** (4.3–5.4) | 0% |
| 3S | 0.5% | 142 | 66 | 4/5/**9**/10/11 | 6:37% 7:58% 8:4% | **5.3** (4.0–6.1) | 0% |
| 3D | 0.4% | 104 | 83 | 5/7/**9**/10/12 | 6:62% 7:33% 8:6% | **5.0** (4.0–5.4) | 0% |
| 2NT | 0.5% | 141 | 56 | 9/10/**13**/13/16 | — | — | 0% |
| 4H | 0.3% | 88 | 44 | 6/11/**11**/13/15 | 6:8% 7:60% 8:32% | **5.9** (4.5–8.0) | 0% |
| 3C | 0.2% | 43 | 58 | 5/9/**11**/12/14 | 0:7% 1:40% 2:14% 6:12% 7:26% 8:2% | **2.1** (0.0–4.7) | 0% |
| 4S | 0.2% | 57 | 38 | 6/8/**10**/12/16 | 6:11% 7:60% 8:30% | **6.1** (5.1–7.1) | 0% |
| 5D | 0.2% | 50 | 10 | 12/12/**12**/12/15 | 6:6% 7:2% 8:90% 9:2% | **7.0** (7.0–7.0) | 0% |
| 4D | 0.1% | 30 | 23 | 4/8/**9**/10/12 | 1:7% 6:13% 7:17% 8:63% | **4.4** (4.4–5.6) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1S | none | 798 | 7/9/**11**/13/15 |
| 1S | fav | 686 | 7/9/**9**/12/16 |
| 1S | unfav | 832 | 7/10/**12**/13/15 |
| 1S | both | 870 | 7/9/**10**/12/15 |
| 1H | none | 795 | 7/9/**10**/13/15 |
| 1H | fav | 647 | 7/9/**10**/12/15 |
| 1H | unfav | 751 | 7/9/**10**/13/17 |
| 1H | both | 651 | 7/9/**11**/13/16 |
| X | none | 669 | 10/12/**14**/17/19 |
| X | fav | 396 | 10/12/**14**/18/20 |
| X | unfav | 606 | 11/13/**14**/17/20 |
| X | both | 543 | 11/12/**14**/15/19 |
| 1D | none | 677 | 7/9/**11**/14/15 |
| 1D | fav | 389 | 6/9/**12**/13/16 |
| 1D | unfav | 403 | 7/9/**12**/14/16 |
| 1D | both | 581 | 7/9/**12**/13/15 |
| 1NT | none | 213 | 14/15/**16**/17/18 |
| 1NT | fav | 103 | 14/15/**16**/17/18 |
| 1NT | unfav | 251 | 15/15/**15**/16/17 |
| 1NT | both | 319 | 14/15/**15**/16/17 |
| 2H | none | 162 | 5/7/**8**/8/11 |
| 2H | fav | 125 | 4/4/**7**/8/11 |
| 2H | unfav | 68 | 5/8/**10**/12/13 |
| 2H | both | 98 | 6/8/**8**/8/12 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 1S | 9/**11**/12 (799) | 9/**11**/14 (1090) | 9/**11**/12 (866) | 9/**11**/14 (431) |
| 1H | 10/**11**/13 (663) | 9/**11**/13 (1045) | 8/**10**/12 (590) | 9/**10**/13 (546) |
| X | 11/**13**/17 (432) | 13/**14**/16 (678) | 13/**14**/15 (820) | 13/**17**/18 (284) |
| 1D | 9/**11**/14 (339) | 9/**11**/13 (635) | 8/**11**/13 (549) | 10/**12**/14 (527) |

Anatomy of X: per HCP band, support held (both majors = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | both majors ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 127 | 98% | 76% | 96% | 92% |
| 11–13 | 796 | 98% | 38% | 100% | 48% |
| 14–16 | 701 | 91% | 18% | 98% | 48% |
| 17+ | 590 | 65% | 11% | 87% | 47% |

Dealer filters (paste into the custom filter box; derived from the data):

- `1S` → `s >= 5 and top(s,5) >= 1 and hcp in 7..15`
- `1H` → `h >= 5 and top(h,5) >= 1 and hcp in 7..16`
- `X` → `((hcp in 10..17 and c <= 2 and s >= 3 and h >= 3 and d >= 2) or (hcp in 12..17 and c in 3..4 and s >= 3 and h >= 3 and d >= 2) or hcp >= 18)`
- `1D` → `d >= 5 and top(d,5) >= 1 and ((hcp in 6..15 and c <= 2) or (hcp in 7..15 and c in 3..5))`
- `1NT` → `(has(c,a) or (has(c,k) and c >= 2) or (has(c,q) and c >= 3)) and hcp in 14..17` *(+ balanced)*
- `2H` → `h >= 6 and (hcp >= 11 or top(h,5) >= 2) and ((hcp in 4..12 and c <= 2) or (hcp in 5..12 and c in 3..4))`

### (1D) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 51.5% | 13048 | 3950 | 3/6/**8**/10/13 | — | — | 62% |
| 1S | 11.5% | 2921 | 982 | 7/9/**10**/13/15 | 4:3% 5:75% 6:20% 7:2% | **4.4** (3.0–5.5) | 26% |
| 1H | 11.3% | 2874 | 931 | 7/9/**11**/13/15 | 4:4% 5:65% 6:30% 7+:1% | **4.6** (3.5–5.8) | 21% |
| X | 10.1% | 2551 | 843 | 10/12/**14**/17/19 | theirs: 0:6% 1:15% 2:44% 3:29% 4:5% | — | 66% |
| 2C | 4.3% | 1081 | 324 | 9/10/**11**/13/16 | 5:29% 6:55% 7:16% | **6.1** (4.6–7.0) | 8% |
| 1NT | 3.2% | 802 | 325 | 14/15/**16**/17/18 | — | — | 89% |
| 2D | 2.1% | 522 | 126 | 6/9/**10**/12/14 | 0:34% 1:49% 2:11% 5:1% 6:2% 7+:1% | **0.0** (0.0–4.6) | 1% |
| 2H | 1.4% | 343 | 156 | 5/7/**8**/10/12 | <5:2% 5:9% 6:79% 7:10% | **5.0** (3.4–6.1) | 1% |
| 3H | 0.8% | 206 | 53 | 6/6/**7**/9/11 | 6:32% 7:68% | **5.3** (3.4–5.8) | 0% |
| 2S | 0.7% | 183 | 115 | 4/6/**8**/10/12 | <5:2% 5:6% 6:83% 7:9% | **4.2** (3.7–5.3) | 1% |
| 3S | 0.7% | 184 | 59 | 6/7/**7**/9/10 | 6:20% 7:79% | **4.5** (3.6–6.5) | 0% |
| 3C | 0.7% | 180 | 89 | 4/7/**9**/10/12 | <5:4% 5:14% 6:49% 7:30% 8:3% | **4.9** (4.0–6.4) | 0% |
| 2NT | 0.6% | 148 | 61 | 8/9/**9**/10/17 | — | — | 1% |
| 4S | 0.5% | 129 | 34 | 6/10/**12**/13/15 | 7:64% 8:12% 9:23% | **7.4** (5.9–8.1) | 0% |
| 4H | 0.3% | 68 | 54 | 5/8/**10**/13/17 | 6:28% 7:44% 8:18% 9:10% | **5.4** (4.3–6.5) | 0% |
| 4C | 0.1% | 28 | 14 | 5/10/**10**/11/12 | 6:7% 7:29% 8:64% | **3.7** (3.7–6.0) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1S | none | 736 | 7/10/**11**/13/15 |
| 1S | fav | 784 | 7/9/**10**/11/14 |
| 1S | unfav | 760 | 7/8/**10**/14/17 |
| 1S | both | 641 | 7/9/**11**/12/15 |
| 1H | none | 601 | 7/8/**10**/13/14 |
| 1H | fav | 473 | 7/9/**11**/13/16 |
| 1H | unfav | 949 | 7/10/**11**/13/16 |
| 1H | both | 851 | 8/9/**11**/14/15 |
| X | none | 682 | 9/12/**13**/14/19 |
| X | fav | 703 | 10/13/**14**/18/20 |
| X | unfav | 469 | 11/12/**14**/18/19 |
| X | both | 697 | 10/13/**15**/15/19 |
| 2C | none | 228 | 9/10/**10**/12/14 |
| 2C | fav | 262 | 8/11/**13**/14/17 |
| 2C | unfav | 333 | 10/10/**11**/13/16 |
| 2C | both | 258 | 9/9/**11**/12/15 |
| 1NT | none | 140 | 14/15/**16**/17/18 |
| 1NT | fav | 242 | 14/16/**16**/17/18 |
| 1NT | unfav | 145 | 14/15/**16**/17/18 |
| 1NT | both | 275 | 15/15/**16**/17/18 |
| 2D | none | 226 | 7/9/**10**/10/12 |
| 2D | fav | 51 | 8/12/**13**/13/14 |
| 2D | unfav | 80 | 9/12/**12**/12/16 |
| 2D | both | 165 | 6/6/**10**/12/13 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 1S | 8/**10**/12 (653) | 9/**10**/12 (1134) | 8/**12**/13 (673) | 10/**11**/12 (461) |
| 1H | 9/**10**/13 (612) | 10/**11**/13 (1124) | 8/**11**/13 (674) | 10/**11**/14 (464) |
| X | 10/**14**/15 (532) | 12/**13**/15 (1129) | 14/**14**/18 (749) | 14/**16**/18 (141) |
| 2C | 10/**10**/12 (192) | 10/**11**/14 (323) | 11/**11**/13 (365) | 10/**11**/14 (201) |

Anatomy of X: per HCP band, support held (both majors = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | both majors ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 174 | 99% | 61% | 99% | 97% |
| 11–13 | 857 | 99% | 30% | 99% | 77% |
| 14–16 | 868 | 94% | 25% | 99% | 56% |
| 17+ | 652 | 41% | 12% | 96% | 53% |

Dealer filters (paste into the custom filter box; derived from the data):

- `1S` → `s >= 5 and top(s,5) >= 1 and hcp in 7..15`
- `1H` → `h >= 5 and top(h,5) >= 1 and hcp in 7..15`
- `X` → `((hcp in 10..17 and d <= 2 and s >= 3 and h >= 3 and c >= 3) or (hcp in 12..17 and d == 3 and s >= 3 and h >= 3 and c >= 3) or hcp >= 18)`
- `2C` → `c >= 5 and top(c,5) >= 2 and hcp in 9..16`
- `1NT` → `(has(d,a) or (has(d,k) and d >= 2) or (has(d,q) and d >= 3)) and hcp in 14..18` *(+ balanced)*
- `2D` → `s >= 5 and h >= 5 and hcp in 6..14`

### (1H) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 57.6% | 10815 | 2535 | 3/6/**8**/10/13 | — | — | 63% |
| 1S | 12.0% | 2255 | 633 | 7/9/**11**/13/16 | 4:3% 5:70% 6:23% 7:3% | **5.1** (3.7–6.2) | 29% |
| X | 11.4% | 2148 | 575 | 10/12/**14**/16/19 | theirs: 0:2% 1:30% 2:41% 3:24% 4:3% | — | 54% |
| 2C | 3.9% | 723 | 225 | 8/10/**12**/14/16 | 5:21% 6:60% 7:18% | **5.6** (4.6–6.7) | 8% |
| 2D | 3.5% | 662 | 225 | 8/10/**11**/13/16 | 5:27% 6:58% 7:14% | **5.6** (4.4–6.4) | 8% |
| 1NT | 2.8% | 535 | 163 | 14/15/**15**/17/17 | — | — | 80% |
| 2H | 2.4% | 459 | 82 | 8/10/**12**/13/15 | 0:40% 1:29% 2:29% 3+:1% | **0.0** (0.0–3.3) | 0% |
| 2S | 1.8% | 340 | 103 | 6/6/**8**/9/12 | <5:1% 5:4% 6:92% 7:2% | **4.6** (3.5–5.6) | 1% |
| 2NT | 1.3% | 237 | 47 | 6/11/**11**/12/13 | — | — | 0% |
| 3D | 0.8% | 156 | 50 | 4/7/**8**/10/11 | 5:3% 6:60% 7:37% | **5.2** (4.3–5.3) | 1% |
| 4S | 0.8% | 142 | 30 | 8/11/**11**/11/15 | <6:1% 6:5% 7:41% 8:53% | **6.9** (5.6–7.6) | 0% |
| 3C | 0.6% | 120 | 62 | 6/8/**10**/11/14 | 0:5% 1:6% 2:13% 3:2% 5:16% 6:23% 7:37% | **4.3** (2.7–6.4) | 1% |
| 3S | 0.6% | 109 | 49 | 5/6/**8**/9/11 | 6:59% 7:39% 8+:2% | **5.0** (3.8–5.6) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1S | none | 402 | 6/8/**11**/13/15 |
| 1S | fav | 547 | 7/10/**12**/14/16 |
| 1S | unfav | 621 | 7/9/**11**/14/16 |
| 1S | both | 685 | 7/10/**11**/12/16 |
| X | none | 571 | 11/13/**13**/15/19 |
| X | fav | 538 | 10/12/**12**/15/17 |
| X | unfav | 556 | 11/13/**14**/17/22 |
| X | both | 483 | 11/12/**14**/16/22 |
| 2C | none | 191 | 8/12/**15**/15/17 |
| 2C | fav | 174 | 9/11/**11**/12/15 |
| 2C | unfav | 116 | 9/11/**12**/13/15 |
| 2C | both | 242 | 9/10/**10**/13/16 |
| 2D | none | 233 | 8/10/**13**/14/16 |
| 2D | fav | 130 | 8/10/**11**/12/16 |
| 2D | unfav | 121 | 10/11/**12**/13/15 |
| 2D | both | 178 | 10/10/**11**/13/16 |
| 1NT | none | 135 | 14/15/**15**/15/18 |
| 1NT | fav | 137 | 15/15/**15**/17/17 |
| 1NT | unfav | 167 | 14/15/**15**/15/17 |
| 1NT | both | 96 | 14/15/**17**/17/17 |
| 2H | none | 66 | 8/13/**13**/13/14 |
| 2H | fav | 159 | 8/12/**12**/13/13 |
| 2H | unfav | 105 | 8/8/**14**/14/16 |
| 2H | both | 129 | 6/10/**10**/12/15 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 1S | 8/**11**/13 (495) | 9/**11**/13 (812) | 11/**12**/13 (638) | 10/**12**/14 (310) |
| X | 11/**12**/15 (686) | 12/**13**/15 (891) | 14/**15**/17 (510) | 13/**14**/17 (61) |
| 2C | 10/**11**/15 (272) | 10/**12**/13 (180) | 10/**11**/14 (250) | 11/**13**/14 (21) |
| 2D | 10/**12**/14 (226) | 10/**11**/12 (232) | 11/**12**/14 (114) | 11/**13**/13 (90) |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 121 | 100% | 91% | 100% | 99% |
| 11–13 | 889 | 100% | 78% | 99% | 84% |
| 14–16 | 701 | 99% | 62% | 97% | 68% |
| 17+ | 437 | 75% | 49% | 97% | 52% |

Dealer filters (paste into the custom filter box; derived from the data):

- `1S` → `s >= 5 and top(s,5) >= 1 and ((hcp in 6..16 and h <= 2) or (hcp in 8..16 and h in 3..4))`
- `X` → `((hcp in 10..17 and h <= 2 and s >= 3 and d >= 2 and c >= 2) or (hcp in 12..17 and h == 3 and s >= 3 and d >= 2 and c >= 2) or hcp >= 18)`
- `2C` → `c >= 5 and top(c,5) >= 2 and ((hcp in 8..16 and h <= 2) or (hcp in 9..16 and h == 3))`
- `2D` → `d >= 5 and top(d,5) >= 1 and ((hcp in 8..16 and h <= 2) or (hcp in 9..16 and h in 3..4))`
- `1NT` → `hcp in 14..17`
- `2H` → `s >= 5 and ((hcp in 8..15 and d >= 5) or (hcp in 8..15 and c >= 5))`

### (1S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 67.5% | 13783 | 3002 | 3/6/**8**/10/13 | — | — | 59% |
| X | 8.1% | 1658 | 598 | 11/12/**14**/15/19 | theirs: 0:5% 1:26% 2:41% 3:22% 4:6% | — | 53% |
| 2H | 6.4% | 1297 | 344 | 9/11/**12**/14/16 | 5:46% 6:50% 7:4% | **5.7** (4.3–6.5) | 12% |
| 2D | 5.3% | 1092 | 253 | 8/10/**12**/13/16 | 5:25% 6:58% 7:17% | **6.2** (4.8–7.0) | 16% |
| 2C | 3.7% | 751 | 215 | 9/10/**12**/15/16 | 5:32% 6:53% 7:15% | **5.3** (4.5–6.3) | 11% |
| 1NT | 3.0% | 604 | 216 | 14/15/**16**/17/18 | — | — | 75% |
| 2S | 1.3% | 264 | 93 | 6/8/**12**/12/16 | 0:16% 1:62% 2:18% 3:3% | **0.0** (0.0–1.7) | 1% |
| 3C | 1.0% | 210 | 78 | 4/6/**8**/10/14 | 1:10% 2:4% 3:5% 5:5% 6:29% 7:46% | **4.5** (4.1–5.2) | 0% |
| 3D | 0.9% | 193 | 60 | 6/7/**9**/10/11 | 5:3% 6:44% 7:49% 8:4% | **5.1** (5.1–6.6) | 1% |
| 3H | 0.9% | 176 | 52 | 4/8/**8**/10/12 | 6:51% 7:49% | **4.9** (4.0–7.0) | 0% |
| 2NT | 0.8% | 172 | 59 | 7/10/**11**/12/20 | — | — | 0% |
| 4H | 0.4% | 88 | 32 | 6/9/**10**/15/16 | 0:2% 6:34% 7:38% 8:24% 9:2% | **6.5** (5.8–7.1) | 0% |
| 4C | 0.2% | 43 | 12 | 4/7/**7**/8/8 | 6:2% 7:86% 8:12% | **4.3** (4.1–5.2) | 0% |
| 4D | 0.2% | 37 | 11 | 7/7/**7**/10/13 | 6:14% 7:78% 8:8% | **6.0** (5.1–6.0) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 333 | 10/13/**14**/15/19 |
| X | fav | 342 | 10/12/**13**/16/21 |
| X | unfav | 410 | 11/13/**14**/15/19 |
| X | both | 573 | 11/12/**13**/15/19 |
| 2H | none | 467 | 9/11/**12**/14/15 |
| 2H | fav | 216 | 9/10/**11**/12/16 |
| 2H | unfav | 297 | 9/10/**13**/13/16 |
| 2H | both | 317 | 9/10/**11**/14/16 |
| 2D | none | 259 | 7/10/**11**/12/15 |
| 2D | fav | 226 | 8/10/**10**/13/15 |
| 2D | unfav | 386 | 10/10/**11**/13/17 |
| 2D | both | 221 | 8/11/**13**/13/16 |
| 2C | none | 121 | 10/11/**13**/14/15 |
| 2C | fav | 331 | 8/10/**11**/15/16 |
| 2C | unfav | 116 | 9/9/**11**/14/16 |
| 2C | both | 183 | 10/11/**13**/14/16 |
| 1NT | none | 145 | 14/15/**16**/17/18 |
| 1NT | fav | 210 | 14/15/**17**/17/17 |
| 1NT | unfav | 103 | 14/15/**16**/17/18 |
| 1NT | both | 146 | 14/15/**15**/16/17 |
| 2S | none | 110 | 7/7/**12**/12/13 |
| 2S | fav | 66 | 6/6/**11**/13/16 |
| 2S | unfav | 49 | 7/11/**14**/15/16 |
| 2S | both | 39 | 7/11/**12**/13/18 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 12/**13**/14 (513) | 13/**14**/15 (685) | 13/**14**/16 (364) | 13/**18**/19 (96) |
| 2H | 10/**11**/13 (440) | 11/**12**/14 (544) | 11/**12**/14 (227) | 11/**12**/14 (86) |
| 2D | 10/**11**/13 (341) | 10/**12**/14 (320) | 10/**13**/13 (288) | 10/**10**/11 (143) |
| 2C | 10/**11**/15 (242) | 11/**13**/15 (265) | 11/**13**/14 (150) | 10/**10**/14 (94) |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 76 | 96% | 88% | 87% | 91% |
| 11–13 | 724 | 100% | 78% | 99% | 76% |
| 14–16 | 606 | 98% | 57% | 99% | 74% |
| 17+ | 252 | 78% | 57% | 87% | 52% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 10..17 and s <= 2 and h >= 3 and d >= 2 and c >= 2) or (hcp in 12..17 and s == 3 and h >= 3 and d >= 2 and c >= 2) or hcp >= 18)`
- `2H` → `h >= 5 and top(h,5) >= 1 and (hcp >= 11 or top(h,5) >= 2) and hcp in 9..16`
- `2D` → `d >= 5 and top(d,5) >= 2 and ((hcp in 8..16 and s <= 2) or (hcp in 9..16 and s in 3..4))`
- `2C` → `c >= 5 and top(c,5) >= 2 and ((hcp in 8..16 and s <= 2) or (hcp in 10..16 and s in 3..4))`
- `1NT` → `(has(s,a) or (has(s,k) and s >= 2) or (has(s,q) and s >= 3)) and hcp in 14..18`
- `2S` → `h >= 5 and ((hcp in 6..16 and d >= 5) or (hcp in 6..16 and c >= 5))`

### (1NT) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 78.6% | 17837 | 4800 | 3/6/**8**/10/14 | — | — | 58% |
| X | 5.6% | 1279 | 596 | 9/13/**15**/17/19 | — | — | 36% |
| 2D | 4.6% | 1048 | 388 | 6/9/**11**/12/16 | <1:2% 1:13% 2:38% 3:23% 4:12% 5:8% 6:3% | **3.4** (1.3–5.4) | 2% |
| 2C | 4.4% | 987 | 373 | 6/10/**12**/13/15 | 0:5% 1:29% 2:36% 3:19% 4:5% 5:5% | **1.1** (0.2–4.0) | 3% |
| 2H | 2.3% | 522 | 208 | 7/10/**12**/13/16 | 1:2% 2:2% 3:3% 4:4% 5:60% 6:26% 7:3% | **4.9** (3.7–5.9) | 2% |
| 2S | 1.8% | 416 | 199 | 8/9/**11**/13/15 | 4:3% 5:65% 6:28% 7:4% | **4.8** (3.7–5.2) | 2% |
| 3D | 0.7% | 149 | 62 | 6/9/**10**/11/14 | <6:1% 6:40% 7:46% 8:13% | **5.7** (4.4–6.6) | 0% |
| 3C | 0.5% | 110 | 51 | 5/8/**10**/11/14 | <6:3% 6:35% 7:47% 8:15% | **4.7** (4.0–5.8) | 0% |
| 3H | 0.3% | 71 | 25 | 3/5/**7**/10/13 | <6:1% 6:15% 7:80% 8:3% | **4.1** (4.0–5.8) | 0% |
| 2NT | 0.3% | 62 | 34 | 5/6/**12**/13/17 | — | — | 0% |
| 3S | 0.3% | 59 | 30 | 5/8/**10**/10/13 | <6:2% 6:32% 7:64% 8+:2% | **4.9** (4.4–6.0) | 0% |
| 4D | 0.2% | 50 | 7 | 9/9/**9**/9/10 | 5:2% 6:2% 7:6% 8:90% | **4.4** (4.4–4.4) | 0% |
| 4H | 0.2% | 44 | 14 | 9/10/**10**/11/15 | 6:2% 7:27% 8:70% | **6.5** (6.3–6.5) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 455 | 10/11/**14**/16/18 |
| X | fav | 160 | 9/10/**14**/16/18 |
| X | unfav | 424 | 11/14/**15**/17/19 |
| X | both | 240 | 9/13/**16**/19/19 |
| 2D | none | 305 | 3/9/**11**/12/17 |
| 2D | fav | 134 | 4/8/**10**/12/14 |
| 2D | unfav | 260 | 6/9/**10**/12/16 |
| 2D | both | 349 | 7/9/**11**/12/14 |
| 2C | none | 253 | 8/9/**11**/13/17 |
| 2C | fav | 318 | 6/10/**11**/13/14 |
| 2C | unfav | 168 | 7/9/**12**/12/15 |
| 2C | both | 248 | 6/10/**13**/13/15 |
| 2H | none | 194 | 5/10/**12**/15/16 |
| 2H | fav | 46 | 9/10/**11**/12/13 |
| 2H | unfav | 195 | 7/10/**12**/12/14 |
| 2H | both | 87 | 7/10/**11**/13/15 |
| 2S | none | 150 | 7/10/**11**/13/15 |
| 2S | fav | 76 | 7/8/**10**/11/15 |
| 2S | unfav | 96 | 8/10/**12**/13/16 |
| 2S | both | 94 | 7/10/**10**/12/13 |
| 3D | none | 65 | 8/10/**11**/11/11 |
| 3D | fav | 39 | 5/9/**9**/10/12 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 9..19`
- `2D` → `((hcp in 6..16 and s >= 5) or (hcp in 6..16 and h >= 5))`
- `2C` → `(hcp in 6..15 and s >= 4 and h >= 4)`
- `2H` → `h >= 4 and top(h,5) >= 1 and hcp in 7..16`
- `2S` → `s >= 5 and top(s,5) >= 1 and ((hcp in 8..15 and d >= 4) or (hcp in 8..15 and c >= 4))`
- `3D` → `d >= 6 and top(d,5) >= 2 and hcp in 6..14`

### (2C) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 73.4% | 2686 | 1040 | 2/5/**7**/9/13 | — | — | 54% |
| X | 7.5% | 275 | 142 | 9/13/**15**/17/20 | theirs: <1:1% 1:27% 2:37% 3:20% 4:6% 5:4% 6:5% | — | 53% |
| 2S | 5.6% | 205 | 119 | 4/8/**11**/13/16 | <5:1% 5:41% 6:48% 7:9% | **4.9** (3.7–5.8) | 14% |
| 2H | 5.3% | 194 | 92 | 6/10/**12**/14/17 | <5:3% 5:46% 6:43% 7:7% | **5.0** (4.1–5.4) | 14% |
| 2D | 2.7% | 98 | 67 | 7/9/**12**/15/17 | 0:2% 1:1% 2:2% 3:2% 4:1% 5:42% 6:38% 7:6% 8:6% | **5.0** (4.0–6.4) | 15% |
| 2NT | 1.4% | 53 | 35 | 4/15/**16**/17/18 | — | — | 72% |
| 3C | 1.1% | 42 | 31 | 3/10/**13**/14/14 | 0:2% 1:29% 2:10% 5:10% 6:36% 7:10% 8:5% | **4.6** (1.7–6.0) | 0% |
| 3D | 1.1% | 40 | 15 | 6/8/**8**/9/14 | 1:5% 6:33% 7:10% 8:53% | **4.0** (4.0–5.0) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 84 | 10/12/**16**/17/20 |
| X | fav | 57 | 9/13/**16**/16/20 |
| X | unfav | 92 | 9/13/**15**/17/20 |
| X | both | 42 | 11/12/**14**/16/19 |
| 2S | none | 87 | 5/7/**11**/13/14 |
| 2S | fav | 30 | 4/5/**9**/14/16 |
| 2S | unfav | 43 | 9/10/**12**/13/16 |
| 2S | both | 45 | 7/8/**10**/12/15 |
| 2H | none | 65 | 6/10/**12**/14/17 |
| 2H | unfav | 64 | 7/10/**12**/13/16 |
| 2H | both | 45 | 8/11/**13**/16/17 |
| 2D | none | 36 | 5/9/**11**/14/16 |
| 2D | unfav | 27 | 8/9/**13**/15/17 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 12/**14**/17 (76) | 14/**16**/17 (102) | 14/**15**/17 (55) | 9/**13**/16 (42) |
| 2S | 8/**10**/12 (70) | 9/**11**/14 (73) | 7/**11**/13 (42) | 8/**10**/11 (20) |
| 2H | 8/**12**/12 (68) | 10/**12**/14 (87) | 12/**15**/17 (18) | 8/**13**/13 (21) |

Anatomy of X: per HCP band, support held (both majors = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | both majors ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 20 | 60% | 30% | 65% | 30% |
| 11–13 | 69 | 88% | 48% | 97% | 68% |
| 14–16 | 97 | 95% | 41% | 99% | 63% |
| 17+ | 89 | 81% | 13% | 89% | 72% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 9..17 and c <= 4 and s >= 3 and h >= 3 and d >= 2) or hcp >= 18)`
- `2S` → `s >= 5 and top(s,5) >= 1 and ((hcp in 4..16 and c <= 2) or (hcp in 5..16 and c in 3..4))`
- `2H` → `h >= 5 and top(h,5) >= 1 and hcp in 6..17`
- `2D` → `d >= 5 and top(d,5) >= 1 and hcp in 7..17`
- `2NT` → `hcp in 4..18`

### (2D) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 46.0% | 171 | 1203 | 4/8/**9**/11/14 | — | — | 50% |
| X | 21.0% | 78 | 312 | 11/14/**16**/20/24 | theirs: 0:3% 1:17% 2:54% 3:17% 4:9% 5+:1% | — | 54% |
| 2H | 7.0% | 26 | 120 | 8/10/**13**/14/16 | 5:46% 6:54% | **5.5** (3.8–7.0) | 0% |
| 2S | 9.9% | 37 | 111 | 9/9/**11**/13/16 | 5:38% 6:41% 7:22% | **6.7** (4.9–7.0) | 24% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 32 | 11/14/**17**/24/24 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 11..17 and d <= 4 and s >= 3 and h >= 3 and c >= 2) or hcp >= 18)`

### (2H) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 57.1% | 1632 | 705 | 3/7/**9**/11/13 | — | — | 53% |
| X | 17.3% | 494 | 226 | 11/13/**14**/17/21 | theirs: 1:29% 2:44% 3:19% 4:6% 5+:2% | — | 43% |
| 2S | 10.7% | 306 | 125 | 9/12/**14**/16/16 | <5:2% 5:63% 6:32% 7:4% | **5.6** (3.9–6.8) | 8% |
| 2NT | 5.0% | 143 | 82 | 14/15/**16**/17/18 | — | — | 67% |
| 3C | 4.9% | 139 | 51 | 9/13/**13**/14/16 | 5:5% 6:82% 7:12% 8+:1% | **5.6** (4.8–6.7) | 0% |
| 3D | 2.8% | 81 | 37 | 9/11/**13**/13/16 | 5:15% 6:53% 7:32% | **6.3** (5.2–6.8) | 4% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 159 | 10/13/**14**/17/20 |
| X | fav | 123 | 11/13/**14**/17/20 |
| X | unfav | 137 | 11/13/**14**/17/22 |
| X | both | 75 | 11/13/**16**/19/22 |
| 2S | none | 97 | 8/12/**14**/14/15 |
| 2S | fav | 76 | 9/13/**16**/16/17 |
| 2S | unfav | 65 | 10/11/**13**/14/16 |
| 2S | both | 68 | 8/10/**15**/16/16 |
| 2NT | none | 33 | 14/15/**16**/17/18 |
| 2NT | unfav | 75 | 13/15/**16**/17/18 |
| 3C | none | 47 | 10/13/**13**/14/16 |
| 3C | fav | 27 | 9/10/**13**/13/13 |
| 3C | unfav | 49 | 11/13/**14**/14/14 |
| 3D | none | 32 | 9/10/**11**/14/16 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 11/**14**/16 (147) | 13/**15**/17 (215) | 13/**14**/18 (92) | 14/**16**/19 (40) |
| 2S | 10/**13**/15 (95) | 13/**14**/15 (99) | 12/**13**/14 (62) | 16/**16**/16 (50) |
| 2NT | — | 16/**17**/17 (44) | 14/**16**/17 (58) | 15/**16**/16 (41) |
| 3C | 12/**13**/13 (49) | 11/**12**/13 (21) | 13/**14**/14 (65) | — |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 22 | 95% | 95% | 100% | 91% |
| 11–13 | 155 | 97% | 86% | 99% | 73% |
| 14–16 | 161 | 92% | 69% | 92% | 78% |
| 17+ | 156 | 90% | 74% | 81% | 66% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 10..17 and h <= 2 and s >= 3 and d >= 2 and c >= 2) or (hcp in 13..17 and h == 3 and s >= 3 and d >= 2 and c >= 2) or hcp >= 18)`
- `2S` → `s >= 5 and top(s,5) >= 1 and (hcp >= 11 or top(s,5) >= 2) and ((hcp in 8..16 and h <= 2) or (hcp in 10..16 and h in 3..4))`
- `2NT` → `(has(h,a) or (has(h,k) and h >= 2) or (has(h,q) and h >= 3)) and hcp in 14..18`
- `3C` → `c >= 6 and top(c,5) >= 2 and ((hcp in 8..16 and h <= 2) or (hcp in 10..16 and h == 3))`
- `3D` → `d >= 5 and top(d,5) >= 2 and hcp in 9..16`

### (2S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 55.7% | 1868 | 658 | 3/7/**9**/11/14 | — | — | 47% |
| X | 21.0% | 706 | 215 | 11/13/**15**/16/20 | theirs: 0:6% 1:38% 2:39% 3:13% 4:4% | — | 34% |
| 3H | 8.1% | 273 | 78 | 10/11/**12**/13/16 | 5:25% 6:71% 7:3% 8+:1% | **5.2** (4.0–6.7) | 9% |
| 2NT | 7.5% | 252 | 84 | 15/16/**17**/17/18 | — | — | 88% |
| 3D | 2.4% | 82 | 36 | 10/13/**14**/14/17 | 5:15% 6:76% 7:6% 8:4% | **6.5** (5.4–6.9) | 0% |
| 3C | 2.3% | 77 | 45 | 9/11/**13**/14/16 | 5:25% 6:52% 7:22% 8+:1% | **5.8** (4.6–6.3) | 5% |
| 4H | 1.3% | 43 | 22 | 10/12/**14**/16/19 | 3:2% 6:49% 7:30% 8:19% | **5.9** (5.4–7.9) | 2% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 168 | 12/14/**15**/16/20 |
| X | fav | 159 | 12/13/**15**/17/19 |
| X | unfav | 232 | 11/13/**14**/14/19 |
| X | both | 147 | 11/15/**16**/19/22 |
| 3H | none | 47 | 9/13/**13**/13/16 |
| 3H | fav | 63 | 9/11/**11**/13/15 |
| 3H | unfav | 73 | 10/12/**13**/16/17 |
| 3H | both | 90 | 10/11/**12**/12/16 |
| 2NT | none | 35 | 15/16/**16**/17/18 |
| 2NT | fav | 42 | 15/17/**17**/17/18 |
| 2NT | unfav | 151 | 15/17/**17**/17/18 |
| 3D | none | 45 | 10/13/**14**/14/16 |
| 3C | both | 36 | 9/11/**12**/13/18 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 13/**15**/16 (310) | 14/**14**/16 (276) | 14/**16**/16 (90) | 17/**18**/18 (30) |
| 3H | 11/**12**/12 (112) | 11/**11**/14 (76) | 13/**13**/13 (73) | — |
| 2NT | — | 16/**16**/17 (24) | 16/**17**/17 (162) | 16/**17**/17 (65) |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 24 | 96% | 83% | 88% | 83% |
| 11–13 | 164 | 100% | 80% | 98% | 91% |
| 14–16 | 361 | 100% | 60% | 99% | 84% |
| 17+ | 157 | 95% | 76% | 83% | 72% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 11..17 and s <= 2 and h >= 3 and d >= 2 and c >= 2) or (hcp in 13..17 and s == 3 and h >= 3 and d >= 2 and c >= 2) or hcp >= 18)`
- `3H` → `h >= 5 and top(h,5) >= 2 and ((hcp in 9..16 and s <= 2) or (hcp in 12..16 and s == 3))`
- `2NT` → `(has(s,a) or (has(s,k) and s >= 2) or (has(s,q) and s >= 3)) and hcp in 15..18` *(+ balanced)*
- `3D` → `d >= 5 and top(d,5) >= 2 and hcp in 10..17`
- `3C` → `c >= 5 and top(c,5) >= 2 and ((hcp in 9..16 and s <= 2) or (hcp in 10..16 and s in 3..4))`

### (2NT) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 97.7% | 3044 | 822 | 2/4/**6**/8/12 | — | — | 51% |
| X | 0.9% | 28 | 16 | 12/14/**17**/19/21 | — | — | 57% |

### (3C) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 46.3% | 592 | 191 | 4/8/**10**/11/15 | — | — | 43% |
| X | 23.9% | 306 | 90 | 10/15/**16**/18/20 | theirs: 0:12% 1:28% 2:15% 3:39% 4:5% | — | 51% |
| 3H | 9.4% | 120 | 27 | 8/11/**11**/11/16 | 5:8% 6:89% 7:3% | **5.1** (5.1–5.1) | 2% |
| 3NT | 7.1% | 91 | 23 | 15/16/**17**/18/19 | — | — | 68% |
| 3D | 3.9% | 50 | 17 | 8/11/**11**/15/15 | 0:2% 2:2% 5:4% 6:78% 7:14% | **6.2** (5.9–6.2) | 0% |
| 4C | 3.4% | 43 | 8 | 12/14/**14**/14/14 | 0:81% 1:16% 2:2% | **0.0** (0.0–0.0) | 0% |
| 3S | 3.1% | 39 | 28 | 10/12/**13**/16/17 | 5:59% 6:33% 7:5% 8:3% | **5.0** (4.0–6.6) | 18% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 93 | 12/15/**17**/17/19 |
| X | unfav | 174 | 10/15/**15**/18/20 |
| 3H | none | 82 | 11/11/**11**/11/13 |
| 3NT | none | 37 | 16/16/**17**/17/19 |
| 3NT | unfav | 49 | 15/16/**17**/18/18 |
| 3D | unfav | 37 | 10/11/**11**/15/17 |
| 4C | unfav | 33 | 14/14/**14**/14/14 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 11/**16**/19 (122) | 15/**16**/17 (47) | 15/**15**/17 (119) | 16/**16**/17 (18) |
| 3H | — | 11/**11**/11 (81) | 8/**8**/12 (19) | — |

Anatomy of X: per HCP band, support held (both majors = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | both majors ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 31 | 97% | 94% | 100% | 100% |
| 11–13 | 23 | 100% | 65% | 100% | 100% |
| 14–16 | 119 | 97% | 56% | 92% | 37% |
| 17+ | 133 | 92% | 23% | 99% | 53% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 10..17 and c <= 2 and s >= 3 and h >= 3 and d >= 2) or (hcp in 15..17 and c == 3 and s >= 3 and h >= 3 and d >= 2) or hcp >= 18)`
- `3H` → `h >= 6 and top(h,5) >= 2 and hcp in 8..16`
- `3NT` → `(has(c,a) or (has(c,k) and c >= 2) or (has(c,q) and c >= 3)) and hcp in 15..19`
- `3D` → `d >= 6 and top(d,5) >= 3 and hcp in 8..15`

### (3D) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 49.2% | 706 | 215 | 6/9/**11**/12/14 | — | — | 51% |
| X | 16.5% | 236 | 85 | 9/13/**13**/16/20 | theirs: 0:10% 1:27% 2:54% 3:8% | — | 50% |
| 3H | 12.5% | 179 | 40 | 8/12/**12**/13/17 | 5:26% 6:72% 7+:2% | **6.2** (3.6–6.2) | 3% |
| 3S | 11.6% | 166 | 33 | 9/11/**11**/14/17 | 5:14% 6:70% 7:15% | **6.7** (6.7–7.8) | 13% |
| 3NT | 4.9% | 70 | 26 | 15/16/**16**/20/21 | — | — | 89% |
| 4S | 2.9% | 41 | 5 | 13/13/**14**/17/17 | 6:20% 7:51% 9:29% | **4.4** (4.4–10.0) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 112 | 12/13/**13**/13/20 |
| X | fav | 25 | 12/13/**15**/20/20 |
| X | unfav | 80 | 9/12/**14**/17/19 |
| 3H | unfav | 77 | 8/12/**13**/15/18 |
| 3H | both | 80 | 12/12/**12**/12/17 |
| 3S | none | 40 | 9/9/**10**/13/13 |
| 3S | fav | 35 | 14/14/**14**/14/14 |
| 3S | both | 68 | 11/11/**11**/11/16 |
| 3NT | none | 45 | 15/16/**16**/20/20 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 11/**13**/16 (88) | 13/**13**/16 (127) | 14/**15**/20 (19) | — |
| 3H | 12/**13**/15 (46) | 12/**12**/12 (93) | 12/**12**/12 (38) | — |
| 3S | 10/**10**/12 (17) | 11/**11**/14 (130) | 13/**13**/13 (16) | — |

Anatomy of X: per HCP band, support held (both majors = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | both majors ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 21 | 100% | 100% | 95% | 100% |
| 11–13 | 118 | 95% | 71% | 100% | 98% |
| 14–16 | 39 | 85% | 44% | 95% | 74% |
| 17+ | 58 | 74% | 9% | 98% | 84% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 9..17 and d <= 2 and s >= 3 and h >= 3 and c >= 3) or hcp >= 18)`
- `3H` → `h >= 5 and top(h,5) >= 1 and ((hcp in 8..17 and d <= 2) or (hcp in 11..17 and d == 3))`
- `3S` → `s >= 5 and top(s,5) >= 2 and hcp in 9..17`
- `3NT` → `(has(d,a) or (has(d,k) and d >= 2) or (has(d,q) and d >= 3)) and hcp in 15..21` *(+ balanced)*

### (3H) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 65.8% | 591 | 165 | 2/6/**10**/11/13 | — | — | 48% |
| X | 15.7% | 141 | 50 | 11/14/**15**/17/20 | theirs: <1:1% 1:40% 2:52% 3:4% 4+:2% | — | 45% |
| 3S | 7.5% | 67 | 31 | 8/10/**11**/13/17 | 5:40% 6:48% 7:12% | **4.3** (3.0–5.9) | 9% |
| 3NT | 6.5% | 58 | 28 | 14/16/**18**/18/18 | — | — | 33% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 44 | 10/14/**14**/14/18 |
| X | fav | 46 | 12/15/**17**/17/20 |
| X | unfav | 39 | 11/14/**14**/16/16 |
| 3S | both | 27 | 8/10/**10**/10/16 |
| 3NT | unfav | 34 | 14/16/**18**/18/18 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 13/**14**/14 (59) | 14/**16**/17 (73) | — | — |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| 11–13 | 20 | 100% | 65% | 100% | 90% |
| 14–16 | 77 | 99% | 71% | 96% | 96% |
| 17+ | 38 | 92% | 92% | 95% | 95% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 11..17 and h <= 2 and s >= 3 and d >= 2 and c >= 2) or hcp >= 18)`
- `3S` → `s >= 5 and top(s,5) >= 1 and hcp in 8..17`
- `3NT` → `(has(h,a) or (has(h,k) and h >= 2) or (has(h,q) and h >= 3)) and hcp in 14..18`

### (3S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 76.7% | 815 | 174 | 3/5/**10**/12/14 | — | — | 45% |
| X | 10.2% | 108 | 52 | 12/13/**15**/16/18 | theirs: 0:6% 1:27% 2:46% 3:15% 4:6% | — | 29% |
| 3NT | 7.2% | 77 | 26 | 11/17/**17**/18/19 | — | — | 79% |
| 4H | 2.9% | 31 | 19 | 8/12/**15**/17/18 | 4:3% 5:23% 6:65% 7:3% 8:6% | **5.9** (5.3–7.0) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 25 | 11/13/**16**/16/18 |
| X | fav | 31 | 15/16/**16**/16/23 |
| X | unfav | 34 | 11/13/**14**/15/17 |
| 3NT | unfav | 56 | 16/17/**17**/17/19 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 13/**13**/15 (36) | 13/**16**/16 (50) | 16/**16**/16 (16) | — |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| 11–13 | 33 | 100% | 88% | 97% | 94% |
| 14–16 | 59 | 97% | 68% | 98% | 78% |
| 17+ | 15 | 93% | 67% | 67% | 53% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 12..17 and s <= 3 and h >= 3 and d >= 2 and c >= 2) or hcp >= 18)`
- `3NT` → `(has(s,a) or (has(s,k) and s >= 2) or (has(s,q) and s >= 3)) and hcp in 11..19`

### (3NT) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 69.1% | 163 | 101 | 3/7/**10**/12/14 | — | — | 42% |
| X | 17.8% | 42 | 15 | 10/13/**13**/15/16 | — | — | 12% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | fav | 25 | 13/13/**13**/13/15 |

### (4C) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 55.0% | 83 | 47 | 4/7/**10**/13/15 | — | — | 46% |
| X | 21.9% | 33 | 16 | 11/14/**15**/15/20 | theirs: 0:27% 1:42% 2:6% 3:21% 5:3% | — | 21% |

### (4H) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 79.2% | 498 | 148 | 4/8/**10**/12/15 | — | — | 48% |
| 4S | 12.1% | 76 | 18 | 8/10/**10**/13/14 | <5:1% 5:33% 6:62% 7:4% | **6.7** (5.6–6.9) | 3% |
| X | 5.9% | 37 | 27 | 11/15/**17**/18/24 | theirs: 0:8% 1:19% 2:27% 3:43% 4:3% | — | 32% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 4S | unfav | 35 | 8/8/**12**/14/16 |

Dealer filters (paste into the custom filter box; derived from the data):

- `4S` → `s >= 5 and top(s,5) >= 2 and hcp in 8..14`

### (4S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 79.3% | 508 | 135 | 5/9/**10**/11/15 | — | — | 33% |
| X | 9.4% | 60 | 31 | 10/15/**16**/17/21 | theirs: 0:7% 1:35% 2:42% 3:3% 4:13% | — | 10% |
| 4NT | 6.7% | 43 | 8 | 10/15/**21**/21/21 | — | — | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 4NT | fav | 35 | 10/21/**21**/21/21 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 10..17 and s <= 4 and h >= 4 and d >= 2 and c >= 2) or hcp >= 18)`

## Action rates: how the opening’s meaning changes the direct seat

Share of direct-seat decisions when RHO opens. Raw rates are confounded by
strength depletion — a strong 1C means opener holds 16+, so the seats behind
hold less — so the second table fixes the acting hand’s own HCP band.

| opening faced | n | pass | X | suit bid | NT | any action |
|---|---|---|---|---|---|---|
| 1C natural (3+) | 25499 | 49% | 8% | 39% | 4% | 51% |
| 1C short (2+) | 1049 | 56% | 6% | 35% | 2% | 44% |
| 1C strong | 4706 | 62% | 4% | 32% | 2% | 38% |
| 1C Polish | 314 | 60% | 5% | 32% | 3% | 40% |
| 1D natural | 25322 | 52% | 10% | 35% | 4% | 48% |
| 1D nebulous | 1827 | 52% | 10% | 34% | 5% | 48% |
| 1H (any) | 18773 | 58% | 11% | 27% | 4% | 42% |
| 1S (any) | 20413 | 68% | 8% | 21% | 4% | 32% |

Action rate at fixed own strength (the fair comparison):

| opening faced | 6–8 HCP | 9–11 HCP | 12–14 HCP | 15+ HCP |
|---|---|---|---|---|
| 1C natural (3+) | 29% | 57% | 75% | 97% |
| 1C short (2+) | 27% | 47% | 69% | 92% |
| 1C strong | 33% | 48% | 66% | 72% |
| 1C Polish | 27% | 49% | 59% | — |
| 1D natural | 27% | 53% | 66% | 96% |
| 1D nebulous | 26% | 54% | 59% | 96% |
| 1H (any) | 21% | 40% | 66% | 96% |
| 1S (any) | 10% | 29% | 59% | 96% |

### (1C = strong, Precision-style) ? — for comparison

| action | n | HCP p5/p25/med/p75/p95 | bid-suit len | texture |
|---|---|---|---|---|
| P | 2919 | 2/5/**7**/9/13 | — | — |
| 1S | 382 | 5/8/**10**/12/15 | <4:4% 4:4% 5:75% 6:15% 7:2% | **4.3** (3.2–5.3) |
| 1H | 392 | 5/7/**10**/12/14 | <3:3% 3:2% 4:5% 5:71% 6:17% 7+:2% | **4.4** (3.4–5.9) |
| X | 173 | 5/8/**12**/14/19 | — | — |
| 1D | 247 | 6/7/**9**/11/15 | 2:4% 3:6% 4:11% 5:51% 6:24% 7:2% | **4.6** (3.4–5.9) |
| 1NT | 74 | 4/8/**12**/15/17 | — | — |
| 2H | 58 | 3/6/**8**/10/13 | 0:3% 1:3% 3:3% 4:3% 5:17% 6:60% 7:9% | **4.4** (3.1–6.4) |
| 2S | 77 | 4/5/**7**/10/12 | <5:4% 5:18% 6:74% 7:4% | **4.1** (3.8–5.3) |
| 2C | 112 | 6/7/**9**/11/14 | 1:9% 2:4% 5:28% 6:52% 7:4% | **5.1** (3.0–6.7) |
| 2D | 68 | 4/7/**9**/10/13 | 0:3% 1:3% 2:12% 3:13% 4:6% 5:7% 6:47% 7:9% | **4.1** (1.8–5.5) |
| 3H | 29 | 3/6/**8**/10/12 | 6:59% 7:41% | **4.5** (4.1–5.8) |
| 3S | 25 | 4/5/**6**/10/12 | 6:52% 7:36% 8:12% | **4.6** (3.6–6.4) |
| 3D | 47 | 3/8/**9**/10/13 | 6:60% 7:15% 8:26% | **5.0** (4.0–6.4) |
| 3C | 33 | 5/8/**10**/12/14 | 1:3% 2:3% 5:6% 6:64% 7:24% | **5.3** (4.5–7.3) |

## Balancing seat: (opening) P (P) ?

Includes balancing over weak twos and preempts — the classic "protect with less" seat.

### (1C) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| X | 35.6% | 106 | 53 | 9/11/**14**/17/19 | theirs: 1:35% 2:26% 3:33% 4+:5% | — | 49% |
| P | 26.5% | 79 | 52 | 4/8/**8**/10/15 | — | — | 66% |
| 1S | 13.4% | 40 | 13 | 10/10/**12**/14/14 | 5:93% 6:8% | **4.4** (2.6–4.6) | 35% |
| 1NT | 8.7% | 26 | 15 | 10/11/**14**/14/16 | — | — | 96% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | unfav | 51 | 10/11/**12**/17/18 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 11/**11**/17 (38) | 10/**11**/14 (28) | 12/**14**/18 (35) | — |

Anatomy of X: per HCP band, support held (both majors = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | both majors ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 19 | 100% | 47% | 100% | 68% |
| 11–13 | 30 | 100% | 77% | 100% | 77% |
| 14–16 | 25 | 68% | 28% | 100% | 52% |
| 17+ | 32 | 81% | 6% | 97% | 53% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 8..17 and c <= 2 and s >= 3 and h >= 3 and d >= 2) or (hcp in 10..17 and c == 3 and s >= 3 and h >= 3 and d >= 2) or hcp >= 18)`

### (1D) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| X | 35.2% | 196 | 74 | 8/9/**11**/16/19 | theirs: 0:6% 1:10% 2:46% 3:26% 4:8% 5:5% | — | 60% |
| P | 21.0% | 117 | 50 | 5/8/**8**/8/10 | — | — | 56% |
| 1H | 18.1% | 101 | 32 | 6/9/**14**/14/14 | 5:95% 6:4% | **7.5** (4.1–7.5) | 7% |
| 1S | 10.6% | 59 | 32 | 7/10/**12**/13/15 | 5:92% 6:8% | **4.6** (4.4–5.0) | 24% |
| 1NT | 8.3% | 46 | 31 | 11/11/**13**/14/16 | — | — | 98% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 26 | 8/14/**14**/15/19 |
| X | fav | 51 | 8/12/**18**/19/19 |
| X | unfav | 51 | 8/11/**11**/16/17 |
| X | both | 68 | 8/9/**9**/10/16 |
| 1H | none | 62 | 12/14/**14**/14/14 |
| 1H | both | 25 | 6/6/**9**/10/12 |
| 1S | fav | 28 | 9/12/**12**/12/14 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 9/**14**/15 (30) | 9/**9**/12 (91) | 11/**13**/19 (51) | 17/**17**/18 (24) |
| 1H | 14/**14**/14 (71) | 9/**9**/12 (18) | — | — |

Anatomy of X: per HCP band, support held (both majors = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | both majors ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 77 | 94% | 23% | 100% | 94% |
| 11–13 | 36 | 97% | 19% | 100% | 22% |
| 14–16 | 40 | 63% | 23% | 100% | 85% |
| 17+ | 43 | 72% | 42% | 44% | 16% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 8..17 and d <= 4 and s >= 3 and h >= 3 and c >= 3) or hcp >= 18)`
- `1H` → `h >= 5 and top(h,5) >= 1 and hcp in 6..14`
- `1S` → `s >= 5 and top(s,5) >= 2 and hcp in 7..15`

### (1H) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 34.8% | 178 | 44 | 6/7/**9**/10/11 | — | — | 62% |
| X | 28.6% | 146 | 51 | 7/10/**15**/22/22 | theirs: <1:1% 1:8% 2:41% 3:46% 4:3% | — | 51% |
| 1S | 11.2% | 57 | 27 | 7/7/**10**/11/15 | <5:4% 5:61% 6:33% 7+:2% | **5.1** (2.2–5.4) | 35% |
| 1NT | 10.8% | 55 | 24 | 10/11/**11**/14/16 | — | — | 62% |
| 3NT | 4.9% | 25 | 1 | 22/22/**22**/22/22 | — | — | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 55 | 7/16/**22**/22/22 |
| X | fav | 34 | 7/12/**15**/16/18 |
| X | both | 51 | 10/10/**15**/16/17 |
| 1S | unfav | 27 | 7/8/**11**/11/13 |
| 1NT | both | 29 | 10/11/**11**/11/16 |
| 3NT | none | 25 | 22/22/**22**/22/22 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | — | 10/**11**/15 (60) | 16/**22**/22 (67) | — |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 39 | 100% | 41% | 100% | 90% |
| 14–16 | 45 | 100% | 69% | 67% | 51% |
| 17+ | 49 | 100% | 12% | 18% | 12% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 7..17 and h <= 2 and s >= 3) or (hcp in 15..17 and h == 3 and s >= 3) or hcp >= 18)`
- `1S` → `s >= 5 and top(s,5) >= 2 and hcp in 7..15`
- `1NT` → `hcp in 10..16`

### (1S) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| X | 38.5% | 256 | 63 | 9/9/**10**/16/17 | theirs: 1:45% 2:44% 3:9% 4+:2% | — | 41% |
| P | 33.2% | 221 | 82 | 5/6/**8**/9/11 | — | — | 63% |
| 1NT | 10.5% | 70 | 41 | 9/11/**12**/15/16 | — | — | 79% |
| 2C | 6.0% | 40 | 11 | 9/9/**11**/13/15 | 5:80% 6:20% | **6.0** (5.3–7.1) | 0% |
| 2H | 5.4% | 36 | 15 | 9/10/**10**/15/15 | 5:86% 6:11% 7:3% | **5.8** (4.3–6.8) | 14% |
| 2D | 4.7% | 31 | 17 | 8/10/**12**/12/16 | 5:77% 6:13% 7:6% 8:3% | **4.6** (3.6–6.3) | 42% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 56 | 10/10/**10**/15/18 |
| X | fav | 77 | 8/11/**16**/16/17 |
| X | unfav | 34 | 7/10/**12**/12/17 |
| X | both | 89 | 9/9/**9**/10/14 |
| 1NT | fav | 26 | 10/10/**11**/15/16 |
| 2C | both | 29 | 9/9/**13**/13/13 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 9/**9**/10 (115) | 10/**15**/16 (113) | 12/**15**/17 (22) | — |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 132 | 100% | 47% | 100% | 98% |
| 11–13 | 34 | 91% | 47% | 100% | 85% |
| 14–16 | 70 | 97% | 79% | 91% | 84% |
| 17+ | 20 | 70% | 55% | 85% | 55% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 9..15 and s <= 3 and h >= 3 and d >= 3 and c >= 3) or hcp >= 16)`
- `1NT` → `hcp in 9..16`

### (1NT) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 64.0% | 2596 | 1010 | 4/7/**9**/10/13 | — | — | 78% |
| X | 10.3% | 419 | 225 | 7/10/**12**/15/17 | — | — | 40% |
| 2C | 7.1% | 286 | 157 | 5/8/**9**/11/14 | 0:9% 1:21% 2:17% 3:24% 4:17% 5:10% 6+:1% | **2.8** (0.2–4.5) | 13% |
| 2D | 6.1% | 249 | 107 | 6/9/**9**/11/15 | <1:2% 1:5% 2:24% 3:31% 4:25% 5:10% 6:2% | **3.7** (1.1–4.4) | 14% |
| 2H | 5.2% | 210 | 82 | 7/8/**10**/11/15 | <4:2% 4:3% 5:79% 6:11% 7:5% | **4.5** (3.8–6.2) | 7% |
| 2S | 4.9% | 199 | 64 | 6/9/**10**/13/16 | 5:67% 6:32% 7+:1% | **4.0** (3.0–5.2) | 13% |
| 3H | 0.9% | 37 | 1 | 9/9/**9**/9/9 | 7:100% | **4.4** (4.4–4.4) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 142 | 7/10/**14**/15/17 |
| X | fav | 65 | 8/10/**11**/12/15 |
| X | unfav | 121 | 8/11/**14**/16/18 |
| X | both | 91 | 7/10/**10**/14/17 |
| 2C | none | 97 | 4/8/**10**/10/14 |
| 2C | fav | 53 | 5/8/**9**/11/14 |
| 2C | unfav | 57 | 7/8/**9**/12/14 |
| 2C | both | 79 | 6/7/**8**/10/13 |
| 2D | none | 89 | 7/8/**9**/11/15 |
| 2D | fav | 30 | 6/9/**9**/11/11 |
| 2D | unfav | 75 | 6/9/**11**/11/12 |
| 2D | both | 55 | 8/9/**9**/10/14 |
| 2H | none | 48 | 7/7/**8**/10/15 |
| 2H | fav | 97 | 7/9/**11**/11/11 |
| 2H | unfav | 37 | 6/10/**10**/13/15 |
| 2H | both | 28 | 7/9/**9**/10/15 |
| 2S | none | 83 | 6/8/**9**/15/16 |
| 2S | unfav | 68 | 7/11/**13**/13/13 |
| 2S | both | 29 | 8/10/**10**/11/13 |
| 3H | both | 37 | 9/9/**9**/9/9 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 7..17`
- `2C` → `(hcp in 5..14 and s >= 4 and h >= 4)`
- `2D` → `((hcp in 6..15 and s >= 5) or (hcp in 6..15 and h >= 5))`
- `2H` → `h >= 5 and top(h,5) >= 1 and ((hcp in 7..15 and d >= 4) or (hcp in 7..15 and c >= 4))`
- `2S` → `s >= 5 and top(s,5) >= 1 and hcp in 6..16`

### (2C) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 44.8% | 47 | 39 | 4/6/**9**/10/12 | — | — | 66% |
| X | 27.6% | 29 | 17 | 8/10/**12**/18/18 | theirs: 0:7% 1:41% 2:10% 3:38% 4:3% | — | 48% |

### (2D) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 46.9% | 90 | 67 | 4/8/**9**/11/13 | — | — | 73% |
| X | 27.6% | 53 | 42 | 8/11/**13**/18/20 | theirs: <1:2% 1:28% 2:36% 3:21% 4:11% 5+:2% | — | 51% |
| 2H | 14.6% | 28 | 13 | 7/12/**14**/14/14 | 3:4% 5:36% 6:61% | **4.5** (3.7–4.6) | 11% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 8..17 and d <= 4 and s >= 3 and h >= 3 and c >= 3) or hcp >= 18)`

### (2H) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 54.3% | 315 | 141 | 5/8/**9**/11/14 | — | — | 71% |
| X | 20.7% | 120 | 60 | 9/10/**11**/14/17 | theirs: 1:18% 2:59% 3:16% 4:6% | — | 66% |
| 2NT | 7.9% | 46 | 25 | 14/14/**16**/17/18 | — | — | 87% |
| 2S | 6.7% | 39 | 25 | 9/10/**12**/12/17 | 4:3% 5:85% 6:10% 7:3% | **4.6** (3.4–5.1) | 13% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 30 | 8/10/**13**/17/21 |
| X | unfav | 53 | 9/10/**11**/11/14 |
| X | both | 25 | 10/12/**12**/12/16 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 9/**10**/13 (23) | 10/**11**/12 (71) | 14/**14**/16 (19) | — |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 40 | 100% | 63% | 98% | 100% |
| 11–13 | 47 | 100% | 26% | 98% | 91% |
| 14–16 | 20 | 100% | 55% | 90% | 45% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 9..16 and h <= 3 and s >= 3 and d >= 2 and c >= 2) or hcp >= 17)`

### (2S) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 43.0% | 371 | 185 | 6/8/**9**/11/14 | — | — | 63% |
| X | 28.4% | 245 | 78 | 9/12/**14**/19/21 | theirs: 1:32% 2:31% 3:36% | — | 45% |
| 2NT | 10.7% | 92 | 35 | 13/14/**15**/15/17 | — | — | 84% |
| 3H | 6.6% | 57 | 20 | 9/13/**14**/14/15 | 5:23% 6:72% 7:5% | **4.5** (4.5–4.9) | 5% |
| 3D | 4.6% | 40 | 14 | 8/11/**13**/16/16 | 4:3% 5:8% 6:83% 7:8% | **6.4** (4.3–6.4) | 8% |
| 3C | 3.2% | 28 | 15 | 9/11/**13**/14/16 | 5:25% 6:61% 7:14% | **6.6** (5.5–6.7) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 90 | 9/10/**14**/15/19 |
| X | fav | 55 | 10/16/**18**/21/21 |
| X | unfav | 52 | 10/11/**14**/19/20 |
| X | both | 48 | 9/10/**14**/14/18 |
| 2NT | none | 43 | 14/15/**15**/15/17 |
| 2NT | both | 30 | 13/15/**15**/15/16 |
| 3H | none | 37 | 9/14/**14**/14/14 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 12/**14**/21 (80) | 9/**11**/16 (76) | 14/**15**/19 (87) | — |

Anatomy of X: per HCP band, support held (other major = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | other major ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| ≤10 | 45 | 98% | 84% | 100% | 89% |
| 11–13 | 38 | 100% | 84% | 95% | 84% |
| 14–16 | 87 | 100% | 82% | 87% | 51% |
| 17+ | 75 | 100% | 60% | 83% | 53% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 9..17 and s <= 2 and h >= 3 and d >= 2 and c >= 2) or (hcp in 10..17 and s == 3 and h >= 3 and d >= 2 and c >= 2) or hcp >= 18)`
- `2NT` → `(has(s,a) or (has(s,k) and s >= 2) or (has(s,q) and s >= 3)) and hcp in 13..17` *(+ balanced)*
- `3H` → `h >= 5 and top(h,5) >= 1 and hcp in 9..15`

### (2NT) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 95.1% | 137 | 86 | 3/7/**9**/10/13 | — | — | 69% |

### (3C) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 41.0% | 164 | 74 | 2/7/**8**/10/14 | — | — | 72% |
| X | 27.5% | 110 | 36 | 10/14/**15**/17/19 | theirs: 0:5% 1:37% 2:33% 3:24% 4+:2% | — | 45% |
| 3NT | 16.8% | 67 | 19 | 14/17/**17**/18/21 | — | — | 93% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 50 | 14/15/**15**/15/18 |
| X | unfav | 42 | 8/10/**16**/17/18 |
| 3NT | unfav | 42 | 14/17/**17**/17/21 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 15/**15**/15 (46) | 10/**14**/17 (36) | 17/**17**/19 (26) | — |

Anatomy of X: per HCP band, support held (both majors = min length; unbid
minors = min length). Strong doubles relax shape:

| band | n | both majors ≥3 | ≥4 | unbid minor(s) ≥2 | ≤2 in their suit |
|---|---|---|---|---|---|
| 14–16 | 50 | 100% | 66% | 100% | 98% |
| 17+ | 41 | 76% | 17% | 100% | 37% |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 10..17 and c <= 2 and s >= 3 and h >= 3 and d >= 3) or (hcp in 15..17 and c == 3 and s >= 3 and h >= 3 and d >= 3) or hcp >= 18)`
- `3NT` → `(has(c,a) or (has(c,k) and c >= 2) or (has(c,q) and c >= 3)) and hcp in 14..21` *(+ balanced)*

### (3D) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 56.8% | 226 | 78 | 6/8/**9**/11/13 | — | — | 62% |
| X | 20.9% | 83 | 49 | 8/11/**12**/16/20 | theirs: 0:7% 1:31% 2:51% 3:11% | — | 40% |
| 3NT | 9.5% | 38 | 20 | 11/17/**18**/20/20 | — | — | 47% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 26 | 9/11/**13**/19/19 |
| X | unfav | 39 | 8/11/**12**/15/20 |
| 3NT | unfav | 30 | 15/17/**20**/20/20 |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `((hcp in 8..17 and d <= 3 and s >= 3 and h >= 3 and c >= 3) or hcp >= 18)`

### (3H) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 55.9% | 146 | 61 | 7/8/**9**/11/15 | — | — | 70% |
| X | 14.9% | 39 | 19 | 9/12/**12**/14/18 | theirs: 0:3% 1:51% 2:31% 3:5% 4:10% | — | 31% |
| 3NT | 13.0% | 34 | 15 | 12/15/**16**/17/20 | — | — | 56% |
| 4S | 11.5% | 30 | 4 | 11/17/**17**/17/18 | 5:7% 6:87% 7:7% | **6.2** (6.2–6.2) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 4S | none | 27 | 17/17/**17**/17/17 |

### (3S) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 59.1% | 189 | 65 | 6/9/**10**/11/14 | — | — | 47% |
| X | 15.0% | 48 | 27 | 9/12/**13**/15/19 | theirs: 0:2% 1:65% 2:27% 3:6% | — | 15% |
| 3NT | 13.4% | 43 | 16 | 11/11/**15**/19/20 | — | — | 42% |
| 4H | 8.4% | 27 | 6 | 14/14/**16**/16/20 | 5:15% 6:85% | **6.5** (4.5–6.5) | 15% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | unfav | 25 | 10/13/**13**/15/20 |
| 3NT | none | 26 | 11/11/**11**/15/18 |

### (4H) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 82.6% | 351 | 115 | 4/6/**8**/9/11 | — | — | 18% |
| X | 7.5% | 32 | 20 | 7/12/**16**/19/23 | theirs: 0:3% 1:59% 2:19% 3:16% 4:3% | — | 28% |

### (4S) P (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 89.6% | 438 | 118 | 5/7/**8**/10/13 | — | — | 53% |
| X | 7.4% | 36 | 17 | 8/14/**14**/16/22 | theirs: 0:3% 1:58% 2:31% 4:8% | — | 14% |

## Responding after interference: partner opens, RHO acts

Key contexts: 1x (X) ? — redouble/new suits/jump raises; 1x (overcall) ? — negative doubles, raises, free bids. 1C contexts show STANDARD responders (transfer-response pairs are tabulated separately below); 1D contexts use natural openers. After 1M (X) much of the field plays transfers / graded raises (2M−1 constructive, 2M weak or vice versa), so read the **partner's suit** column: when most hands hold 3+ support, the bid is a raise in disguise and its derived rule keys on support + strength band, not the named suit.

### 1C (X) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♣ |
|---|---|---|---|---|---|---|---|---|
| P | 30.5% | 384 | 295 | 0/3/**4**/5/7 | — | — | 65% | 1:2% 2:42% 3:30% 4:21% 5:3% |
| 1D | 16.5% | 207 | 219 | 4/6/**7**/9/11 | <2:2% 2:9% 3:11% 4:14% 5:45% 6:19% | **4.0** (2.2–5.1) | 31% | 0:2% 1:18% 2:33% 3:19% 4:23% 5:2% 6:2% |
| 1H | 16.0% | 201 | 191 | 4/6/**7**/8/10 | 1:8% 2:7% 3:11% 4:45% 5:19% 6:8% | **3.4** (1.6–4.4) | 28% | 1:22% 2:25% 3:23% 4:15% 5:8% 6:6% |
| 1S | 15.7% | 198 | 144 | 4/6/**7**/8/11 | <2:2% 2:4% 3:12% 4:38% 5:30% 6:11% 7:5% | **3.2** (1.8–4.2) | 36% | <1:1% 1:13% 2:34% 3:24% 4:11% 5:18% |
| XX | 8.7% | 109 | 139 | 9/10/**11**/12/15 | — | — | 59% | 0:6% 1:6% 2:19% 3:34% 4:20% 5:13% 6:3% |
| 2C | 3.4% | 43 | 67 | 4/6/**7**/7/9 | 1:7% 4:47% 5:40% 6:7% | **2.9** (2.0–4.4) | 58% | 1:7% 4:47% 5:40% 6:7% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1D | none | 59 | 4/5/**8**/9/11 |
| 1D | fav | 79 | 4/6/**7**/8/10 |
| 1D | unfav | 28 | 6/6/**7**/10/13 |
| 1D | both | 41 | 4/5/**6**/8/10 |
| 1H | none | 66 | 5/6/**6**/7/9 |
| 1H | fav | 56 | 4/6/**7**/8/9 |
| 1H | unfav | 38 | 4/6/**7**/8/13 |
| 1H | both | 41 | 4/6/**7**/8/10 |
| 1S | none | 75 | 3/6/**7**/8/9 |
| 1S | fav | 37 | 1/6/**7**/8/10 |
| 1S | unfav | 30 | 4/6/**8**/9/11 |
| 1S | both | 56 | 5/7/**7**/9/11 |
| XX | unfav | 25 | 8/10/**11**/12/14 |
| XX | both | 47 | 9/10/**11**/11/14 |

Dealer filters (paste into the custom filter box; derived from the data):

- `1D` → `hcp in 4..11`
- `1H` → `hcp in 4..10`
- `1S` → `s >= 3 and hcp in 4..11`
- `XX` → `hcp in 9..15`

### 1D (X) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♦ |
|---|---|---|---|---|---|---|---|---|
| P | 25.0% | 636 | 278 | 0/1/**4**/5/8 | — | — | 52% | 0:2% 1:29% 2:31% 3:22% 4:11% 5:4% |
| 1H | 22.8% | 579 | 232 | 4/6/**8**/10/12 | 1:3% 2:6% 3:6% 4:32% 5:36% 6:10% 7:7% | **3.4** (2.3–4.8) | 28% | <1:2% 1:24% 2:23% 3:32% 4:17% 5+:3% |
| 1S | 18.8% | 477 | 162 | 3/6/**7**/9/11 | 3:4% 4:39% 5:42% 6:9% 7:5% | **4.1** (2.2–4.8) | 37% | 0:13% 1:16% 2:20% 3:19% 4:19% 5:12% 6+:1% |
| XX | 13.3% | 339 | 173 | 6/9/**11**/12/15 | — | — | 47% | 0:9% 1:13% 2:19% 3:30% 4:12% 5:15% 6:2% |
| 3D | 5.2% | 133 | 71 | 2/5/**6**/8/9 | <4:2% 4:34% 5:55% 6:7% 7:3% | **2.5** (2.2–3.4) | 32% | <4:2% 4:34% 5:55% 6:7% 7:3% |
| 2D | 4.4% | 111 | 78 | 3/5/**6**/8/12 | 2:5% 3:14% 4:57% 5:23% 6+:3% | **2.6** (2.1–3.5) | 62% | 2:5% 3:14% 4:57% 5:23% 6+:3% |
| 1NT | 1.7% | 43 | 47 | 7/7/**9**/9/10 | — | — | 86% | 1:2% 2:14% 3:37% 4:37% 5:9% |
| 2C | 1.8% | 45 | 35 | 4/6/**7**/8/11 | 1:2% 2:4% 3:4% 4:9% 5:11% 6:60% 7:9% | **3.4** (2.8–4.1) | 16% | 0:2% 1:36% 2:27% 3:18% 4:7% 5:9% 7:2% |
| 2NT | 1.1% | 29 | 23 | 3/6/**8**/14/15 | — | — | 45% | 4:21% 5:69% 6:10% |
| 2S | 1.3% | 33 | 13 | 3/3/**3**/8/15 | 3:24% 5:6% 6:9% 7:61% | **3.4** (2.9–3.4) | 18% | 0:3% 1:58% 2:9% 3:3% 4:3% 5:21% 6:3% |
| 3C | 1.0% | 25 | 19 | 6/7/**8**/10/10 | 1:4% 2:8% 3:12% 4:8% 5:60% 6:4% 7:4% | **3.3** (3.2–3.4) | 16% | 2:4% 4:68% 5:28% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1H | none | 145 | 4/5/**8**/11/11 |
| 1H | fav | 114 | 5/7/**7**/9/10 |
| 1H | unfav | 142 | 6/8/**8**/10/12 |
| 1H | both | 178 | 5/6/**7**/8/14 |
| 1S | none | 105 | 5/8/**8**/10/12 |
| 1S | fav | 82 | 4/6/**7**/10/10 |
| 1S | unfav | 104 | 1/3/**7**/8/12 |
| 1S | both | 186 | 5/6/**7**/8/9 |
| XX | none | 144 | 7/10/**11**/11/15 |
| XX | fav | 63 | 6/8/**9**/10/12 |
| XX | unfav | 79 | 5/10/**12**/13/15 |
| XX | both | 53 | 6/7/**9**/11/14 |
| 3D | fav | 30 | 5/5/**6**/8/9 |
| 3D | unfav | 44 | 2/3/**6**/6/9 |
| 3D | both | 37 | 2/6/**7**/8/9 |
| 2D | fav | 35 | 3/5/**7**/7/9 |
| 2D | unfav | 32 | 2/5/**6**/10/15 |
| 2D | both | 28 | 5/6/**6**/7/8 |

Dealer filters (paste into the custom filter box; derived from the data):

- `1H` → `h >= 3 and hcp in 4..12`
- `1S` → `s >= 4 and top(s,5) >= 1 and hcp in 3..11`
- `XX` → `hcp in 6..15`
- `3D` → `d >= 4 and top(d,5) >= 1 and hcp in 2..9`
- `2D` → `d >= 3 and hcp in 3..12`

### 1H (X) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♥ |
|---|---|---|---|---|---|---|---|---|
| P | 25.5% | 552 | 178 | 0/1/**4**/6/8 | — | — | 38% | <1:2% 1:42% 2:40% 3:16% |
| 2H | 12.1% | 261 | 114 | 3/5/**6**/7/9 | <3:2% 3:84% 4:13% 5+:2% | **2.5** (1.1–4.0) | 87% | <3:2% 3:84% 4:13% 5+:2% |
| XX | 10.9% | 235 | 80 | 9/10/**10**/12/15 | — | — | 65% | 1:3% 2:75% 3:17% 4:3% |
| 2NT | 9.8% | 212 | 58 | 8/9/**10**/13/14 | — | — | 80% | <4:2% 4:85% 5:12% |
| 1S | 9.3% | 200 | 72 | 4/7/**7**/10/12 | 2:3% 3:4% 4:39% 5:42% 6:13% | **4.3** (2.5–4.6) | 30% | 0:8% 1:22% 2:61% 3:7% 4+:3% |
| 2D | 8.3% | 180 | 88 | 5/7/**8**/9/13 | 1:2% 2:26% 3:27% 4:19% 5:22% 6:3% | **3.3** (0.9–4.9) | 72% | <2:2% 2:4% 3:71% 4:22% |
| 4H | 7.4% | 159 | 53 | 4/6/**6**/8/13 | 3:6% 4:16% 5:70% 6:8% | **4.4** (2.7–5.1) | 21% | 3:6% 4:16% 5:70% 6:8% |
| 3H | 4.8% | 104 | 53 | 3/5/**6**/8/9 | 3:6% 4:88% 5:7% | **3.7** (1.9–4.4) | 67% | 3:6% 4:88% 5:7% |
| 1NT | 2.9% | 62 | 32 | 7/7/**8**/9/10 | — | — | 40% | 1:29% 2:47% 3:16% 4:5% 5:3% |
| 3D | 2.5% | 54 | 34 | 5/7/**8**/9/13 | 1:13% 2:7% 3:46% 4:15% 5:13% 6:2% 7:4% | **2.3** (0.9–3.8) | 57% | <3:2% 3:6% 4:74% 5:19% |
| 2C | 2.3% | 49 | 24 | 4/6/**7**/7/10 | 0:6% 1:2% 2:24% 3:37% 4:8% 5:8% 6:14% | **2.3** (1.9–3.3) | 24% | 0:4% 1:47% 2:16% 3:33% |
| 3C | 1.9% | 40 | 22 | 5/7/**8**/9/9 | 0:3% 1:13% 2:18% 3:33% 4:30% 5:5% | **1.1** (0.0–3.4) | 65% | 2:3% 3:5% 4:90% 6:3% |
| 2S | 1.2% | 27 | 20 | 5/7/**8**/9/13 | 1:15% 2:15% 3:15% 4:41% 6:7% 7:7% | **2.8** (0.8–3.4) | 56% | 0:4% 2:4% 3:4% 4:81% 5:7% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2H | none | 65 | 4/6/**7**/8/9 |
| 2H | fav | 72 | 3/5/**5**/7/7 |
| 2H | unfav | 44 | 4/5/**6**/8/9 |
| 2H | both | 80 | 2/4/**6**/7/8 |
| XX | none | 52 | 9/10/**11**/15/17 |
| XX | fav | 55 | 9/10/**12**/12/14 |
| XX | unfav | 53 | 9/10/**11**/12/14 |
| XX | both | 75 | 9/10/**10**/10/11 |
| 2NT | none | 69 | 8/13/**14**/14/14 |
| 2NT | unfav | 99 | 9/9/**9**/9/11 |
| 2NT | both | 31 | 8/9/**12**/13/13 |
| 1S | none | 72 | 5/7/**7**/7/8 |
| 1S | fav | 33 | 4/7/**8**/10/10 |
| 1S | unfav | 43 | 6/7/**10**/12/12 |
| 1S | both | 52 | 3/6/**8**/10/10 |
| 2D | none | 58 | 4/7/**7**/9/14 |
| 2D | fav | 28 | 5/7/**7**/9/14 |
| 2D | unfav | 52 | 6/8/**9**/9/11 |
| 2D | both | 42 | 6/7/**9**/10/13 |
| 4H | none | 31 | 3/7/**11**/13/14 |
| 4H | fav | 98 | 3/6/**6**/6/8 |

Dealer filters (paste into the custom filter box; derived from the data):

- `2H` → `h >= 3 and hcp in 3..9`
- `XX` → `hcp in 9..15`
- `2NT` → `h >= 4 and hcp in 8..14`
- `1S` → `s >= 4 and top(s,5) >= 1 and hcp in 4..12`
- `2D` → `h >= 3 and hcp in 5..13`
- `4H` → `h >= 4 and hcp in 4..13`

### 1S (X) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♠ |
|---|---|---|---|---|---|---|---|---|
| P | 25.2% | 415 | 189 | 1/3/**4**/6/9 | — | — | 43% | 0:8% 1:14% 2:51% 3:25% 4+:2% |
| 2S | 16.8% | 276 | 117 | 3/4/**6**/7/8 | 3:90% 4:9% | **1.7** (1.1–3.2) | 68% | 3:90% 4:9% |
| 2H | 10.6% | 174 | 96 | 5/7/**8**/9/11 | 1:3% 2:37% 3:27% 4:18% 5:11% 6:3% | **2.7** (1.5–4.0) | 64% | <3:2% 3:79% 4:19% |
| XX | 7.7% | 126 | 68 | 9/10/**11**/13/15 | — | — | 71% | 1:7% 2:49% 3:39% 4:4% |
| 2NT | 7.5% | 124 | 46 | 8/9/**10**/11/13 | — | — | 69% | 3:5% 4:89% 5:5% 6+:2% |
| 1NT | 6.9% | 114 | 62 | 5/6/**8**/8/10 | — | — | 22% | 0:4% 1:39% 2:38% 3:17% 4:3% |
| 3S | 6.9% | 113 | 50 | 1/2/**5**/6/8 | 3:3% 4:82% 5:14% | **2.6** (1.1–3.4) | 71% | 3:3% 4:82% 5:14% |
| 4S | 6.8% | 112 | 54 | 3/6/**7**/9/13 | 3:9% 4:56% 5:31% 6:4% | **3.4** (2.6–4.6) | 26% | 3:9% 4:56% 5:31% 6:4% |
| 2C | 4.4% | 73 | 36 | 4/6/**6**/9/10 | 1:10% 2:10% 3:48% 4:7% 5:7% 6:11% 8:8% | **4.3** (2.6–4.4) | 14% | 0:37% 1:18% 2:29% 3:11% 4:5% |
| 2D | 1.9% | 32 | 24 | 5/6/**8**/9/11 | 1:3% 2:25% 3:25% 4:9% 5:9% 6:28% | **2.9** (0.9–3.0) | 25% | 0:25% 1:9% 2:34% 3:22% 4:9% |
| 3C | 1.7% | 28 | 18 | 6/7/**8**/9/10 | 2:25% 3:25% 4:14% 5:18% 6:7% 8:11% | **2.8** (0.4–4.4) | 50% | 1:11% 3:14% 4:61% 5:14% |
| 3H | 1.7% | 28 | 21 | 6/6/**7**/8/12 | 1:4% 2:18% 3:39% 4:25% 5:11% 6:4% | **2.4** (1.1–4.5) | 68% | 3:4% 4:82% 5:14% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2S | none | 48 | 3/5/**6**/8/9 |
| 2S | fav | 58 | 1/4/**5**/6/8 |
| 2S | unfav | 93 | 4/4/**5**/7/8 |
| 2S | both | 77 | 3/6/**7**/8/8 |
| 2H | none | 34 | 7/8/**9**/9/10 |
| 2H | fav | 32 | 2/5/**6**/9/13 |
| 2H | unfav | 35 | 6/7/**9**/11/14 |
| 2H | both | 73 | 6/8/**8**/8/10 |
| XX | fav | 34 | 9/10/**13**/13/14 |
| XX | unfav | 31 | 9/10/**11**/13/15 |
| XX | both | 37 | 9/10/**11**/11/13 |
| 2NT | none | 28 | 8/9/**10**/10/10 |
| 2NT | unfav | 29 | 9/10/**10**/10/12 |
| 2NT | both | 53 | 7/8/**10**/11/13 |
| 1NT | none | 46 | 6/6/**6**/7/10 |
| 1NT | fav | 28 | 5/7/**8**/8/10 |
| 1NT | both | 27 | 6/8/**8**/9/10 |
| 3S | fav | 66 | 1/2/**2**/5/7 |
| 3S | both | 32 | 3/5/**6**/7/10 |

Dealer filters (paste into the custom filter box; derived from the data):

- `2S` → `s >= 3 and hcp in 3..8`
- `2H` → `s >= 3 and hcp in 5..11`
- `XX` → `hcp in 9..15`
- `2NT` → `s >= 4 and hcp in 8..13`
- `1NT` → `hcp in 5..10`
- `3S` → `s >= 4 and hcp in 1..8`

### 1C (1S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♣ |
|---|---|---|---|---|---|---|---|---|
| X | 39.7% | 709 | 421 | 5/7/**9**/11/16 | theirs: <1:2% 1:19% 2:35% 3:27% 4:15% | — | 51% | <1:1% 1:14% 2:21% 3:42% 4:12% 5:10% |
| P | 26.5% | 473 | 352 | 1/4/**5**/6/8 | — | — | 58% | 1:10% 2:29% 3:29% 4:25% 5:5% 6+:1% |
| 1NT | 8.3% | 148 | 102 | 7/8/**9**/10/10 | — | — | 97% | 1:2% 2:3% 3:63% 4:25% 5:7% |
| 2H | 7.1% | 126 | 139 | 6/10/**10**/12/14 | 2:5% 3:16% 5:37% 6:24% 7:10% 8:8% | **4.3** (3.1–5.5) | 20% | 0:6% 1:20% 2:29% 3:30% 4:10% 5:2% 6+:2% |
| 2D | 5.2% | 92 | 123 | 6/8/**10**/13/14 | 1:4% 2:25% 3:13% 4:17% 5:30% 6:7% 7:3% | **3.7** (1.7–5.4) | 29% | 0:3% 1:25% 2:25% 3:42% 4:4% |
| 2C | 4.3% | 76 | 112 | 4/6/**8**/10/14 | 1:4% 2:8% 3:20% 4:39% 5:24% 6:5% | **2.8** (2.1–4.4) | 41% | 1:4% 2:8% 3:20% 4:39% 5:24% 6:5% |
| 2S | 2.9% | 51 | 63 | 8/10/**13**/13/16 | 0:4% 1:14% 2:41% 3:22% 4:16% 5:4% | **0.5** (0.2–4.2) | 57% | 1:4% 3:10% 4:47% 5:16% 6:24% |
| 3C | 1.7% | 30 | 34 | 5/6/**7**/8/9 | 4:3% 5:70% 6:27% | **2.8** (2.7–3.6) | 23% | 4:3% 5:70% 6:27% |
| 3NT | 1.7% | 31 | 11 | 14/14/**14**/14/17 | — | — | 94% | 1:6% 2:3% 3:81% 4:10% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 155 | 6/8/**9**/11/15 |
| X | fav | 94 | 5/5/**7**/10/11 |
| X | unfav | 209 | 8/10/**10**/11/16 |
| X | both | 251 | 6/7/**8**/9/15 |
| 1NT | fav | 46 | 8/8/**8**/8/10 |
| 1NT | both | 71 | 9/10/**10**/10/10 |
| 2H | none | 42 | 6/8/**10**/10/15 |
| 2H | fav | 29 | 5/10/**10**/11/13 |
| 2H | both | 31 | 7/10/**12**/13/14 |
| 2D | none | 43 | 6/8/**10**/12/15 |
| 2D | both | 26 | 6/7/**12**/13/14 |
| 2C | both | 25 | 5/6/**8**/9/12 |
| 2S | none | 31 | 8/10/**13**/13/17 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 9/**9**/11 (152) | 7/**8**/11 (250) | 7/**10**/10 (192) | 8/**9**/10 (115) |
| 1NT | — | — | 8/**8**/10 (84) | 9/**10**/10 (60) |
| 2H | 6/**9**/10 (18) | 10/**11**/12 (59) | 9/**11**/12 (26) | 10/**10**/12 (23) |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 5..16`
- `1NT` → `(has(s,a) or (has(s,k) and s >= 2) or (has(s,q) and s >= 3)) and hcp in 7..10` *(+ balanced)*
- `2H` → `h >= 3 and top(h,5) >= 1 and ((hcp in 6..14 and s <= 2) or (hcp in 7..14 and s in 3..4))`
- `2D` → `hcp in 6..14`
- `2C` → `hcp in 4..14`
- `2S` → `((hcp in 8..16 and s >= 4) or (hcp in 8..16 and s <= 3 and h <= 3))`

### 1D (1S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♦ |
|---|---|---|---|---|---|---|---|---|
| X | 38.7% | 1126 | 385 | 6/7/**9**/10/12 | theirs: 0:5% 1:17% 2:30% 3:30% 4:12% 5:7% | — | 45% | 1:10% 2:32% 3:23% 4:21% 5:13% |
| P | 27.6% | 803 | 272 | 1/4/**6**/7/13 | — | — | 60% | 1:13% 2:37% 3:38% 4:9% 5+:2% |
| 1NT | 6.4% | 185 | 99 | 6/8/**8**/10/11 | — | — | 80% | 1:12% 2:35% 3:33% 4:15% 5:5% |
| 2H | 5.8% | 170 | 137 | 6/9/**10**/11/14 | <3:2% 3:10% 5:36% 6:43% 7:8% | **4.7** (3.2–5.5) | 19% | 1:25% 2:36% 3:18% 4:14% 5:6% |
| 2D | 6.1% | 176 | 120 | 4/6/**7**/9/12 | 1:5% 2:10% 3:19% 4:51% 5:14% 6+:2% | **2.3** (1.1–3.8) | 59% | 1:5% 2:10% 3:19% 4:51% 5:14% 6+:2% |
| 2C | 4.9% | 142 | 115 | 6/7/**10**/11/14 | 1:4% 2:11% 3:22% 4:13% 5:36% 6:11% 7:3% | **4.7** (2.6–5.7) | 41% | 1:6% 2:27% 3:35% 4:23% 5:9% |
| 2S | 3.8% | 109 | 69 | 8/10/**10**/12/14 | 0:6% 1:35% 2:26% 3:17% 4:13% 5:3% | **4.1** (0.0–5.5) | 32% | <4:3% 4:51% 5:39% 6:7% |
| 3D | 2.9% | 83 | 47 | 3/6/**6**/7/9 | <4:1% 4:42% 5:49% 6:7% | **2.2** (1.7–3.3) | 57% | <4:1% 4:42% 5:49% 6:7% |
| 3C | 1.0% | 28 | 18 | 6/7/**10**/10/14 | 1:4% 2:7% 3:7% 4:25% 5:43% 7:14% | **4.8** (2.0–7.2) | 25% | 0:4% 1:4% 2:4% 3:7% 4:61% 5:21% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 314 | 6/7/**9**/10/11 |
| X | fav | 214 | 6/6/**10**/10/14 |
| X | unfav | 327 | 6/7/**10**/10/12 |
| X | both | 271 | 6/7/**7**/10/14 |
| 1NT | none | 31 | 6/8/**8**/9/11 |
| 1NT | fav | 47 | 6/7/**9**/9/11 |
| 1NT | unfav | 83 | 6/8/**8**/10/10 |
| 2H | none | 60 | 6/8/**10**/11/13 |
| 2H | fav | 39 | 5/8/**10**/11/16 |
| 2H | both | 48 | 7/9/**10**/13/14 |
| 2D | none | 42 | 3/6/**7**/10/10 |
| 2D | fav | 63 | 5/6/**6**/8/11 |
| 2D | unfav | 34 | 4/6/**6**/8/10 |
| 2D | both | 37 | 6/6/**7**/9/13 |
| 2C | none | 25 | 6/8/**10**/12/13 |
| 2C | fav | 68 | 6/7/**9**/11/14 |
| 2C | both | 28 | 6/7/**9**/11/13 |
| 2S | fav | 39 | 9/10/**10**/14/14 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 7/**10**/10 (240) | 7/**9**/11 (341) | 7/**8**/10 (336) | 8/**9**/11 (209) |
| 1NT | — | — | 8/**9**/10 (68) | 8/**8**/9 (112) |
| 2H | 8/**10**/13 (36) | 9/**10**/11 (63) | 9/**10**/11 (49) | 8/**11**/12 (22) |
| 2D | 4/**6**/8 (22) | 6/**6**/9 (63) | 6/**7**/8 (50) | 6/**7**/8 (41) |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 6..12`
- `1NT` → `hcp in 6..11` *(+ balanced)*
- `2H` → `h >= 3 and top(h,5) >= 1 and hcp in 6..14`
- `2D` → `((hcp in 3..12 and s <= 2) or (hcp in 5..12 and s in 3..5))`
- `2C` → `(hcp >= 11 or top(c,5) >= 1) and ((hcp in 5..14 and s <= 2) or (hcp in 6..14 and s in 3..4))`
- `2S` → `((hcp in 8..11 and s >= 4) or (hcp in 8..14 and s <= 3 and h <= 3) or (hcp in 12..14 and d >= 5) or (hcp in 12..14 and c >= 5))`

### 1H (1S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♥ |
|---|---|---|---|---|---|---|---|---|
| 2H | 23.2% | 522 | 129 | 4/6/**7**/8/10 | 3:81% 4:18% | **3.5** (1.3–4.6) | 63% | 3:81% 4:18% |
| P | 17.1% | 385 | 161 | 1/4/**6**/6/10 | — | — | 29% | <1:2% 1:30% 2:51% 3:14% 4:2% |
| X | 12.0% | 271 | 117 | 6/7/**9**/11/14 | theirs: 1:13% 2:34% 3:29% 4:24% 5+:1% | — | 32% | 1:31% 2:59% 3:9% |
| 2S | 10.0% | 226 | 106 | 8/10/**11**/14/17 | 1:16% 2:23% 3:31% 4:25% 5:4% | **3.9** (1.7–5.5) | 62% | <3:1% 3:60% 4:22% 5:16% |
| 2NT | 8.9% | 201 | 74 | 8/11/**12**/14/17 | — | — | 47% | 3:13% 4:49% 5:37% |
| 3H | 7.6% | 171 | 40 | 2/4/**6**/6/8 | 3:4% 4:94% 5:2% | **3.4** (0.7–3.5) | 61% | 3:4% 4:94% 5:2% |
| 2D | 6.0% | 135 | 71 | 6/9/**9**/11/17 | <2:1% 2:4% 3:12% 4:8% 5:17% 6:30% 7:28% | **5.1** (3.3–5.6) | 27% | 1:16% 2:51% 3:24% 4:5% 5:3% |
| 1NT | 3.6% | 80 | 43 | 7/9/**9**/10/11 | — | — | 54% | 1:31% 2:61% 3:6% 4+:1% |
| 2C | 3.2% | 72 | 49 | 6/7/**10**/13/17 | 1:4% 2:11% 3:11% 4:11% 5:26% 6:25% 7:11% | **4.4** (2.9–6.5) | 18% | 0:6% 1:26% 2:47% 3:18% 4:3% |
| 4H | 3.1% | 70 | 45 | 4/6/**8**/11/13 | 3:9% 4:53% 5:31% 6:7% | **3.4** (2.1–4.4) | 26% | 3:9% 4:53% 5:31% 6:7% |
| 3D | 1.8% | 40 | 26 | 4/6/**7**/9/10 | 2:8% 3:5% 4:15% 5:30% 6:15% 7:28% | **3.7** (3.0–5.6) | 20% | 1:13% 2:18% 3:10% 4:58% 5:3% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2H | none | 83 | 5/6/**6**/7/9 |
| 2H | fav | 153 | 4/7/**7**/9/9 |
| 2H | unfav | 97 | 6/6/**6**/8/10 |
| 2H | both | 189 | 4/6/**8**/8/9 |
| X | none | 59 | 6/9/**13**/13/17 |
| X | fav | 51 | 7/7/**8**/10/17 |
| X | unfav | 91 | 6/7/**7**/9/13 |
| X | both | 70 | 7/9/**10**/10/13 |
| 2S | none | 53 | 8/11/**12**/17/17 |
| 2S | fav | 80 | 8/9/**12**/14/17 |
| 2S | unfav | 38 | 7/10/**10**/12/15 |
| 2S | both | 55 | 8/10/**11**/12/14 |
| 2NT | none | 44 | 9/10/**12**/14/17 |
| 2NT | fav | 89 | 8/11/**14**/14/17 |
| 2NT | unfav | 37 | 10/11/**12**/13/14 |
| 2NT | both | 31 | 6/9/**11**/13/14 |
| 3H | fav | 45 | 3/4/**4**/6/7 |
| 3H | unfav | 43 | 6/6/**6**/6/7 |
| 3H | both | 60 | 4/5/**6**/7/8 |
| 2D | unfav | 57 | 6/9/**9**/9/14 |
| 2D | both | 37 | 6/9/**11**/11/14 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 2H | 6/**6**/9 (99) | 5/**5**/8 (100) | 6/**8**/8 (200) | 7/**7**/7 (123) |
| X | 7/**7**/9 (35) | 7/**8**/10 (91) | 7/**8**/11 (78) | 9/**11**/13 (67) |
| 2S | 9/**9**/9 (38) | 10/**11**/12 (52) | 10/**12**/17 (70) | 11/**13**/14 (66) |
| 2NT | — | 9/**12**/13 (39) | 9/**11**/12 (56) | 13/**14**/14 (95) |

Dealer filters (paste into the custom filter box; derived from the data):

- `2H` → `((hcp in 4..11 and h >= 4) or (hcp in 4..11 and s >= 4) or (hcp in 4..11 and s <= 3 and h <= 3))`
- `X` → `hcp in 6..14`
- `2S` → `((hcp in 8..17 and h >= 4) or (hcp in 8..17 and s >= 4) or (hcp in 8..17 and s <= 3 and h <= 3))`
- `2NT` → `hcp in 8..17`
- `3H` → `h >= 4 and hcp in 2..8`
- `2D` → `d >= 3 and top(d,5) >= 1 and hcp in 6..17`

### 1C (1H) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♣ |
|---|---|---|---|---|---|---|---|---|
| X | 32.4% | 513 | 413 | 6/7/**9**/10/15 | theirs: 1:17% 2:47% 3:26% 4:8% 5:2% | — | 53% | <1:1% 1:5% 2:27% 3:33% 4:29% 5:5% |
| P | 16.4% | 260 | 279 | 2/4/**5**/7/9 | — | — | 57% | 1:4% 2:15% 3:37% 4:33% 5:10% |
| 1S | 19.4% | 308 | 291 | 6/7/**9**/10/14 | <2:2% 2:18% 3:27% 4:7% 5:30% 6:15% | **3.3** (2.1–4.8) | 42% | <1:2% 1:6% 2:20% 3:20% 4:44% 5:7% |
| 2C | 6.8% | 108 | 102 | 5/6/**7**/9/12 | <2:2% 2:4% 3:4% 4:41% 5:50% | **3.1** (2.4–3.9) | 16% | <2:2% 2:4% 3:4% 4:41% 5:50% |
| 2H | 5.6% | 89 | 90 | 7/9/**11**/13/15 | 0:3% 1:28% 2:21% 3:39% 4:8% | **3.0** (0.9–4.2) | 31% | 1:10% 2:12% 3:15% 4:31% 5:30% 6+:1% |
| 2D | 5.6% | 89 | 82 | 6/10/**11**/12/15 | 3:2% 4:1% 5:47% 6:36% 7:12% 8+:1% | **4.3** (4.0–5.3) | 17% | <1:1% 1:7% 2:22% 3:15% 4:44% 5:10% 6+:1% |
| 1NT | 5.2% | 82 | 67 | 7/7/**9**/9/10 | — | — | 76% | 2:7% 3:16% 4:51% 5:26% |
| 3C | 4.5% | 72 | 33 | 5/5/**6**/8/9 | 4:7% 5:89% 6:4% | **3.1** (2.3–4.7) | 4% | 4:7% 5:89% 6:4% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 111 | 6/7/**8**/10/12 |
| X | fav | 154 | 6/7/**9**/11/17 |
| X | unfav | 114 | 6/8/**9**/10/13 |
| X | both | 134 | 6/7/**9**/10/15 |
| 1S | none | 103 | 6/7/**9**/11/14 |
| 1S | fav | 91 | 5/7/**9**/11/15 |
| 1S | unfav | 49 | 6/8/**9**/10/12 |
| 1S | both | 65 | 6/7/**8**/10/12 |
| 2C | none | 27 | 6/9/**10**/11/15 |
| 2C | fav | 32 | 5/5/**7**/7/10 |
| 2C | unfav | 32 | 6/6/**8**/8/11 |
| 2H | none | 32 | 9/10/**12**/14/14 |
| 2D | none | 46 | 10/10/**12**/12/16 |
| 1NT | none | 48 | 7/8/**9**/9/10 |
| 1NT | both | 26 | 7/8/**8**/8/10 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 7/**8**/10 (87) | 8/**9**/10 (243) | 7/**9**/10 (131) | 8/**10**/11 (52) |
| 1S | 8/**9**/11 (63) | 7/**8**/10 (117) | 7/**9**/11 (87) | 7/**8**/9 (41) |
| 2C | 6/**8**/8 (31) | 7/**7**/10 (42) | 5/**7**/9 (17) | 7/**7**/9 (18) |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 6..15`
- `1S` → `hcp in 6..14`
- `2C` → `c >= 4 and top(c,5) >= 1 and hcp in 5..12`
- `2H` → `((hcp in 7..11 and s >= 4) or (hcp in 7..15 and s <= 3 and h <= 3) or (hcp in 12..15 and d >= 5) or (hcp in 12..15 and c >= 5))`
- `2D` → `d >= 5 and top(d,5) >= 1 and hcp in 6..15`
- `1NT` → `(has(h,a) or (has(h,k) and h >= 2) or (has(h,q) and h >= 3)) and hcp in 7..10`

### 1D (1H) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♦ |
|---|---|---|---|---|---|---|---|---|
| X | 36.0% | 1024 | 357 | 5/7/**8**/10/13 | theirs: 1:12% 2:35% 3:37% 4:14% 5:3% | — | 48% | <1:1% 1:19% 2:24% 3:30% 4:17% 5:8% |
| P | 20.0% | 568 | 226 | 2/3/**4**/6/9 | — | — | 55% | <1:1% 1:12% 2:59% 3:14% 4:12% 5+:1% |
| 1S | 17.9% | 508 | 253 | 4/7/**9**/11/13 | <2:2% 2:6% 3:29% 4:8% 5:36% 6:14% 7:5% | **4.2** (2.4–5.2) | 41% | 0:5% 1:7% 2:34% 3:39% 4:11% 5:5% |
| 2D | 5.6% | 158 | 76 | 4/7/**7**/8/11 | 2:3% 3:6% 4:70% 5:18% 6:3% | **3.2** (2.2–3.6) | 43% | 2:3% 3:6% 4:70% 5:18% 6:3% |
| 2C | 4.7% | 133 | 79 | 7/10/**11**/13/19 | <2:2% 2:5% 3:3% 4:3% 5:16% 6:33% 7:11% 8:28% | **6.6** (4.7–7.1) | 15% | 0:4% 1:8% 2:59% 3:12% 4:10% 5:8% |
| 1NT | 4.3% | 121 | 76 | 7/7/**9**/9/11 | — | — | 88% | <2:2% 2:31% 3:38% 4:13% 5:16% |
| 2H | 4.3% | 123 | 67 | 6/8/**10**/12/13 | <1:2% 1:15% 2:17% 3:28% 4:22% 5:16% | **2.1** (0.4–3.8) | 35% | 0:10% 1:9% 2:11% 3:31% 4:20% 5:18% 6+:2% |
| 3D | 3.2% | 90 | 41 | 4/5/**7**/7/9 | 4:66% 5:23% 6:11% | **3.0** (2.1–3.6) | 34% | 4:66% 5:23% 6:11% |
| 2S | 1.4% | 40 | 35 | 6/9/**10**/11/14 | 1:28% 2:13% 3:28% 4:3% 5:5% 6:25% | **2.8** (0.4–4.4) | 23% | 0:5% 1:5% 2:33% 3:10% 4:10% 5:35% 6:3% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 226 | 4/7/**9**/10/13 |
| X | fav | 374 | 6/7/**8**/9/12 |
| X | unfav | 197 | 6/8/**9**/10/13 |
| X | both | 227 | 5/6/**7**/9/12 |
| 1S | none | 124 | 4/7/**9**/11/13 |
| 1S | fav | 204 | 4/8/**10**/12/12 |
| 1S | unfav | 73 | 5/7/**9**/10/15 |
| 1S | both | 107 | 6/6/**7**/9/12 |
| 2D | none | 25 | 7/8/**8**/9/13 |
| 2D | fav | 44 | 6/7/**9**/9/11 |
| 2D | both | 71 | 4/4/**7**/7/9 |
| 2C | none | 28 | 7/10/**15**/19/19 |
| 2C | unfav | 30 | 8/9/**11**/13/14 |
| 2C | both | 59 | 7/11/**11**/11/15 |
| 1NT | fav | 67 | 7/7/**9**/9/10 |
| 2H | fav | 67 | 6/9/**10**/12/12 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 6/**8**/8 (120) | 7/**9**/9 (358) | 7/**7**/9 (377) | 8/**10**/12 (169) |
| 1S | 7/**7**/9 (57) | 6/**9**/9 (186) | 7/**9**/11 (144) | 8/**10**/12 (121) |
| 2D | — | 7/**7**/9 (40) | 7/**9**/9 (36) | 5/**7**/8 (76) |
| 2C | — | 11/**11**/11 (73) | 9/**14**/19 (34) | — |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 5..13`
- `1S` → `s >= 3 and ((hcp in 4..13 and h <= 2) or (hcp in 5..13 and h in 3..5))`
- `2D` → `d >= 4 and top(d,5) >= 1 and hcp in 4..11`
- `2C` → `c >= 4 and top(c,5) >= 1 and hcp in 7..19`
- `1NT` → `hcp in 7..11` *(+ balanced)*
- `2H` → `((hcp in 6..13 and h >= 4) or (hcp in 6..13 and s >= 4) or (hcp in 6..11 and s <= 3 and h <= 3))`

### 1S (2H) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♠ |
|---|---|---|---|---|---|---|---|---|
| P | 32.4% | 435 | 127 | 2/3/**6**/7/10 | — | — | 38% | 0:11% 1:13% 2:49% 3:26% 4+:1% |
| 2S | 21.0% | 282 | 75 | 4/5/**7**/8/10 | 2:2% 3:67% 4:29% 5+:1% | **1.8** (0.7–2.7) | 77% | 2:2% 3:67% 4:29% 5+:1% |
| X | 10.1% | 135 | 65 | 7/8/**10**/11/15 | theirs: 1:5% 2:30% 3:33% 4:31% | — | 56% | 0:4% 1:19% 2:66% 3:10% 4+:1% |
| 3H | 8.6% | 116 | 50 | 7/9/**10**/11/13 | 0:11% 1:21% 2:46% 3:19% 4:3% | **0.4** (0.0–2.8) | 61% | 3:70% 4:25% 5:5% |
| 3S | 7.5% | 101 | 23 | 1/6/**6**/7/8 | 3:3% 4:92% 5:5% | **1.6** (0.7–1.9) | 85% | 3:3% 4:92% 5:5% |
| 4S | 6.9% | 92 | 39 | 4/5/**9**/9/12 | 3:17% 4:23% 5:58% 6:2% | **2.3** (1.8–3.0) | 24% | 3:17% 4:23% 5:58% 6:2% |
| 2NT | 6.3% | 84 | 47 | 7/9/**9**/11/13 | — | — | 63% | <3:4% 3:27% 4:44% 5:23% 6:2% |
| 3D | 1.9% | 26 | 13 | 8/11/**12**/13/13 | 3:4% 5:15% 6:73% 7:8% | **5.6** (2.1–6.9) | 8% | 0:4% 1:38% 2:4% 3:46% 4:8% |
| 4H | 1.9% | 25 | 5 | 9/9/**9**/10/13 | 0:24% 1:76% | **0.0** (0.0–0.0) | 0% | 3:20% 4:8% 5:72% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2S | none | 155 | 5/5/**6**/7/9 |
| 2S | fav | 67 | 5/6/**7**/8/9 |
| 2S | both | 39 | 2/4/**6**/8/10 |
| X | none | 45 | 7/8/**9**/11/15 |
| X | unfav | 46 | 7/10/**10**/10/15 |
| 3H | fav | 25 | 5/8/**9**/13/14 |
| 3H | unfav | 45 | 8/10/**10**/10/11 |
| 3H | both | 30 | 8/10/**10**/11/13 |
| 3S | none | 36 | 4/7/**7**/7/7 |
| 3S | fav | 52 | 1/6/**6**/6/8 |
| 4S | none | 43 | 9/9/**9**/9/10 |
| 2NT | none | 30 | 7/9/**9**/10/13 |
| 2NT | fav | 27 | 6/8/**9**/11/13 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 2S | 5/**5**/5 (44) | 6/**7**/8 (88) | 7/**7**/9 (94) | 6/**6**/6 (56) |
| X | — | 7/**9**/11 (40) | 8/**10**/15 (45) | 10/**10**/10 (42) |
| 3H | 9/**10**/11 (37) | 10/**10**/10 (53) | 10/**10**/10 (22) | — |
| 3S | — | 6/**6**/6 (42) | 5/**7**/7 (50) | — |

Dealer filters (paste into the custom filter box; derived from the data):

- `2S` → `((hcp in 4..11 and h >= 4) or (hcp in 4..11 and s >= 4) or (hcp in 4..11 and s <= 3 and h <= 3))`
- `X` → `hcp in 7..15`
- `3H` → `((hcp in 7..11 and s >= 4) or (hcp in 7..11 and s <= 3 and h <= 3))`
- `3S` → `s >= 4 and hcp in 1..8`
- `4S` → `s >= 3 and hcp in 4..12`
- `2NT` → `hcp in 7..13`

### 1H (2D) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♥ |
|---|---|---|---|---|---|---|---|---|
| X | 27.2% | 186 | 54 | 5/7/**8**/10/14 | theirs: 0:5% 1:5% 2:18% 3:53% 4:17% 5+:2% | — | 56% | 1:11% 2:82% 3:6% |
| P | 22.8% | 156 | 68 | 1/5/**6**/8/14 | — | — | 46% | <1:1% 1:13% 2:67% 3:15% 4:4% |
| 2H | 15.5% | 106 | 54 | 5/6/**8**/9/10 | 2:4% 3:93% 4:3% | **2.4** (1.5–3.5) | 91% | 2:4% 3:93% 4:3% |
| 2S | 10.2% | 70 | 24 | 6/10/**10**/12/14 | <5:1% 5:46% 6:20% 7:33% | **5.4** (3.2–6.9) | 1% | 1:44% 2:51% 3:4% |
| 3D | 7.3% | 50 | 31 | 8/9/**10**/11/14 | 1:20% 2:32% 3:30% 4:2% 5:16% | **2.2** (0.9–3.0) | 52% | 1:4% 3:64% 4:28% 5:4% |
| 2NT | 4.8% | 33 | 21 | 7/9/**10**/12/14 | — | — | 42% | 2:6% 3:9% 4:61% 5:18% 6:6% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 77 | 5/7/**8**/11/14 |
| X | fav | 32 | 7/9/**10**/10/12 |
| X | both | 56 | 6/7/**7**/10/12 |
| 2H | none | 35 | 4/6/**6**/8/10 |
| 2H | unfav | 26 | 7/9/**10**/10/10 |
| 2H | both | 36 | 5/6/**6**/8/10 |
| 2S | none | 46 | 10/10/**10**/14/14 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 5/**5**/7 (20) | 6/**8**/10 (34) | 7/**8**/10 (98) | 10/**12**/14 (34) |
| 2H | — | 6/**8**/8 (43) | 6/**8**/10 (42) | 6/**6**/10 (15) |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 5..14`
- `2H` → `((hcp in 5..11 and s >= 4) or (hcp in 5..11 and s <= 3 and h <= 3))`
- `2S` → `s >= 5 and top(s,5) >= 1 and hcp in 6..14`
- `3D` → `((hcp in 8..14 and h >= 4) or (hcp in 8..14 and s >= 4) or (hcp in 8..11 and s <= 3 and h <= 3))`

### 1S (2D) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♠ |
|---|---|---|---|---|---|---|---|---|
| P | 25.1% | 277 | 82 | 2/4/**5**/8/8 | — | — | 22% | 0:5% 1:38% 2:38% 3:15% 4:4% |
| 2S | 18.9% | 209 | 68 | 3/5/**6**/7/10 | 2:3% 3:81% 4:15% 5+:1% | **2.6** (1.5–3.2) | 67% | 2:3% 3:81% 4:15% 5+:1% |
| X | 13.6% | 150 | 43 | 6/8/**8**/10/11 | theirs: 1:5% 2:43% 3:38% 4:5% 5:7% | — | 23% | 0:35% 1:17% 2:43% 3:5% |
| 4S | 12.9% | 142 | 19 | 5/5/**6**/6/10 | <4:1% 4:15% 5:83% | **2.7** (2.2–2.7) | 4% | <4:1% 4:15% 5:83% |
| 2H | 9.6% | 106 | 26 | 5/8/**9**/11/13 | 5:25% 6:57% 7:17% | **5.2** (3.6–6.7) | 2% | 0:17% 1:22% 2:58% 3:4% |
| 3S | 6.4% | 71 | 17 | 2/5/**5**/6/7 | 3:6% 4:66% 5:28% | **3.0** (2.6–5.1) | 59% | 3:6% 4:66% 5:28% |
| 2NT | 5.0% | 55 | 23 | 7/8/**12**/13/13 | — | — | 65% | 3:5% 4:82% 5:11% 6+:2% |
| 3D | 4.1% | 45 | 30 | 7/9/**11**/13/14 | 0:7% 1:20% 2:22% 3:31% 4:20% | **2.8** (0.5–4.0) | 64% | 2:7% 3:38% 4:47% 5:9% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2S | none | 62 | 6/6/**7**/7/9 |
| 2S | fav | 65 | 4/4/**4**/8/10 |
| 2S | unfav | 47 | 1/6/**6**/6/9 |
| 2S | both | 35 | 4/6/**7**/7/10 |
| X | fav | 83 | 8/8/**8**/9/11 |
| X | unfav | 30 | 6/7/**7**/8/14 |
| 4S | none | 65 | 6/6/**6**/6/7 |
| 4S | both | 65 | 5/5/**5**/5/7 |
| 2H | none | 29 | 8/11/**11**/11/13 |
| 2H | fav | 56 | 5/8/**9**/9/10 |
| 3S | fav | 31 | 4/5/**5**/5/5 |
| 2NT | fav | 29 | 11/13/**13**/13/14 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 2S | 4/**4**/4 (52) | 6/**7**/7 (71) | 6/**6**/8 (70) | 5/**8**/8 (16) |
| X | — | 8/**8**/8 (65) | 7/**7**/11 (57) | 8/**10**/10 (19) |
| 4S | 5/**5**/6 (73) | 6/**6**/6 (60) | — | — |
| 2H | 11/**11**/11 (21) | 8/**8**/9 (27) | 5/**10**/12 (30) | 9/**9**/10 (28) |

Dealer filters (paste into the custom filter box; derived from the data):

- `2S` → `((hcp in 3..11 and h >= 4) or (hcp in 3..11 and s <= 3 and h <= 3))`
- `X` → `hcp in 6..11`
- `4S` → `s >= 4 and top(s,5) >= 1 and hcp in 5..10`
- `2H` → `h >= 5 and top(h,5) >= 1 and hcp in 5..13`
- `3S` → `s >= 4 and top(s,5) >= 1 and hcp in 2..7`
- `2NT` → `hcp in 7..13`

### 1H (2C) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♥ |
|---|---|---|---|---|---|---|---|---|
| P | 20.9% | 155 | 62 | 3/6/**6**/8/10 | — | — | 42% | 0:6% 1:39% 2:44% 3:8% 4+:3% |
| X | 20.8% | 154 | 56 | 6/8/**9**/10/13 | theirs: 1:5% 2:45% 3:27% 4:21% | — | 33% | 0:5% 1:18% 2:70% 3:6% 4+:1% |
| 2H | 10.2% | 76 | 43 | 3/6/**7**/8/9 | 2:3% 3:76% 4:21% | **2.1** (1.5–3.6) | 49% | 2:3% 3:76% 4:21% |
| 3C | 9.7% | 72 | 31 | 7/9/**11**/12/13 | 0:8% 1:17% 2:42% 3:28% 4:4% 5+:1% | **1.6** (0.2–3.0) | 38% | 3:49% 4:46% 5:4% 6+:1% |
| 2NT | 9.3% | 69 | 24 | 7/10/**11**/11/13 | — | — | 30% | 3:14% 4:78% 5:7% |
| 2S | 7.5% | 56 | 23 | 6/9/**12**/12/14 | 5:46% 6:36% 7:18% | **4.5** (4.3–5.5) | 36% | 0:7% 1:4% 2:52% 3:32% 4:5% |
| 3H | 4.6% | 34 | 18 | 2/5/**6**/7/9 | 3:6% 4:85% 5:9% | **3.6** (1.9–3.6) | 29% | 3:6% 4:85% 5:9% |
| 4H | 4.2% | 31 | 14 | 5/7/**8**/11/13 | 3:29% 4:48% 5:19% 6:3% | **3.6** (1.8–4.2) | 19% | 3:29% 4:48% 5:19% 6:3% |
| 2D | 4.2% | 31 | 16 | 7/8/**11**/12/15 | 1:6% 2:3% 3:3% 5:35% 6:52% | **4.9** (3.4–6.3) | 29% | 1:32% 2:52% 3:13% 4:3% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 25 | 7/9/**11**/11/17 |
| X | fav | 25 | 6/8/**10**/10/11 |
| X | both | 85 | 6/9/**9**/10/13 |
| 2H | unfav | 34 | 3/6/**7**/8/9 |
| 3C | none | 34 | 7/10/**11**/11/11 |
| 2NT | none | 36 | 9/11/**11**/11/11 |
| 2S | unfav | 26 | 10/12/**12**/12/16 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | — | 8/**9**/9 (70) | 10/**11**/12 (42) | 8/**10**/10 (33) |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 6..13`
- `2H` → `((hcp in 3..11 and h >= 4) or (hcp in 3..11 and s >= 4) or (hcp in 3..11 and s <= 3 and h <= 3))`
- `3C` → `((hcp in 7..11 and h >= 4) or (hcp in 7..13 and s >= 4))`
- `2NT` → `hcp in 7..13`
- `2S` → `s >= 5 and top(s,5) >= 1 and hcp in 6..14`

### 1S (2C) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♠ |
|---|---|---|---|---|---|---|---|---|
| P | 36.9% | 280 | 60 | 1/1/**3**/6/9 | — | — | 42% | 0:7% 1:22% 2:54% 3:17% |
| 2S | 16.1% | 122 | 52 | 4/6/**6**/8/10 | 3:92% 4:8% | **1.6** (1.5–3.3) | 55% | 3:92% 4:8% |
| X | 15.5% | 118 | 43 | 6/7/**9**/11/13 | theirs: 1:4% 2:36% 3:45% 4:14% | — | 40% | 0:5% 1:30% 2:49% 3:15% |
| 2H | 6.6% | 50 | 20 | 6/9/**9**/12/13 | 3:2% 5:28% 6:60% 7:10% | **4.6** (3.3–4.9) | 8% | 0:10% 1:60% 2:28% 3:2% |
| 3C | 5.7% | 43 | 24 | 8/10/**11**/12/13 | 1:9% 2:40% 3:40% 4:9% 5:2% | **1.5** (1.5–3.2) | 86% | 3:67% 4:26% 5:5% 6:2% |
| 2NT | 4.6% | 35 | 22 | 7/8/**9**/11/15 | — | — | 51% | 2:3% 3:20% 4:66% 5:11% |
| 3S | 4.3% | 33 | 14 | 3/4/**4**/7/8 | 4:97% 5:3% | **2.5** (2.5–3.8) | 24% | 4:97% 5:3% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2S | none | 29 | 4/7/**8**/9/10 |
| 2S | both | 67 | 5/6/**6**/6/9 |
| X | unfav | 55 | 6/6/**11**/11/12 |
| X | both | 25 | 5/7/**7**/9/13 |
| 2H | unfav | 30 | 6/9/**9**/12/12 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 2S | 6/**6**/6 (51) | 7/**8**/9 (21) | 6/**7**/8 (27) | 5/**7**/9 (23) |
| X | — | 8/**9**/10 (42) | 6/**11**/11 (53) | 7/**7**/10 (18) |

Dealer filters (paste into the custom filter box; derived from the data):

- `2S` → `((hcp in 4..11 and h >= 4) or (hcp in 4..11 and s <= 3 and h <= 3))`
- `X` → `hcp in 6..13`
- `2H` → `h >= 5 and top(h,5) >= 2 and hcp in 6..13`

### 1D (2C) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♦ |
|---|---|---|---|---|---|---|---|---|
| X | 37.9% | 410 | 150 | 6/8/**9**/10/12 | theirs: 1:11% 2:37% 3:49% 4+:2% | — | 51% | 1:10% 2:33% 3:24% 4:23% 5:9% |
| P | 30.7% | 333 | 115 | 3/5/**5**/6/9 | — | — | 61% | 1:23% 2:25% 3:44% 4:8% |
| 2H | 13.3% | 144 | 49 | 7/9/**10**/10/12 | <3:3% 3:6% 5:82% 6:9% | **4.3** (3.4–6.3) | 57% | 1:11% 2:56% 3:21% 4:6% 5:3% 6:4% |
| 2D | 7.4% | 80 | 56 | 5/6/**7**/9/12 | 1:4% 2:20% 3:24% 4:45% 5:5% 6:3% | **1.9** (0.3–3.6) | 56% | 1:4% 2:20% 3:24% 4:45% 5:5% 6:3% |
| 2S | 3.0% | 33 | 29 | 5/8/**10**/12/15 | 2:6% 3:18% 4:3% 5:36% 6:15% 7:18% 8:3% | **3.4** (2.4–4.8) | 33% | 1:9% 2:48% 3:6% 4:27% 5:6% 6:3% |
| 3C | 3.0% | 32 | 11 | 8/10/**12**/15/15 | 0:3% 1:6% 2:22% 3:69% | **3.2** (2.1–3.6) | 75% | 2:6% 4:34% 5:56% 6:3% |
| 3D | 2.5% | 27 | 18 | 3/5/**5**/8/9 | 2:4% 4:59% 5:30% 6:7% | **2.1** (1.0–3.5) | 33% | 2:4% 4:59% 5:30% 6:7% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 73 | 5/7/**8**/9/12 |
| X | fav | 191 | 6/8/**9**/10/12 |
| X | unfav | 65 | 6/9/**9**/10/12 |
| X | both | 81 | 6/8/**9**/10/10 |
| 2H | fav | 36 | 7/8/**9**/10/10 |
| 2H | unfav | 66 | 9/10/**10**/11/12 |
| 2H | both | 28 | 5/9/**10**/11/12 |
| 2D | fav | 25 | 5/5/**8**/9/12 |
| 2D | unfav | 27 | 4/7/**9**/10/13 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 7/**8**/9 (50) | 7/**9**/10 (150) | 9/**10**/10 (201) | — |
| 2H | 9/**9**/11 (20) | 7/**10**/11 (38) | 10/**10**/10 (81) | — |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 6..12`
- `2H` → `h >= 5 and top(h,5) >= 1 and ((hcp in 5..12 and c <= 2) or (hcp in 7..12 and c == 3))`
- `2D` → `hcp in 5..12`

### 1NT (X) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 37.3% | 491 | 250 | 2/4/**6**/7/10 | — | — | 76% |
| XX | 17.2% | 226 | 166 | 1/4/**7**/9/12 | — | — | 46% |
| 2C | 11.8% | 155 | 111 | 1/3/**6**/7/9 | 0:3% 1:8% 2:16% 3:16% 4:25% 5:26% 6:6% | **2.3** (1.3–3.9) | 37% |
| 2H | 11.5% | 151 | 93 | 1/4/**5**/7/10 | <1:1% 1:5% 2:7% 3:28% 4:11% 5:42% 6:5% | **2.4** (1.3–4.1) | 34% |
| 2D | 11.3% | 149 | 78 | 1/3/**5**/6/8 | <1:1% 1:2% 2:6% 3:17% 4:35% 5:36% 6:3% | **2.4** (1.5–3.3) | 39% |
| 2S | 4.9% | 64 | 47 | 1/4/**6**/7/10 | <1:2% 1:3% 2:3% 3:9% 5:56% 6:27% | **2.7** (1.5–3.7) | 16% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| XX | none | 81 | 2/6/**8**/9/10 |
| XX | fav | 90 | 1/4/**6**/9/13 |
| XX | both | 35 | 1/2/**4**/9/12 |
| 2C | none | 45 | 1/4/**6**/8/9 |
| 2C | fav | 72 | 1/3/**6**/7/9 |
| 2H | none | 45 | 2/5/**6**/7/10 |
| 2H | fav | 56 | 1/4/**4**/8/11 |
| 2H | both | 32 | 1/3/**5**/5/7 |
| 2D | none | 65 | 2/5/**6**/6/8 |
| 2D | fav | 43 | 2/4/**5**/7/9 |
| 2D | both | 33 | 1/2/**2**/4/9 |
| 2S | none | 25 | 3/5/**7**/7/10 |

Dealer filters (paste into the custom filter box; derived from the data):

- `XX` → `hcp in 1..12`
- `2C` → `hcp in 1..9`
- `2H` → `hcp in 1..10`
- `2D` → `d >= 3 and hcp in 1..8`
- `2S` → `s >= 3 and hcp in 1..10`

## Transfer responses over interference: 1C (…) ? by transfer-walsh pairs

Pairs whose 1C responses are transfers keep them on over a double or 1D overcall: X/1D = hearts, 1H = spades, 1S = no major. The derived rules key on the suit actually held.

### 1C (X) ? — transfer responders

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♣ |
|---|---|---|---|---|---|---|---|---|
| P | 34.3% | 221 | 295 | 1/3/**4**/6/8 | — | — | 70% | 1:3% 2:36% 3:32% 4:22% 5:6% 6+:1% |
| 1D | 18.3% | 118 | 219 | 4/6/**7**/8/12 | 1:5% 2:34% 3:28% 4:16% 5:12% 6:4% | **2.1** (0.8–3.9) | 27% | 1:15% 2:39% 3:20% 4:11% 5:6% 6:8% |
| 1H | 16.7% | 108 | 191 | 3/6/**7**/8/11 | 1:19% 2:20% 3:42% 4:16% 5:4% | **3.4** (0.5–4.7) | 40% | <1:2% 1:12% 2:32% 3:31% 4:9% 5:14% |
| 1S | 10.1% | 65 | 144 | 4/7/**7**/8/11 | 1:9% 2:29% 3:49% 4:5% 5:5% 6:3% | **2.1** (1.1–3.5) | 54% | 1:11% 2:9% 3:26% 4:35% 5:18% |
| XX | 9.3% | 60 | 139 | 4/8/**10**/11/16 | — | — | 53% | 0:10% 1:7% 2:13% 3:30% 4:20% 5:20% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1D | none | 31 | 4/5/**6**/7/10 |
| 1D | fav | 41 | 4/6/**8**/8/10 |
| 1D | unfav | 28 | 3/7/**8**/12/12 |
| 1H | none | 41 | 3/6/**7**/8/9 |
| 1H | both | 31 | 4/7/**7**/9/11 |

Dealer filters (paste into the custom filter box; derived from the data):

- `1D` → `(hcp in 4..11 and h >= 4)`
- `1H` → `(hcp in 3..11 and s >= 4)`
- `1S` → `(hcp in 4..11 and s <= 3 and h <= 3)`
- `XX` → `hcp in 4..16`

### 1C (1D) ? — transfer responders

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♣ |
|---|---|---|---|---|---|---|---|---|
| X | 31.3% | 178 | 277 | 5/7/**9**/10/14 | theirs: 1:17% 2:44% 3:23% 4:13% 5+:2% | — | 53% | <1:1% 1:7% 2:21% 3:43% 4:15% 5:6% 6:6% |
| 1H | 25.0% | 142 | 283 | 6/8/**9**/11/13 | 1:6% 2:20% 3:45% 4:17% 5:8% 6:3% | **3.2** (0.9–4.5) | 42% | 1:7% 2:23% 3:44% 4:13% 5:9% 6:4% |
| 1S | 8.1% | 46 | 205 | 7/7/**8**/10/11 | 1:9% 2:4% 3:46% 4:28% 5:7% 6:7% | **3.4** (1.5–5.5) | 63% | 1:7% 2:15% 3:17% 4:17% 5:41% 7:2% |
| P | 14.6% | 83 | 219 | 2/3/**4**/6/10 | — | — | 59% | 1:6% 2:22% 3:36% 4:25% 5:8% 6:2% |
| 2C | 6.0% | 34 | 69 | 4/7/**7**/8/11 | 0:6% 1:9% 2:9% 3:15% 4:12% 5:41% 6:9% | **2.2** (0.9–4.1) | 35% | 0:6% 1:9% 2:9% 3:15% 4:12% 5:41% 6:9% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 60 | 5/7/**8**/9/13 |
| X | fav | 44 | 4/7/**8**/9/13 |
| X | unfav | 32 | 6/8/**9**/11/14 |
| X | both | 42 | 4/9/**9**/11/12 |
| 1H | none | 46 | 6/7/**8**/11/14 |
| 1H | unfav | 42 | 6/8/**10**/11/12 |
| 1H | both | 31 | 7/9/**9**/11/13 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 6/**7**/9 (32) | 8/**9**/11 (79) | 9/**9**/11 (41) | 6/**7**/9 (26) |
| 1H | 8/**8**/12 (39) | 8/**9**/10 (52) | 7/**9**/11 (38) | — |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 5..14`
- `1H` → `(hcp in 6..13 and s >= 4)`

### 1C (1H) ? — transfer responders

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♣ |
|---|---|---|---|---|---|---|---|---|
| X | 38.7% | 329 | 413 | 5/7/**9**/10/14 | theirs: 1:17% 2:44% 3:26% 4:10% 5:2% | — | 50% | 1:10% 2:29% 3:33% 4:23% 5:4% |
| P | 16.0% | 136 | 279 | 2/4/**5**/7/8 | — | — | 68% | 1:4% 2:19% 3:29% 4:37% 5:9% 6+:1% |
| 1S | 19.7% | 168 | 291 | 6/7/**9**/11/13 | <1:1% 1:5% 2:38% 3:44% 4:5% 5:4% 6:2% | **2.4** (0.7–3.9) | 52% | 2:10% 3:13% 4:49% 5:26% 6+:1% |
| 2C | 6.1% | 52 | 102 | 6/7/**10**/12/15 | 1:8% 2:13% 3:13% 4:31% 5:31% 6+:4% | **3.4** (2.5–5.2) | 15% | 1:8% 2:13% 3:13% 4:31% 5:31% 6+:4% |
| 2H | 4.6% | 39 | 90 | 6/9/**10**/12/13 | 1:21% 2:26% 3:44% 4:10% | **3.3** (1.1–5.2) | 3% | 2:38% 3:26% 4:8% 5:28% |
| 2D | 2.9% | 25 | 82 | 8/10/**10**/12/15 | 2:4% 4:16% 5:44% 6:28% 7:4% 8:4% | **4.3** (3.6–4.8) | 12% | 0:4% 1:4% 2:24% 3:4% 4:44% 5:20% |
| 1NT | 3.8% | 32 | 67 | 7/7/**8**/9/10 | — | — | 59% | 2:6% 3:19% 4:38% 5:38% |
| 3C | 3.2% | 27 | 33 | 5/5/**6**/8/11 | 5:93% 6:7% | **2.9** (2.3–6.2) | 0% | 5:93% 6:7% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| X | none | 96 | 5/7/**8**/9/12 |
| X | fav | 90 | 5/7/**9**/10/14 |
| X | unfav | 72 | 6/8/**9**/10/13 |
| X | both | 71 | 6/7/**9**/11/15 |
| 1S | none | 37 | 7/9/**10**/12/14 |
| 1S | fav | 53 | 6/7/**9**/11/13 |
| 1S | unfav | 42 | 6/7/**8**/10/13 |
| 1S | both | 36 | 6/7/**8**/10/12 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| X | 6/**7**/10 (58) | 8/**9**/10 (146) | 7/**9**/10 (85) | 7/**9**/11 (40) |
| 1S | 8/**8**/12 (27) | 7/**9**/10 (48) | 8/**10**/12 (60) | 7/**8**/9 (33) |

Dealer filters (paste into the custom filter box; derived from the data):

- `X` → `hcp in 5..14`
- `1S` → `((hcp in 6..11 and h >= 4) or (hcp in 6..11 and s <= 3 and h <= 3))`
- `2C` → `(hcp >= 11 or top(c,5) >= 1) and hcp in 6..15`

## Advancing partner’s direct action: (1x) act (…) ?

Includes advances of overcalls and of takeout doubles (partner doubled, RHO passed or raised). 1C/1D contexts face natural openers only.

### (1C) 1H (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♥ |
|---|---|---|---|---|---|---|---|---|
| P | 18.5% | 87 | 83 | 1/5/**5**/6/8 | — | — | 43% | 0:2% 1:29% 2:45% 3:23% 4+:1% |
| 1S | 26.1% | 123 | 56 | 4/9/**11**/11/12 | <4:2% 4:19% 5:53% 6:17% 7:10% | **3.5** (3.0–4.0) | 19% | 1:43% 2:42% 3:13% |
| 2H | 13.6% | 64 | 46 | 5/6/**7**/8/10 | 3:78% 4:22% | **3.4** (1.1–3.8) | 81% | 3:78% 4:22% |
| 2C | 11.9% | 56 | 51 | 9/10/**11**/14/16 | <1:2% 1:4% 2:18% 3:36% 4:21% 5:20% | **3.7** (2.6–4.9) | 79% | 1:9% 2:11% 3:70% 4:7% 5:4% |
| 2D | 8.7% | 41 | 22 | 9/9/**12**/12/14 | 2:2% 3:2% 4:5% 5:20% 6:54% 8:17% | **3.4** (2.2–6.3) | 12% | 0:2% 1:46% 2:39% 3:12% |
| 1NT | 6.4% | 30 | 28 | 6/9/**9**/11/13 | — | — | 23% | 0:3% 1:43% 2:37% 3:17% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1S | none | 26 | 7/9/**12**/12/12 |
| 1S | unfav | 27 | 4/4/**9**/9/11 |
| 1S | both | 56 | 6/11/**11**/11/12 |
| 2H | none | 26 | 5/5/**7**/8/9 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 1S | 4/**5**/7 (19) | 9/**11**/12 (38) | 11/**11**/11 (51) | 7/**9**/11 (15) |

Dealer filters (paste into the custom filter box; derived from the data):

- `1S` → `s >= 4 and top(s,5) >= 1 and ((hcp in 4..12 and c <= 2) or (hcp in 7..12 and c in 3..4))`
- `2H` → `h >= 3 and hcp in 5..10`
- `2C` → `hcp in 9..16`

### (1C) 1S (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♠ |
|---|---|---|---|---|---|---|---|---|
| P | 25.1% | 217 | 104 | 2/4/**6**/6/9 | — | — | 38% | 0:24% 1:19% 2:47% 3:9% |
| 1NT | 18.5% | 160 | 65 | 8/10/**10**/10/11 | — | — | 26% | 0:4% 1:53% 2:42% 3+:1% |
| 2S | 14.8% | 128 | 65 | 6/7/**7**/8/9 | 3:95% 4:5% | **3.8** (2.6–4.1) | 95% | 3:95% 4:5% |
| 2C | 16.1% | 139 | 65 | 9/10/**11**/12/16 | 0:3% 1:3% 2:12% 3:35% 4:40% 5:5% 6:3% | **2.5** (2.3–4.3) | 76% | 1:6% 2:7% 3:82% 4:4% |
| 2H | 9.5% | 82 | 40 | 7/9/**10**/11/12 | 1:2% 2:1% 3:5% 4:2% 5:28% 6:45% 7:16% | **5.6** (4.2–5.9) | 12% | 0:4% 1:32% 2:54% 3:11% |
| 2D | 7.5% | 65 | 29 | 8/9/**10**/11/12 | 1:11% 2:5% 3:9% 4:3% 5:12% 6:49% 7:2% 8:9% | **4.2** (2.4–7.5) | 8% | 0:31% 1:26% 2:34% 3:8% 4+:2% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1NT | none | 33 | 8/9/**9**/10/11 |
| 1NT | unfav | 105 | 8/10/**10**/10/11 |
| 2S | fav | 79 | 6/7/**7**/8/10 |
| 2C | fav | 25 | 9/10/**10**/13/16 |
| 2C | unfav | 60 | 11/11/**11**/12/16 |
| 2C | both | 34 | 8/9/**11**/12/16 |
| 2H | none | 47 | 9/9/**9**/11/11 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 1NT | — | — | 9/**10**/11 (21) | 10/**10**/10 (134) |
| 2S | — | 7/**8**/8 (21) | 7/**7**/7 (81) | 6/**8**/9 (26) |
| 2C | — | 10/**10**/13 (16) | 11/**12**/12 (49) | 10/**11**/11 (66) |

Dealer filters (paste into the custom filter box; derived from the data):

- `1NT` → `hcp in 8..11`
- `2S` → `s >= 3 and top(s,5) >= 1 and hcp in 6..9`
- `2C` → `hcp in 9..16`
- `2H` → `h >= 4 and top(h,5) >= 1 and ((hcp in 6..12 and c <= 2) or (hcp in 7..12 and c in 3..4))`
- `2D` → `hcp in 8..12`

### (1D) 1H (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♥ |
|---|---|---|---|---|---|---|---|---|
| 1S | 16.1% | 94 | 58 | 6/9/**10**/10/14 | 4:30% 5:51% 6:15% 7:3% 8+:1% | **5.9** (3.9–6.2) | 31% | 1:20% 2:69% 3:11% |
| P | 16.6% | 97 | 45 | 3/5/**7**/7/9 | — | — | 23% | <1:1% 1:30% 2:61% 3:7% 4+:1% |
| 2D | 17.3% | 101 | 57 | 8/10/**10**/11/14 | 1:8% 2:7% 3:53% 4:22% 5:7% 6:3% | **2.3** (1.9–3.9) | 76% | 2:12% 3:70% 4:15% 5+:2% |
| 2H | 16.4% | 96 | 54 | 6/7/**7**/9/10 | 1:2% 2:2% 3:85% 4:10% | **2.9** (1.6–4.2) | 92% | 1:2% 2:2% 3:85% 4:10% |
| 1NT | 15.0% | 88 | 18 | 9/10/**11**/11/11 | — | — | 18% | 1:17% 2:83% |
| 2C | 11.1% | 65 | 21 | 7/9/**9**/9/14 | 2:5% 3:3% 4:2% 5:5% 6:83% 7:3% | **3.1** (3.1–5.2) | 8% | 1:62% 2:28% 3:8% 4:3% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1S | none | 33 | 7/9/**10**/10/11 |
| 1S | both | 32 | 6/10/**10**/10/10 |
| 2D | none | 30 | 9/9/**10**/10/14 |
| 2D | unfav | 32 | 8/10/**11**/13/14 |
| 2D | both | 27 | 8/9/**10**/11/16 |
| 2H | both | 46 | 7/7/**7**/7/9 |
| 1NT | fav | 41 | 11/11/**11**/11/11 |
| 1NT | both | 28 | 7/9/**9**/10/11 |
| 2C | both | 55 | 7/9/**9**/9/14 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 2D | — | — | 9/**10**/11 (54) | 10/**10**/12 (32) |

Dealer filters (paste into the custom filter box; derived from the data):

- `1S` → `s >= 4 and top(s,5) >= 1 and ((hcp in 5..14 and d <= 2) or (hcp in 7..14 and d in 3..4))`
- `2D` → `hcp in 8..14`
- `2H` → `h >= 3 and top(h,5) >= 1 and hcp in 6..10`
- `1NT` → `hcp in 9..11`
- `2C` → `c >= 5 and top(c,5) >= 2 and hcp in 7..14`

### (1D) 1S (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♠ |
|---|---|---|---|---|---|---|---|---|
| P | 25.4% | 205 | 71 | 4/6/**6**/7/8 | — | — | 35% | 0:2% 1:52% 2:39% 3:7% |
| 2D | 21.2% | 171 | 60 | 10/10/**11**/13/16 | 0:10% 1:9% 2:49% 3:13% 4:17% 5+:2% | **2.3** (1.5–4.3) | 60% | 0:3% 1:5% 2:9% 3:73% 4:9% 5+:1% |
| 1NT | 12.6% | 102 | 58 | 6/8/**10**/10/11 | — | — | 26% | <1:2% 1:63% 2:35% |
| 2H | 13.9% | 112 | 32 | 9/11/**11**/14/14 | 3:7% 4:7% 5:29% 6:21% 7:35% | **5.6** (5.6–6.3) | 10% | 0:17% 1:56% 2:12% 3:13% 4+:2% |
| 2S | 9.4% | 76 | 43 | 5/7/**9**/10/10 | 3:89% 4:11% | **2.1** (1.3–3.2) | 96% | 3:89% 4:11% |
| 2C | 6.8% | 55 | 32 | 8/8/**10**/13/16 | <2:2% 2:5% 3:11% 4:5% 5:25% 6:51% | **4.5** (2.2–5.2) | 29% | 1:36% 2:24% 3:33% 4:7% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2D | fav | 102 | 10/10/**10**/12/16 |
| 2D | both | 36 | 9/10/**11**/14/16 |
| 1NT | none | 31 | 8/10/**10**/10/12 |
| 1NT | unfav | 47 | 6/7/**10**/10/10 |
| 2H | none | 60 | 11/11/**11**/12/14 |
| 2H | fav | 36 | 10/12/**14**/14/14 |
| 2S | fav | 28 | 7/10/**10**/10/10 |
| 2C | both | 32 | 8/8/**10**/10/14 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 2D | 11/**12**/12 (32) | 10/**10**/10 (83) | 11/**14**/14 (23) | 13/**15**/16 (33) |
| 1NT | — | — | 7/**9**/10 (30) | 9/**10**/10 (71) |
| 2H | — | 12/**12**/12 (31) | 11/**11**/11 (49) | 14/**14**/14 (25) |

Dealer filters (paste into the custom filter box; derived from the data):

- `2D` → `hcp in 10..16`
- `1NT` → `hcp in 6..11`
- `2H` → `h >= 4 and top(h,5) >= 1 and hcp in 9..14`
- `2S` → `s >= 3 and top(s,5) >= 1 and hcp in 5..10`
- `2C` → `c >= 3 and top(c,5) >= 1 and hcp in 8..16`

### (1H) 1S (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♠ |
|---|---|---|---|---|---|---|---|---|
| 2S | 27.9% | 112 | 27 | 4/7/**7**/9/9 | 3:88% 4:10% | **2.4** (1.7–2.4) | 93% | 3:88% 4:10% |
| P | 24.2% | 97 | 46 | 2/4/**6**/7/9 | — | — | 34% | 0:16% 1:30% 2:35% 3:18% 4+:1% |
| 1NT | 15.2% | 61 | 27 | 8/9/**9**/10/12 | — | — | 34% | 1:54% 2:46% |
| 2H | 15.0% | 60 | 37 | 8/9/**11**/13/16 | 1:12% 2:30% 3:28% 4:15% 5:15% | **3.0** (0.7–5.4) | 60% | <2:2% 2:15% 3:50% 4:33% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2S | fav | 55 | 7/7/**7**/7/8 |
| 2S | both | 36 | 7/8/**9**/9/9 |
| 1NT | unfav | 29 | 9/9/**9**/9/11 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 2S | — | 7/**7**/7 (63) | 4/**8**/9 (27) | 9/**9**/9 (15) |

Dealer filters (paste into the custom filter box; derived from the data):

- `2S` → `s >= 3 and hcp in 4..9`
- `1NT` → `hcp in 8..12`
- `2H` → `hcp in 8..16`

### (1H) 2C (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♣ |
|---|---|---|---|---|---|---|---|---|
| P | 37.4% | 55 | 24 | 3/5/**6**/9/9 | — | — | 24% | 0:9% 1:64% 2:18% 3:7% 4+:2% |
| 2D | 18.4% | 27 | 9 | 8/9/**9**/10/16 | 2:4% 4:7% 5:85% 6:4% | **4.6** (2.5–6.2) | 11% | 0:11% 1:74% 2:11% 3:4% |

### (1S) 2C (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♣ |
|---|---|---|---|---|---|---|---|---|
| P | 27.2% | 74 | 29 | 4/6/**7**/8/9 | — | — | 54% | 0:3% 1:11% 2:68% 3:15% 4:4% |
| 3C | 27.2% | 74 | 14 | 7/7/**7**/9/10 | 2:7% 3:27% 4:64% 5:3% | **1.9** (1.9–3.0) | 91% | 2:7% 3:27% 4:64% 5:3% |
| 2NT | 14.7% | 40 | 8 | 8/10/**10**/10/10 | — | — | 25% | 2:68% 3:18% 5:15% |
| 2H | 14.7% | 40 | 9 | 7/8/**10**/10/12 | 4:5% 5:90% 7:5% | **2.2** (2.2–3.7) | 25% | 1:15% 2:83% 3:3% |
| 2S | 9.9% | 27 | 8 | 9/10/**16**/16/16 | 2:89% 3:7% 4:4% | **3.0** (3.0–3.0) | 74% | 3:15% 4:63% 5:22% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 3C | fav | 50 | 7/7/**7**/7/10 |
| 2NT | fav | 32 | 10/10/**10**/10/10 |
| 2H | fav | 38 | 7/8/**10**/10/12 |

Dealer filters (paste into the custom filter box; derived from the data):

- `3C` → `c >= 3 and hcp in 7..10`

### (1S) 2H (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal | partner's ♥ |
|---|---|---|---|---|---|---|---|---|
| P | 46.8% | 190 | 68 | 3/6/**7**/8/9 | — | — | 63% | 0:3% 1:15% 2:70% 3:12% 4+:1% |
| 2S | 15.0% | 61 | 18 | 9/9/**13**/13/16 | 1:5% 2:15% 3:62% 4:8% 5:10% | **0.5** (0.2–3.7) | 75% | 2:51% 3:43% 4:5% 5+:2% |
| 3H | 9.1% | 37 | 27 | 4/8/**9**/9/10 | 2:5% 3:78% 4:16% | **2.3** (1.5–4.2) | 76% | 2:5% 3:78% 4:16% |
| 2NT | 7.4% | 30 | 18 | 8/9/**10**/10/15 | — | — | 60% | 1:17% 2:53% 3:27% 4:3% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2S | none | 31 | 10/13/**13**/13/13 |

Dealer filters (paste into the custom filter box; derived from the data):

- `2S` → `((hcp in 9..16 and d >= 4) or (hcp in 9..16 and c >= 4))`

### (1C) X (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 1H | 19.7% | 136 | 68 | 4/5/**7**/8/8 | 4:60% 5:37% 6:2% | **3.7** (2.4–5.2) | 64% |
| 1S | 14.1% | 97 | 58 | 1/5/**5**/7/10 | 4:58% 5:41% 6+:1% | **3.2** (1.5–3.9) | 62% |
| 1D | 11.0% | 76 | 49 | 2/3/**5**/7/9 | 3:8% 4:63% 5:22% 6:7% | **2.7** (2.0–4.0) | 72% |
| 2C | 10.9% | 75 | 33 | 8/10/**11**/14/14 | <1:1% 1:8% 2:23% 3:59% 4:7% 5:3% | **1.3** (0.2–3.8) | 61% |
| 1NT | 11.9% | 82 | 31 | 8/8/**10**/10/10 | — | — | 83% |
| 2H | 8.1% | 56 | 23 | 6/8/**8**/8/10 | 4:23% 5:73% 6:4% | **5.2** (4.9–6.0) | 45% |
| 2S | 6.8% | 47 | 28 | 7/8/**10**/10/11 | 4:45% 5:55% | **3.6** (2.8–3.9) | 74% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1H | none | 52 | 4/5/**8**/8/8 |
| 1H | fav | 30 | 4/6/**7**/8/10 |
| 1H | unfav | 35 | 3/5/**6**/8/8 |
| 1S | none | 42 | 5/5/**6**/8/8 |
| 1D | fav | 32 | 3/3/**5**/7/7 |
| 2C | none | 41 | 8/11/**14**/14/14 |
| 1NT | both | 38 | 8/8/**10**/10/10 |
| 2H | unfav | 28 | 8/8/**8**/8/9 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 1H | — | 6/**8**/8 (71) | 5/**6**/8 (38) | 4/**6**/7 (17) |

Dealer filters (paste into the custom filter box; derived from the data):

- `1H` → `h >= 4 and top(h,5) >= 1 and hcp in 4..8`
- `1S` → `s >= 4 and hcp in 1..10`
- `1D` → `d >= 4 and top(d,5) >= 1 and hcp in 2..9`
- `2C` → `hcp in 8..14`
- `1NT` → `hcp in 8..10` *(+ balanced)*
- `2H` → `h >= 4 and top(h,5) >= 1 and hcp in 6..10`

### (1D) X (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 1H | 26.7% | 169 | 70 | 4/5/**8**/8/10 | 3:9% 4:71% 5:18% 6+:2% | **3.5** (2.7–4.1) | 75% |
| 1S | 17.2% | 109 | 67 | 0/5/**5**/8/9 | 3:4% 4:62% 5:34% | **2.5** (1.3–4.0) | 70% |
| 1NT | 13.7% | 87 | 40 | 6/7/**9**/10/10 | — | — | 89% |
| 2H | 10.7% | 68 | 18 | 8/9/**10**/10/10 | 4:87% 5:13% | **2.7** (2.7–3.5) | 81% |
| 2D | 8.2% | 52 | 35 | 9/9/**10**/11/13 | <1:2% 1:37% 2:31% 3:12% 4:17% 5+:2% | **3.0** (1.7–5.6) | 38% |
| 2S | 6.8% | 43 | 34 | 5/7/**8**/9/11 | 4:23% 5:72% 6:5% | **4.0** (2.0–5.3) | 56% |
| P | 4.7% | 30 | 23 | 2/7/**10**/11/14 | — | — | 23% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1H | none | 33 | 5/9/**10**/10/10 |
| 1H | fav | 77 | 5/5/**8**/8/8 |
| 1H | both | 44 | 2/6/**7**/9/9 |
| 1S | unfav | 31 | 3/5/**5**/8/10 |
| 1S | both | 38 | 0/3/**5**/9/9 |
| 1NT | none | 40 | 5/7/**7**/10/10 |
| 1NT | fav | 32 | 7/9/**9**/10/10 |
| 2H | none | 42 | 10/10/**10**/10/10 |
| 2D | both | 25 | 9/9/**9**/10/11 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 1H | — | 5/**6**/9 (18) | 4/**6**/7 (41) | 6/**8**/9 (103) |
| 1S | — | 5/**6**/7 (22) | 5/**5**/8 (43) | 3/**5**/7 (38) |

Dealer filters (paste into the custom filter box; derived from the data):

- `1H` → `h >= 4 and top(h,5) >= 1 and ((hcp in 2..10 and d <= 2) or (hcp in 4..10 and d in 3..5))`
- `1S` → `s >= 4 and hcp in 0..9`
- `1NT` → `hcp in 6..10` *(+ balanced)*
- `2H` → `h >= 4 and top(h,5) >= 1 and hcp in 8..10`
- `2D` → `hcp in 9..13`

### (1H) X (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 1S | 36.1% | 201 | 67 | 3/4/**5**/7/9 | 3:7% 4:81% 5:12% | **1.9** (1.7–3.7) | 72% |
| 1NT | 23.9% | 133 | 32 | 5/8/**9**/10/10 | — | — | 62% |
| 2C | 12.9% | 72 | 26 | 2/5/**5**/7/8 | 3:10% 4:53% 5:35% 6:3% | **2.9** (1.6–3.2) | 49% |
| 2S | 7.7% | 43 | 24 | 7/8/**8**/9/10 | 4:51% 5:49% | **2.2** (1.9–4.1) | 70% |
| 2D | 4.8% | 27 | 22 | 2/3/**5**/8/9 | 3:4% 4:44% 5:41% 6:11% | **3.0** (1.6–3.8) | 41% |
| 2H | 4.7% | 26 | 19 | 7/11/**11**/12/14 | 0:4% 1:12% 2:46% 3:19% 4:15% 5:4% | **2.3** (0.0–3.5) | 42% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1S | none | 72 | 2/5/**5**/7/9 |
| 1S | fav | 26 | 5/6/**7**/8/10 |
| 1S | unfav | 55 | 4/4/**4**/7/9 |
| 1S | both | 48 | 3/5/**6**/7/7 |
| 1NT | fav | 57 | 5/8/**8**/8/9 |
| 1NT | unfav | 57 | 7/10/**10**/10/10 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 1S | — | 6/**7**/7 (47) | 4/**5**/6 (115) | 5/**7**/7 (39) |
| 1NT | — | — | — | 8/**9**/10 (123) |

Dealer filters (paste into the custom filter box; derived from the data):

- `1S` → `s >= 4 and hcp in 3..9`
- `1NT` → `(has(h,a) or (has(h,k) and h >= 2) or (has(h,q) and h >= 3)) and hcp in 5..10`
- `2C` → `c >= 4 and hcp in 2..8`

### (1S) X (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 2H | 25.1% | 105 | 42 | 3/7/**8**/9/10 | 4:76% 5:24% | **3.1** (1.9–4.7) | 68% |
| 1NT | 22.7% | 95 | 45 | 5/7/**8**/8/10 | — | — | 93% |
| 2D | 13.9% | 58 | 33 | 3/4/**5**/7/9 | <4:2% 4:36% 5:62% | **3.8** (2.4–4.6) | 53% |
| 3H | 11.7% | 49 | 21 | 7/9/**10**/10/11 | 4:71% 5:24% 6:2% 7:2% | **3.7** (3.0–4.7) | 31% |
| 2C | 9.1% | 38 | 23 | 1/5/**6**/7/9 | 3:3% 4:58% 5:32% 6:5% 7:3% | **3.7** (2.6–3.7) | 76% |
| 2S | 6.7% | 28 | 12 | 10/10/**11**/11/14 | 1:11% 2:68% 3:14% 4:7% | **0.2** (0.2–4.4) | 14% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2H | both | 63 | 4/7/**9**/9/9 |
| 1NT | unfav | 35 | 4/8/**8**/8/9 |
| 1NT | both | 31 | 5/7/**7**/8/9 |
| 2D | fav | 29 | 3/4/**6**/7/9 |

HCP by length held in their suit — p25/**med**/p75 (n). Shortage acts lighter:

| action | 0–1 | 2 | 3 | 4+ |
|---|---|---|---|---|
| 2H | — | 9/**9**/9 (60) | 7/**7**/7 (18) | 4/**6**/7 (25) |

Dealer filters (paste into the custom filter box; derived from the data):

- `2H` → `h >= 4 and top(h,5) >= 1 and hcp in 3..10`
- `1NT` → `(has(s,a) or (has(s,k) and s >= 2) or (has(s,q) and s >= 3)) and hcp in 5..10` *(+ balanced)*
- `2D` → `d >= 4 and top(d,5) >= 1 and hcp in 3..9`

### (1H) X (2H) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 32.3% | 84 | 43 | 0/1/**4**/6/10 | — | — | 76% |
| 2S | 17.3% | 45 | 31 | 5/6/**7**/8/10 | 4:80% 5:20% | **3.5** (2.5–4.4) | 62% |
| X | 13.1% | 34 | 18 | 8/10/**11**/11/11 | theirs: 1:6% 2:71% 3:12% 4:12% | — | 88% |
| 3D | 11.9% | 31 | 9 | 7/10/**10**/10/10 | 5:87% 6:13% | **5.3** (5.3–5.3) | 81% |
| 3C | 10.0% | 26 | 9 | 5/8/**9**/11/11 | 3:4% 5:73% 6:23% | **2.9** (1.3–4.2) | 69% |

### (1S) X (2S) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| P | 28.8% | 81 | 43 | 2/3/**4**/5/10 | — | — | 67% |
| 3H | 18.9% | 53 | 22 | 5/8/**9**/10/10 | 4:32% 5:58% 6:8% 7+:2% | **4.9** (3.0–5.3) | 49% |
| 4H | 14.6% | 41 | 16 | 6/9/**10**/10/10 | 4:5% 5:85% 6:7% 7:2% | **4.9** (3.0–4.9) | 34% |
| X | 12.5% | 35 | 25 | 7/8/**9**/10/17 | theirs: 1:9% 2:54% 3:31% 4:6% | — | 71% |
| 3C | 9.6% | 27 | 14 | 5/6/**7**/9/17 | 5:56% 6:33% 7:11% | **3.7** (3.2–4.1) | 37% |
| 2NT | 9.3% | 26 | 19 | 4/5/**7**/8/10 | — | — | 31% |

Dealer filters (paste into the custom filter box; derived from the data):

- `3H` → `h >= 4 and top(h,5) >= 1 and hcp in 5..10`

## Uncontested responses: 1x (P) ?

Partner opened (natural style), RHO passed. Responder ranges. The 1C row shows STANDARD responders; transfer-walsh pairs (1D = ♥, 1H = ♠, 1S = no-major NT-ish) are tabulated separately below.

### 1C (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 1D | 23.7% | 1800 | 2061 | 3/6/**9**/13/17 | <2:2% 2:6% 3:13% 4:27% 5:30% 6:16% 7:6% | **3.9** (2.2–5.4) | 56% |
| 1H | 33.7% | 2557 | 1950 | 5/7/**10**/12/15 | 4:61% 5:27% 6:9% 7:3% | **3.8** (2.6–4.9) | 54% |
| 1S | 28.2% | 2137 | 1486 | 5/8/**10**/12/16 | 4:47% 5:38% 6:11% 7+:3% | **3.8** (2.9–5.1) | 49% |
| 1NT | 4.7% | 357 | 480 | 7/8/**9**/10/15 | — | — | 95% |
| 2C | 2.7% | 208 | 317 | 8/12/**14**/15/20 | <2:2% 2:5% 3:5% 4:23% 5:40% 6:22% 7:2% | **5.2** (4.0–6.5) | 60% |
| 2D | 1.4% | 110 | 259 | 4/8/**12**/16/19 | 1:5% 2:6% 3:16% 5:26% 6:35% 7:10% | **5.1** (3.3–6.2) | 21% |
| P | 1.8% | 134 | 139 | 1/2/**3**/4/5 | — | — | 76% |
| 2H | 1.0% | 74 | 149 | 6/8/**12**/15/16 | 2:22% 3:32% 4:19% 5:4% 6:14% 7:9% | **4.5** (2.6–5.6) | 49% |
| 2NT | 0.6% | 43 | 117 | 10/11/**12**/14/15 | — | — | 93% |
| 2S | 0.7% | 52 | 81 | 4/9/**11**/12/17 | 2:12% 3:31% 4:2% 5:13% 6:25% 7:8% 8:10% | **4.2** (2.4–4.8) | 35% |
| 3NT | 0.5% | 37 | 38 | 12/12/**14**/15/15 | — | — | 100% |
| 3C | 0.4% | 34 | 43 | 3/6/**7**/8/10 | 5:50% 6:50% | **3.8** (2.8–4.5) | 18% |
| 3D | 0.3% | 26 | 15 | 5/5/**7**/7/11 | 0:4% 6:12% 7:77% 8:8% | **4.5** (2.6–5.3) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1D | none | 446 | 3/5/**7**/13/17 |
| 1D | fav | 511 | 2/5/**10**/13/17 |
| 1D | unfav | 312 | 4/6/**10**/15/19 |
| 1D | both | 531 | 3/6/**9**/12/16 |
| 1H | none | 534 | 6/8/**10**/13/15 |
| 1H | fav | 867 | 6/7/**9**/11/15 |
| 1H | unfav | 387 | 6/8/**10**/12/14 |
| 1H | both | 769 | 4/7/**10**/12/16 |
| 1S | none | 508 | 6/8/**10**/12/14 |
| 1S | fav | 744 | 4/8/**10**/12/18 |
| 1S | unfav | 371 | 4/8/**10**/12/16 |
| 1S | both | 514 | 6/8/**10**/12/16 |
| 1NT | none | 152 | 7/9/**10**/10/11 |
| 1NT | fav | 44 | 7/8/**9**/11/18 |
| 1NT | unfav | 56 | 8/8/**9**/10/19 |
| 1NT | both | 105 | 7/8/**10**/10/15 |
| 2C | none | 37 | 7/10/**12**/14/21 |
| 2C | fav | 51 | 7/13/**14**/15/18 |
| 2C | unfav | 85 | 11/15/**15**/15/20 |
| 2C | both | 35 | 8/10/**12**/15/15 |
| 2D | none | 31 | 5/8/**13**/16/18 |
| 2D | fav | 27 | 5/8/**13**/17/18 |
| 2D | unfav | 27 | 4/8/**15**/19/19 |
| 2D | both | 25 | 4/9/**11**/12/15 |

Dealer filters (paste into the custom filter box; derived from the data):

- `1D` → `d >= 3 and hcp in 3..17`
- `1H` → `h >= 4 and top(h,5) >= 1 and hcp in 5..15`
- `1S` → `s >= 4 and top(s,5) >= 1 and hcp in 5..16`
- `1NT` → `hcp in 7..15` *(+ balanced)*
- `2C` → `c >= 3 and top(c,5) >= 1 and hcp in 8..20`
- `2D` → `hcp in 4..19`

### 1D (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 1H | 37.1% | 4798 | 1720 | 5/7/**9**/12/15 | <4:2% 4:55% 5:32% 6:8% 7:3% | **3.7** (2.3–4.8) | 46% |
| 1S | 37.2% | 4806 | 1464 | 5/8/**10**/12/15 | <4:1% 4:44% 5:42% 6:10% 7+:2% | **4.0** (2.5–5.3) | 51% |
| 1NT | 6.7% | 871 | 431 | 5/8/**9**/10/13 | — | — | 73% |
| 2C | 5.7% | 741 | 312 | 9/12/**14**/15/19 | <3:2% 3:6% 4:14% 5:31% 6:36% 7:10% | **5.4** (3.8–6.3) | 38% |
| P | 4.2% | 539 | 196 | 0/3/**4**/5/5 | — | — | 74% |
| 2D | 3.5% | 450 | 209 | 7/10/**14**/15/17 | <3:2% 3:4% 4:56% 5:30% 6:7% 7+:1% | **4.6** (3.7–6.8) | 77% |
| 2H | 1.3% | 165 | 115 | 4/6/**7**/9/12 | 2:4% 3:5% 4:27% 5:26% 6:31% 7:5% 8+:1% | **3.8** (2.3–4.4) | 8% |
| 2NT | 1.0% | 128 | 101 | 7/11/**12**/13/17 | — | — | 91% |
| 2S | 0.8% | 106 | 76 | 5/7/**9**/11/13 | 1:7% 2:8% 3:26% 4:2% 5:11% 6:31% 7:14% | **3.4** (1.9–4.4) | 12% |
| 3C | 0.7% | 89 | 55 | 5/9/**9**/10/15 | 2:4% 3:16% 4:11% 5:15% 6:11% 7:43% | **5.8** (3.3–7.2) | 24% |
| 3D | 0.6% | 77 | 51 | 3/6/**8**/9/10 | 4:45% 5:29% 6:26% | **2.8** (2.3–4.1) | 36% |
| 3NT | 0.5% | 68 | 38 | 11/12/**14**/15/15 | — | — | 94% |
| 4H | 0.3% | 37 | 17 | 8/8/**8**/10/12 | 2:5% 7:86% 8:8% | **4.4** (4.4–5.1) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1H | none | 789 | 5/7/**9**/11/15 |
| 1H | fav | 1535 | 5/7/**9**/12/17 |
| 1H | unfav | 961 | 5/7/**9**/11/14 |
| 1H | both | 1513 | 4/7/**10**/12/15 |
| 1S | none | 1428 | 5/7/**10**/12/14 |
| 1S | fav | 1320 | 5/8/**9**/11/15 |
| 1S | unfav | 926 | 5/7/**9**/11/16 |
| 1S | both | 1132 | 6/8/**10**/12/14 |
| 1NT | none | 182 | 5/6/**9**/10/12 |
| 1NT | fav | 252 | 5/7/**9**/10/15 |
| 1NT | unfav | 160 | 6/8/**9**/9/13 |
| 1NT | both | 277 | 6/8/**8**/9/12 |
| 2C | none | 200 | 10/13/**14**/19/19 |
| 2C | fav | 232 | 10/10/**14**/15/18 |
| 2C | unfav | 147 | 8/11/**12**/15/17 |
| 2C | both | 162 | 9/11/**12**/14/16 |
| 2D | none | 68 | 7/11/**14**/15/16 |
| 2D | fav | 202 | 8/10/**14**/15/18 |
| 2D | unfav | 135 | 8/11/**15**/17/17 |
| 2D | both | 45 | 5/8/**11**/14/18 |
| 2H | none | 25 | 3/5/**8**/9/11 |
| 2H | fav | 56 | 5/6/**6**/10/15 |
| 2H | unfav | 37 | 6/6/**8**/9/11 |
| 2H | both | 47 | 4/6/**6**/8/12 |

Dealer filters (paste into the custom filter box; derived from the data):

- `1H` → `h >= 4 and top(h,5) >= 1 and hcp in 5..15`
- `1S` → `s >= 4 and top(s,5) >= 1 and hcp in 5..15`
- `1NT` → `hcp in 5..13`
- `2C` → `c >= 4 and top(c,5) >= 1 and hcp in 9..19`
- `2D` → `d >= 4 and top(d,5) >= 1 and hcp in 7..17`
- `2H` → `h >= 4 and top(h,5) >= 1 and hcp in 4..12`

### 1H (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 1S | 34.2% | 2834 | 1008 | 5/7/**10**/12/16 | <4:1% 4:42% 5:43% 6:11% 7:3% | **3.8** (2.7–5.2) | 36% |
| 2C | 15.9% | 1315 | 559 | 9/11/**13**/15/18 | 1:4% 2:13% 3:24% 4:23% 5:22% 6:10% 7+:3% | **4.2** (2.8–5.7) | 65% |
| 1NT | 12.7% | 1056 | 558 | 4/6/**9**/10/12 | — | — | 45% |
| 2H | 11.2% | 930 | 355 | 5/7/**8**/9/10 | 3:90% 4:10% | **2.1** (0.8–4.1) | 92% |
| 2D | 6.4% | 529 | 234 | 9/11/**13**/14/17 | <3:2% 3:5% 4:7% 5:48% 6:36% 7+:2% | **5.3** (4.0–6.5) | 36% |
| 2NT | 6.6% | 547 | 223 | 8/10/**12**/14/15 | — | — | 61% |
| P | 4.5% | 373 | 134 | 0/2/**2**/4/5 | — | — | 58% |
| 2S | 1.8% | 151 | 111 | 3/6/**8**/11/13 | <2:1% 2:6% 3:18% 4:15% 5:13% 6:35% 7:12% | **4.4** (3.6–5.3) | 25% |
| 3C | 1.8% | 152 | 90 | 6/8/**9**/11/12 | 1:16% 2:22% 3:22% 4:28% 5:6% 6:4% 7+:2% | **3.4** (1.5–4.4) | 57% |
| 4H | 0.7% | 62 | 94 | 4/6/**7**/9/12 | 3:6% 4:42% 5:34% 6:18% | **3.9** (2.3–4.6) | 16% |
| 3D | 1.6% | 130 | 83 | 7/9/**10**/11/12 | 1:12% 2:34% 3:21% 4:17% 5:5% 6:11% | **3.2** (1.7–5.4) | 52% |
| 3H | 1.3% | 110 | 73 | 2/2/**6**/8/11 | 3:8% 4:87% 5:5% | **1.7** (1.5–3.8) | 38% |
| 3S | 0.4% | 35 | 31 | 8/9/**10**/11/14 | 1:3% 2:14% 3:14% 4:14% 5:43% 6:9% 7:3% | **4.6** (2.9–5.4) | 3% |
| 3NT | 0.4% | 33 | 27 | 10/11/**13**/13/14 | — | — | 73% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1S | none | 512 | 5/8/**11**/13/16 |
| 1S | fav | 936 | 5/7/**9**/10/14 |
| 1S | unfav | 537 | 5/8/**11**/16/18 |
| 1S | both | 849 | 3/6/**9**/11/13 |
| 2C | none | 244 | 9/12/**13**/15/18 |
| 2C | fav | 330 | 9/10/**13**/14/18 |
| 2C | unfav | 401 | 9/11/**13**/14/16 |
| 2C | both | 340 | 9/12/**14**/15/17 |
| 1NT | none | 220 | 2/6/**7**/10/12 |
| 1NT | fav | 358 | 4/6/**9**/10/11 |
| 1NT | unfav | 244 | 5/8/**9**/11/11 |
| 1NT | both | 234 | 5/7/**9**/10/12 |
| 2H | none | 345 | 6/7/**9**/9/9 |
| 2H | fav | 164 | 5/6/**7**/9/10 |
| 2H | unfav | 212 | 5/7/**8**/8/9 |
| 2H | both | 209 | 5/7/**7**/9/10 |
| 2D | none | 44 | 6/12/**13**/15/18 |
| 2D | fav | 84 | 7/10/**11**/15/20 |
| 2D | unfav | 149 | 9/12/**13**/13/16 |
| 2D | both | 252 | 10/11/**13**/14/17 |
| 2NT | none | 134 | 9/12/**13**/14/17 |
| 2NT | fav | 186 | 7/10/**12**/13/14 |
| 2NT | unfav | 123 | 9/11/**13**/15/15 |
| 2NT | both | 104 | 8/10/**10**/12/14 |

Dealer filters (paste into the custom filter box; derived from the data):

- `1S` → `s >= 4 and hcp in 5..16`
- `2C` → `top(c,5) >= 1 and hcp in 9..18`
- `1NT` → `hcp in 4..12`
- `2H` → `((hcp in 5..11 and s >= 4) or (hcp in 5..11 and s <= 3 and h <= 3))`
- `2D` → `d >= 4 and top(d,5) >= 1 and hcp in 9..17`
- `2NT` → `hcp in 8..15`

### 1S (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 1NT | 32.2% | 3440 | 1308 | 4/7/**8**/9/11 | — | — | 33% |
| 2C | 20.6% | 2204 | 779 | 9/11/**13**/15/17 | <2:2% 2:13% 3:18% 4:38% 5:14% 6:10% 7:4% | **4.5** (3.0–6.0) | 66% |
| 2S | 10.0% | 1068 | 432 | 4/6/**8**/9/10 | 3:89% 4:11% | **1.9** (0.9–4.1) | 80% |
| 2D | 8.3% | 882 | 337 | 9/12/**14**/15/18 | 2:3% 3:5% 4:9% 5:49% 6:31% 7:3% | **5.3** (3.9–6.5) | 24% |
| 2NT | 7.4% | 786 | 338 | 8/10/**12**/14/15 | — | — | 53% |
| 2H | 6.5% | 696 | 308 | 9/11/**13**/15/17 | <5:4% 5:55% 6:35% 7:4% 8:2% | **5.5** (4.1–6.2) | 21% |
| P | 4.4% | 468 | 192 | 1/3/**4**/4/5 | — | — | 42% |
| 4S | 1.8% | 188 | 110 | 0/5/**6**/8/9 | <4:2% 4:21% 5:51% 6:26% | **3.0** (2.0–4.5) | 4% |
| 3C | 2.2% | 240 | 141 | 6/8/**10**/10/13 | 1:16% 2:20% 3:22% 4:17% 5:3% 6:19% 7+:3% | **3.0** (1.1–5.3) | 39% |
| 3D | 2.1% | 222 | 136 | 6/8/**9**/10/12 | 1:10% 2:23% 3:21% 4:16% 5:16% 6:3% 7:10% | **3.6** (1.5–4.7) | 42% |
| 3S | 1.3% | 142 | 103 | 0/5/**6**/8/10 | 3:7% 4:71% 5:20% | **2.5** (1.7–3.5) | 37% |
| 3H | 0.9% | 101 | 73 | 6/8/**10**/11/13 | 1:7% 2:16% 3:16% 4:25% 5:5% 6:31% | **4.1** (2.3–5.4) | 36% |
| 3NT | 0.9% | 100 | 54 | 6/9/**10**/12/14 | — | — | 30% |
| 4C | 0.8% | 90 | 23 | 9/10/**12**/12/14 | 0:8% 1:89% 2:2% 3+:1% | **0.4** (0.0–0.9) | 0% |
| 4D | 0.3% | 37 | 13 | 8/9/**10**/10/13 | 0:11% 1:86% 4:3% | **0.4** (0.0–0.4) | 0% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1NT | none | 618 | 4/6/**8**/9/11 |
| 1NT | fav | 978 | 4/6/**7**/9/11 |
| 1NT | unfav | 756 | 4/7/**9**/10/11 |
| 1NT | both | 1088 | 6/7/**8**/10/11 |
| 2C | none | 406 | 9/12/**13**/14/16 |
| 2C | fav | 602 | 9/11/**13**/14/20 |
| 2C | unfav | 493 | 9/13/**13**/16/17 |
| 2C | both | 703 | 9/11/**12**/14/17 |
| 2S | none | 199 | 4/6/**9**/10/10 |
| 2S | fav | 344 | 4/6/**7**/9/9 |
| 2S | unfav | 171 | 4/7/**8**/9/9 |
| 2S | both | 354 | 5/7/**8**/9/10 |
| 2D | none | 147 | 10/12/**14**/15/15 |
| 2D | fav | 365 | 9/13/**14**/14/18 |
| 2D | unfav | 132 | 10/13/**13**/14/17 |
| 2D | both | 238 | 9/11/**14**/15/18 |
| 2NT | none | 171 | 9/11/**12**/14/15 |
| 2NT | fav | 308 | 8/9/**12**/14/15 |
| 2NT | unfav | 100 | 9/10/**12**/13/15 |
| 2NT | both | 207 | 9/10/**11**/13/15 |
| 2H | none | 149 | 10/11/**13**/17/17 |
| 2H | fav | 197 | 9/11/**13**/14/16 |
| 2H | unfav | 259 | 10/11/**12**/16/18 |
| 2H | both | 91 | 9/11/**13**/14/18 |

Dealer filters (paste into the custom filter box; derived from the data):

- `1NT` → `hcp in 4..11`
- `2C` → `top(c,5) >= 1 and hcp in 9..17`
- `2S` → `((hcp in 4..11 and h >= 4) or (hcp in 4..11 and s <= 3 and h <= 3))`
- `2D` → `d >= 4 and top(d,5) >= 1 and hcp in 9..18`
- `2NT` → `hcp in 8..15`
- `2H` → `h >= 5 and top(h,5) >= 1 and hcp in 9..17`

### 1NT (P) ?

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 2C | 27.7% | 3869 | 1652 | 5/8/**9**/11/15 | <1:2% 1:13% 2:27% 3:28% 4:21% 5:6% 6:3% | **2.8** (1.0–4.5) | 45% |
| P | 21.7% | 3029 | 1377 | 3/4/**6**/7/8 | — | — | 77% |
| 2H | 12.9% | 1808 | 698 | 3/6/**9**/12/16 | 0:4% 1:12% 2:36% 3:40% 4:4% 5:3% | **1.8** (0.2–3.9) | 39% |
| 2D | 12.3% | 1716 | 680 | 3/6/**7**/10/16 | 1:19% 2:26% 3:32% 4:16% 5:5% | **1.9** (0.7–4.0) | 29% |
| 3NT | 9.4% | 1308 | 608 | 8/10/**10**/12/14 | — | — | 78% |
| 3C | 4.0% | 565 | 367 | 7/10/**11**/12/16 | <1:1% 1:10% 2:27% 3:20% 4:25% 5:12% 6:5% | **3.7** (1.9–5.4) | 66% |
| 2NT | 3.5% | 493 | 354 | 5/9/**11**/12/16 | — | — | 54% |
| 2S | 2.7% | 378 | 288 | 5/8/**9**/11/21 | <1:1% 1:22% 2:15% 3:52% 4:7% 5:2% | **2.8** (0.4–4.7) | 38% |
| 4D | 1.7% | 242 | 112 | 6/8/**9**/10/15 | 0:2% 1:18% 2:34% 3:38% 4:5% 5+:2% | **2.3** (0.5–4.2) | 0% |
| 4H | 1.1% | 156 | 87 | 7/8/**9**/10/16 | 0:4% 1:7% 2:32% 3:49% 4:6% 5+:2% | **2.4** (1.3–3.5) | 1% |
| 4C | 0.8% | 113 | 46 | 7/8/**9**/10/18 | 1:29% 2:25% 3:39% 4:2% 5:5% | **3.4** (0.2–4.7) | 1% |
| 3D | 0.6% | 90 | 80 | 6/9/**11**/13/16 | 1:30% 2:14% 3:9% 4:13% 5:21% 6:12% | **3.7** (0.4–4.5) | 20% |
| 3S | 0.7% | 92 | 57 | 9/10/**10**/11/16 | <1:1% 1:83% 2:1% 3:8% 4:5% 5+:2% | **0.0** (0.0–3.9) | 5% |
| 3H | 0.4% | 61 | 46 | 8/10/**12**/17/21 | 1:80% 2:10% 3:8% 4+:2% | **5.4** (2.1–10.0) | 5% |
| 4NT | 0.2% | 28 | 15 | 14/16/**16**/16/17 | — | — | 100% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 2C | none | 966 | 6/8/**9**/10/15 |
| 2C | fav | 1098 | 3/8/**10**/13/16 |
| 2C | unfav | 846 | 5/8/**9**/11/14 |
| 2C | both | 959 | 6/7/**9**/10/14 |
| 2H | none | 531 | 3/6/**9**/13/14 |
| 2H | fav | 596 | 4/5/**9**/11/15 |
| 2H | unfav | 294 | 3/8/**11**/12/17 |
| 2H | both | 387 | 3/5/**6**/10/12 |
| 2D | none | 531 | 3/5/**7**/10/17 |
| 2D | fav | 409 | 3/7/**8**/12/16 |
| 2D | unfav | 298 | 2/5/**7**/10/13 |
| 2D | both | 478 | 3/6/**7**/10/14 |
| 3NT | none | 455 | 9/10/**10**/12/15 |
| 3NT | fav | 396 | 8/10/**10**/12/14 |
| 3NT | unfav | 229 | 8/10/**11**/12/14 |
| 3NT | both | 228 | 8/9/**10**/11/14 |
| 3C | none | 155 | 8/10/**12**/13/16 |
| 3C | fav | 180 | 8/10/**11**/13/17 |
| 3C | unfav | 96 | 8/9/**11**/12/15 |
| 3C | both | 134 | 5/9/**10**/11/14 |
| 2NT | none | 127 | 5/9/**11**/13/16 |
| 2NT | fav | 164 | 7/10/**11**/13/15 |
| 2NT | unfav | 82 | 6/9/**11**/11/15 |
| 2NT | both | 120 | 2/7/**9**/11/14 |

Dealer filters (paste into the custom filter box; derived from the data):

- `2C` → `((hcp in 5..11 and h >= 4) or (hcp in 5..11 and s >= 4))`
- `2H` → `(hcp in 3..16 and s >= 4)`
- `2D` → `(hcp in 3..16 and h >= 4)`
- `3NT` → `hcp in 8..14`
- `3C` → `((hcp in 7..16 and h >= 4) or (hcp in 7..16 and s >= 4) or (hcp in 7..16 and s <= 3 and h <= 3))`
- `2NT` → `hcp in 5..16`

## Transfer responses to 1C: 1C (P) ? by transfer-walsh pairs

Detected per partnership from the hands (4+ of the next suit in essentially every 1D/1H response). The derived rules key on the suit actually shown: 1D = hearts, 1H = spades. The field’s 1S is multi-way — see the decision matrices below for its components.

### 1C (P) ? — transfer responders

| action | freq | n | deals | HCP p5/p25/med/p75/p95 | bid-suit len | texture | %bal |
|---|---|---|---|---|---|---|---|
| 1D | 34.9% | 1436 | 2061 | 4/7/**9**/12/16 | 1:8% 2:23% 3:29% 4:27% 5:9% 6:3% | **3.0** (1.5–4.9) | 52% |
| 1H | 33.0% | 1359 | 1950 | 4/7/**10**/12/15 | <1:2% 1:9% 2:28% 3:48% 4:10% 5:3% | **3.0** (0.9–4.5) | 48% |
| 1S | 16.8% | 690 | 1486 | 5/8/**10**/13/17 | <1:2% 1:3% 2:26% 3:59% 4:6% 5:3% 6+:1% | **3.1** (1.5–4.5) | 62% |
| 1NT | 3.9% | 160 | 480 | 8/10/**11**/14/18 | — | — | 88% |
| 2C | 3.5% | 142 | 317 | 7/12/**13**/15/20 | 0:4% 1:11% 2:18% 3:10% 4:10% 5:28% 6:20% | **4.4** (3.2–6.2) | 38% |
| 2D | 1.8% | 72 | 259 | 4/7/**12**/15/18 | 1:3% 2:26% 3:26% 4:13% 5:19% 6:6% 7:7% | **4.3** (2.1–5.4) | 18% |
| P | 2.4% | 97 | 139 | 1/2/**4**/4/5 | — | — | 74% |
| 2H | 1.2% | 51 | 149 | 4/5/**8**/12/17 | 0:4% 1:10% 2:22% 3:18% 4:24% 5:10% 6:12% 7+:2% | **2.3** (0.7–4.7) | 6% |
| 2NT | 1.1% | 45 | 117 | 10/12/**14**/15/16 | — | — | 84% |

By vulnerability (fav = they vul, we not; unfav = we vul, they not):

| action | vul | n | HCP p5/p25/med/p75/p95 |
|---|---|---|---|
| 1D | none | 300 | 5/8/**9**/12/15 |
| 1D | fav | 484 | 5/7/**9**/11/16 |
| 1D | unfav | 227 | 5/8/**10**/12/15 |
| 1D | both | 425 | 4/7/**10**/12/15 |
| 1H | none | 343 | 5/7/**10**/12/14 |
| 1H | fav | 431 | 3/7/**9**/12/17 |
| 1H | unfav | 250 | 5/7/**9**/11/14 |
| 1H | both | 335 | 6/8/**10**/12/16 |
| 1S | none | 182 | 5/7/**10**/13/16 |
| 1S | fav | 200 | 4/7/**11**/13/17 |
| 1S | unfav | 128 | 5/8/**11**/15/19 |
| 1S | both | 180 | 5/8/**10**/12/16 |
| 1NT | none | 41 | 8/10/**11**/13/16 |
| 1NT | fav | 45 | 7/10/**12**/15/18 |
| 1NT | unfav | 32 | 8/11/**14**/15/20 |
| 1NT | both | 42 | 8/10/**10**/12/16 |
| 2C | none | 25 | 11/13/**14**/16/21 |
| 2C | fav | 43 | 6/11/**13**/14/17 |
| 2C | unfav | 44 | 8/12/**15**/15/20 |
| 2C | both | 30 | 6/9/**12**/14/15 |

Dealer filters (paste into the custom filter box; derived from the data):

- `1D` → `(hcp in 4..16 and h >= 4)`
- `1H` → `(hcp in 4..15 and s >= 4)`
- `1S` → `(hcp in 5..17 and s <= 3 and h <= 3)`
- `1NT` → `hcp in 8..18` *(+ balanced)*
- `2C` → `hcp in 7..20`
- `2D` → `((hcp in 4..18 and h >= 4) or (hcp in 12..18 and s <= 3 and h <= 3) or (hcp in 12..18 and d >= 5) or (hcp in 12..18 and c >= 5))`

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
| ≤4 HCP | 526 | 16% | 15% | 44% | · | · | 21% | 1% | 3% |
| 5–11 · 4♥ only | 1363 | 89% | · | 9% | 1% | · | 1% | · | 1% |
| 5–11 · 4♠ only | 1453 | · | 84% | 14% | · | · | · | 1% | 1% |
| 5–11 · 4-4+ majors | 741 | 62% | 26% | 7% | · | 1% | · | 1% | 3% |
| 5–11 · no 4M | 1031 | · | · | 55% | 30% | 3% | 1% | 2% | 9% |
| 12+ · 4♥ only | 767 | 68% | · | 26% | 1% | 1% | · | 2% | 2% |
| 12+ · 4♠ only | 689 | 1% | 84% | 10% | 1% | 1% | · | 1% | 3% |
| 12+ · 4-4+ majors | 355 | 75% | 17% | 3% | 2% | 3% | · | · | · |
| 12+ · no 4M bal | 482 | · | · | 52% | 4% | 19% | · | 4% | 20% |
| 12+ · no 4M unbal | 180 | 1% | 1% | 55% | · | 29% | · | 12% | 2% |

### 1C (X) ? — standard responders

| hand type | n | P | 1D | 1H | 1S | XX | 2C | 1NT | other |
|---|---|---|---|---|---|---|---|---|---|
| ≤4 HCP | 334 | 76% | 7% | 3% | 4% | · | 1% | · | 8% |
| 5–11 · 4♥ only | 253 | 14% | 27% | 39% | 1% | 5% | 3% | 1% | 10% |
| 5–11 · 4♠ only | 290 | 10% | 8% | 18% | 45% | 13% | · | 1% | 5% |
| 5–11 · 4-4+ majors | 84 | 12% | 10% | 43% | 24% | 11% | 1% | · | · |
| 5–11 · no 4M | 253 | 22% | 29% | · | 12% | 8% | 11% | 7% | 10% |

### 1C (1D) ? — standard responders

| hand type | n | 1H | X | 1S | P | 2C | 3C | 2D | other |
|---|---|---|---|---|---|---|---|---|---|
| ≤4 HCP | 147 | 10% | 5% | 2% | 65% | 2% | 2% | 4% | 10% |
| 5–11 · 4♥ only | 226 | 47% | 36% | · | 8% | · | · | 4% | 5% |
| 5–11 · 4♠ only | 223 | 31% | 3% | 44% | 8% | · | · | · | 13% |
| 5–11 · 4-4+ majors | 204 | 14% | 46% | 20% | 3% | 12% | · | · | 4% |
| 5–11 · no 4M | 223 | · | · | 14% | 14% | 22% | 33% | 4% | 11% |
| 12+ · 4♥ only | 28 | 50% | 39% | · | · | 4% | · | 7% | · |
| 12+ · 4♠ only | 51 | 39% | 10% | 47% | · | · | · | · | 4% |
| 12+ · 4-4+ majors | 26 | 35% | 42% | 8% | · | 4% | · | 4% | 8% |

### 1C (P) ? — transfer-walsh responders

| hand type | n | 1D | 1H | 1S | 1NT | 2C | P | 2D | other |
|---|---|---|---|---|---|---|---|---|---|
| ≤4 HCP | 279 | 26% | 27% | 11% | · | · | 30% | 1% | 4% |
| 5–11 · 4♥ only | 694 | 93% | 1% | 1% | · | · | · | 2% | 1% |
| 5–11 · 4♠ only | 873 | 2% | 92% | 3% | 1% | · | · | · | 2% |
| 5–11 · 4-4+ majors | 434 | 66% | 28% | · | · | 1% | · | 1% | 3% |
| 5–11 · no 4M | 510 | 4% | · | 69% | 15% | 4% | 2% | 1% | 6% |
| 12+ · 4♥ only | 394 | 63% | 2% | 18% | 3% | 8% | · | 3% | 3% |
| 12+ · 4♠ only | 398 | 2% | 77% | 9% | 6% | 1% | · | 1% | 5% |
| 12+ · 4-4+ majors | 191 | 70% | 19% | 2% | 4% | 3% | · | 1% | 2% |
| 12+ · no 4M bal | 242 | 4% | · | 48% | 13% | 16% | · | 5% | 15% |
| 12+ · no 4M unbal | 99 | 2% | · | 41% | 2% | 35% | · | 11% | 8% |

### 1C (X) ? — transfer-walsh responders

| hand type | n | P | 1D | 1H | 1S | XX | 2H | 2D | other |
|---|---|---|---|---|---|---|---|---|---|
| ≤4 HCP | 183 | 72% | 7% | 7% | 2% | 2% | 3% | · | 7% |
| 5–11 · 4♥ only | 137 | 18% | 58% | 3% | 1% | 7% | 1% | 4% | 7% |
| 5–11 · 4♠ only | 127 | 19% | 1% | 58% | 4% | 12% | 2% | 1% | 3% |
| 5–11 · 4-4+ majors | 41 | 22% | 29% | 37% | 2% | 2% | 5% | · | 2% |
| 5–11 · no 4M | 126 | 24% | 2% | · | 40% | 15% | · | 2% | 17% |

### 1C (1D) ? — transfer-walsh responders

| hand type | n | X | 1H | P | 1S | 2C | 2D | 3C | other |
|---|---|---|---|---|---|---|---|---|---|
| ≤4 HCP | 64 | 13% | · | 67% | 2% | 3% | 6% | 3% | 6% |
| 5–11 · 4♥ only | 120 | 75% | 6% | 5% | 1% | · | 6% | · | 8% |
| 5–11 · 4♠ only | 122 | 2% | 67% | 11% | 5% | · | · | · | 15% |
| 5–11 · 4-4+ majors | 116 | 47% | 25% | 1% | 9% | 12% | 3% | · | 3% |
| 5–11 · no 4M | 87 | 1% | 1% | 17% | 29% | 20% | · | 17% | 15% |

## Book vs field

"Book" is the SAYC/2-over-1 teaching range (ACBL SAYC card/booklet). "Field" is
this dataset: p5–p95 (median). The field is systematically lighter than the book
at the bottom of ranges, and vulnerability is the biggest modifier for preempts.

| context | book | field |
|---|---|---|
| 1M opening (seats 1–2) | 12–21 (light 11s common in practice) | 10–18 (med 13), n=23759 |
| 1NT opening (strong-NT pairs) | 15–17 | 13–17 (med 15), n=17478 |
| 2NT opening | 20–21 | 19–21 (med 20), n=2507 |
| weak 2S (seats 1–3) | 5–11, 6-card suit | 5–11 (med 8), n=2497 |
| 1-level overcall (1C) 1H | 8–16 (down to ~8) | 7–16 (med 11), n=2844 |
| 2-level overcall (1S) 2H | 10–17ish, good suit | 9–16 (med 12), n=1297 |
| 1NT overcall (1H) 1NT | 15–18 | 14–17 (med 15), n=535 |
| takeout double (1S) X | opening values (12+) or shape | 11–19 (med 14), n=1658 |
| weak jump overcall (1C) 2H | ~6–10, 6-card suit | 4–12 (med 8), n=453 |
| Michaels (1H) 2H | 8–12 or 16+, 5-5 | 8–15 (med 12), n=459 |
| unusual 2NT (1S) 2NT | weak or 17+, 5-5 minors | 7–20 (med 11), n=172 |
| negative double 1S (2H) X | 7+ (level-adjusted) | 7–15 (med 10), n=135 |
| new suit response 1C (P) 1H (std responders) | 6+ | 5–15 (med 10), n=2557 |

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
  "n": 2148,
  "hcp": {
    "mean": 14.16,
    "sd": 2.85,
    "min": 5,
    "max": 25,
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
      "n": 891,
      "p": [
        11,
        11,
        12,
        13,
        15,
        17,
        19
      ]
    },
    "3": {
      "n": 510,
      "p": [
        12,
        12,
        14,
        15,
        17,
        19,
        19
      ]
    },
    "0–1": {
      "n": 686,
      "p": [
        10,
        10,
        11,
        12,
        15,
        18,
        22
      ]
    },
    "4+": {
      "n": 61,
      "p": [
        12,
        12,
        13,
        14,
        17,
        19,
        20
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

