import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createApp, type AppState } from './state';
import type { RawCountry } from '../types';

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

function makeDeferred<T>(): Deferred<T> {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function makeRawCountry(name: string): RawCountry {
  return {
    name,
    alpha2Code: 'XX',
    alpha3Code: 'XXX',
    capital: 'X',
    region: 'Y',
    subregion: 'Y',
    population: 1,
    area: 1,
    borders: [],
    languages: [{ iso639_1: 'x', name: 'L' }],
    currencies: [{ code: 'X', name: 'C', symbol: '$' }],
    callingCodes: ['1'],
    topLevelDomain: ['.x'],
    flag: 'x.svg',
  };
}

describe('state', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(new AbortController().signal);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('aborts the previous request on every input and never renders stale results', async () => {
    const deferreds = new Map<string, Deferred<Response>>();
    const abortedQueries: string[] = [];

    const fetchMock = vi.fn((url: string, init?: { signal?: AbortSignal }) => {
      const query = decodeURIComponent(url.split('/name/')[1] ?? '');
      const d = makeDeferred<Response>();
      deferreds.set(query, d);

      if (init?.signal?.aborted) {
        d.reject(init.signal.reason);
        return d.promise;
      }

      init?.signal?.addEventListener(
        'abort',
        () => {
          abortedQueries.push(query);
          d.reject(init.signal!.reason ?? new DOMException('Aborted', 'AbortError'));
        },
        { once: true },
      );

      return d.promise;
    });
    vi.stubGlobal('fetch', fetchMock);

    const renders: AppState[] = [];
    const app = createApp((s) => renders.push(s), { debounceMs: 300 });

    app.onInput('sp');
    await vi.advanceTimersByTimeAsync(300);
    expect(deferreds.has('sp')).toBe(true);
    expect(deferreds.has('spain')).toBe(false);

    app.onInput('spain');
    expect(abortedQueries).toContain('sp');
    await vi.advanceTimersByTimeAsync(300);
    expect(deferreds.has('spain')).toBe(true);

    deferreds.get('spain')!.resolve(
      new Response(JSON.stringify([makeRawCountry('Spain')]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    await vi.advanceTimersByTimeAsync(0);

    deferreds.get('sp')?.resolve(
      new Response(JSON.stringify([makeRawCountry('Stale')]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    await vi.advanceTimersByTimeAsync(0);

    expect(abortedQueries).toContain('sp');

    const last = renders[renders.length - 1]!;
    expect(last.status).toBe('results');
    if (last.status === 'results') {
      expect(last.items).toHaveLength(1);
      expect(last.items[0]!.name).toBe('Spain');
    }

    for (const r of renders) {
      if (r.status === 'results') {
        for (const item of r.items) {
          expect(item.name).not.toBe('Stale');
        }
      }
    }
  });

  it('clears state and skips the network on empty input', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const renders: AppState[] = [];
    const app = createApp((s) => renders.push(s), { debounceMs: 300 });

    app.onInput('fra');
    await vi.advanceTimersByTimeAsync(300);
    app.onInput('   ');
    await vi.advanceTimersByTimeAsync(300);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const last = renders[renders.length - 1]!;
    expect(last.status).toBe('idle');
  });

  it('does not ask a pending debounce if the input is cleared first', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const renders: AppState[] = [];
    const app = createApp((s) => renders.push(s), { debounceMs: 300 });

    app.onInput('fra');
    await vi.advanceTimersByTimeAsync(100);
    app.onInput('');
    await vi.advanceTimersByTimeAsync(300);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(renders[renders.length - 1]!.status).toBe('idle');
  });
});
