# Hand evaluation vs double dummy — full study

Deals: 76000 total (4000 uniform + 72000 filter-generated).
Study population (both hands balanced/semi-balanced): **73548** deals — 38.7% of random deals qualify.
Train: 55548 deals (uniform + shards f0-f5) · held-out test: 18000 deals (shards f6-f7).

Shapes: 4333/4432/5332, 6322 (6-card minor), 4441/5431 with stiff A/K/Q in a minor,
5422 except exactly 5♠-4♥. 1M-route rule: 15-16 HCP with a 5+ major and a 4+ card lower
suit is excluded unless ≥6 HCP sit outside the two long suits. 8+ card major fits only.
Tricks are double dummy, better of N/S declaring.

# Part A — the method comparison (main goal)

## A1. Accuracy on the held-out test set

AUC = probability the method ranks a making 3NT deal above a failing one.
"Bid-3NT accuracy": threshold chosen on training data, applied to test deals (all, and within the 22-27 HCP decision zone).

| method | r | R² | resid sd | AUC(3NT) | 50% make at | bid-3NT accuracy (all / 22-27) |
|---|---|---|---|---|---|---|
| HCP (4-3-2-1) | 0.901 | 0.813 | 1.17 | 0.958 | 24.6 pts | 92% / 76% |
| BUM-RAP (4.5/3/1.5/0.75/0.25) | 0.907 | 0.823 | 1.14 | 0.960 | 25.1 pts | 92% / 76% |
| Kaplan-Rubens | 0.877 | 0.770 | 1.30 | 0.947 | 25.2 pts | 90% / 72% |
| Controls (A=2, K=1) | 0.843 | 0.711 | 1.45 | 0.922 | 8.3 ctrl | 88% / 69% |
| Fitted: honors only (v0) | 0.909 | 0.827 | 1.12 | 0.962 | 8.5 tricks | 92% / 76% |
| Fitted: honors + structure (v1) | 0.912 | 0.831 | 1.11 | 0.962 | 8.5 tricks | 92% / 77% |

## A2. What each card is actually worth (fitted on 55548 training deals)

Per-card NT trick values from regression (v0), rescaled so K = 3 points for comparison:

| card | Work (4321) | BUM-RAP | fitted points (K=3) | raw tricks/card |
|---|---|---|---|---|
| A | 4 | 4.5 | 4.45 | 2.164 |
| K | 3 | 3 | 3.00 | 1.458 |
| Q | 2 | 1.5 | 1.74 | 0.846 |
| J | 1 | 0.75 | 0.92 | 0.446 |
| T | 0 | 0.25 | 0.39 | 0.191 |
| 9 | 0 | 0 | 0.14 | 0.068 |

## A3. Structure adjustments (v1 coefficients, in tricks)

| feature | tricks per unit |
|---|---|
| eight (count) | +0.019 |
| longest combined suit (per card) | -0.146 |
| Q/J in a doubleton (per card) | -0.147 |
| stiff A/K/Q (per hand) | -0.350 |
| 4333 hand (per hand) | -0.009 |

## A4. Signal beyond HCP (partial correlation with NT tricks, test set)

| method | partial r after removing HCP |
|---|---|
| BUM-RAP (4.5/3/1.5/0.75/0.25) | 0.252 |
| Kaplan-Rubens | 0.114 |
| Controls (A=2, K=1) | 0.214 |
| Fitted: honors only (v0) | 0.277 |
| Fitted: honors + structure (v1) | 0.314 |

## A5. When the fitted model and HCP disagree (test set, 3NT decision)

HCP bids with ≥ 24.5 combined; the model bids when it predicts ≥ 8.42 tricks.

| decision | deals | P(3NT makes) | avg NT tricks |
|---|---|---|---|
| both say bid | 3011 | 82% | 9.84 |
| both say pass | 14505 | 5% | 5.26 |
| HCP bids, model passes | 291 | 46% | 8.27 |
| model bids, HCP passes | 193 | 51% | 8.55 |

### Example deals

- Model right to bid (HCP 24, predicted 8.7, took 10): `N:AK75.AK84.76.984 9.7632.JT.KQJT32 T862.QT95.A5.A75 QJ43.J.KQ98432.6`
- Model right to bid (HCP 24, predicted 8.5, took 11): `N:K5.AK.KJ32.AJT97 JT76.96543.7.KQ3 42.JT82.AT865.64 AQ983.Q7.Q94.852`
- Model right to bid (HCP 24, predicted 8.6, took 9): `N:AKQ2.QT7.Q742.K8 65.KJ84.AKJ6.QJ4 T84.A6.T5.AT9632 J973.9532.983.75`
- Model right to pass (HCP 25, predicted 8.2, took 7): `N:754.764.QJ3.QJ64 93.Q95.KT74.AT82 AKQ8.K82.A985.K5 JT62.AJT3.62.973`
- Model right to pass (HCP 25, predicted 8.1, took 7): `N:KJ9.QJ.AKJT8.QJ8 A76.752.9643.942 QT532.T86.Q72.K5 84.AK943.5.AT763`
- Model right to pass (HCP 25, predicted 7.5, took 6): `N:KJ.QJ5.9875.A764 A965.9632.AK4.T3 Q74.AT84.Q.KQJ82 T832.K7.JT632.95`

# Part B — eyeball tables and side questions

## B1. NT tricks by combined HCP (study population)

| HCP | deals | avg tricks | sd | ≤6 | 7 | 8 | 9 | 10 | 11 | 12+ | P(make) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 5 | 27 | 0.22 | 0.42 | 27 | 0 | 0 | 0 | 0 | 0 | 0 | 0% |
| 6 | 55 | 0.35 | 0.51 | 55 | 0 | 0 | 0 | 0 | 0 | 0 | 0% |
| 7 | 134 | 0.47 | 0.57 | 134 | 0 | 0 | 0 | 0 | 0 | 0 | 0% |
| 8 | 242 | 0.79 | 0.68 | 242 | 0 | 0 | 0 | 0 | 0 | 0 | 0% |
| 9 | 440 | 1.06 | 0.71 | 440 | 0 | 0 | 0 | 0 | 0 | 0 | 0% |
| 10 | 648 | 1.31 | 0.77 | 648 | 0 | 0 | 0 | 0 | 0 | 0 | 0% |
| 11 | 1099 | 1.63 | 0.89 | 1099 | 0 | 0 | 0 | 0 | 0 | 0 | 0% |
| 12 | 1509 | 2.08 | 1.01 | 1509 | 0 | 0 | 0 | 0 | 0 | 0 | 0% |
| 13 | 2239 | 2.50 | 1.09 | 2238 | 1 | 0 | 0 | 0 | 0 | 0 | 0% |
| 14 | 2831 | 2.98 | 1.15 | 2829 | 2 | 0 | 0 | 0 | 0 | 0 | 0% |
| 15 | 3559 | 3.44 | 1.15 | 3550 | 9 | 0 | 0 | 0 | 0 | 0 | 0% |
| 16 | 4391 | 3.96 | 1.24 | 4345 | 43 | 3 | 0 | 0 | 0 | 0 | 0% |
| 17 | 4975 | 4.50 | 1.21 | 4815 | 149 | 11 | 0 | 0 | 0 | 0 | 0% |
| 18 | 5451 | 5.03 | 1.19 | 4988 | 404 | 56 | 3 | 0 | 0 | 0 | 0% |
| 19 | 5746 | 5.56 | 1.20 | 4624 | 890 | 212 | 19 | 0 | 0 | 1 | 0% |
| 20 | 6003 | 6.07 | 1.20 | 3884 | 1528 | 497 | 92 | 2 | 0 | 0 | 2% |
| 21 | 6030 | 6.60 | 1.19 | 2668 | 2095 | 1033 | 216 | 16 | 1 | 1 | 4% |
| 22 | 5471 | 7.10 | 1.18 | 1541 | 1883 | 1524 | 447 | 68 | 7 | 1 | 10% |
| 23 | 4966 | 7.62 | 1.18 | 781 | 1373 | 1786 | 814 | 179 | 32 | 1 | 21% |
| 24 | 4331 | 8.08 | 1.18 | 363 | 841 | 1559 | 1177 | 334 | 54 | 3 | 36% |
| 25 | 3626 | 8.69 | 1.20 | 135 | 375 | 1004 | 1256 | 668 | 162 | 26 | 58% |
| 26 | 2840 | 9.12 | 1.21 | 63 | 171 | 528 | 1016 | 758 | 246 | 58 | 73% |
| 27 | 2287 | 9.68 | 1.18 | 10 | 76 | 263 | 614 | 773 | 442 | 109 | 85% |
| 28 | 1686 | 10.17 | 1.21 | 12 | 39 | 82 | 281 | 574 | 503 | 195 | 92% |
| 29 | 1141 | 10.68 | 1.16 | 5 | 14 | 37 | 84 | 292 | 454 | 255 | 95% |
| 30 | 718 | 11.13 | 1.09 | 4 | 5 | 12 | 14 | 123 | 275 | 285 | 97% |
| 31 | 482 | 11.54 | 0.87 | 1 | 0 | 4 | 6 | 25 | 173 | 273 | 99% |
| 32 | 292 | 12.01 | 0.68 | 0 | 1 | 0 | 0 | 2 | 46 | 243 | 100% |
| 33 | 152 | 12.25 | 0.59 | 0 | 0 | 0 | 0 | 0 | 12 | 140 | 100% |
| 34 | 84 | 12.32 | 0.64 | 0 | 0 | 0 | 0 | 0 | 8 | 76 | 100% |
| 35 | 46 | 12.70 | 0.46 | 0 | 0 | 0 | 0 | 0 | 0 | 46 | 100% |

## B2. Major-suit tricks by combined HCP (8+ card fit, n=27111)

| HCP | deals | avg tricks | sd | ≤7 | 8 | 9 | 10 | 11 | 12+ | P(make) |
|---|---|---|---|---|---|---|---|---|---|---|
| 7 | 40 | 2.70 | 1.00 | 40 | 0 | 0 | 0 | 0 | 0 | 0% |
| 8 | 81 | 3.43 | 1.08 | 81 | 0 | 0 | 0 | 0 | 0 | 0% |
| 9 | 137 | 3.82 | 0.94 | 137 | 0 | 0 | 0 | 0 | 0 | 0% |
| 10 | 241 | 4.23 | 1.02 | 241 | 0 | 0 | 0 | 0 | 0 | 0% |
| 11 | 393 | 4.48 | 0.99 | 393 | 0 | 0 | 0 | 0 | 0 | 0% |
| 12 | 528 | 4.83 | 1.05 | 524 | 4 | 0 | 0 | 0 | 0 | 0% |
| 13 | 830 | 5.25 | 1.02 | 818 | 12 | 0 | 0 | 0 | 0 | 0% |
| 14 | 1038 | 5.59 | 0.98 | 1015 | 23 | 0 | 0 | 0 | 0 | 0% |
| 15 | 1322 | 6.01 | 0.99 | 1237 | 83 | 2 | 0 | 0 | 0 | 0% |
| 16 | 1553 | 6.35 | 1.00 | 1365 | 170 | 18 | 0 | 0 | 0 | 0% |
| 17 | 1777 | 6.79 | 0.95 | 1380 | 351 | 45 | 1 | 0 | 0 | 0% |
| 18 | 2004 | 7.09 | 0.98 | 1338 | 538 | 121 | 7 | 0 | 0 | 0% |
| 19 | 2170 | 7.51 | 0.98 | 1072 | 782 | 287 | 26 | 3 | 0 | 1% |
| 20 | 2193 | 7.89 | 0.94 | 727 | 909 | 485 | 71 | 1 | 0 | 3% |
| 21 | 2230 | 8.26 | 0.94 | 443 | 889 | 725 | 160 | 13 | 0 | 8% |
| 22 | 1998 | 8.65 | 0.94 | 199 | 661 | 801 | 300 | 37 | 0 | 17% |
| 23 | 1886 | 9.07 | 0.94 | 78 | 408 | 786 | 518 | 94 | 2 | 33% |
| 24 | 1581 | 9.37 | 0.91 | 29 | 216 | 619 | 583 | 124 | 10 | 45% |
| 25 | 1398 | 9.82 | 0.93 | 13 | 80 | 389 | 615 | 270 | 31 | 66% |
| 26 | 1099 | 10.10 | 0.91 | 4 | 39 | 214 | 471 | 325 | 46 | 77% |
| 27 | 847 | 10.57 | 0.91 | 2 | 12 | 81 | 272 | 374 | 106 | 89% |
| 28 | 642 | 10.88 | 0.86 | 0 | 2 | 24 | 178 | 296 | 142 | 96% |
| 29 | 426 | 11.17 | 0.85 | 0 | 0 | 13 | 67 | 196 | 150 | 97% |
| 30 | 267 | 11.50 | 0.81 | 0 | 0 | 3 | 23 | 101 | 140 | 99% |
| 31 | 175 | 11.71 | 0.73 | 0 | 0 | 0 | 7 | 58 | 110 | 100% |
| 32 | 102 | 12.00 | 0.70 | 0 | 0 | 0 | 4 | 13 | 85 | 100% |
| 33 | 63 | 12.27 | 0.65 | 0 | 0 | 0 | 0 | 7 | 56 | 100% |
| 34 | 28 | 12.21 | 0.72 | 0 | 0 | 0 | 0 | 5 | 23 | 100% |

## B3. 3NT vs 4M head-to-head (8+ card major fit)

| HCP | deals | avg NT | avg 4M | P(3NT) | P(4M) | 4M✓ 3NT✗ | 3NT✓ 4M✗ |
|---|---|---|---|---|---|---|---|
| 7 | 40 | 0.23 | 2.70 | 0% | 0% | 0% | 0% |
| 8 | 81 | 0.65 | 3.43 | 0% | 0% | 0% | 0% |
| 9 | 137 | 0.97 | 3.82 | 0% | 0% | 0% | 0% |
| 10 | 241 | 1.21 | 4.23 | 0% | 0% | 0% | 0% |
| 11 | 393 | 1.47 | 4.48 | 0% | 0% | 0% | 0% |
| 12 | 528 | 1.89 | 4.83 | 0% | 0% | 0% | 0% |
| 13 | 830 | 2.33 | 5.25 | 0% | 0% | 0% | 0% |
| 14 | 1038 | 2.83 | 5.59 | 0% | 0% | 0% | 0% |
| 15 | 1322 | 3.35 | 6.01 | 0% | 0% | 0% | 0% |
| 16 | 1553 | 3.80 | 6.35 | 0% | 0% | 0% | 0% |
| 17 | 1777 | 4.38 | 6.79 | 0% | 0% | 0% | 0% |
| 18 | 2004 | 4.88 | 7.09 | 0% | 0% | 0% | 0% |
| 19 | 2170 | 5.43 | 7.51 | 0% | 1% | 1% | 0% |
| 20 | 2193 | 5.95 | 7.89 | 1% | 3% | 3% | 1% |
| 21 | 2230 | 6.48 | 8.26 | 3% | 8% | 7% | 2% |
| 22 | 1998 | 6.99 | 8.65 | 8% | 17% | 12% | 4% |
| 23 | 1886 | 7.51 | 9.07 | 19% | 33% | 21% | 7% |
| 24 | 1581 | 7.96 | 9.37 | 32% | 45% | 24% | 10% |
| 25 | 1398 | 8.62 | 9.82 | 55% | 66% | 23% | 12% |
| 26 | 1099 | 8.98 | 10.10 | 67% | 77% | 20% | 10% |
| 27 | 847 | 9.55 | 10.57 | 79% | 89% | 15% | 6% |
| 28 | 642 | 10.07 | 10.88 | 90% | 96% | 10% | 3% |
| 29 | 426 | 10.58 | 11.17 | 93% | 97% | 7% | 2% |
| 30 | 267 | 11.15 | 11.50 | 97% | 99% | 3% | 1% |
| 31 | 175 | 11.44 | 11.71 | 98% | 100% | 2% | 0% |
| 32 | 102 | 11.86 | 12.00 | 99% | 100% | 1% | 0% |
| 33 | 63 | 12.19 | 12.27 | 100% | 100% | 0% | 0% |
| 34 | 28 | 12.18 | 12.21 | 100% | 100% | 0% | 0% |

## B4. Fit-length effect, 8+ card fits (22-28 HCP)

| major fit | deals | avg NT | avg major | major − NT | P(3NT) | P(4M) |
|---|---|---|---|---|---|---|
| 8 | 7101 | 8.17 | 9.42 | 1.24 | 40% | 47% |
| 9 | 2093 | 8.18 | 9.82 | 1.64 | 41% | 62% |
| 10+ | 257 | 7.89 | 9.91 | 2.02 | 34% | 62% |

## B5. Shape quality in NT at equal HCP

Baseline: NT tricks ~ combined HCP, fitted on both-strictly-balanced deals (n=45093).
Each row: hands of that shape whose PARTNER is strictly balanced; residual = NT tricks vs baseline at the same HCP.

| shape (partner balanced) | samples | avg HCP | NT tricks vs baseline |
|---|---|---|---|
| 4333 | 20353 | 20.0 | +0.05 |
| 4432 | 41199 | 20.0 | -0.02 |
| 5332 | 28634 | 20.0 | -0.01 |
| 6m322 | 4711 | 20.0 | +0.02 |
| 4441 (stiff mH) | 593 | 21.4 | -0.35 |
| 5431 (stiff mH) | 2552 | 21.5 | -0.34 |
| 5422 · 0 dblton honors | 2232 | 17.9 | -0.01 |
| 5422 · 1 dblton honor | 6201 | 19.1 | -0.08 |
| 5422 · 2 dblton honors | 5953 | 20.5 | -0.10 |
| 5422 · 3+ dblton honors | 2516 | 22.2 | -0.15 |

## B6. Doubletons in the DECLARER's hand (dummy for contrast)

Context: the better-declaring seat is also the higher-HCP hand on 64% of (non-tied) deals.

Declarer = the seat whose NT declaration scores better; N/S trick-ties (92% of deals) excluded.
Residual = deal's NT tricks vs the balanced baseline at equal HCP.

| doubleton | in declarer: n | vs baseline | in dummy: n | vs baseline |
|---|---|---|---|---|
| AK | 63 | +0.24 | 45 | +0.47 |
| AQ | 201 | +0.32 | 54 | +0.66 |
| AJ | 141 | +0.60 | 50 | +0.23 |
| AT | 118 | +0.71 | 39 | +0.87 |
| Ax | 704 | +0.64 | 681 | +0.56 |
| KQ | 63 | +0.19 | 44 | +0.49 |
| KJ | 113 | +0.10 | 57 | +0.41 |
| KT | 127 | +0.15 | 63 | +0.64 |
| Kx | 1139 | +0.44 | 416 | +0.61 |
| QJ | 57 | +0.47 | 66 | +0.35 |
| QT | 55 | +0.60 | 69 | +0.54 |
| Qx | 760 | +0.49 | 588 | +0.40 |
| JT | 48 | +0.38 | 57 | +0.30 |
| Jx | 490 | +0.43 | 512 | +0.49 |
| Tx | 380 | +0.67 | 687 | +0.54 |
| xx | 1180 | +0.59 | 2739 | +0.48 |

## B7. Tens (pair total) at equal HCP

| tens | samples | NT tricks vs baseline | P(3NT) at 24-26 HCP |
|---|---|---|---|
| 0 | 4243 | -0.43 | 40% (n=801) |
| 1 | 18660 | -0.24 | 48% (n=3200) |
| 2 | 28428 | -0.04 | 55% (n=4138) |
| 3 | 18108 | +0.14 | 60% (n=2265) |
| 4+ | 4109 | +0.35 | 69% (n=393) |

## B8. Aces at the 3NT boundary (24-26 combined HCP)

| pair aces | deals | avg NT tricks | P(3NT) |
|---|---|---|---|
| ≤1 | 325 | 7.88 | 36% |
| 2 | 3663 | 8.21 | 45% |
| 3 | 5593 | 8.71 | 56% |
| 4 | 1216 | 9.10 | 70% |

## B9. Unguarded suits (no A/K/Q between the hands), 23-27 HCP

| unguarded suits | deals | avg NT tricks | P(3NT) |
|---|---|---|---|
| 0 | 16058 | 8.53 | 51% |
| 1 | 1992 | 7.73 | 23% |

## B10. Which pairs are predictable? (residual sd vs HCP baseline)

| pair type | deals | resid sd (tricks) |
|---|---|---|
| both 4333 | 2291 | 0.91 |
| both strictly balanced | 45093 | 1.09 |
| at least one semi-balanced | 28455 | 1.30 |

