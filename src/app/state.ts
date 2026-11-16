import type { Country } from '../types';
import { searchCountries } from '../api/searchCountries.js';
import { classifyOutcome, type Outcome } from './classifyOutcome.js';
import { debounce } from '../utils/debounce.js';

export type AppState =
  | { status: 'idle'; items: [] }
  | { status: 'loading'; items: [] }
  | { status: 'results'; items: Country[] }
  | { status: 'empty'; items: [] }
  | { status: 'error'; items: []; error: string };

export interface AppOptions {
  debounceMs?: number;
}

export interface App {
  onInput(query: string): void;
  retry(): void;
  getState(): AppState;
}

const IDLE: AppState = { status: 'idle', items: [] };
const LOADING: AppState = { status: 'loading', items: [] };

export function createApp(render: (s: AppState) => void, options: AppOptions = {}): App {
  const debounceMs = options.debounceMs ?? 300;

  let currentController: AbortController | null = null;
  let lastQuery = '';
  let state: AppState = IDLE;

  function setState(next: AppState): void {
    state = next;
    render(next);
  }

  function abortCurrent(): void {
    currentController?.abort(new DOMException('Aborted', 'AbortError'));
    currentController = null;
  }

  async function runSearch(query: string): Promise<void> {
    const controller = new AbortController();
    currentController = controller;
    setState(LOADING);

    let outcome: Outcome;
    try {
      const items = await searchCountries(query, controller.signal);
      outcome = classifyOutcome({ ok: true, items });
    } catch (error) {
      outcome = classifyOutcome({ ok: false, error });
    }

    switch (outcome.status) {
      case 'aborted':
        return;
      case 'empty':
        setState({ status: 'empty', items: [] });
        return;
      case 'results':
        setState({ status: 'results', items: outcome.items });
        return;
      case 'timeout':
        setState({ status: 'error', items: [], error: 'Request timed out' });
        return;
      case 'error':
        setState({ status: 'error', items: [], error: outcome.message });
        return;
    }
  }

  const debouncedSearch = debounce((query: string) => {
    void runSearch(query);
  }, debounceMs);

  return {
    onInput(query: string) {
      abortCurrent();

      const trimmed = query.trim();
      lastQuery = trimmed;

      if (trimmed.length === 0) {
        setState(IDLE);
        return;
      }

      debouncedSearch(trimmed);
    },

    retry() {
      if (lastQuery.length === 0) return;
      abortCurrent();
      void runSearch(lastQuery);
    },

    getState() {
      return state;
    },
  };
}
