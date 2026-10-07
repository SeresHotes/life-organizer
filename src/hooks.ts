import { useEffect, useState, useSyncExternalStore } from 'react'
import { dayKey, useStore } from './store'

/** Current logical day key; re-renders when the day rolls over. */
export function useToday() {
  const dayStartHour = useStore((s) => s.dayStartHour)
  const [today, setToday] = useState(() => dayKey(dayStartHour))
  useEffect(() => {
    const tick = () => setToday(dayKey(dayStartHour))
    tick()
    const t = setInterval(tick, 30_000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [dayStartHour])
  return today
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
