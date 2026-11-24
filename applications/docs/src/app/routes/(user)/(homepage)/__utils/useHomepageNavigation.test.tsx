import { act, renderHook } from '@testing-library/react'
import { createBrowserHistory } from 'history'
import type { ReactNode } from 'react'
import { Router } from 'react-router-dom'

import { useHomepageNavigation } from './useHomepageNavigation'

// As the app's history: under the user's `/u/N`.
function renderNavigation(path: string) {
  window.history.replaceState(null, '', `/u/2${path}`)
  const history = createBrowserHistory({ basename: '/u/2' })
  const { result } = renderHook(useHomepageNavigation, {
    wrapper: ({ children }: { children: ReactNode }) => <Router history={history}>{children}</Router>,
  })
  return { result, history }
}

describe('useHomepageNavigation', () => {
  test('reads the view and the query parameters from the address', () => {
    const { result } = renderNavigation('/trash?sort=name&other=1&q=plan')

    expect(result.current.route).toEqual({ view: 'trash', params: { sort: 'name', other: '1', q: 'plan' } })
  })

  test('gives addresses under the basename', () => {
    const { result } = renderNavigation('/recents')

    expect(result.current.getHref({ view: 'recents', params: { q: 'a b', type: 'document' } })).toBe(
      '/u/2/recents?q=a+b&type=document',
    )
    expect(result.current.getHref({ view: 'trash', params: {} })).toBe('/u/2/trash')
  })

  test('pushes or replaces a history entry, and follows back and forward', async () => {
    const { result, history } = renderNavigation('/recents')
    const { navigate } = result.current

    act(() => navigate({ view: 'trash', params: {} }))
    act(() => navigate({ view: 'trash', params: { sort: 'name' } }, { replace: true }))

    expect(window.location.pathname + window.location.search).toBe('/u/2/trash?sort=name')
    expect(result.current.route).toEqual({ view: 'trash', params: { sort: 'name' } })
    expect(result.current.navigate).toBe(navigate)

    act(() => history.goBack())
    // happy-dom's back is asynchronous, as browsers': wait for its popstate.
    await vi.waitFor(() => expect(result.current.route).toEqual({ view: 'recents', params: {} }))
  })
})
