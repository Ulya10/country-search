import { describe, it, expect } from 'vitest';
import { mapCountryResponse } from './mapCountryResponse';
import type { RawCountry } from '../types';

const france: RawCountry = {
  name: 'France',
  alpha2Code: 'FR',
  alpha3Code: 'FRA',
  capital: 'Paris',
  region: 'Europe',
  subregion: 'Western Europe',
  population: 67391582,
  area: 551695,
  currencies: [{ code: 'EUR', name: 'Euro', symbol: '€' }],
  languages: [{ iso639_1: 'fr', name: 'French' }],
  callingCodes: ['33'],
  topLevelDomain: ['.fr'],
  borders: ['BEL', 'DEU', 'ITA', 'LUX', 'ESP', 'CHE'],
  flag: 'https://countries.dev/flags/fr.svg',
  flags: { svg: 'https://flagcdn.com/fr.svg', png: 'https://flagcdn.com/w320/fr.png' },
};

describe('mapCountryResponse', () => {
  it('maps a full country record to the UI shape', () => {
    expect(mapCountryResponse(france)).toEqual({
      name: 'France',
      flag: 'https://flagcdn.com/fr.svg',
      capital: 'Paris',
      region: 'Europe',
      population: 67391582,
      area: 551695,
      borders: ['BEL', 'DEU', 'ITA', 'LUX', 'ESP', 'CHE'],
      languages: ['French'],
      currencies: [{ name: 'Euro', symbol: '€' }],
    });
  });

  it('flattens languages from objects to string names', () => {
    const result = mapCountryResponse({
      ...france,
      languages: [
        { iso639_1: 'fr', name: 'French' },
        { iso639_1: 'br', name: 'Breton' },
      ],
    });
    expect(result.languages).toEqual(['French', 'Breton']);
  });

  it('returns an empty capital string when capital is missing', () => {
    const { capital: _capital, ...rest } = france;
    expect(mapCountryResponse(rest as RawCountry).capital).toBe('');
  });

  it('returns empty arrays for missing borders, languages and currencies', () => {
    const { borders: _b, languages: _l, currencies: _c, ...rest } = france;
    const result = mapCountryResponse(rest as RawCountry);
    expect(result.borders).toEqual([]);
    expect(result.languages).toEqual([]);
    expect(result.currencies).toEqual([]);
  });

  it('is a pure function — does not mutate the input object', () => {
    const original = structuredClone(france);
    mapCountryResponse(france);
    expect(france).toEqual(original);
  });

  it('does not share array references with the input', () => {
    const result = mapCountryResponse(france);
    expect(result.borders).not.toBe(france.borders);
    expect(result.currencies).not.toBe(france.currencies);
  });
});
