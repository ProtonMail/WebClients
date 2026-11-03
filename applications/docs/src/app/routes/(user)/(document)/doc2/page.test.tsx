import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { CompatRouter, Link, Route, Routes } from 'react-router-dom-v5-compat'

import AuthenticationContext from '@proton/components/containers/authentication/authenticationContext'

import { ApplicationProvider, type ApplicationProviderProps } from '~/utils/application-context'
import { DocsUrlContextProvider } from '~/utils/docs-url-bar'
import DocumentPageV2 from './page'

jest.mock('~/utils/flags', () => ({ useIsSheetsEnabled: () => true }))
// The SDK ships ES modules only, which jest does not transform.
jest.mock('@proton-docs/realtime-sdk', () => ({ version: '0.0.0' }))

const ORIGIN = 'https://docs.proton.dev'

describe('DocumentPageV2', () => {
  const originalLocation = window.location
  const assign = jest.fn()

  beforeEach(() => {
    assign.mockClear()
  })

  afterAll(() => {
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true })
  })

  test('a bare URL shows the loader', () => {
    renderAt('/doc2')

    expect(screen.queryByTestId('invalid-openaction-error')).not.toBeInTheDocument()
  })

  test('an unsupported mode shows its error and a way home', async () => {
    renderAt('/doc2?mode=history&volumeId=VOLUME&linkId=LINK')

    expect(screen.getByTestId('invalid-openaction-error')).toHaveTextContent('This link is not supported on this page.')

    await userEvent.click(screen.getByRole('button', { name: 'Go to Docs home' }))

    expect(screen.getByText('Recents page')).toBeInTheDocument()
  })

  test('open without a linkId shows the invalid URL message', () => {
    renderAt('/doc2?mode=open&volumeId=VOLUME')

    expect(screen.getByTestId('invalid-openaction-error')).toHaveTextContent('No document supplied in URL.')
  })

  test('a URL truncated by Slack shows the Slack message', () => {
    renderAt('/doc2?mode=open&volumeId=VOLU[%E2%80%A6]')

    expect(screen.getByTestId('invalid-openaction-error')).toHaveTextContent('copied from Slack incorrectly')
  })

  test('resolves the URL it is on, not the one the app loaded', async () => {
    renderAt('/recents')

    await userEvent.click(screen.getByRole('link', { name: 'Open history' }))

    expect(screen.getByTestId('invalid-openaction-error')).toHaveTextContent('This link is not supported on this page.')
  })

  test('open-url-reauth goes back to the public document', () => {
    renderAt('/u/1/doc2?mode=open-url-reauth&token=TOKEN&linkId=LINK', '#urlPassword')

    const url = new URL(assign.mock.lastCall[0])
    expect(url.pathname).toBe('/doc')
    expect(url.searchParams.get('mode')).toBe('open-url')
    expect(url.searchParams.get('token')).toBe('TOKEN')
    expect(url.searchParams.get('linkId')).toBe('LINK')
    expect(url.hash).toBe('#urlPassword')
  })

  function renderAt(path: string, hash = '') {
    const href = `${ORIGIN}${path}${hash}`
    const { pathname } = new URL(href)
    Object.defineProperty(window, 'location', {
      value: { href, origin: ORIGIN, pathname, hash, assign },
      writable: true,
    })
    const application = { logger: { info: jest.fn() } } as unknown as ApplicationProviderProps['application']

    render(
      <AuthenticationContext.Provider value={{ getLocalID: () => 1 } as any}>
        <ApplicationProvider application={application}>
          <MemoryRouter initialEntries={[path]}>
            <CompatRouter>
              <DocsUrlContextProvider>
                <Routes>
                  <Route path="/doc2" element={<DocumentPageV2 />} />
                  <Route path="/u/1/doc2" element={<DocumentPageV2 />} />
                  <Route
                    path="/recents"
                    element={
                      <>
                        Recents page
                        <Link to="/doc2?mode=history&volumeId=VOLUME&linkId=LINK">Open history</Link>
                      </>
                    }
                  />
                </Routes>
              </DocsUrlContextProvider>
            </CompatRouter>
          </MemoryRouter>
        </ApplicationProvider>
      </AuthenticationContext.Provider>,
    )
  }
})
