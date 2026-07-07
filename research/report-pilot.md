# Hand evaluation vs double dummy — 3NT / 4M study

Deals: 4480 total (4000 uniform + 480 filter-generated).
Study population (both N and S balanced/semi-balanced): **2028** deals — 38.7% of random deals qualify.

Shapes: 4333/4432/5332, 6322 (6-card minor), 4441/5431 with stiff A/K/Q in a minor,
5422 except exactly 5♠-4♥ (doubleton honor quality measured below, not gated); both hands must qualify.
1M-route rule: 15-16 HCP with a 5+ major and a 4+ card lower suit is excluded unless
≥6 HCP sit outside the two long suits. Major-fit analysis covers 8+ card fits only.
Tricks are double dummy, better of N/S declaring. 4M = the pair's longer major.

## Metric accuracy, study population → NT tricks

| metric | r | R² | residual sd (tricks) | tricks per point |
|---|---|---|---|---|
| HCP (4-3-2-1) | 0.899 | 0.808 | 1.19 | 0.507 |
| BUM-RAP (4.5/3/1.5/0.75/0.25) | 0.904 | 0.817 | 1.16 | 0.486 |
| Kaplan-Rubens | 0.877 | 0.769 | 1.30 | 0.451 |
| Controls (A=2, K=1) | 0.838 | 0.703 | 1.48 | 1.065 |

(For reference, on ALL uniform deals: )

| metric | r | R² | residual sd (tricks) | tricks per point |
|---|---|---|---|---|
| HCP (4-3-2-1) | 0.869 | 0.756 | 1.36 | 0.511 |
| BUM-RAP (4.5/3/1.5/0.75/0.25) | 0.878 | 0.771 | 1.32 | 0.493 |
| Kaplan-Rubens | 0.787 | 0.619 | 1.70 | 0.390 |
| Controls (A=2, K=1) | 0.819 | 0.671 | 1.58 | 1.093 |

## Eyeball table: NT tricks by combined HCP (study population)

Counts of deals taking each number of NT tricks. P(make) = 9+ tricks.

| HCP | deals | avg tricks | sd | ≤6 | 7 | 8 | 9 | 10 | 11 | 12+ | P(make) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 10 | 20 | 1.30 | 0.84 | 20 | 0 | 0 | 0 | 0 | 0 | 0 | 0% |
| 11 | 28 | 1.32 | 0.89 | 28 | 0 | 0 | 0 | 0 | 0 | 0 | 0% |
| 12 | 53 | 2.21 | 0.92 | 53 | 0 | 0 | 0 | 0 | 0 | 0 | 0% |
| 13 | 51 | 2.24 | 0.98 | 51 | 0 | 0 | 0 | 0 | 0 | 0 | 0% |
| 14 | 82 | 2.98 | 1.15 | 82 | 0 | 0 | 0 | 0 | 0 | 0 | 0% |
| 15 | 94 | 3.37 | 1.25 | 94 | 0 | 0 | 0 | 0 | 0 | 0 | 0% |
| 16 | 119 | 3.88 | 1.15 | 118 | 0 | 1 | 0 | 0 | 0 | 0 | 0% |
| 17 | 153 | 4.50 | 1.24 | 148 | 5 | 0 | 0 | 0 | 0 | 0 | 0% |
| 18 | 160 | 5.14 | 1.13 | 145 | 13 | 2 | 0 | 0 | 0 | 0 | 0% |
| 19 | 173 | 5.63 | 1.30 | 131 | 32 | 7 | 3 | 0 | 0 | 0 | 2% |
| 20 | 165 | 6.12 | 1.17 | 107 | 40 | 16 | 2 | 0 | 0 | 0 | 1% |
| 21 | 147 | 6.67 | 1.12 | 66 | 49 | 24 | 8 | 0 | 0 | 0 | 5% |
| 22 | 125 | 7.09 | 1.27 | 37 | 37 | 38 | 11 | 2 | 0 | 0 | 10% |
| 23 | 133 | 7.70 | 1.18 | 22 | 32 | 47 | 24 | 8 | 0 | 0 | 24% |
| 24 | 120 | 8.27 | 1.26 | 6 | 20 | 43 | 36 | 12 | 3 | 0 | 43% |
| 25 | 115 | 8.67 | 1.15 | 5 | 10 | 35 | 39 | 20 | 6 | 0 | 57% |
| 26 | 74 | 9.18 | 1.17 | 1 | 4 | 15 | 24 | 24 | 3 | 3 | 73% |
| 27 | 64 | 9.55 | 1.31 | 0 | 6 | 6 | 18 | 19 | 11 | 4 | 81% |
| 28 | 53 | 10.26 | 1.17 | 0 | 1 | 2 | 9 | 20 | 13 | 8 | 94% |
| 29 | 33 | 10.52 | 1.16 | 0 | 2 | 0 | 1 | 11 | 14 | 5 | 94% |
| 30 | 19 | 11.05 | 1.47 | 1 | 0 | 0 | 0 | 3 | 8 | 7 | 95% |
| 31 | 12 | 11.33 | 1.25 | 0 | 0 | 1 | 0 | 1 | 3 | 7 | 92% |
| 32 | 10 | 12.10 | 0.54 | 0 | 0 | 0 | 0 | 0 | 1 | 9 | 100% |

## Eyeball table: major-suit tricks by combined HCP (8+ card fit only, n=806)

Counts of deals taking each number of tricks in the longer major. P(make) = 10+ tricks.

| HCP | deals | avg tricks | sd | ≤7 | 8 | 9 | 10 | 11 | 12+ | P(make) |
|---|---|---|---|---|---|---|---|---|---|---|
| 10 | 10 | 3.70 | 1.49 | 10 | 0 | 0 | 0 | 0 | 0 | 0% |
| 11 | 11 | 4.00 | 0.43 | 11 | 0 | 0 | 0 | 0 | 0 | 0% |
| 12 | 23 | 4.65 | 1.24 | 23 | 0 | 0 | 0 | 0 | 0 | 0% |
| 13 | 18 | 5.61 | 1.06 | 18 | 0 | 0 | 0 | 0 | 0 | 0% |
| 14 | 30 | 5.57 | 0.96 | 30 | 0 | 0 | 0 | 0 | 0 | 0% |
| 15 | 35 | 6.06 | 0.95 | 33 | 1 | 1 | 0 | 0 | 0 | 0% |
| 16 | 47 | 6.23 | 1.04 | 44 | 2 | 1 | 0 | 0 | 0 | 0% |
| 17 | 63 | 6.78 | 0.92 | 50 | 12 | 1 | 0 | 0 | 0 | 0% |
| 18 | 65 | 6.78 | 0.98 | 49 | 15 | 1 | 0 | 0 | 0 | 0% |
| 19 | 73 | 7.62 | 1.11 | 31 | 30 | 9 | 2 | 1 | 0 | 4% |
| 20 | 67 | 7.97 | 0.86 | 17 | 34 | 14 | 2 | 0 | 0 | 3% |
| 21 | 61 | 8.49 | 0.86 | 8 | 19 | 29 | 5 | 0 | 0 | 8% |
| 22 | 36 | 8.61 | 0.92 | 5 | 10 | 15 | 6 | 0 | 0 | 17% |
| 23 | 46 | 9.00 | 0.91 | 1 | 11 | 22 | 10 | 2 | 0 | 26% |
| 24 | 54 | 9.33 | 1.00 | 2 | 9 | 17 | 22 | 3 | 1 | 48% |
| 25 | 51 | 9.80 | 0.93 | 0 | 2 | 18 | 22 | 7 | 2 | 61% |
| 26 | 27 | 10.04 | 1.23 | 1 | 1 | 8 | 6 | 8 | 3 | 63% |
| 27 | 26 | 10.54 | 1.12 | 0 | 2 | 2 | 7 | 10 | 5 | 85% |
| 28 | 24 | 11.13 | 0.73 | 0 | 0 | 0 | 4 | 14 | 6 | 100% |
| 29 | 15 | 11.13 | 0.62 | 0 | 0 | 0 | 2 | 9 | 4 | 100% |

## 3NT vs 4M head-to-head (8+ card major fit)

| HCP | deals | avg NT | avg 4M | P(3NT) | P(4M) | 4M✓ 3NT✗ | 3NT✓ 4M✗ |
|---|---|---|---|---|---|---|---|
| 10 | 10 | 1.00 | 3.70 | 0% | 0% | 0% | 0% |
| 11 | 11 | 1.18 | 4.00 | 0% | 0% | 0% | 0% |
| 12 | 23 | 2.17 | 4.65 | 0% | 0% | 0% | 0% |
| 13 | 18 | 2.22 | 5.61 | 0% | 0% | 0% | 0% |
| 14 | 30 | 2.87 | 5.57 | 0% | 0% | 0% | 0% |
| 15 | 35 | 3.37 | 6.06 | 0% | 0% | 0% | 0% |
| 16 | 47 | 3.91 | 6.23 | 0% | 0% | 0% | 0% |
| 17 | 63 | 4.43 | 6.78 | 0% | 0% | 0% | 0% |
| 18 | 65 | 4.98 | 6.78 | 0% | 0% | 0% | 0% |
| 19 | 73 | 5.53 | 7.62 | 1% | 4% | 4% | 1% |
| 20 | 67 | 6.01 | 7.97 | 1% | 3% | 3% | 1% |
| 21 | 61 | 6.67 | 8.49 | 3% | 8% | 7% | 2% |
| 22 | 36 | 6.92 | 8.61 | 8% | 17% | 11% | 3% |
| 23 | 46 | 7.48 | 9.00 | 20% | 26% | 11% | 4% |
| 24 | 54 | 8.17 | 9.33 | 39% | 48% | 20% | 11% |
| 25 | 51 | 8.47 | 9.80 | 45% | 61% | 27% | 12% |
| 26 | 27 | 8.89 | 10.04 | 59% | 63% | 22% | 19% |
| 27 | 26 | 9.27 | 10.54 | 77% | 85% | 19% | 12% |
| 28 | 24 | 10.29 | 11.13 | 96% | 100% | 4% | 0% |
| 29 | 15 | 10.40 | 11.13 | 93% | 100% | 7% | 0% |

## Fit-length effect, 8+ card major fits (game zone: 22–28 combined HCP)

| major fit | deals | avg NT | avg major | major − NT | P(3NT) | P(4M) |
|---|---|---|---|---|---|---|
| 8 | 205 | 8.35 | 9.51 | 1.16 | 44% | 48% |
| 9 | 54 | 8.06 | 9.91 | 1.85 | 39% | 63% |
| 10+ | 5 | 9.40 | 11.00 | 1.60 | 60% | 100% |

## Shape quality in NT at equal HCP (incl. the 5422 doubleton-honor question)

Baseline: NT tricks ~ combined HCP, fitted on both-strictly-balanced deals (n=1224).
Each row: hands of that shape whose PARTNER is strictly balanced; residual = NT tricks vs baseline at the same HCP.

| shape (partner balanced) | samples | avg HCP | NT tricks vs baseline |
|---|---|---|---|
| 4333 | 527 | 19.9 | -0.01 |
| 4432 | 1120 | 20.2 | -0.02 |
| 5332 | 801 | 19.8 | +0.03 |
| 6m322 | 112 | 19.9 | +0.10 |
| 4441 (stiff mH) | 13 | 20.5 | -0.46 |
| 5431 (stiff mH) | 85 | 22.3 | -0.36 |
| 5422 · 0 dblton honors | 70 | 18.6 | -0.04 |
| 5422 · 1 dblton honor | 179 | 18.6 | +0.04 |
| 5422 · 2 dblton honors | 173 | 20.8 | +0.03 |
| 5422 · 3+ dblton honors | 63 | 22.8 | +0.13 |

## Honors in doubletons — specific holdings and pairings

Baseline: both-strictly-balanced deals (n=1224). Each doubleton held by N or S contributes the deal's residual.

| doubleton | samples | avg deal HCP | NT tricks vs baseline |
|---|---|---|---|
| AK | 57 | 22.9 | -0.06 |
| AQ | 53 | 22.0 | +0.06 |
| AJ | 61 | 21.3 | +0.18 |
| AT | 52 | 21.6 | +0.08 |
| Ax | 393 | 21.7 | +0.16 |
| KQ | 60 | 22.6 | -0.35 |
| KJ | 49 | 23.0 | -0.16 |
| KT | 35 | 22.3 | +0.05 |
| Kx | 415 | 20.9 | -0.06 |
| QJ | 47 | 22.8 | -0.79 |
| QT | 55 | 19.2 | +0.05 |
| Qx | 394 | 20.0 | -0.24 |
| JT | 45 | 19.1 | -0.08 |
| Jx | 424 | 19.9 | -0.07 |
| Tx | 424 | 19.0 | +0.00 |
| xx | 1480 | 19.1 | +0.02 |

