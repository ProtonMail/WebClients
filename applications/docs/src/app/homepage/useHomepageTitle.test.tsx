import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'

import { HomepageViewContext, type HomepageViewState, type HomepageViewValue } from './homepageViewContext'
import { useHomepageTitle } from './useHomepageTitle'

function titleIn(state: HomepageViewState) {
  const value = { state } as unknown as HomepageViewValue
  const { result } = renderHook(() => useHomepageTitle(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <HomepageViewContext.Provider value={value}>{children}</HomepageViewContext.Provider>
    ),
  })
  return result.current
}

describe('useHomepageTitle', () => {
  test('names the view, and the query while searching', () => {
    expect(titleIn({ view: 'recents-loading' })).toBe('Recents')
    expect(titleIn({ view: 'trash-empty' })).toBe('Trash')
    expect(titleIn({ view: 'search-initial', query: 'plans' })).toBe('Searching "plans"')
    expect(titleIn({ view: 'unknown' })).toBe('')
  })
})
