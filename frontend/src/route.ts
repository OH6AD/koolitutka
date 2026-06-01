import { normalizeCallsign } from './callsign';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface RouteState {
  q: string | null;
  start: string | null;
  end: string | null;
}

export function parseRouteHash(hash: string): RouteState {
  const value = hash.startsWith('#') ? hash.slice(1) : hash;
  const params = new URLSearchParams(value);
  const start = params.get('start');
  const end = params.get('end');
  const q = normalizeCallsign(params.get('q') ?? '');

  return {
    q: q.length > 0 ? q : null,
    start: start && DATE_RE.test(start) ? start : null,
    end: end && DATE_RE.test(end) ? end : null,
  };
}

export function buildRouteHash(state: { q?: string | null; start: string; end: string }): string {
  const params = new URLSearchParams();
  const q = normalizeCallsign(state.q ?? '');
  if (q.length > 0) params.set('q', q);
  params.set('start', state.start);
  params.set('end', state.end);
  return `#${params.toString()}`;
}
