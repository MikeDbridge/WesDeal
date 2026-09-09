/**
 * Photo / screenshot import seam (phase 2).
 *
 * The import panel calls `extractDeal(image)` when a picture is dropped; the
 * result lands in the same review grid as every text import, with
 * low-confidence cells highlighted for correction. Phase 2 implements this by
 * sending the image to a vision model (per-field JSON extraction) — the
 * transport stays behind this interface so a proxy can replace a direct
 * browser call without touching the UI.
 */

import type { Seat } from './deal';
import type { Vulnerability } from './board';

export interface ExtractedField<T> {
  value: T;
  /** 0–1; the review grid highlights anything below ~0.9 for checking. */
  confidence: number;
}

export interface DealExtraction {
  /** Per-seat dotted holdings "AKQ2.54.T987.J32", as read from the image. */
  hands: Partial<Record<Seat, ExtractedField<string>>>;
  dealer?: ExtractedField<Seat>;
  vul?: ExtractedField<Vulnerability>;
  /** e.g. "4S", "3NT" — only when visible in the image. */
  contract?: ExtractedField<string>;
  declarer?: ExtractedField<Seat>;
}

export type ExtractDeal = (image: Blob) => Promise<DealExtraction>;

/** Phase-2 stub: photo import is not wired up yet. */
export const extractDeal: ExtractDeal = () => {
  return Promise.reject(new Error('Photo import is coming in a later update.'));
};
