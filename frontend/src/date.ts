import type { Messages } from './i18n';

const DAY_MS = 24 * 60 * 60 * 1000;

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function daysAgoIso(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return toIsoDate(date);
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function daysBetween(start: string | null, end: string | null): number | null {
  if (start === null || end === null) return null;
  const startMs = Date.parse(`${start}T00:00:00Z`);
  const endMs = Date.parse(`${end}T00:00:00Z`);
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return null;
  return Math.max(0, Math.round((endMs - startMs) / DAY_MS));
}

export function formatDuration(days: number | null, t: Messages): string {
  if (days === null) return '';
  if (days < 60) return t.days.replace('{n}', String(days));
  if (days < 365) return t.months.replace('{n}', String(Math.max(1, Math.round(days / 30))));
  const years = Math.floor(days / 365);
  const months = Math.round((days - years * 365) / 30);
  return t.yearsMonths.replace('{years}', String(years)).replace('{months}', String(months));
}
