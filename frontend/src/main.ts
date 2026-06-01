import './style.css';
import { DbClient } from './dbClient';
import { formatDuration, todayIso } from './date';
import { formatMessage, languages, messages, pickLanguage } from './i18n';
import { normalizeCallsign } from './callsign';
import { buildRouteHash, parseRouteHash } from './route';
import { parsePrefixSearchOnly } from './searchMode';
import type { ChangeRow, EventRow, Language, LookupResult, Metadata, Status } from './types';

const VALIDITY_RULES_URL = 'https://oh2ti.fi/wp-content/uploads/2023/05/PRK-RA2023_L1-L2_K-moduuli.pdf#page=9';
const PREFIX_SEARCH_ONLY_KEY = 'prefixSearchOnly';
const AUTHOR_URL = 'https://zouppen.iki.fi/';
const SOURCE_URL = 'https://github.com/OH6AD/koolitutka';
const DATA_SOURCE_URL = 'https://github.com/OH6AD/koolit';

const db = new DbClient();
const initialRoute = parseRouteHash(location.hash);
const savedLanguage = localStorage.getItem('language');
let language: Language = (savedLanguage && languages.includes(savedLanguage as Language) ? savedLanguage as Language : null)
  ?? pickLanguage(navigator.languages);
let changesDate = initialRoute.date ?? todayIso();
let changesDateExplicit = initialRoute.date !== null;
let changesLimit = 20;
let changesHasMore = false;
let pendingLookup = initialRoute.q;
let prefixSearchOnly = parsePrefixSearchOnly(localStorage.getItem(PREFIX_SEARCH_ONLY_KEY));
let metadata: Metadata | null = null;
let lastLookup: LookupResult | null = null;
let changes: ChangeRow[] = [];
let isLoading = true;
let error: string | null = null;

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing app root');

window.addEventListener('hashchange', () => {
  applyHash(location.hash);
});

render();
db.init(new URL('koolitutka.sqlite', document.baseURI).toString())
  .then((data) => {
    metadata = data;
    if (!changesDateExplicit) changesDate = metadata.updated || todayIso();
    isLoading = false;
    syncRoute();
    return applyRouteState();
  })
  .catch((reason) => {
    isLoading = false;
    error = reason instanceof Error ? reason.message : String(reason);
    render();
  });

function render(): void {
  const t = messages(language);
  document.documentElement.lang = language;
  app.innerHTML = `
    <main class="shell">
      <header class="topbar">
        <div class="topleft">
          <h1>${t.appTitle}</h1>
          <p>${t.appSubtitle}</p>
          ${metadata ? `<p class="metadata">${formatMessage(t.metadata, { genesis: metadata.genesis, updated: metadata.updated })}</p>` : ''}
        </div>
        <label class="language">
          <span>${t.language}</span>
          <select id="language-select">
            ${languages.map((option) => `<option value="${option}" ${option === language ? 'selected' : ''}>${option}</option>`).join('')}
          </select>
        </label>
      </header>

      ${isLoading ? `<p class="notice">${t.loading}</p>` : ''}
      ${error ? `<p class="notice error">${t.error}: ${escapeHtml(error)}</p>` : ''}

      <section class="search-panel">
        <form id="search-form" class="search-form">
          <label for="callsign">${t.searchLabel}<input id="callsign" name="callsign" autocomplete="off" placeholder="${t.searchPlaceholder}" value="${lastLookup?.callsign ?? ''}" /></label>
          <button type="submit">${t.searchButton}</button>
          <label class="checkbox-label"><input id="prefix-search-only" type="checkbox" ${prefixSearchOnly ? 'checked' : ''} />${t.prefixSearchOnly}</label>
        </form>
        <div id="suggestions" class="suggestions"></div>
      </section>

      ${lastLookup ? renderLookup(lastLookup) : ''}

      <section class="changes-panel">
        <div class="section-header">
          <h2>${t.changes}</h2>
          <form id="changes-form" class="date-form">
            <label>${t.until}<input type="date" id="changes-date" value="${changesDate}" /></label>
            <button type="submit">${t.update}</button>
            <button id="show-newest-changes" class="secondary-button" type="button">${t.showNewest}</button>
          </form>
        </div>
        ${renderChanges(changes)}
      </section>

      ${renderFooter()}
    </main>
  `;
  bindEvents();
}

function renderFooter(): string {
  const t = messages(language);
  return `<footer class="footer">${formatMessage(t.footer, {
    author: `<a href="${AUTHOR_URL}">OH64K</a>`,
    source: `<a href="${SOURCE_URL}">GitHub</a>`,
    dataSource: `<a href="${DATA_SOURCE_URL}">koolit</a>`,
  })}</footer>`;
}

function bindEvents(): void {
  document.querySelector<HTMLSelectElement>('#language-select')?.addEventListener('change', (event) => {
    language = (event.currentTarget as HTMLSelectElement).value as Language;
    localStorage.setItem('language', language);
    render();
  });

  document.querySelector<HTMLFormElement>('#search-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = document.querySelector<HTMLInputElement>('#callsign');
    const callsign = normalizeCallsign(input?.value ?? '');
    if (callsign.length === 0) return;
    lookupCallsign(callsign).then(() => {
      syncRoute();
      render();
    }).catch(showError);
  });

  document.querySelector<HTMLInputElement>('#callsign')?.addEventListener('input', () => {
    refreshSuggestions().catch(showError);
  });

  document.querySelector<HTMLInputElement>('#prefix-search-only')?.addEventListener('change', (event) => {
    prefixSearchOnly = (event.currentTarget as HTMLInputElement).checked;
    localStorage.setItem(PREFIX_SEARCH_ONLY_KEY, String(prefixSearchOnly));
    refreshSuggestions().catch(showError);
  });

  document.querySelector<HTMLFormElement>('#changes-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    changesDate = document.querySelector<HTMLInputElement>('#changes-date')?.value || changesDate;
    changesDateExplicit = true;
    changesLimit = 20;
    syncRoute();
    loadChanges().catch(showError);
  });

  document.querySelector<HTMLButtonElement>('#show-newest-changes')?.addEventListener('click', () => {
    changesDate = metadata?.updated || todayIso();
    changesDateExplicit = false;
    changesLimit = 20;
    syncRoute();
    loadChanges().catch(showError);
  });

  document.querySelector<HTMLButtonElement>('#show-more-changes')?.addEventListener('click', () => {
    changesLimit += 20;
    loadChanges().catch(showError);
  });

  document.querySelector<HTMLButtonElement>('#close-lookup')?.addEventListener('click', () => {
    lastLookup = null;
    pendingLookup = null;
    const input = document.querySelector<HTMLInputElement>('#callsign');
    if (input) input.value = '';
    syncRoute();
    render();
  });
}

function refreshSuggestions(): Promise<void> {
  const input = document.querySelector<HTMLInputElement>('#callsign');
  const suggestions = document.querySelector<HTMLDivElement>('#suggestions');
  const value = normalizeCallsign(input?.value ?? '');
  if (!suggestions || value.length < 2) {
    if (suggestions) suggestions.innerHTML = '';
    return Promise.resolve();
  }

  return db.searchSuggestions(value, prefixSearchOnly ? 'prefix' : 'anywhere').then((rows) => {
    suggestions.innerHTML = rows.map((row) => `<button type="button" data-callsign="${row.callsign}">${row.callsign}</button>`).join('');
    suggestions.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
      button.addEventListener('click', () => {
        if (input) input.value = button.dataset.callsign ?? '';
        document.querySelector<HTMLFormElement>('#search-form')?.requestSubmit();
      });
    });
  });
}

function renderLookup(result: LookupResult): string {
  const t = messages(language);
  const current = result.current;
  return `
    <section class="lookup-grid">
      <article class="status-card status-${current.status.toLowerCase()}">
        <div class="card-header">
          <h2>${t.currentStatus}</h2>
          <button id="close-lookup" class="icon-button" type="button" aria-label="${t.close}" title="${t.close}">×</button>
        </div>
        <div class="status-line">${current.callsign}: ${statusText(current.status)}</div>
        ${renderCurrentDates(current)}
        ${renderNoHistoryNotice(result)}
      </article>
      <article>
        <h2>${t.history}</h2>
        ${renderEventsTable(result.history)}
      </article>
      <article>
        <h2>${t.related}</h2>
        ${renderEventsTable(result.related, true)}
      </article>
    </section>
  `;
}

function renderNoHistoryNotice(result: LookupResult): string {
  if (result.history.length > 0) return '';
  const t = messages(language);
  return `<p class="status-note">${t.noHistoryNotice} <a href="${VALIDITY_RULES_URL}" target="_blank" rel="noopener noreferrer">${t.validityRules}</a>.</p>`;
}

function renderEventsTable(rows: EventRow[], linkCallsigns = false): string {
  const t = messages(language);
  if (rows.length === 0) return `<p class="empty">${t.noRows}</p>`;
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>${t.callsign}</th><th>${t.status}</th><th>${t.startDate}</th><th>${t.endDate}</th></tr></thead>
        <tbody>${rows.map((row) => `
          <tr>
            <td>${renderCallsignCell(row.callsign, linkCallsigns)}</td>
            <td>${statusText(row.status)}</td>
            <td>${displayStart(row)}</td>
            <td>${displayEnd(row)}</td>
          </tr>`).join('')}</tbody>
      </table>
    </div>
  `;
}

function renderCallsignCell(callsign: string, linked: boolean): string {
  if (!linked) return callsign;
  return `<a class="callsign-link" href="${callsignHash(callsign)}">${callsign}</a>`;
}

function renderChanges(rows: ChangeRow[]): string {
  const t = messages(language);
  if (rows.length === 0) return `<p class="empty">${t.noRows}</p>`;
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>${t.date}</th><th>${t.change}</th><th>${t.callsign}</th><th>${t.status}</th><th>${t.startDate}</th><th>${t.endDate}</th><th>${t.duration}</th></tr></thead>
        <tbody>${rows.map((row) => `
          <tr>
            <td>${row.change_date}</td>
            <td>${row.change_type === 'start' ? t.started : t.ended}</td>
            <td>${renderCallsignCell(row.callsign, row.is_wildcard === 0)}</td>
            <td>${statusText(row.status)}</td>
            <td>${displayStart(row)}</td>
            <td>${displayEnd(row)}</td>
            <td>${formatDuration(row.from_date, row.duration_end_date, t, row.from_date_estimated)}</td>
          </tr>`).join('')}</tbody>
      </table>
    </div>
    ${changesHasMore ? `<div class="changes-actions"><button id="show-more-changes" class="secondary-button" type="button">${t.showMore}</button></div>` : ''}
  `;
}

function loadChanges(): Promise<void> {
  return db.listChanges(changesDate, changesLimit).then((result) => {
    changes = result.rows;
    changesHasMore = result.hasMore;
    render();
  });
}

function renderCurrentDates(current: { from_date: string | null; from_date_estimated?: boolean; to_date: string | null }): string {
  const t = messages(language);
  const rows = [];
  if (current.from_date) rows.push(`<p>${t.since}: ${displayStart(current)}</p>`);
  if (current.to_date) rows.push(`<p>${t.endDate}: ${displayEnd({ to_date: current.to_date })}</p>`);
  const end = current.to_date ?? todayIso();
  const duration = formatDuration(current.from_date, end, t, current.from_date_estimated);
  if (duration) rows.push(`<p>${t.duration}: ${duration}</p>`);
  return rows.join('');
}

function lookupCallsign(callsign: string): Promise<void> {
  pendingLookup = callsign;
  return db.lookupCallsign(callsign).then((result) => {
    lastLookup = result;
  });
}

function applyRouteState(): Promise<void> {
  return loadChanges().then(() => {
    if (pendingLookup === null) {
      lastLookup = null;
      render();
      return;
    }
    return lookupCallsign(pendingLookup).then(render);
  });
}

function callsignHash(callsign: string): string {
  return buildRouteHash({ q: callsign, date: changesDateExplicit ? changesDate : null });
}

function syncRoute(): void {
  const hash = buildRouteHash({ q: lastLookup?.callsign ?? pendingLookup, date: changesDateExplicit ? changesDate : null });
  if (location.hash !== hash) history.replaceState(null, '', hash);
}

function applyHash(hash: string): void {
  const route = parseRouteHash(hash);
  const previousLookup = pendingLookup;
  changesDateExplicit = route.date !== null;
  changesDate = route.date ?? metadata?.updated ?? todayIso();
  changesLimit = 20;
  pendingLookup = route.q;
  applyRouteState().then(() => {
    if (pendingLookup !== null && pendingLookup !== previousLookup) window.scrollTo({ top: 0, behavior: 'smooth' });
  }).catch(showError);
}

function displayStart(row: { from_date: string | null; from_date_estimated?: boolean }): string {
  if (row.from_date === null) return '';
  return row.from_date_estimated ? `< ${row.from_date}` : row.from_date;
}

function displayEnd(row: { to_date: string }): string {
  return row.to_date === 'NOW' ? messages(language).active : row.to_date;
}

function statusText(status: Status): string {
  return messages(language).statusText[status];
}

function showError(reason: unknown): void {
  error = reason instanceof Error ? reason.message : String(reason);
  render();
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char] ?? char));
}
