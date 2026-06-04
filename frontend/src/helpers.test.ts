import { describe, expect, it } from 'vitest';
import { normalizeCallsign, neighbour } from './callsign';
import { addYearsIso, daysBetween, formatDuration, formatStartDate } from './date';
import { messages, pickLanguage } from './i18n';
import { currentState, databaseNeighbour, mergedHistory } from './lookup';
import { buildRouteHash, parseRouteHash } from './route';
import { parsePrefixSearchOnly } from './searchMode';

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

  it('adds calendar years to ISO dates', () => {
    expect(addYearsIso('2024-05-31', 2)).toBe('2026-05-31');
    expect(addYearsIso('2024-02-29', 2)).toBe('2026-02-28');
    expect(addYearsIso('invalid', 2)).toBeNull();
  });

  it('formats inclusive estimated start dates', () => {
    expect(formatStartDate('2016-04-22', true)).toBe('≤ 2016-04-22');
    expect(formatStartDate('2016-04-22')).toBe('2016-04-22');
    expect(formatStartDate(null, true)).toBe('');
  });

  it('formats days, months, and years', () => {
    expect(daysBetween('2026-05-01', '2026-05-10')).toBe(9);
    expect(formatDuration('2026-05-01', '2026-05-10', t)).toBe('9 d');
    expect(formatDuration('2026-01-01', '2026-03-31', t)).toBe('89 d');
    expect(formatDuration('2026-01-01', '2026-04-01', t)).toBe('3 mo');
    expect(formatDuration('2025-01-15', '2026-03-15', t)).toBe('1 y 2 mo');
    expect(formatDuration('2022-06-09', '2026-05-31', t)).toBe('3 y 11 mo');
    expect(formatDuration('2024-06-01', '2026-06-01', t)).toBe('2 y');
    expect(formatDuration('2016-05-26', '2018-05-24', t)).toBe('1 y 11 mo');
    expect(formatDuration('2016-05-26', '2018-05-24', t, false, 'nearest')).toBe('2 y');
    expect(formatDuration('2016-04-23', '2026-06-01', t, true)).toBe('≥ 10 y 1 mo');
    expect(formatDuration('2016-05-26', '2018-05-24', t, true, 'nearest')).toBe('≥ 1 y 11 mo');
  });
});


describe('lookup history', () => {
  it('uses database-provided neighbour from exact rows', () => {
    const rows = [
      { callsign: 'OH6ABC', neighbour: 'OH9SPECIAL', is_wildcard: 0, status: 'VOIMASSA' as const, from_date: '2025-01-01', to_date: 'NOW' },
    ];

    expect(databaseNeighbour(rows)).toBe('OH9SPECIAL');
  });

  it('merges exact and wildcard history chronologically', () => {
    const rows = [
      { callsign: 'OH*EYA', neighbour: 'OH*EYA', is_wildcard: 1, status: 'KARENSSI' as const, from_date: '2019-10-23', to_date: '2021-10-21' },
      { callsign: 'OH6EYA', neighbour: 'OH*EYA', is_wildcard: 0, status: 'VOIMASSA' as const, from_date: null, to_date: '2019-10-22' },
    ];

    expect(mergedHistory(rows, '2016-04-23').map((row) => [row.callsign, row.from_date, row.to_date])).toEqual([
      ['OH6EYA', '2016-04-23', '2019-10-22'],
      ['OH*EYA', '2019-10-23', '2021-10-21'],
    ]);
  });

  it('uses active wildcard history for current status when exact callsign is inactive', () => {
    const rows = [
      { callsign: 'OH6JXE', neighbour: 'OH*JXE', is_wildcard: 0, status: 'VOIMASSA' as const, from_date: '2020-01-01', to_date: '2024-05-30' },
      { callsign: 'OH*JXE', neighbour: 'OH*JXE', is_wildcard: 1, status: 'KARENSSI' as const, from_date: '2024-05-31', to_date: 'NOW' },
    ];

    expect(currentState('OH6JXE', rows, '2016-04-23')).toEqual({
      callsign: 'OH6JXE',
      status: 'KARENSSI',
      from_date: '2024-05-31',
      from_date_estimated: undefined,
      to_date: null,
    });
  });

  it('prefers exact active history over active wildcard history', () => {
    const rows = [
      { callsign: 'OH6ABC', neighbour: 'OH*ABC', is_wildcard: 0, status: 'VOIMASSA' as const, from_date: '2025-01-01', to_date: 'NOW' },
      { callsign: 'OH*ABC', neighbour: 'OH*ABC', is_wildcard: 1, status: 'KARENSSI' as const, from_date: '2024-01-01', to_date: 'NOW' },
    ];

    expect(currentState('OH6ABC', rows, '2016-04-23').status).toBe('VOIMASSA');
  });
});


describe('hash routing', () => {
  it('parses and builds shareable route state without language preference', () => {
    expect(parseRouteHash('#q=oh2ad&date=2026-05-30&lang=sv')).toEqual({
      q: 'OH2AD',
      date: '2026-05-30',
      states: ['VOIMASSA', 'VARAUS', 'KARENSSI'],
    });
    expect(buildRouteHash({ q: 'oh2ad', date: '2026-05-30' })).toBe('#q=OH2AD&date=2026-05-30');
    expect(buildRouteHash({ q: 'oh2ad', date: null })).toBe('#q=OH2AD');
  });

  it('parses and builds Changes state filters', () => {
    expect(parseRouteHash('#states=KARENSSI,VOIMASSA,UNKNOWN')).toEqual({
      q: null,
      date: null,
      states: ['VOIMASSA', 'KARENSSI'],
    });
    expect(parseRouteHash('#states=')).toEqual({ q: null, date: null, states: [] });
    expect(buildRouteHash({ states: ['KARENSSI', 'VOIMASSA'] })).toBe('#states=VOIMASSA%2CKARENSSI');
    expect(buildRouteHash({ states: [] })).toBe('#states=');
  });
});


describe('search mode', () => {
  it('defaults to prefix search unless explicitly disabled', () => {
    expect(parsePrefixSearchOnly(null)).toBe(true);
    expect(parsePrefixSearchOnly('true')).toBe(true);
    expect(parsePrefixSearchOnly('false')).toBe(false);
  });
});
