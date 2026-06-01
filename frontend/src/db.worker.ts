import initSqlJs, { type Database, type QueryExecResult } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { neighbour, normalizeCallsign } from './callsign';
import { currentState, databaseNeighbour, mergedHistory, normalizeOpenStart } from './lookup';
import type { ChangeListResult, ChangeRow, EventRow, LookupResult, Metadata, Status, SuggestionSearchMode, WorkerRequest, WorkerResponse } from './types';

let db: Database | null = null;
let metadata: Metadata | null = null;

type ChangeEventRow = EventRow & { change_date: string; change_type: 'start' | 'end' };

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
    metadata = getMetadata();
    return metadata;
  }

  const database = requireDb();
  switch (request.type) {
    case 'lookupCallsign':
      return lookupCallsign(database, request.callsign);
    case 'searchSuggestions':
      return searchSuggestions(database, request.query, request.mode, request.limit);
    case 'listChanges':
      return listChanges(database, request.date, request.limit);
    case 'getMetadata':
      return getMetadata();
  }
}

function lookupCallsign(database: Database, value: string): LookupResult {
  const genesis = requireMetadata().genesis;
  const callsign = normalizeCallsign(value);
  const exactRows = rows<EventRow>(database.exec(
    `SELECT callsign, neighbour, is_wildcard, status, from_date, to_date
       FROM event
      WHERE callsign = ?`,
    [callsign],
  ));
  const wildcard = databaseNeighbour(exactRows) ?? neighbour(callsign);
  const wildcardRows = wildcard === callsign ? [] : rows<EventRow>(database.exec(
    `SELECT callsign, neighbour, is_wildcard, status, from_date, to_date
       FROM event
      WHERE callsign = ?`,
    [wildcard],
  ));
  const historyRows = [...exactRows, ...wildcardRows];
  const related = rows<EventRow>(database.exec(
    `WITH ranked AS (
       SELECT callsign, neighbour, is_wildcard, status, from_date, to_date,
              row_number() OVER (
                PARTITION BY callsign
                ORDER BY COALESCE(from_date, '') DESC, to_date DESC
              ) AS rn
         FROM event
        WHERE callsign != ?
          AND callsign != ?
          AND neighbour = ?
     )
     SELECT callsign, neighbour, is_wildcard, status, from_date, to_date
       FROM ranked
      WHERE rn = 1
      ORDER BY callsign`,
    [callsign, wildcard, wildcard],
  ));

  return {
    callsign,
    current: currentState(callsign, historyRows, genesis),
    history: mergedHistory(historyRows, genesis),
    related: related.map((row) => normalizeOpenStart(row, genesis)),
  };
}

function searchSuggestions(database: Database, value: string, mode: SuggestionSearchMode, limit: number): Array<{ callsign: string; status: Status }> {
  const query = normalizeCallsign(value);
  if (query.length === 0) return [];
  const condition = mode === 'prefix' ? 'callsign BETWEEN ? AND ?' : "callsign LIKE ? ESCAPE '\\'";
  const parameters = mode === 'prefix' ? [query, `${query}~`, limit * 4] : [`%${escapeLike(query)}%`, limit * 8];
  const result = rows<{ callsign: string; status: Exclude<Status, 'VAPAA'>; to_date: string }>(database.exec(
    `SELECT callsign, status, to_date
       FROM event
      WHERE ${condition}
        AND is_wildcard = 0
      ORDER BY callsign ASC, to_date DESC
      LIMIT ?`,
    parameters,
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

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

function listChanges(database: Database, date: string, limit: number): ChangeListResult {
  const genesis = requireMetadata().genesis;
  const queryLimit = limit + 1;
  const result = rows<ChangeEventRow>(database.exec(
    `SELECT callsign, neighbour, is_wildcard, status, from_date, to_date, change_date, change_type
       FROM (
         SELECT callsign, neighbour, is_wildcard, status, from_date, to_date,
                from_date AS change_date, 'start' AS change_type
           FROM event
          WHERE from_date IS NOT NULL
            AND from_date <= ?
         UNION ALL
         SELECT callsign, neighbour, is_wildcard, status, from_date, to_date,
                to_date AS change_date, 'end' AS change_type
           FROM event
          WHERE to_date != 'NOW'
            AND to_date <= ?
       )
      ORDER BY change_date DESC, callsign ASC
      LIMIT ?`,
    [date, date, queryLimit],
  ));
  const changes = result.map((row) => changeRow(normalizeOpenStart(row, genesis), row.change_date, row.change_type, date));
  return { rows: changes.slice(0, limit), hasMore: changes.length > limit };
}
function changeRow(row: EventRow, changeDate: string, changeType: 'start' | 'end', rangeEnd: string): ChangeRow {
  return {
    ...row,
    change_date: changeDate,
    change_type: changeType,
    duration_end_date: row.to_date === 'NOW' ? rangeEnd : row.to_date,
  };
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

function requireMetadata(): Metadata {
  if (metadata === null) throw new Error('Database metadata is not initialized');
  return metadata;
}

function rows<T extends Record<string, unknown>>(result: QueryExecResult[]): T[] {
  if (result.length === 0) return [];
  const [{ columns, values }] = result;
  return values.map((value) => Object.fromEntries(columns.map((column, index) => [column, value[index]])) as T);
}

function post(response: WorkerResponse): void {
  self.postMessage(response);
}
