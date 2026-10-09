import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { CompatRouter } from 'react-router-dom-v5-compat'

import AuthenticationContext from '@proton/components/containers/authentication/authenticationContext'
import type { DocumentAction } from '@proton/docs-shared'

import { DocsUrlContextProvider, useDocsUrlBar } from './docs-url-bar'

jest.mock('./flags', () => ({ useIsSheetsEnabled: () => true }))

const ORIGIN = 'https://docs.proton.dev'

describe('navigateToAction', () => {
  const originalLocation = window.location
  const assign = jest.fn()

  beforeEach(() => {
    assign.mockClear()
  })

  afterAll(() => {
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true })
  })

  describe('back to the public context', () => {
    it.each([
      { type: 'doc', expectedPathname: '/doc' },
      { type: 'document', expectedPathname: '/doc' },
      { type: 'sheet', expectedPathname: '/sheet' },
      { type: 'spreadsheet', expectedPathname: '/sheet' },
    ] as const)('opens a $type at $expectedPathname', ({ type, expectedPathname }) => {
      const url = navigate('/u/1/doc?mode=open-url-reauth&token=TOKEN&linkId=LINK', {
        type,
        mode: 'open-url',
        token: 'TOKEN',
        linkId: 'LINK',
        urlPassword: '#urlPassword',
      })

      expect(url.origin).toBe(ORIGIN)
      expect(url.pathname).toBe(expectedPathname)
      expect(url.searchParams.get('mode')).toBe('open-url')
      expect(url.searchParams.get('token')).toBe('TOKEN')
      expect(url.searchParams.get('linkId')).toBe('LINK')
      expect(url.hash).toBe('#urlPassword')
    })
  })

  it('keeps the current path for a private action', () => {
    const url = navigate(
      '/u/1/sheet?mode=open-url-reauth&token=TOKEN',
      { type: 'sheet', mode: 'open', volumeId: 'VOLUME', linkId: 'LINK' },
      'private',
    )

    expect(url.pathname).toBe('/u/1/sheet')
  })

  function navigate(path: string, action: DocumentAction, context: 'private' | 'public' = 'public') {
    const href = `${ORIGIN}${path}`
    const { pathname } = new URL(href)
    Object.defineProperty(window, 'location', { value: { href, origin: ORIGIN, pathname, assign }, writable: true })

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthenticationContext.Provider value={{ getLocalID: () => 1 } as any}>
        <MemoryRouter initialEntries={[path]}>
          <CompatRouter>
            <DocsUrlContextProvider>{children}</DocsUrlContextProvider>
          </CompatRouter>
        </MemoryRouter>
      </AuthenticationContext.Provider>
    )
    const { result } = renderHook(() => useDocsUrlBar(), { wrapper })

    result.current.navigateToAction(action, context)

    return new URL(assign.mock.lastCall[0])
  }
})
