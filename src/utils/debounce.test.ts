import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from './debounce';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('invokes the function once after the delay', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(299);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('resets the timer on subsequent calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    vi.advanceTimersByTime(200);
    debounced();
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('passes the latest arguments to the function', () => {
    const fn = vi.fn<(a: string, b: number) => void>();
    const debounced = debounce(fn, 300);

    debounced('first', 1);
    debounced('second', 2);
    debounced('last', 3);

    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('last', 3);
  });

  it('collapses a burst of calls into one invocation', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    for (let i = 0; i < 10; i++) {
      debounced();
      vi.advanceTimersByTime(50);
    }

    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
