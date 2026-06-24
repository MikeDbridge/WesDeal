# WesDeal

A bridge **deal generator**: it randomly produces card layouts (North/East/South/West)
that are consistent with constraints you specify — high-card points, suit lengths,
shape, partnership totals, and more.

## Status

**Phases 1–2 complete:** the dealing engine, test suite, and a working web UI.

- Unbiased, seedable dealing (Fisher–Yates) — deals are reproducible from a seed.
- Hand analysis: HCP, controls, suit lengths, shape, honor lookups, balanced detection.
- A constraint model (per-hand HCP / suit-length / balanced, plus partnership HCP totals).
- A **generate-and-test** dealer that samples uniformly from the constrained population.
- PBN (Portable Bridge Notation) and plain-text output.
- A form-based web UI: per-seat conditions, batch generation in a Web Worker (UI stays
  responsive), the classic 4-hand compass diagram, search stats, and copy-to-clipboard
  export (PBN / text).
- **Given (locked) hands:** lock 0, 1, or 2 fully-specified hands and deal the remaining
  cards randomly around them, subject to the conditions on the free seats. Typed holdings
  are parsed and validated live; locked seats are marked in the diagram.
- **HCP and Kaplan-Rubens (KnR) filters, side by side:** every seat (and partnership)
  has both an HCP and a KnR points filter, available at once. KnR follows Pavlicek's
  26-step spec and is verified against Jeff Goldsmith's reference calculator (see
  `tests/knr.test.ts`). Each hand shows both its HCP and KnR value.
- **Compact points syntax:** point filters accept `12` (exactly), `10+` (min), `11-`
  (max), or `12-14` (range); decimals work for KnR.
- **`x` for small cards:** locked hands may use `x` for any small card (rank 7 or below),
  e.g. `AKxxx Kx Qxx Axx`; the `x` cards are drawn fresh for each board. While typing a
  locked hand, a live descriptor shows its HCP, KnR, and exact shape (♠♥♦♣ order, e.g.
  `2=5=2=4`).
- **Output layouts:** a dropdown chooses how deals are shown — *PBN (one line)*, *Seat
  lines (compact)*, *Seat lines (with points)*, *Compass (compact)*, or *Compass
  (detailed)* — from very terse to fully annotated. Shapes display in exact ♠♥♦♣ order.

Next phases: save/load condition sets, a scripting layer for complex/relational
constraints, and (optionally) double-dummy analysis.

## Project layout

```
src/engine/      Pure TypeScript engine, no DOM dependencies
  cards.ts         Card model, suits/ranks, HCP tables
  deal.ts          Seedable RNG, shuffle, deal into 4 hands
  hand.ts          Hand analysis (HCP, shape, honors, balanced)
  constraints.ts   Constraint model + evaluator (the "test" step)
  dealer.ts        Generate-and-test loop with stats and limits
  format.ts        PBN and text rendering
  index.ts         Public engine API
tests/           Vitest unit tests
```

## Commands

```bash
npm install        # install dependencies
npm test           # run the test suite (Vitest)
npm run typecheck  # strict TypeScript check
npm run dev        # start the Vite dev server (UI, Phase 2)
npm run build      # production build
```

## Design notes

- **Generate-and-test** is the default because it produces *truly* random deals from
  the constrained population — no sampling bias. Very tight constraints may need many
  attempts per hit; `maxAttempts` bounds the work and the result reports how hard it
  looked. A constructive/biased fast path can be added later for extreme cases.
- HCP uses the standard Milton Work scale (A=4, K=3, Q=2, J=1).
- The **constraint model is the stable core**: the Phase 2 form and a future scripting
  language both compile down to the same `ConstraintSet`, so neither rebuilds the other.
