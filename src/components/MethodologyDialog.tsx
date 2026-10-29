import { useEffect, useRef } from 'react'
import { useI18n } from '../i18n'

export function MethodologyDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="modal" role="presentation" onClick={onClose}>
      <div
        className="modal__card"
        role="dialog"
        aria-modal="true"
        aria-label={t.about.title}
        onClick={(event) => event.stopPropagation()}
      >
        <h2>{t.about.title}</h2>
        <p>{t.about.routing}</p>
        <p>{t.about.limits}</p>
        <p>{t.about.cost}</p>
        <p className="modal__caveat">{t.about.caveat}</p>
        <button ref={closeRef} type="button" className="button" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  )
}
