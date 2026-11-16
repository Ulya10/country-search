import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchCountries } from './searchCountries';
import { HttpError } from './HttpError';
import type { RawCountry } from '../types';

const rawFrance: RawCountry = {
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
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeFetchMock(handler: (url: string) => Response | Promise<Response>) {
  return vi.fn(async (url: string, init?: { signal?: AbortSignal }) => {
    if (init?.signal?.aborted) {
      throw init.signal.reason;
    }
    return new Promise<Response>((resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(init.signal!.reason), { once: true });
      Promise.resolve(handler(url)).then(resolve, reject);
    });
  });
}

describe('searchCountries', () => {
  beforeEach(() => {
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(new AbortController().signal);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('calls the correct URL-encoded endpoint and maps the response', async () => {
    const fetchMock = makeFetchMock(() => jsonResponse([rawFrance]));
    vi.stubGlobal('fetch', fetchMock);

    const result = await searchCountries('south fra', new AbortController().signal);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://countries.dev/name/south%20fra');
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe('France');
    expect(result[0]!.flag).toBe('https://countries.dev/flags/fr.svg');
  });

  it('returns an empty array for 404 — no matches is not an error', async () => {
    vi.stubGlobal(
      'fetch',
      makeFetchMock(() => new Response('', { status: 404 })),
    );

    const result = await searchCountries('nonexistent', new AbortController().signal);

    expect(result).toEqual([]);
  });

  it.each([500, 503, 403, 401])(
    'throws HttpError with status %i for a non-ok response',
    async (status) => {
      vi.stubGlobal(
        'fetch',
        makeFetchMock(() => new Response('', { status })),
      );

      const promise = searchCountries('x', new AbortController().signal);

      await expect(promise).rejects.toBeInstanceOf(HttpError);
      await expect(promise).rejects.toMatchObject({ status });
    },
  );

  it('propagates AbortError when the caller signal is aborted', async () => {
    const ac = new AbortController();
    vi.stubGlobal(
      'fetch',
      makeFetchMock(() => new Promise<Response>(() => {})),
    );

    const promise = searchCountries('x', ac.signal);
    ac.abort(new DOMException('Aborted', 'AbortError'));

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('propagates TimeoutError distinct from AbortError', async () => {
    vi.mocked(AbortSignal.timeout).mockImplementation(() => {
      const ac = new AbortController();
      ac.abort(new DOMException('Timeout', 'TimeoutError'));
      return ac.signal;
    });
    vi.stubGlobal(
      'fetch',
      makeFetchMock(() => new Promise<Response>(() => {})),
    );

    const promise = searchCountries('x', new AbortController().signal);

    await expect(promise).rejects.toMatchObject({ name: 'TimeoutError' });
  });
});
