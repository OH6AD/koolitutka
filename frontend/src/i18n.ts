import type { Language, Status } from './types';

const translations = {
  fi: {
    appTitle: 'Koolitutka',
    appSubtitle: 'Radioamatöörikutsujen tila ja historia',
    searchLabel: 'Kutsu',
    searchPlaceholder: 'Esim. OH2AD',
    searchButton: 'Hae',
    loading: 'Ladataan tietokantaa...',
    error: 'Virhe',
    available: 'Vapaa',
    currentStatus: 'Nykytila',
    history: 'Historia',
    related: 'Liittyvät kutsut',
    changes: 'Muutokset',
    from: 'Alkaen',
    to: 'Päättyen',
    update: 'Päivitä',
    noRows: 'Ei näytettäviä rivejä.',
    callsign: 'Kutsu',
    status: 'Tila',
    startDate: 'Alkupäivä',
    endDate: 'Loppupäivä',
    active: 'voimassa',
    change: 'Muutos',
    duration: 'Kesto',
    started: 'alkoi',
    ended: 'päättyi',
    metadata: 'Päivitetty {updated}',
    language: 'Kieli',
    statusText: {
      VOIMASSA: 'Voimassa',
      VARAUS: 'Varaus',
      KARENSSI: 'Karenssi',
      VAPAA: 'Vapaa',
    } satisfies Record<Status, string>,
    days: '{n} pv',
    months: '{n} kk',
    yearsMonths: '{years} v {months} kk',
  },
  sv: {
    appTitle: 'Koolitutka',
    appSubtitle: 'Status och historik för radioamatöranropssignaler',
    searchLabel: 'Anropssignal',
    searchPlaceholder: 'T.ex. OH2AD',
    searchButton: 'Sök',
    loading: 'Laddar databasen...',
    error: 'Fel',
    available: 'Ledig',
    currentStatus: 'Nuvarande status',
    history: 'Historik',
    related: 'Relaterade anropssignaler',
    changes: 'Ändringar',
    from: 'Från',
    to: 'Till',
    update: 'Uppdatera',
    noRows: 'Inga rader att visa.',
    callsign: 'Anropssignal',
    status: 'Status',
    startDate: 'Startdatum',
    endDate: 'Slutdatum',
    active: 'aktiv',
    change: 'Ändring',
    duration: 'Varaktighet',
    started: 'började',
    ended: 'slutade',
    metadata: 'Uppdaterad {updated}',
    language: 'Språk',
    statusText: {
      VOIMASSA: 'I kraft',
      VARAUS: 'Reserverad',
      KARENSSI: 'Karenstid',
      VAPAA: 'Ledig',
    } satisfies Record<Status, string>,
    days: '{n} d',
    months: '{n} mån',
    yearsMonths: '{years} år {months} mån',
  },
  en: {
    appTitle: 'Koolitutka',
    appSubtitle: 'Amateur radio callsign status and history',
    searchLabel: 'Callsign',
    searchPlaceholder: 'E.g. OH2AD',
    searchButton: 'Search',
    loading: 'Loading database...',
    error: 'Error',
    available: 'Available',
    currentStatus: 'Current status',
    history: 'History',
    related: 'Related callsigns',
    changes: 'Changes',
    from: 'From',
    to: 'To',
    update: 'Update',
    noRows: 'No rows to show.',
    callsign: 'Callsign',
    status: 'Status',
    startDate: 'Start date',
    endDate: 'End date',
    active: 'active',
    change: 'Change',
    duration: 'Duration',
    started: 'started',
    ended: 'ended',
    metadata: 'Updated {updated}',
    language: 'Language',
    statusText: {
      VOIMASSA: 'Active',
      VARAUS: 'Reserved',
      KARENSSI: 'Cooldown',
      VAPAA: 'Available',
    } satisfies Record<Status, string>,
    days: '{n} d',
    months: '{n} mo',
    yearsMonths: '{years} y {months} mo',
  },
};

export type Messages = typeof translations.fi;
export const languages: Language[] = ['fi', 'sv', 'en'];

export function pickLanguage(candidates: readonly string[], fallback: Language = 'fi'): Language {
  for (const candidate of candidates) {
    const language = candidate.toLowerCase().split('-')[0];
    if (languages.includes(language as Language)) return language as Language;
  }
  return fallback;
}

export function messages(language: Language): Messages {
  return translations[language];
}

export function formatMessage(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{([^}]+)\}/g, (_, key: string) => String(values[key] ?? ''));
}
