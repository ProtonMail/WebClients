import { createContext, useContext, useMemo, type ReactNode } from 'react'

export type HomepageView = 'recents' | 'trash'

/**
 * The address's query parameters: the homepage's own, whose values the module checks, and any other, which it keeps
 * as they are.
 */
export type HomepageRouteParams = { q?: string; sort?: string; type?: string; [name: string]: string | undefined }

export type HomepageRoute = { view: HomepageView; params: HomepageRouteParams }

/**
 * Where the homepage is, and how it moves. The host owns the paths and the history: the module only knows its views
 * and their query parameters.
 */
export type HomepageNavigation = {
  /** The current route. The host updates it whenever its address changes, back and forward included. */
  route: HomepageRoute
  /** Goes to `to`, in a new history entry unless `replace` is set. Keep it the same function across renders. */
  navigate: (to: HomepageRoute, options?: { replace?: boolean }) => void
  /** The address of `to`, for links. Keep it the same function across renders. */
  getHref: (to: HomepageRoute) => string
}

/** The parameters of a query string, in its order. A repeated parameter keeps its first value. */
export function parseHomepageParams(search: string): HomepageRouteParams {
  const params: HomepageRouteParams = {}
  for (const [name, value] of new URLSearchParams(search)) {
    params[name] ??= value
  }
  return params
}

/** The query string of `params`, without its `?`, and empty without any. */
export function formatHomepageParams(params: HomepageRouteParams): string {
  const search = new URLSearchParams()
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined) {
      search.set(name, value)
    }
  }
  return search.toString()
}

const HomepageNavigationContext = createContext<HomepageNavigation | undefined>(undefined)

export type HomepageNavigationProviderProps = { navigation: HomepageNavigation; children: ReactNode }

export function HomepageNavigationProvider({
  navigation: { route, navigate, getHref },
  children,
}: HomepageNavigationProviderProps) {
  // The host can pass a new object on every render: only its fields' identities matter.
  const value = useMemo(() => ({ route, navigate, getHref }), [route, navigate, getHref])
  return <HomepageNavigationContext.Provider value={value}>{children}</HomepageNavigationContext.Provider>
}

export function useHomepageRoute() {
  const value = useContext(HomepageNavigationContext)
  if (!value) {
    throw new Error('Missing HomepageNavigationProvider')
  }
  return value
}
