import { useCallback, useMemo } from 'react'
import { matchPath, useHistory, useLocation } from 'react-router'

import { formatHomepageParams, parseHomepageParams, type HomepageNavigation, type HomepageRoute } from '~/homepage'
import { HOMEPAGE_RECENTS_PATH, HOMEPAGE_TRASH_PATH } from '../../__utils/homepage-paths'

function toLocation({ view, params }: HomepageRoute) {
  const search = formatHomepageParams(params)
  return { pathname: view === 'trash' ? HOMEPAGE_TRASH_PATH : HOMEPAGE_RECENTS_PATH, search: search && `?${search}` }
}

/** The homepage's navigation on the app's router: its paths, its history, and the `/u/N` basename in addresses. */
export function useHomepageNavigation(): HomepageNavigation {
  const history = useHistory()
  const { pathname, search } = useLocation()
  const route = useMemo(
    (): HomepageRoute => ({
      view: matchPath(pathname, HOMEPAGE_TRASH_PATH) ? 'trash' : 'recents',
      params: parseHomepageParams(search),
    }),
    [pathname, search],
  )
  const navigate = useCallback<HomepageNavigation['navigate']>(
    (to, { replace = false } = {}) => (replace ? history.replace(toLocation(to)) : history.push(toLocation(to))),
    [history],
  )
  const getHref = useCallback<HomepageNavigation['getHref']>((to) => history.createHref(toLocation(to)), [history])
  return { route, navigate, getHref }
}
