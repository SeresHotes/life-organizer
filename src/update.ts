import { registerSW } from 'virtual:pwa-register'

// autoUpdate: as soon as a new service worker is installed it takes over and the page reloads
registerSW({ immediate: true })

export type UpdateResult = 'updating' | 'latest' | 'error'

/** Asks the server for a newer version; if there is one, the page reloads into it. */
export async function checkForUpdate(): Promise<UpdateResult> {
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (!reg) {
      location.reload()
      return 'updating'
    }
    await reg.update()
    if (reg.installing || reg.waiting) {
      // fallback in case the automatic reload doesn't happen
      setTimeout(() => location.reload(), 8000)
      return 'updating'
    }
    return 'latest'
  } catch {
    return 'error'
  }
}

/** Last resort: drop the service worker and caches and load everything from the network. */
export async function hardReload() {
  const regs = (await navigator.serviceWorker?.getRegistrations()) ?? []
  await Promise.all(regs.map((r) => r.unregister()))
  if ('caches' in window) await Promise.all((await caches.keys()).map((k) => caches.delete(k)))
  location.reload()
}
