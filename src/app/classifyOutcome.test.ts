import { describe, it, expect } from 'vitest';
import { classifyOutcome } from './classifyOutcome';
import { HttpError } from '../api/HttpError';
import type { Country } from '../types';

const sampleCountry: Country = {
  name: 'France',
  flag: 'https://countries.dev/flags/fr.svg',
  capital: 'Paris',
  region: 'Europe',
  population: 67391582,
  area: 551695,
  borders: [],
  languages: ['French'],
  currencies: [{ name: 'Euro', symbol: '€' }],
};

describe('classifyOutcome', () => {
  it('returns results when there is at least one item', () => {
    expect(classifyOutcome({ ok: true, items: [sampleCountry] })).toEqual({
      status: 'results',
      items: [sampleCountry],
    });
  });

  it('returns empty when the result is an empty array (404 case)', () => {
    expect(classifyOutcome({ ok: true, items: [] })).toEqual({ status: 'empty' });
  });

  it('returns aborted for AbortError for user-cancelled request', () => {
    const err = new DOMException('Aborted', 'AbortError');
    expect(classifyOutcome({ ok: false, error: err })).toEqual({ status: 'aborted' });
  });

  it('returns timeout for TimeoutError — distinct from AbortError', () => {
    const err = new DOMException('Timeout', 'TimeoutError');
    expect(classifyOutcome({ ok: false, error: err })).toEqual({ status: 'timeout' });
  });

  it('returns error for HttpError with the status in the message', () => {
    const result = classifyOutcome({ ok: false, error: new HttpError(500) });
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.retryable).toBe(true);
      expect(result.message).toContain('500');
    }
  });

  it('returns error for any other unknown error', () => {
    const result = classifyOutcome({ ok: false, error: new TypeError('Failed to fetch') });
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.retryable).toBe(true);
    }
  });
});
