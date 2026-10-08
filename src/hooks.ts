import { useEffect, useState, useSyncExternalStore } from 'react'
import { isRoutineDone, useStore, type Routine } from './store'

/** Current time, refreshed every 30 seconds and when the app comes back to the foreground. */
export function useNow() {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const tick = () => setNow(Date.now())
    const t = setInterval(tick, 30_000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])
  return now
}

/** Predicate "routine is done right now" that re-renders as time passes. */
export function useRoutineDone() {
  const now = useNow()
  const dayStartHour = useStore((s) => s.dayStartHour)
  return { now, dayStartHour, isDone: (r: Routine) => isRoutineDone(r, now, dayStartHour) }
}

const subscribeHash = (cb: () => void) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

/** Hash route split into segments: "#/project/abc" -> ["project", "abc"]. */
export function useRoute() {
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash)
  return hash.replace(/^#\/?/, '').split('/').filter(Boolean)
}

export const navigate = (path: string) => {
  window.location.hash = '/' + path
}

/** Whether a CSS media query matches, updated live. */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const m = matchMedia(query)
      m.addEventListener('change', cb)
      return () => m.removeEventListener('change', cb)
    },
    () => matchMedia(query).matches,
  )
}

/** Wide screens show all main-screen lists side by side; narrow ones use an accordion. */
export const WIDE = '(min-width: 900px)'
