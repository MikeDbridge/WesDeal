import { describe, it, expect } from 'vitest';
import {
  encodeAnalyzeState, decodeAnalyzeState, sideVulnerable, ddsVulnerability, type AnalyzeState,
} from '../src/engine/analyzeState';

const sample: AnalyzeState = {
  v: 1,
  hands: {
    N: 'AKQ2.54.T987.J32',
    E: 'J97.KQJ9.62.T874',
    S: 'T863.A87.AKQ.965',
    W: '54.T632.J543.AKQ',
  },
  dealer: 'S',
  vul: 'NS',
  contract: '4Sx',
  declarer: 'S',
  play: 'HKH4H6HA',
};

describe('analyzeState encode/decode', () => {
  it('round-trips losslessly', () => {
    expect(decodeAnalyzeState(encodeAnalyzeState(sample))).toEqual(sample);
  });

  it('round-trips without the optional fields', () => {
    const bare: AnalyzeState = { v: 1, hands: { ...sample.hands }, dealer: 'N', vul: 'None' };
    expect(decodeAnalyzeState(encodeAnalyzeState(bare))).toEqual(bare);
  });

  it('produces a URL-safe string', () => {
    expect(encodeAnalyzeState(sample)).not.toMatch(/[+/=]/);
  });

  it('rejects garbage, truncation and wrong versions', () => {
    expect(decodeAnalyzeState('!!not-base64!!')).toBeNull();
    expect(decodeAnalyzeState(encodeAnalyzeState(sample).slice(0, 12))).toBeNull();
    expect(decodeAnalyzeState(encodeAnalyzeState({ ...sample, v: 2 as unknown as 1 }))).toBeNull();
  });

  it('rejects malformed contracts, seats and play strings', () => {
    const bad = (patch: Partial<AnalyzeState>): AnalyzeState => ({ ...sample, ...patch });
    expect(decodeAnalyzeState(encodeAnalyzeState(bad({ contract: '8S' })))).toBeNull();
    expect(decodeAnalyzeState(encodeAnalyzeState(bad({ declarer: 'X' as unknown as 'N' })))).toBeNull();
    expect(decodeAnalyzeState(encodeAnalyzeState(bad({ play: 'SKX' })))).toBeNull();
    expect(decodeAnalyzeState(encodeAnalyzeState(bad({ play: 'S1' })))).toBeNull();
  });

  it('maps vulnerability to sides and DDS codes', () => {
    expect(sideVulnerable('NS', 'S')).toBe(true);
    expect(sideVulnerable('NS', 'E')).toBe(false);
    expect(sideVulnerable('EW', 'W')).toBe(true);
    expect(sideVulnerable('Both', 'N')).toBe(true);
    expect(sideVulnerable('None', 'N')).toBe(false);
    expect(ddsVulnerability('None')).toBe(0);
    expect(ddsVulnerability('Both')).toBe(1);
    expect(ddsVulnerability('NS')).toBe(2);
    expect(ddsVulnerability('EW')).toBe(3);
  });
});
