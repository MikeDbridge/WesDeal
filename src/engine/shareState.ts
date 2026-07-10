/**
 * Shareable page state: a compact, URL-safe encoding of the whole conditions
 * form plus the opening-lead parameters, so a run can be reproduced from a link.
 *
 * We serialise the *raw field values* (the text the user typed — "12-14", "5+",
 * the exact hand, the seed) rather than the compiled constraints. That makes the
 * round-trip lossless and keeps `restore` trivial: it just writes the strings
 * back into the inputs. The blob is JSON → UTF-8 → base64url, carried in the URL
 * hash (`#s=…`) so it never hits a server and works under any base path.
 */

import type { Seat } from './deal';

/** One seat's raw form inputs. `len` is [♠, ♥, ♦, ♣] length expressions. */
export interface SeatState {
  hcp: string;
  knr: string;
  len: string[];
  shape: string;
  filter: string;
  locked: boolean;
  hand: string;
}

export interface PartnerState {
  nsHcp: string;
  nsKnr: string;
  ewHcp: string;
  ewKnr: string;
}

export interface OptionsState {
  count: string;
  maxAttempts: string;
  seed: string;
}

export interface FormState {
  seats: Record<Seat, SeatState>;
  partner: PartnerState;
  options: OptionsState;
  /** Ticked double-dummy cells, as [strain, declarer] pairs. */
  dd: Array<[number, number]>;
}

/** The opening-lead analyser controls. */
export interface LeadState {
  level: string;
  strain: string;
  deals: string;
  vul: boolean;
}

export interface ShareState {
  v: 1;
  form: FormState;
  lead?: LeadState;
}

function bytesToB64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64UrlToBytes(s: string): Uint8Array {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function encodeState(state: ShareState): string {
  return bytesToB64Url(new TextEncoder().encode(JSON.stringify(state)));
}

/** Decode a share blob; returns null on anything malformed. */
export function decodeState(encoded: string): ShareState | null {
  try {
    const json = new TextDecoder().decode(b64UrlToBytes(encoded));
    const obj = JSON.parse(json) as unknown;
    return isShareState(obj) ? obj : null;
  } catch {
    return null;
  }
}

function isShareState(x: unknown): x is ShareState {
  if (typeof x !== 'object' || x === null) return false;
  const o = x as Record<string, unknown>;
  if (o.v !== 1) return false;
  const f = o.form;
  if (typeof f !== 'object' || f === null) return false;
  return typeof (f as Record<string, unknown>).seats === 'object';
}
