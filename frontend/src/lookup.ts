import type { CurrentState, EventRow } from './types';

const GENESIS_DATE = '2016-04-23';

export function databaseNeighbour(rows: EventRow[]): string | null {
  return rows.map((row) => row.neighbour).find((value) => value.length > 0) ?? null;
}

export function mergedHistory(rows: EventRow[]): EventRow[] {
  return rows.map(normalizeOpenStart).sort(compareEvents);
}

export function currentState(callsign: string, rows: EventRow[]): CurrentState {
  const normalized = mergedHistory(rows);
  const exactCurrent = normalized.find((row) => row.callsign === callsign && row.to_date === 'NOW');
  const wildcardCurrent = normalized.find((row) => row.callsign !== callsign && row.to_date === 'NOW');
  const current = exactCurrent ?? wildcardCurrent;
  if (current) {
    return {
      callsign,
      status: current.status,
      from_date: current.from_date,
      from_date_estimated: current.from_date_estimated,
      to_date: null,
    };
  }
  return { callsign, status: 'VAPAA', from_date: nextDay(lastEnd(normalized)), to_date: null };
}

export function normalizeOpenStart(row: EventRow): EventRow {
  if (row.from_date !== null) return row;
  return { ...row, from_date: GENESIS_DATE, from_date_estimated: true };
}

function compareEvents(a: EventRow, b: EventRow): number {
  return (a.from_date ?? '').localeCompare(b.from_date ?? '')
    || a.to_date.localeCompare(b.to_date)
    || a.callsign.localeCompare(b.callsign);
}

function lastEnd(rows: EventRow[]): string | null {
  const dates = rows.map((row) => row.to_date).filter((date) => date !== 'NOW').sort();
  return dates.at(-1) ?? null;
}

function nextDay(value: string | null): string | null {
  if (value === null) return null;
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
