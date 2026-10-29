import { useEffect, useState } from 'react'

/**
 * Tracks a CSS media query from JavaScript, for layout that markup must know
 * about.
 *
 * Listens to `resize` as well as the query's own `change` event. The two should
 * be equivalent, but a `change` that never arrives leaves the component
 * rendering the wrong layout for the viewport it is actually in — which is
 * exactly what happened here on a desktop resize. Re-reading a boolean is
 * cheap, and React drops the render when the value has not moved.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  )

  useEffect(() => {
    const list = window.matchMedia(query)
    const sync = () => setMatches(list.matches)

    sync()
    list.addEventListener('change', sync)
    window.addEventListener('resize', sync)
    window.addEventListener('orientationchange', sync)
    return () => {
      list.removeEventListener('change', sync)
      window.removeEventListener('resize', sync)
      window.removeEventListener('orientationchange', sync)
    }
  }, [query])

  return matches
}

/**
 * Below this the control panel is taller than the screen, so its long sections
 * collapse and the map is reachable without scrolling past every chokepoint.
 */
export const COMPACT_QUERY = '(max-width: 900px)'
