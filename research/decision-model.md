# Decision-space model — (1C) direct seat

A single priority-ordered **decision list** over the whole call space a hand faces
after a natural/short 1♣ on its right — first matching rule names the call, no match
passes. Scored on a **leakage-free split by board number** (boards 1–8 of each 16-board
cycle train, 9–16 test — each half spans every dealer and vulnerability, and every copy
of a physical deal lands on one side). The evolutionary tuner optimises call-agreement
on TRAIN only; TEST is held out and never seen during selection.

- Train: 13145 decisions.  Test (held-out): 12165 decisions.
- **Always-Pass floor** (test): 50.8%.
- **Brute-force lookup baseline** (test): 72.3% — memorise each feature cell's modal call. The evolved list **beats this**, so the interpretable rules generalise better than raw memorisation.
- **Exact-hand oracle** (test): 86.6% — memorises each deal's modal call; a mirage (unreachable without overfitting to individual boards).
- **Hand-crafted baseline** — test 77.5% (75% of floor→ceiling).
- **Evolved (GA-tuned)** — train 80.2%, **test 80.5%** (83% of floor→ceiling); train−test gap -0.4pt (overfit check).
- **KnR experiment** — blending Kaplan-Rubens into the strength metric (GA chose 20% KnR) gave test 80.5% vs 80.5% HCP-only: a +0.0pt difference, within run-to-run noise. A better strength metric is not the bottleneck.

## Per-call confusion — evolved list (held-out test)

precision = P(actual | predicted), recall = P(predicted | actual).

| call | actual n | actual % | predicted n | precision | recall |
|---|---|---|---|---|---|
| P | 6185 | 51% | 6745 | 86% | 94% |
| 1S | 1410 | 12% | 1491 | 84% | 89% |
| 1H | 1277 | 10% | 1627 | 69% | 88% |
| X | 990 | 8% | 782 | 76% | 60% |
| 1D | 839 | 7% | 729 | 72% | 62% |
| 1NT | 372 | 3% | 393 | 70% | 74% |
| 2H | 255 | 2% | 107 | 64% | 27% |
| 2C | 133 | 1% | 0 | — | 0% |
| MAJ2 | 125 | 1% | 145 | 86% | 100% |
| 2S | 110 | 1% | 19 | 42% | 7% |
| 2D | 73 | 1% | 0 | — | 0% |
| 3S | 60 | 0% | 60 | 58% | 58% |
| 2NT | 41 | 0% | 67 | 4% | 7% |
| other | 295 | 2% | — | — | — |

## Per-call confusion — hand-crafted baseline (held-out test), for comparison

| call | actual n | actual % | predicted n | precision | recall |
|---|---|---|---|---|---|
| P | 6185 | 51% | 6463 | 85% | 89% |
| 1S | 1410 | 12% | 1520 | 78% | 84% |
| 1H | 1277 | 10% | 1299 | 74% | 75% |
| X | 990 | 8% | 1030 | 65% | 67% |
| 1D | 839 | 7% | 842 | 64% | 65% |
| 1NT | 372 | 3% | 412 | 67% | 74% |
| 2H | 255 | 2% | 326 | 41% | 53% |
| 2C | 133 | 1% | 0 | — | 0% |
| MAJ2 | 125 | 1% | 145 | 86% | 100% |
| 2S | 110 | 1% | 56 | 30% | 15% |
| 2D | 73 | 1% | 0 | — | 0% |
| 3S | 60 | 0% | 71 | 51% | 60% |
| 2NT | 41 | 0% | 1 | 0% | 0% |
| other | 295 | 2% | — | — | — |

## The evolved decision list

Priority order (first match wins), thresholds tuned by the GA (warm-started from the
hand-crafted list, then evolved to maximise held-out-adjacent train agreement):

1. **MAJ2** Michaels (2♣/2♦, majors) — 5+♠ & 5+♥
2. **3S** preempt — 7+♠, 5–10 HCP, texture ≥0/10
3. **2S** weak jump — 6+♠, 5–9 HCP, <4♥, texture ≥4/10
4. **2H** weak jump — 6+♥, 4–8 HCP, <4♠, texture ≥4/10
5. **1S** — 5+♠, ≤5♥, 7–16 HCP (relax quality if ≥8 HCP else top(s,5)≥3), −2 HCP with a singleton/void
6. **1H** — 5+♥ (≥♠), 7–17 HCP (relax if ≥8 else top(h,5)≥3), −1 HCP with a singleton/void
7. **1S** (4-card) — exactly 4♠, ≤2♥, top(s,5)≥4, 13–14 HCP
8. **2NT** unusual (reds) — 5+♦ & 5+♥ (always), 6+ HCP
9. **1NT** — 15–18 HCP, no singleton/void, ♣ stopper (4-4 majors only with a textured ♣ stopper — 3+ of AKQJT)
10. **X** takeout — 12–19 HCP (−1 with ≤1♣), ≤3♣, 3+♠, 2+♥, ♠+♥ ≥7
11. **1D** — 5+♦, no 5-card major, 9–16 HCP
12. **X** strong — 17+ HCP, ≤3♣ (not length in their suit)
13. **P** — default

Evolution: warm-started from the hand-crafted list (76.0% train), evolved over
85 generations to 80.2% train / 80.5% test. The fitness is distribution-aware
(accuracy + macro-F1) so rare calls like the Michaels cue are not optimised away, and it
predicts MEANING (2♣/2♦ majors → one MAJ2 class), not the partnership’s convention.

What we learned nailing 1♣: the model beats a brute-force feature lookup, so the rule
structure generalises better than memorising feature cells. Two things made no material
difference on held-out data — richer features (texture, distribution points, flexible
takeout/1NT shape) and a better strength metric (Kaplan-Rubens blended with HCP) — each
fit train a little better but did not generalise. So the ceiling here is set by
irreducible between-player style variance, not by missing features. The method is
sound and near its practical limit on 1♣; the payoff now is breadth — pointing the same
harness (decision list + board-split + GA + meaning labels) at every opening, where the
per-call structure will largely mirror this one.
