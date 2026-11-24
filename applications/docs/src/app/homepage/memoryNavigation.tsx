import { useSyncExternalStore, type ReactNode } from 'react'

import {
  formatHomepageParams,
  HomepageNavigationProvider,
  parseHomepageParams,
  type HomepageNavigation,
  type HomepageRoute,
} from './homepageNavigation'

/**
 * For tests: the homepage's navigation on an in-memory history, with the Docs app's paths (`/recents`, `/trash`).
 * Wrap what's tested in its `NavigationProvider`, or pass `useNavigation()` as `HomepageDependencies.navigation`.
 */
export function createMemoryNavigation(path = '/recents') {
  const toPath = ({ view, params }: HomepageRoute) => {
    const search = formatHomepageParams(params)
    return `/${view}${search && `?${search}`}`
  }
  const toEntry = (path: string) => {
    const [pathname, search = ''] = path.split('?')
    const route: HomepageRoute = {
      view: pathname === '/trash' ? 'trash' : 'recents',
      params: parseHomepageParams(search),
    }
    return { path, route }
  }

  let entries = [toEntry(path)]
  let index = 0
  const listeners = new Set<() => void>()
  const notify = () => listeners.forEach((listener) => listener())
  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }
  const getRoute = () => entries[index].route

  const navigate: HomepageNavigation['navigate'] = (to, { replace = false } = {}) => {
    const entry = toEntry(toPath(to))
    if (replace) {
      entries[index] = entry
    } else {
      entries = [...entries.slice(0, index + 1), entry]
      index += 1
    }
    notify()
  }
  const go = (delta: number) => {
    index = Math.min(Math.max(index + delta, 0), entries.length - 1)
    notify()
  }

  function useNavigation(): HomepageNavigation {
    return { route: useSyncExternalStore(subscribe, getRoute), navigate, getHref: toPath }
  }

  function NavigationProvider({ children }: { children: ReactNode }) {
    return <HomepageNavigationProvider navigation={useNavigation()}>{children}</HomepageNavigationProvider>
  }

  return {
    NavigationProvider,
    useNavigation,
    /** The current address, such as `/recents?q=plan`. */
    getLocation: () => entries[index].path,
    /** Every address in the history, oldest first. */
    getEntries: () => entries.map((entry) => entry.path),
    navigate,
    back: () => go(-1),
    forward: () => go(1),
  }
}
