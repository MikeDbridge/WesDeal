/**
 * Double-dummy types and constants.
 *
 * Strain and declarer indices match Bo Haglund's DDS (and the `bridge-dds`
 * wrapper): strain 0=♠ 1=♥ 2=♦ 3=♣ 4=NT; declarer 0=N 1=E 2=S 3=W. The actual
 * solving (which needs the WASM engine) lives in `ddSolve.ts`; this module is
 * pure so the rest of the app can talk about cells without pulling in the WASM.
 */

export const DD_STRAIN_LABELS = ['♠', '♥', '♦', '♣', 'NT'] as const;
export const DD_DECLARER_LABELS = ['N', 'E', 'S', 'W'] as const;

export type DDStrain = 0 | 1 | 2 | 3 | 4;
export type DDDeclarer = 0 | 1 | 2 | 3;

/** One thing to solve: how many tricks `declarer` makes in `strain`. */
export interface DDCell {
  strain: number;
  declarer: number;
}

/** The opening leader for a contract is the declarer's left-hand opponent. */
export function leaderOf(declarer: number): number {
  return (declarer + 1) % 4;
}

/** Stable key for a cell, e.g. "4-0" for NT by North. */
export function cellKey(strain: number, declarer: number): string {
  return `${strain}-${declarer}`;
}
