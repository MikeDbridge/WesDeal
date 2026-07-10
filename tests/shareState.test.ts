import { describe, it, expect } from 'vitest';
import { encodeState, decodeState, type ShareState } from '../src/engine/shareState';

const sample: ShareState = {
  v: 1,
  form: {
    seats: {
      N: { hcp: '12-14', knr: '', len: ['', '5+', '', ''], shape: 'balanced', filter: '', locked: false, hand: '' },
      E: { hcp: '3-9', knr: '', len: ['', '', '', ''], shape: 'any', filter: '', locked: false, hand: '' },
      S: { hcp: '', knr: '', len: ['', '', '', ''], shape: 'any', filter: '', locked: true, hand: 'AK432 KQ5 A32 54' },
      W: { hcp: '', knr: '', len: ['', '', '', ''], shape: 'any', filter: 'spades >= 5', locked: false, hand: '' },
    },
    partner: { nsHcp: '25+', nsKnr: '', ewHcp: '', ewKnr: '' },
    options: { count: '10', maxAttempts: '100000', seed: '12345' },
    dd: [[0, 2], [4, 2]],
  },
  lead: { level: '4', strain: '0', deals: '1000', vul: true },
};

describe('shareState encode/decode', () => {
  it('round-trips losslessly', () => {
    const decoded = decodeState(encodeState(sample));
    expect(decoded).toEqual(sample);
  });

  it('produces a URL-safe string (no +, /, or =)', () => {
    const encoded = encodeState(sample);
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it('returns null for garbage or truncated input', () => {
    expect(decodeState('not base64 !!!')).toBeNull();
    expect(decodeState(encodeState(sample).slice(0, 10))).toBeNull();
  });

  it('rejects a payload with the wrong version', () => {
    const bad = encodeState({ ...sample, v: 2 as unknown as 1 });
    expect(decodeState(bad)).toBeNull();
  });

  it('preserves unicode in hand holdings', () => {
    const withVoid: ShareState = {
      ...sample,
      form: {
        ...sample.form,
        seats: { ...sample.form.seats, S: { ...sample.form.seats.S, hand: 'AK432 - AQJ32 K54' } },
      },
    };
    expect(decodeState(encodeState(withVoid))?.form.seats.S.hand).toBe('AK432 - AQJ32 K54');
  });
});
