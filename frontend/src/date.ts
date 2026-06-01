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

export function formatDuration(start: string | null, end: string | null, t: Messages, estimatedStart = false, rounding: 'floor' | 'nearest' = 'floor'): string {
  if (start === null || end === null) return '';
  const startDate = parseIsoDate(start);
  const endDate = parseIsoDate(end);
  if (!startDate || !endDate) return '';

  const prefix = estimatedStart ? '> ' : '';
  const days = daysBetween(start, end);
  const monthsTotal = rounding === 'nearest' ? roundedCalendarMonthsBetween(startDate, endDate) : calendarMonthsBetween(startDate, endDate);
  if (monthsTotal < 3) return prefix + t.days.replace('{n}', String(days ?? 0));
  if (monthsTotal < 12) return prefix + t.months.replace('{n}', String(monthsTotal));

  const years = Math.floor(monthsTotal / 12);
  const months = monthsTotal % 12;
  if (months === 0) return prefix + t.years.replace('{n}', String(years));
  return prefix + t.yearsMonths.replace('{years}', String(years)).replace('{months}', String(months));
}

function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

function calendarMonthsBetween(start: Date, end: Date): number {
  if (end.getTime() <= start.getTime()) return 0;
  let months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth();
  if (end.getUTCDate() < start.getUTCDate()) months -= 1;
  return Math.max(0, months);
}

function roundedCalendarMonthsBetween(start: Date, end: Date): number {
  const floorMonths = calendarMonthsBetween(start, end);
  const floorDate = addUtcMonths(start, floorMonths);
  const nextDate = addUtcMonths(start, floorMonths + 1);
  const elapsedRemainder = end.getTime() - floorDate.getTime();
  const nextMonthLength = nextDate.getTime() - floorDate.getTime();
  if (nextMonthLength <= 0) return floorMonths;
  return elapsedRemainder >= nextMonthLength / 2 ? floorMonths + 1 : floorMonths;
}

function addUtcMonths(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + months;
  const day = date.getUTCDate();
  const target = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target;
}
