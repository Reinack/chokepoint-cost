/**
 * Language metadata, deliberately kept out of the dictionaries.
 *
 * The dictionaries load on demand, but this cannot: the switcher has to list
 * every language before any of them are fetched, and the document direction has
 * to be right on the first paint. A locale that arrived with its strings would
 * mean Arabic rendering left-to-right and then mirroring a moment later.
 *
 * This module holds no prose, so it stays a few hundred bytes in the main
 * bundle.
 */

export type Language = 'en' | 'es' | 'pt' | 'fr' | 'de' | 'it' | 'ru' | 'zh' | 'ar'

export type Direction = 'ltr' | 'rtl'

export interface LanguageMeta {
  id: Language
  /** Written in its own language, as a language menu should be. */
  label: string
  direction: Direction
}

export const LANGUAGES: LanguageMeta[] = [
  { id: 'en', label: 'English', direction: 'ltr' },
  { id: 'es', label: 'Español', direction: 'ltr' },
  { id: 'pt', label: 'Português (BR)', direction: 'ltr' },
  { id: 'fr', label: 'Français', direction: 'ltr' },
  { id: 'de', label: 'Deutsch', direction: 'ltr' },
  { id: 'it', label: 'Italiano', direction: 'ltr' },
  { id: 'ru', label: 'Русский', direction: 'ltr' },
  { id: 'zh', label: '中文', direction: 'ltr' },
  { id: 'ar', label: 'العربية', direction: 'rtl' },
]

export const DEFAULT_LANGUAGE: Language = 'en'

const BY_ID = new Map(LANGUAGES.map((l) => [l.id, l]))

export const isLanguage = (value: string): value is Language => BY_ID.has(value as Language)

export const directionOf = (language: Language): Direction =>
  BY_ID.get(language)?.direction ?? 'ltr'
