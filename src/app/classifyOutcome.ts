import type { Country } from '../types';
import { HttpError } from '../api/HttpError';

export type Outcome =
  | { status: 'aborted' }
  | { status: 'empty' }
  | { status: 'timeout' }
  | { status: 'results'; items: Country[] }
  | { status: 'error'; retryable: boolean; message: string };

export type ClassifyInput = { ok: true; items: Country[] } | { ok: false; error: unknown };

export function classifyOutcome(input: ClassifyInput): Outcome {
  if (input.ok) {
    return input.items.length === 0
      ? { status: 'empty' }
      : { status: 'results', items: input.items };
  }

  const { error } = input;

  if (error instanceof DOMException && error.name === 'AbortError') {
    return { status: 'aborted' };
  }

  if (error instanceof DOMException && error.name === 'TimeoutError') {
    return { status: 'timeout' };
  }

  if (error instanceof HttpError) {
    return { status: 'error', retryable: true, message: `Server error ${error.status}` };
  }

  return { status: 'error', retryable: true, message: 'Network error' };
}
