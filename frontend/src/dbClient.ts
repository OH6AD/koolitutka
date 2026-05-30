import type { ChangeRow, LookupResult, Metadata, SuggestionSearchMode, WorkerRequest, WorkerResponse } from './types';

export class DbClient {
  private worker = new Worker(new URL('./db.worker.ts', import.meta.url), { type: 'module' });
  private nextId = 1;
  private pending = new Map<number, { resolve: (value: unknown) => void; reject: (reason?: unknown) => void }>();

  constructor() {
    this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const pending = this.pending.get(event.data.id);
      if (!pending) return;
      this.pending.delete(event.data.id);
      if (event.data.ok) pending.resolve(event.data.data);
      else pending.reject(new Error(event.data.error));
    };
  }

  init(dbUrl: string): Promise<Metadata> {
    return this.request<Metadata>({ type: 'init', dbUrl });
  }

  lookupCallsign(callsign: string): Promise<LookupResult> {
    return this.request<LookupResult>({ type: 'lookupCallsign', callsign });
  }

  searchSuggestions(query: string, mode: SuggestionSearchMode, limit = 8): Promise<Array<{ callsign: string; status: string }>> {
    return this.request<Array<{ callsign: string; status: string }>>({ type: 'searchSuggestions', query, mode, limit });
  }

  listChanges(start: string, end: string): Promise<ChangeRow[]> {
    return this.request<ChangeRow[]>({ type: 'listChanges', start, end });
  }

  private request<T>(message: Omit<WorkerRequest, 'id'>): Promise<T> {
    const id = this.nextId++;
    const request = { ...message, id } as WorkerRequest;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (value: unknown) => void, reject });
      this.worker.postMessage(request);
    });
  }
}
