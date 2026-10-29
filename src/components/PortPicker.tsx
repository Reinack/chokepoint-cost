import { useEffect, useId, useMemo, useState, type KeyboardEvent } from 'react'
import { PORTS, PORT_BY_ID, type PortRegion } from '../data/ports'
import { useI18n } from '../i18n'

interface Props {
  label: string
  value: string
  regions: PortRegion[]
  onChange: (id: string) => void
}

/** Folds case and accents, so "sao" finds "São" and "goteborg" finds "Göteborg". */
const fold = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/**
 * A searchable port field (ARIA combobox with a grouped listbox). It matches the
 * port's name, its country code, the country's name in the current language
 * and the region, so "Países Bajos", "NL" and "Rotterdam" all find Rotterdam.
 */
export function PortPicker({ label, value, regions, onChange }: Props) {
  const { t, language } = useI18n()
  const id = useId()
  // null while the list is closed; the text typed so far while it is open.
  const [query, setQuery] = useState<string | null>(null)
  const [active, setActive] = useState(0)
  const open = query !== null
  const selected = PORT_BY_ID.get(value)!

  const countryName = useMemo(() => {
    const names = new Intl.DisplayNames([language], { type: 'region' })
    return (code: string) => names.of(code) ?? code
  }, [language])

  const groups = useMemo(() => {
    const needle = fold(query ?? '').trim()
    return regions
      .map((region) => ({
        region,
        ports: PORTS.filter((port) => port.region === region)
          .filter(
            (port) =>
              !needle ||
              fold(`${port.name} ${port.country} ${countryName(port.country)} ${t.region[region]}`).includes(needle),
          )
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .filter((group) => group.ports.length > 0)
  }, [query, regions, countryName, t])

  const options = groups.flatMap((group) => group.ports)
  const optionId = (portId: string) => `${id}-${portId}`

  useEffect(() => {
    if (!open || !options[active]) return
    document.getElementById(optionId(options[active].id))?.scrollIntoView({ block: 'nearest' })
    // optionId only depends on the stable `id`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active, options])

  const choose = (portId: string) => {
    onChange(portId)
    setQuery(null)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        setQuery('')
        setActive(0)
        return
      }
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive((current) => Math.min(Math.max(current + step, 0), options.length - 1))
    } else if (event.key === 'Enter' && open) {
      event.preventDefault()
      if (options[active]) choose(options[active].id)
    } else if (event.key === 'Escape' && open) {
      event.preventDefault()
      setQuery(null)
    }
  }

  return (
    <div className="field combo">
      <label htmlFor={`${id}-input`}>{label}</label>
      <input
        id={`${id}-input`}
        className="combo__input"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={open && options[active] ? optionId(options[active].id) : undefined}
        autoComplete="off"
        spellCheck={false}
        placeholder={t.form.search}
        value={open ? query : `${selected.name} · ${selected.country}`}
        onFocus={() => {
          setQuery('')
          setActive(0)
        }}
        onBlur={() => setQuery(null)}
        onChange={(event) => {
          setQuery(event.target.value)
          setActive(0)
        }}
        onKeyDown={onKeyDown}
      />
      {open && (
        <div className="combo__popup">
          {options.length === 0 ? (
            <p className="combo__empty" role="status">
              {t.form.noResults}
            </p>
          ) : (
            <div id={`${id}-list`} role="listbox" aria-label={label} className="combo__list">
              {groups.map((group) => (
                <div key={group.region} role="group" aria-labelledby={`${id}-${group.region}`}>
                  <div id={`${id}-${group.region}`} className="combo__group">
                    {t.region[group.region]}
                  </div>
                  {group.ports.map((port) => {
                    const index = options.indexOf(port)
                    return (
                      <div
                        key={port.id}
                        id={optionId(port.id)}
                        role="option"
                        aria-selected={port.id === value}
                        className={`combo__option${index === active ? ' combo__option--active' : ''}`}
                        // Keep focus in the input, so blur does not close the list before the click lands.
                        onMouseDown={(event) => event.preventDefault()}
                        onMouseEnter={() => setActive(index)}
                        onClick={() => choose(port.id)}
                      >
                        <span>{port.name}</span>
                        <span className="combo__country">{countryName(port.country)}</span>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
