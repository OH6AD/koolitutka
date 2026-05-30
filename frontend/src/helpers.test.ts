import { describe, expect, it } from 'vitest';
import { normalizeCallsign, neighbour } from './callsign';
import { daysBetween, formatDuration } from './date';
import { messages, pickLanguage } from './i18n';
import { buildRouteHash, parseRouteHash } from './route';

describe('language selection', () => {
  it('uses supported browser language and falls back to Finnish', () => {
    expect(pickLanguage(['sv-FI'])).toBe('sv');
    expect(pickLanguage(['de-DE'])).toBe('fi');
  });
});

describe('callsigns', () => {
  it('normalizes input and derives wildcard neighbour', () => {
    expect(normalizeCallsign(' oh2ad ')).toBe('OH2AD');
    expect(neighbour('OH2AD')).toBe('OH*AD');
  });
});

describe('duration formatting', () => {
  const t = messages('en');

  it('formats days, months, and years', () => {
    expect(daysBetween('2026-05-01', '2026-05-10')).toBe(9);
    expect(formatDuration(9, t)).toBe('9 d');
    expect(formatDuration(90, t)).toBe('3 mo');
    expect(formatDuration(430, t)).toBe('1 y 2 mo');
    expect(formatDuration(3700, t, true)).toBe('> 10 y 2 mo');
  });
});


describe('hash routing', () => {
  it('parses and builds shareable route state', () => {
    expect(parseRouteHash('#q=oh2ad&start=2026-05-01&end=2026-05-30&lang=sv')).toEqual({
      q: 'OH2AD',
      start: '2026-05-01',
      end: '2026-05-30',
      language: 'sv',
    });
    expect(buildRouteHash({ q: 'oh2ad', start: '2026-05-01', end: '2026-05-30', language: 'en' })).toBe('#q=OH2AD&start=2026-05-01&end=2026-05-30&lang=en');
  });
});
