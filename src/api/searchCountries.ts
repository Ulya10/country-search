import type { Country, RawCountry } from '../types';
import { mapCountryResponse } from '../utils/mapCountryResponse';
import { HttpError } from './HttpError';

const API_BASE = 'https://countries.dev/name';
const TIMEOUT_MS = 5000;

export async function searchCountries(query: string, signal: AbortSignal): Promise<Country[]> {
  const timeoutSignal = AbortSignal.timeout(TIMEOUT_MS);
  const combinedSignal = AbortSignal.any([signal, timeoutSignal]);

  const response = await fetch(`${API_BASE}/${encodeURIComponent(query)}`, {
    signal: combinedSignal,
  });

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new HttpError(response.status);
  }

  const raw = (await response.json()) as RawCountry[];
  return raw.map(mapCountryResponse);
}
