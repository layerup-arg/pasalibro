/**
 * Idioma de cada libro. Para agregar uno nuevo: sumalo acá y en el CHECK de la base (supabase/008_idioma.sql).
 * El orden de esta lista es el orden en que aparecen en todos los listados.
 */
export const LANGUAGES = [
  { code: 'en', flag: '🇬🇧', label: 'Inglés' },
  { code: 'es', flag: '🇦🇷', label: 'Castellano' },
];

export const DEFAULT_LANGUAGE = 'es';

const BY_CODE = Object.fromEntries(LANGUAGES.map((l, i) => [l.code, { ...l, rank: i }]));

export const languageOf = code => BY_CODE[code] ?? BY_CODE[DEFAULT_LANGUAGE];

/**
 * Lo que escribe el admin al cargar ("en", "inglés", "english", "es", "castellano"…) → código, o null si no se entiende.
 */
export function parseLanguage(input) {
  const v = String(input ?? '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (!v) return null;
  if (['en', 'ing', 'ingles', 'english', 'eng'].includes(v)) return 'en';
  if (['es', 'esp', 'espanol', 'castellano', 'cast', 'spanish'].includes(v)) return 'es';
  return null;
}

/** Orden de todos los listados: primero idioma, después título. */
export function compareBooks(a, b) {
  return (languageOf(a.language).rank - languageOf(b.language).rank)
    || a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });
}
