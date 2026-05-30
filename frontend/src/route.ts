import { normalizeCallsign } from './callsign';
import { languages } from './i18n';
import type { Language } from './types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface RouteState {
  q: string | null;
  start: string | null;
  end: string | null;
  language: Language | null;
}

export function parseRouteHash(hash: string): RouteState {
  const value = hash.startsWith('#') ? hash.slice(1) : hash;
  const params = new URLSearchParams(value);
  const language = params.get('lang');
  const start = params.get('start');
  const end = params.get('end');
  const q = normalizeCallsign(params.get('q') ?? '');

  return {
    q: q.length > 0 ? q : null,
    start: start && DATE_RE.test(start) ? start : null,
    end: end && DATE_RE.test(end) ? end : null,
    language: language && languages.includes(language as Language) ? language as Language : null,
  };
}

export function buildRouteHash(state: { q?: string | null; start: string; end: string; language: Language }): string {
  const params = new URLSearchParams();
  const q = normalizeCallsign(state.q ?? '');
  if (q.length > 0) params.set('q', q);
  params.set('start', state.start);
  params.set('end', state.end);
  params.set('lang', state.language);
  return `#${params.toString()}`;
}
