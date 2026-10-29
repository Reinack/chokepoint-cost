import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Dictionary } from './en'
import { loadDictionary, loadedDictionary } from './load'
import { DEFAULT_LANGUAGE, directionOf, isLanguage, type Language } from './languages'

export { LANGUAGES, DEFAULT_LANGUAGE, type Language } from './languages'
export type { Dictionary } from './en'

const STORAGE_KEY = 'chokepoint.language'

/**
 * English unless the visitor has picked something else before.
 *
 * Deliberately not sniffing `navigator.languages`: this is a reference tool
 * whose vocabulary — Neopanamax, TCE, VLSFO — is English in the trade, and a
 * browser locale is a poor proxy for which language someone wants to read
 * shipping economics in. The choice is one click away and it sticks.
 */
function initialLanguage(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored && isLanguage(stored) ? stored : DEFAULT_LANGUAGE
}

interface I18nValue {
  language: Language
  /** The language being fetched, if a switch is in flight. */
  pending: Language | null
  setLanguage: (language: Language) => void
  t: Dictionary
  /** True for Arabic, so components can opt individual subtrees back into LTR. */
  rtl: boolean
  formatNumber: (value: number, fractionDigits?: number) => string
  formatUsd: (value: number, options?: { compact?: boolean; sign?: boolean }) => string
  formatPercent: (fraction: number, fractionDigits?: number) => string
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  // Language and dictionary move together. Committing them separately would
  // show one language's strings under another's text direction — Arabic words
  // in a left-to-right shell, or the reverse — for as long as the fetch took.
  const [active, setActive] = useState(() => {
    const language = initialLanguage()
    return { language, dictionary: loadedDictionary(language) ?? null }
  })
  const [pending, setPending] = useState<Language | null>(null)

  /** Only the most recent request may commit, however the fetches interleave. */
  const latestRequest = useRef(0)

  // Resolve the stored language when it is not the statically bundled default.
  useEffect(() => {
    if (active.dictionary) return
    const request = ++latestRequest.current
    let cancelled = false
    loadDictionary(active.language).then((dictionary) => {
      if (cancelled || request !== latestRequest.current) return
      setActive((current) => ({ ...current, dictionary }))
    })
    return () => {
      cancelled = true
    }
  }, [active.dictionary, active.language])

  useEffect(() => {
    if (!active.dictionary) return
    window.localStorage.setItem(STORAGE_KEY, active.language)
    document.documentElement.lang = active.language
    document.documentElement.dir = directionOf(active.language)
  }, [active.language, active.dictionary])

  const setLanguage = useCallback((next: Language) => {
    const cached = loadedDictionary(next)
    if (cached) {
      latestRequest.current++
      setPending(null)
      setActive({ language: next, dictionary: cached })
      return
    }

    const request = ++latestRequest.current
    setPending(next)
    loadDictionary(next).then((dictionary) => {
      if (request !== latestRequest.current) return
      setPending(null)
      setActive({ language: next, dictionary })
    })
  }, [])

  const value = useMemo<I18nValue>(() => {
    const t = active.dictionary
    // Guarded by the early return below; the provider renders nothing until the
    // first dictionary is in hand.
    if (!t) return null as unknown as I18nValue

    const { locale } = t

    const formatNumber = (n: number, fractionDigits = 0) =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }).format(n)

    const formatUsd = (n: number, options?: { compact?: boolean; sign?: boolean }) => {
      const abs = Math.abs(n)
      const compact = options?.compact ?? abs >= 1_000_000
      const formatted = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'USD',
        notation: compact ? 'compact' : 'standard',
        maximumFractionDigits: compact ? 2 : abs < 100 ? 2 : 0,
      }).format(n)
      return options?.sign && n > 0 ? `+${formatted}` : formatted
    }

    const formatPercent = (fraction: number, fractionDigits = 0) =>
      new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }).format(fraction)

    return {
      language: active.language,
      pending,
      setLanguage,
      t,
      rtl: directionOf(active.language) === 'rtl',
      formatNumber,
      formatUsd,
      formatPercent,
    }
  }, [active, pending, setLanguage])

  // Only reachable when a returning visitor stored a non-default language: its
  // chunk is in flight. English readers never wait.
  if (!active.dictionary) return null

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n must be used inside <I18nProvider>')
  return value
}
