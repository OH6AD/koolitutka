export type Language = 'fi' | 'sv' | 'en';
export type Status = 'VOIMASSA' | 'VARAUS' | 'KARENSSI' | 'VAPAA';
export type SuggestionSearchMode = 'prefix' | 'anywhere';

export interface EventRow {
  callsign: string;
  neighbour: string;
  is_wildcard: number;
  status: Exclude<Status, 'VAPAA'>;
  from_date: string | null;
  from_date_estimated?: boolean;
  to_date: string;
}

export interface CurrentState {
  callsign: string;
  status: Status;
  from_date: string | null;
  from_date_estimated?: boolean;
  to_date: string | null;
}

export interface LookupResult {
  callsign: string;
  current: CurrentState;
  history: EventRow[];
  related: EventRow[];
}

export interface ChangeRow extends EventRow {
  change_date: string;
  change_type: 'start' | 'end';
  duration_days: number | null;
}

export interface Metadata {
  schema_version: string;
  genesis: string;
  updated: string;
}

export type WorkerRequest =
  | { id: number; type: 'init'; dbUrl: string }
  | { id: number; type: 'lookupCallsign'; callsign: string }
  | { id: number; type: 'searchSuggestions'; query: string; mode: SuggestionSearchMode; limit: number }
  | { id: number; type: 'listChanges'; start: string; end: string }
  | { id: number; type: 'getMetadata' };

export type WorkerResponse =
  | { id: number; ok: true; data: unknown }
  | { id: number; ok: false; error: string };
