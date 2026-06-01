import { normalizeCallsign } from './callsign';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface RouteState {
  q: string | null;
  date: string | null;
}

export function parseRouteHash(hash: string): RouteState {
  const value = hash.startsWith('#') ? hash.slice(1) : hash;
  const params = new URLSearchParams(value);
  const date = params.get('date');
  const q = normalizeCallsign(params.get('q') ?? '');

  return {
    q: q.length > 0 ? q : null,
    date: date && DATE_RE.test(date) ? date : null,
  };
}

export function buildRouteHash(state: { q?: string | null; date: string }): string {
  const params = new URLSearchParams();
  const q = normalizeCallsign(state.q ?? '');
  if (q.length > 0) params.set('q', q);
  params.set('date', state.date);
  return `#${params.toString()}`;
}
