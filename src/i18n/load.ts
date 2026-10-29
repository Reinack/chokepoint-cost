import { en, type Dictionary } from './en'
import type { Language } from './languages'

/**
 * Dictionary loading.
 *
 * English is imported statically: it is the default language and the type
 * source, so it has to be there on the first paint anyway. The other eight are
 * dynamic imports, which Vite emits as separate chunks fetched only when
 * someone picks that language.
 */
const LOADERS: Record<Language, () => Promise<Dictionary>> = {
  en: () => Promise.resolve(en),
  es: () => import('./es').then((m) => m.es),
  pt: () => import('./pt').then((m) => m.pt),
  fr: () => import('./fr').then((m) => m.fr),
  de: () => import('./de').then((m) => m.de),
  it: () => import('./it').then((m) => m.it),
  ru: () => import('./ru').then((m) => m.ru),
  zh: () => import('./zh').then((m) => m.zh),
  ar: () => import('./ar').then((m) => m.ar),
}

/** Fetched dictionaries are kept, so switching back is instant and offline-safe. */
const cache = new Map<Language, Dictionary>([['en', en]])

/** The dictionary if it is already in memory, otherwise undefined. */
export const loadedDictionary = (language: Language): Dictionary | undefined =>
  cache.get(language)

export async function loadDictionary(language: Language): Promise<Dictionary> {
  const cached = cache.get(language)
  if (cached) return cached

  const dictionary = await LOADERS[language]()
  cache.set(language, dictionary)
  return dictionary
}
