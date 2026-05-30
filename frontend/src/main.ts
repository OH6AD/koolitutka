import './style.css';
import { DbClient } from './dbClient';
import { daysAgoIso, daysBetween, formatDuration, todayIso } from './date';
import { formatMessage, languages, messages, pickLanguage } from './i18n';
import { normalizeCallsign } from './callsign';
import { buildRouteHash, parseRouteHash } from './route';
import type { ChangeRow, EventRow, Language, LookupResult, Metadata, Status } from './types';

const VALIDITY_RULES_URL = 'https://oh2ti.fi/wp-content/uploads/2023/05/PRK-RA2023_L1-L2_K-moduuli.pdf#page=9';

const db = new DbClient();
const initialRoute = parseRouteHash(location.hash);
const savedLanguage = localStorage.getItem('language');
let language: Language = initialRoute.language
  ?? (savedLanguage && languages.includes(savedLanguage as Language) ? savedLanguage as Language : null)
  ?? pickLanguage(navigator.languages);
let dateStart = initialRoute.start ?? daysAgoIso(7);
let dateEnd = initialRoute.end ?? todayIso();
let pendingLookup = initialRoute.q;
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
db.init('/koolitutka.sqlite')
  .then((data) => {
    metadata = data;
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
        <div>
          <h1>${t.appTitle}</h1>
          <p>${t.appSubtitle}</p>
        </div>
        <label class="language">
          <span>${t.language}</span>
          <select id="language-select">
            ${languages.map((option) => `<option value="${option}" ${option === language ? 'selected' : ''}>${option.toUpperCase()}</option>`).join('')}
          </select>
        </label>
      </header>

      ${metadata ? `<p class="metadata">${formatMessage(t.metadata, { updated: metadata.updated })}</p>` : ''}
      ${isLoading ? `<p class="notice">${t.loading}</p>` : ''}
      ${error ? `<p class="notice error">${t.error}: ${escapeHtml(error)}</p>` : ''}

      <section class="search-panel">
        <form id="search-form" class="search-form">
          <label for="callsign">${t.searchLabel}</label>
          <input id="callsign" name="callsign" autocomplete="off" placeholder="${t.searchPlaceholder}" value="${lastLookup?.callsign ?? ''}" />
          <button type="submit">${t.searchButton}</button>
        </form>
        <div id="suggestions" class="suggestions"></div>
      </section>

      ${lastLookup ? renderLookup(lastLookup) : ''}

      <section class="changes-panel">
        <div class="section-header">
          <h2>${t.changes}</h2>
          <form id="changes-form" class="date-form">
            <label>${t.from}<input type="date" id="start-date" value="${dateStart}" /></label>
            <label>${t.to}<input type="date" id="end-date" value="${dateEnd}" /></label>
            <button type="submit">${t.update}</button>
          </form>
        </div>
        ${renderChanges(changes)}
      </section>
    </main>
  `;
  bindEvents();
}

function bindEvents(): void {
  document.querySelector<HTMLSelectElement>('#language-select')?.addEventListener('change', (event) => {
    language = (event.currentTarget as HTMLSelectElement).value as Language;
    localStorage.setItem('language', language);
    syncRoute();
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

  document.querySelector<HTMLInputElement>('#callsign')?.addEventListener('input', (event) => {
    const value = normalizeCallsign((event.currentTarget as HTMLInputElement).value);
    const suggestions = document.querySelector<HTMLDivElement>('#suggestions');
    if (!suggestions || value.length < 2) {
      if (suggestions) suggestions.innerHTML = '';
      return;
    }
    db.searchPrefix(value).then((rows) => {
      suggestions.innerHTML = rows.map((row) => `<button type="button" data-callsign="${row.callsign}">${row.callsign}</button>`).join('');
      suggestions.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
        button.addEventListener('click', () => {
          const input = document.querySelector<HTMLInputElement>('#callsign');
          if (input) input.value = button.dataset.callsign ?? '';
          document.querySelector<HTMLFormElement>('#search-form')?.requestSubmit();
        });
      });
    }).catch(showError);
  });

  document.querySelector<HTMLFormElement>('#changes-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    dateStart = document.querySelector<HTMLInputElement>('#start-date')?.value || dateStart;
    dateEnd = document.querySelector<HTMLInputElement>('#end-date')?.value || dateEnd;
    syncRoute();
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
        ${renderEventsTable(result.related)}
      </article>
    </section>
  `;
}

function renderNoHistoryNotice(result: LookupResult): string {
  if (result.history.length > 0) return '';
  const t = messages(language);
  return `<p class="status-note">${t.noHistoryNotice} <a href="${VALIDITY_RULES_URL}" target="_blank" rel="noopener noreferrer">${t.validityRules}</a>.</p>`;
}

function renderEventsTable(rows: EventRow[]): string {
  const t = messages(language);
  if (rows.length === 0) return `<p class="empty">${t.noRows}</p>`;
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>${t.callsign}</th><th>${t.status}</th><th>${t.startDate}</th><th>${t.endDate}</th></tr></thead>
        <tbody>${rows.map((row) => `
          <tr>
            <td>${row.callsign}</td>
            <td>${statusText(row.status)}</td>
            <td>${displayStart(row)}</td>
            <td>${displayEnd(row)}</td>
          </tr>`).join('')}</tbody>
      </table>
    </div>
  `;
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
            <td><a class="callsign-link" href="${callsignHash(row.callsign)}">${row.callsign}</a></td>
            <td>${statusText(row.status)}</td>
            <td>${displayStart(row)}</td>
            <td>${displayEnd(row)}</td>
            <td>${formatDuration(row.duration_days, t, row.from_date_estimated)}</td>
          </tr>`).join('')}</tbody>
      </table>
    </div>
  `;
}

function loadChanges(): Promise<void> {
  return db.listChanges(dateStart, dateEnd).then((rows) => {
    changes = rows;
    render();
  });
}

function renderCurrentDates(current: { from_date: string | null; from_date_estimated?: boolean; to_date: string | null }): string {
  const t = messages(language);
  const rows = [];
  if (current.from_date) rows.push(`<p>${t.since}: ${displayStart(current)}</p>`);
  if (current.to_date) rows.push(`<p>${t.endDate}: ${displayEnd({ to_date: current.to_date })}</p>`);
  const end = current.to_date ?? todayIso();
  const duration = formatDuration(daysBetween(current.from_date, end), t, current.from_date_estimated);
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
  return buildRouteHash({ q: callsign, start: dateStart, end: dateEnd, language });
}

function syncRoute(): void {
  const hash = buildRouteHash({ q: lastLookup?.callsign ?? pendingLookup, start: dateStart, end: dateEnd, language });
  if (location.hash !== hash) history.replaceState(null, '', hash);
}

function applyHash(hash: string): void {
  const route = parseRouteHash(hash);
  language = route.language ?? language;
  dateStart = route.start ?? daysAgoIso(7);
  dateEnd = route.end ?? todayIso();
  pendingLookup = route.q;
  applyRouteState().catch(showError);
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
