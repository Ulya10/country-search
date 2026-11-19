import { describe, it, expect } from 'vitest';
import { HttpError } from './HttpError';

describe('HttpError', () => {
  it('is an instance of Error', () => {
    expect(new HttpError(500)).toBeInstanceOf(Error);
  });

  it('is an instance of HttpError', () => {
    expect(new HttpError(500)).toBeInstanceOf(HttpError);
  });

  it('exposes the HTTP status code', () => {
    const err = new HttpError(503);
    expect(err.status).toBe(503);
  });

  it('has name "HttpError" so it is distinguishable in logs', () => {
    expect(new HttpError(500).name).toBe('HttpError');
  });

  it('keeps a default message that mentions the status code', () => {
    expect(new HttpError(500).message).toContain('500');
  });
});
