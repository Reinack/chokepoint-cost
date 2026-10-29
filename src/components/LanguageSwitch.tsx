import { LANGUAGES, useI18n, type Language } from '../i18n'

/**
 * A dropdown rather than a row of buttons: nine languages will not fit across a
 * header, least of all a phone one.
 *
 * The control shows the language being fetched, not the one still on screen, so
 * it responds on click even though the strings arrive a moment later.
 */
export function LanguageSwitch() {
  const { language, pending, setLanguage, t } = useI18n()

  return (
    <label className="lang">
      <span className="visually-hidden">{t.nav.language}</span>
      <select
        className="lang__select"
        value={pending ?? language}
        aria-busy={pending !== null}
        onChange={(event) => setLanguage(event.target.value as Language)}
      >
        {LANGUAGES.map((option) => (
          <option key={option.id} value={option.id} lang={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
