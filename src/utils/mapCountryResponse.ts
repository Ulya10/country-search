import type { Country, RawCountry } from '../types';

export function mapCountryResponse(raw: RawCountry): Country {
  return {
    name: raw.name,
    flag: raw.flag ?? '',
    capital: raw.capital ?? '',
    region: raw.region,
    population: raw.population,
    area: raw.area,
    borders: [...(raw.borders ?? [])],
    languages: (raw.languages ?? []).map((lang) => lang.name),
    currencies: (raw.currencies ?? []).map((c) => ({ name: c.name, symbol: c.symbol })),
  };
}
