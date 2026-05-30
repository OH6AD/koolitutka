import initSqlJs, { type Database, type QueryExecResult } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { daysBetween } from './date';
import { neighbour, normalizeCallsign } from './callsign';
import type { ChangeRow, CurrentState, EventRow, LookupResult, Metadata, Status, WorkerRequest, WorkerResponse } from './types';

let db: Database | null = null;

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  try {
    const data = await handleRequest(request);
    post({ id: request.id, ok: true, data });
  } catch (error) {
    post({ id: request.id, ok: false, error: error instanceof Error ? error.message : String(error) });
  }
};

async function handleRequest(request: WorkerRequest): Promise<unknown> {
  if (request.type === 'init') {
    const SQL = await initSqlJs({ locateFile: () => wasmUrl });
    const response = await fetch(request.dbUrl, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Unable to load database: ${response.status}`);
    db = new SQL.Database(new Uint8Array(await response.arrayBuffer()));
    return getMetadata();
  }

  const database = requireDb();
  switch (request.type) {
    case 'lookupCallsign':
      return lookupCallsign(database, request.callsign);
    case 'searchPrefix':
      return searchPrefix(database, request.prefix, request.limit);
    case 'listChanges':
      return listChanges(database, request.start, request.end);
    case 'getMetadata':
      return getMetadata();
  }
}

function lookupCallsign(database: Database, value: string): LookupResult {
  const callsign = normalizeCallsign(value);
  const wildcard = neighbour(callsign);
  const direct = rows<EventRow>(database.exec(
    `SELECT callsign, neighbour, is_wildcard, status, from_date, to_date
       FROM event
      WHERE callsign = ?
      ORDER BY COALESCE(from_date, ''), to_date`,
    [callsign],
  ));
  const related = rows<EventRow>(database.exec(
    `SELECT callsign, neighbour, is_wildcard, status, from_date, to_date
       FROM event
      WHERE callsign != ?
        AND (callsign = ? OR neighbour = ?)
      ORDER BY is_wildcard DESC, callsign, COALESCE(from_date, ''), to_date`,
    [callsign, wildcard, wildcard],
  ));

  return {
    callsign,
    current: currentState(callsign, direct),
    history: direct,
    related: related.filter((row) => row.to_date === 'NOW'),
  };
}

function searchPrefix(database: Database, value: string, limit: number): Array<{ callsign: string; status: Status }> {
  const prefix = normalizeCallsign(value);
  if (prefix.length === 0) return [];
  const result = rows<{ callsign: string; status: Exclude<Status, 'VAPAA'>; to_date: string }>(database.exec(
    `SELECT callsign, status, to_date
       FROM event
      WHERE callsign BETWEEN ? AND ?
        AND is_wildcard = 0
      ORDER BY callsign ASC, to_date DESC
      LIMIT ?`,
    [prefix, `${prefix}~`, limit * 4],
  ));

  const seen = new Set<string>();
  const output: Array<{ callsign: string; status: Status }> = [];
  for (const row of result) {
    if (seen.has(row.callsign)) continue;
    seen.add(row.callsign);
    output.push({ callsign: row.callsign, status: row.to_date === 'NOW' ? row.status : 'VAPAA' });
    if (output.length >= limit) break;
  }
  return output;
}

function listChanges(database: Database, start: string, end: string): ChangeRow[] {
  const started = rows<EventRow>(database.exec(
    `SELECT callsign, neighbour, is_wildcard, status, from_date, to_date
       FROM event
      WHERE is_wildcard = 0
        AND from_date IS NOT NULL
        AND from_date BETWEEN ? AND ?`,
    [start, end],
  )).map((row) => changeRow(row, row.from_date ?? start, 'start', end));

  const ended = rows<EventRow>(database.exec(
    `SELECT callsign, neighbour, is_wildcard, status, from_date, to_date
       FROM event
      WHERE is_wildcard = 0
        AND to_date != 'NOW'
        AND to_date BETWEEN ? AND ?`,
    [start, end],
  )).map((row) => changeRow(row, row.to_date, 'end', end));

  return [...started, ...ended].sort((a, b) => a.change_date.localeCompare(b.change_date) || a.callsign.localeCompare(b.callsign));
}

function changeRow(row: EventRow, changeDate: string, changeType: 'start' | 'end', rangeEnd: string): ChangeRow {
  return {
    ...row,
    change_date: changeDate,
    change_type: changeType,
    duration_days: daysBetween(row.from_date, row.to_date === 'NOW' ? rangeEnd : row.to_date),
  };
}

function currentState(callsign: string, rows: EventRow[]): CurrentState {
  const current = rows.find((row) => row.to_date === 'NOW');
  if (current) {
    return { callsign, status: current.status, from_date: current.from_date, to_date: null };
  }
  return { callsign, status: 'VAPAA', from_date: nextDay(lastEnd(rows)), to_date: null };
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

function getMetadata(): Metadata {
  const database = requireDb();
  const result = rows<{ key: string; value: string }>(database.exec('SELECT key, value FROM metadata'));
  return Object.fromEntries(result.map((row) => [row.key, row.value])) as unknown as Metadata;
}

function requireDb(): Database {
  if (db === null) throw new Error('Database is not initialized');
  return db;
}

function rows<T extends Record<string, unknown>>(result: QueryExecResult[]): T[] {
  if (result.length === 0) return [];
  const [{ columns, values }] = result;
  return values.map((value) => Object.fromEntries(columns.map((column, index) => [column, value[index]])) as T);
}

function post(response: WorkerResponse): void {
  self.postMessage(response);
}
