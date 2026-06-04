import { normalizeCallsign } from './callsign';
import { EVENT_STATUSES, type EventStatus } from './types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface RouteState {
  q: string | null;
  date: string | null;
  states: EventStatus[];
}

export function parseRouteHash(hash: string): RouteState {
  const value = hash.startsWith('#') ? hash.slice(1) : hash;
  const params = new URLSearchParams(value);
  const date = params.get('date');
  const q = normalizeCallsign(params.get('q') ?? '');

  return {
    q: q.length > 0 ? q : null,
    date: date && DATE_RE.test(date) ? date : null,
    states: parseStates(params),
  };
}

export function buildRouteHash(state: { q?: string | null; date?: string | null; states?: readonly EventStatus[] }): string {
  const params = new URLSearchParams();
  const q = normalizeCallsign(state.q ?? '');
  if (q.length > 0) params.set('q', q);
  if (state.date) params.set('date', state.date);
  const states = normalizeStates(state.states ?? EVENT_STATUSES);
  if (states.length !== EVENT_STATUSES.length) params.set('states', states.join(','));
  return `#${params.toString()}`;
}

function parseStates(params: URLSearchParams): EventStatus[] {
  if (!params.has('states')) return [...EVENT_STATUSES];
  return normalizeStates(params.get('states')?.split(',') ?? []);
}

function normalizeStates(states: readonly string[]): EventStatus[] {
  const selected = new Set(states);
  return EVENT_STATUSES.filter((status) => selected.has(status));
}

