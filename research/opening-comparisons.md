# Opening-bid comparisons — recreated from championship bidding

A recreation of Richard Pavlicek’s [Opening Bid Comparisons]
(https://www.rpbridge.net/9x00.htm) using the auctions we have extracted from
recent World & European championships and the top US team events (2023–2026).

**Method** (his, applied to our data): on a team board the identical hand is
played at two tables. Where a seat *opened differently* at the two tables — 1♥
at one, Pass at the other; 1♣ vs 1♦; and so on — the board’s IMP swing is
awarded to whichever choice did better. Summed over every such case, the higher
IMP total is the long-term winner (**bold**). Split by seat (First = dealer,
then the passed-out positions) and, where Pavlicek does, by the acting hand’s
HCP. The meaning of a bid is not judged — but paired choices almost always have
a like relationship (1♥/1NT ≈ balanced 5-card heart hand; 1♣/2♣ ≈ big-club vs
standard).

**Data.** 166,692 contract-auctions; 82,338 boards had both tables
with a bid auction and were compared (average swing 4.14 IMPs/board).
We score every board ourselves from contract + tricks (validated 100% against
the events that publish scores), so US events with only hand records are included.
Small samples are noisy — treat sub-30-case rows as suggestive only.

Caveat vs Pavlicek: his study is 72 events 1996–2014 (40,069 deals); ours is a
different, more recent field, so exact percentages will differ — the interest is
whether the same directional verdicts hold.

## Open vs Pass

A light opening (Table 1) vs a pass (Table 2), by strain.

| Seat | Compared | Cases | Table 1 | IMPs | % | Table 2 | IMPs | % | Winner |
|---|---|---:|---|---:|---:|---|---:|---:|---|
| First | 1♣ vs Pass | 824 | **1♣** | 1978 | 55.4 | Pass | 1591 | 44.6 | 1♣ |
| First | 1♦ vs Pass | 1103 | **1♦** | 2812 | 58.5 | Pass | 1992 | 41.5 | 1♦ |
| First | 1♥ vs Pass | 420 | 1♥ | 993 | 48.9 | **Pass** | 1036 | 51.1 | Pass |
| First | 1♠ vs Pass | 496 | **1♠** | 1286 | 53.9 | Pass | 1101 | 46.1 | 1♠ |
| First | 1NT vs Pass | 548 | **1NT** | 1325 | 53.3 | Pass | 1161 | 46.7 | 1NT |
| Second | 1♣ vs Pass | 389 | **1♣** | 1069 | 58.1 | Pass | 771 | 41.9 | 1♣ |
| Second | 1♦ vs Pass | 462 | **1♦** | 1211 | 59.3 | Pass | 831 | 40.7 | 1♦ |
| Second | 1♥ vs Pass | 190 | 1♥ | 382 | 45.2 | **Pass** | 464 | 54.8 | Pass |
| Second | 1♠ vs Pass | 190 | **1♠** | 498 | 57.0 | Pass | 375 | 43.0 | 1♠ |
| Second | 1NT vs Pass | 256 | **1NT** | 624 | 58.1 | Pass | 450 | 41.9 | 1NT |
| Third | 1♣ vs Pass | 254 | **1♣** | 497 | 52.4 | Pass | 452 | 47.6 | 1♣ |
| Third | 1♦ vs Pass | 291 | **1♦** | 541 | 53.8 | Pass | 464 | 46.2 | 1♦ |
| Third | 1♥ vs Pass | 112 | **1♥** | 236 | 57.6 | Pass | 174 | 42.4 | 1♥ |
| Third | 1♠ vs Pass | 141 | **1♠** | 387 | 57.7 | Pass | 284 | 42.3 | 1♠ |
| Third | 1NT vs Pass | 22 | **1NT** | 36 | 53.7 | Pass | 31 | 46.3 | 1NT |

## One Club vs One Diamond

1♣ vs 1♦ with the same hand.

| Seat | Compared | Cases | Table 1 | IMPs | % | Table 2 | IMPs | % | Winner |
|---|---|---:|---|---:|---:|---|---:|---:|---|
| First | 1♣ vs 1♦ | 2470 | **1♣** | 5292 | 51.4 | 1♦ | 5012 | 48.6 | 1♣ |
| Second | 1♣ vs 1♦ | 1462 | **1♣** | 2877 | 50.3 | 1♦ | 2848 | 49.7 | 1♣ |
| Third | 1♣ vs 1♦ | 724 | **1♣** | 1373 | 50.3 | 1♦ | 1354 | 49.7 | 1♣ |

## One of a Suit vs 1NT

A one-of-a-suit opening vs 1NT (usually a 5-card suit inside a balanced hand).

| Seat | Compared | Cases | Table 1 | IMPs | % | Table 2 | IMPs | % | Winner |
|---|---|---:|---|---:|---:|---|---:|---:|---|
| First | 1♣ vs 1NT | 2149 | **1♣** | 4394 | 52.1 | 1NT | 4033 | 47.9 | 1♣ |
| First | 1♦ vs 1NT | 1339 | 1♦ | 2375 | 44.4 | **1NT** | 2975 | 55.6 | 1NT |
| First | 1♥ vs 1NT | 263 | 1♥ | 455 | 44.7 | **1NT** | 563 | 55.3 | 1NT |
| First | 1♠ vs 1NT | 377 | 1♠ | 617 | 39.9 | **1NT** | 929 | 60.1 | 1NT |
| Second | 1♣ vs 1NT | 1142 | 1♣ | 1973 | 46.9 | **1NT** | 2230 | 53.1 | 1NT |
| Second | 1♦ vs 1NT | 727 | 1♦ | 1233 | 40.9 | **1NT** | 1779 | 59.1 | 1NT |
| Second | 1♥ vs 1NT | 234 | **1♥** | 590 | 58.0 | 1NT | 428 | 42.0 | 1♥ |
| Second | 1♠ vs 1NT | 253 | 1♠ | 494 | 47.2 | **1NT** | 553 | 52.8 | 1NT |
| Third | 1♣ vs 1NT | 455 | **1♣** | 824 | 50.0 | 1NT | 823 | 50.0 | 1♣ |
| Third | 1♦ vs 1NT | 320 | 1♦ | 592 | 46.2 | **1NT** | 690 | 53.8 | 1NT |
| Third | 1♥ vs 1NT | 88 | **1♥** | 142 | 50.2 | 1NT | 141 | 49.8 | 1♥ |
| Third | 1♠ vs 1NT | 151 | **1♠** | 447 | 57.4 | 1NT | 332 | 42.6 | 1♠ |

## One of a Suit vs 2NT

One of a suit vs 2NT.

| Seat | Compared | Cases | Table 1 | IMPs | % | Table 2 | IMPs | % | Winner |
|---|---|---:|---|---:|---:|---|---:|---:|---|
| First | 1♣ vs 2NT | 284 | 1♣ | 500 | 42.2 | **2NT** | 685 | 57.8 | 2NT |
| First | 1♦ vs 2NT | 106 | 1♦ | 146 | 31.7 | **2NT** | 314 | 68.3 | 2NT |
| First | 1♥ vs 2NT | 35 | 1♥ | 57 | 39.6 | **2NT** | 87 | 60.4 | 2NT |
| First | 1♠ vs 2NT | 12 | **1♠** | 62 | 72.9 | 2NT | 23 | 27.1 | 1♠ |
| Second | 1♣ vs 2NT | 208 | 1♣ | 425 | 43.3 | **2NT** | 556 | 56.7 | 2NT |
| Second | 1♦ vs 2NT | 91 | **1♦** | 241 | 54.9 | 2NT | 198 | 45.1 | 1♦ |
| Second | 1♥ vs 2NT | 28 | 1♥ | 81 | 43.3 | **2NT** | 106 | 56.7 | 2NT |
| Second | 1♠ vs 2NT | 7 | **1♠** | 31 | 77.5 | 2NT | 9 | 22.5 | 1♠ |
| Third | 1♣ vs 2NT | 116 | **1♣** | 211 | 53.3 | 2NT | 185 | 46.7 | 1♣ |
| Third | 1♦ vs 2NT | 59 | **1♦** | 151 | 66.8 | 2NT | 75 | 33.2 | 1♦ |
| Third | 1♥ vs 2NT | 8 | 1♥ | 21 | 43.8 | **2NT** | 27 | 56.3 | 2NT |
| Third | 1♠ vs 2NT | 21 | **1♠** | 47 | 52.8 | 2NT | 42 | 47.2 | 1♠ |

## One of a Suit vs 2♣ (16+ HCP)

Strong hands opened naturally at the one level vs an artificial 2♣ (big-club vs standard).

| Seat | Compared | Cases | Table 1 | IMPs | % | Table 2 | IMPs | % | Winner |
|---|---|---:|---|---:|---:|---|---:|---:|---|
| First | 1♣ vs 2♣ | 204 | 1♣ | 453 | 45.9 | **2♣** | 533 | 54.1 | 2♣ |
| First | 1♦ vs 2♣ | 38 | 1♦ | 8 | 3.9 | **2♣** | 198 | 96.1 | 2♣ |
| First | 1♥ vs 2♣ | 11 | **1♥** | 33 | 62.3 | 2♣ | 20 | 37.7 | 1♥ |
| First | 1♠ vs 2♣ | 57 | 1♠ | 121 | 32.9 | **2♣** | 247 | 67.1 | 2♣ |
| Second | 1♣ vs 2♣ | 136 | 1♣ | 334 | 45.4 | **2♣** | 401 | 54.6 | 2♣ |
| Second | 1♦ vs 2♣ | 25 | 1♦ | 19 | 21.3 | **2♣** | 70 | 78.7 | 2♣ |
| Second | 1♥ vs 2♣ | 39 | 1♥ | 46 | 33.3 | **2♣** | 92 | 66.7 | 2♣ |
| Second | 1♠ vs 2♣ | 10 | **1♠** | 22 | 59.5 | 2♣ | 15 | 40.5 | 1♠ |
| Third | 1♣ vs 2♣ | 122 | **1♣** | 310 | 51.6 | 2♣ | 291 | 48.4 | 1♣ |
| Third | 1♦ vs 2♣ | 12 | **1♦** | 21 | 60.0 | 2♣ | 14 | 40.0 | 1♦ |
| Third | 1♠ vs 2♣ | 16 | **1♠** | 69 | 79.3 | 2♣ | 18 | 20.7 | 1♠ |

## One vs Two of the Same Suit (9–15 HCP)

Opening at the one level vs a weak/intermediate two, same suit.

| Seat | Compared | Cases | Table 1 | IMPs | % | Table 2 | IMPs | % | Winner |
|---|---|---:|---|---:|---:|---|---:|---:|---|
| First | 1♦ vs 2♦ | 65 | 1♦ | 163 | 49.4 | **2♦** | 167 | 50.6 | 2♦ |
| First | 1♥ vs 2♥ | 199 | **1♥** | 538 | 54.3 | 2♥ | 453 | 45.7 | 1♥ |
| First | 1♠ vs 2♠ | 262 | 1♠ | 711 | 48.5 | **2♠** | 754 | 51.5 | 2♠ |
| Second | 1♦ vs 2♦ | 24 | **1♦** | 88 | 75.9 | 2♦ | 28 | 24.1 | 1♦ |
| Second | 1♥ vs 2♥ | 64 | 1♥ | 109 | 46.0 | **2♥** | 128 | 54.0 | 2♥ |
| Second | 1♠ vs 2♠ | 94 | 1♠ | 234 | 45.6 | **2♠** | 279 | 54.4 | 2♠ |
| Third | 1♦ vs 2♦ | 33 | 1♦ | 49 | 35.8 | **2♦** | 88 | 64.2 | 2♦ |
| Third | 1♥ vs 2♥ | 94 | **1♥** | 198 | 50.6 | 2♥ | 193 | 49.4 | 1♥ |
| Third | 1♠ vs 2♠ | 66 | **1♠** | 180 | 58.6 | 2♠ | 127 | 41.4 | 1♠ |

## One vs Four of the Same Major

Going slow (1M) vs preempting (4M).

| Seat | Compared | Cases | Table 1 | IMPs | % | Table 2 | IMPs | % | Winner |
|---|---|---:|---|---:|---:|---|---:|---:|---|
| First | 1♥ vs 4♥ | 41 | **1♥** | 159 | 62.4 | 4♥ | 96 | 37.6 | 1♥ |
| First | 1♠ vs 4♠ | 60 | 1♠ | 114 | 38.4 | **4♠** | 183 | 61.6 | 4♠ |
| Second | 1♥ vs 4♥ | 35 | **1♥** | 125 | 61.3 | 4♥ | 79 | 38.7 | 1♥ |
| Second | 1♠ vs 4♠ | 51 | 1♠ | 94 | 49.0 | **4♠** | 98 | 51.0 | 4♠ |
| Third | 1♥ vs 4♥ | 35 | **1♥** | 93 | 52.0 | 4♥ | 86 | 48.0 | 1♥ |
| Third | 1♠ vs 4♠ | 32 | 1♠ | 45 | 32.8 | **4♠** | 92 | 67.2 | 4♠ |

## Files

- Regenerate: `npm run research:compare` (reads the combined scrape).
- Scoring/IMPs: `research/bidding/score.ts`; analysis: `research/opening-compare.task.ts`.

