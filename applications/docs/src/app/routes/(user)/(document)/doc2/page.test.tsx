import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { CompatRouter, Link, Route, Routes, useLocation } from 'react-router-dom-v5-compat'

import { ConfigContext } from '@proton/app-context/configContext'
import AuthenticationContext from '@proton/components/containers/authentication/authenticationContext'
import type { DriveCompat } from '@proton/drive-store/lib/useDriveCompat'
import { getDrive } from '@proton/drive/sdk'
import type { ProtonConfig } from '@proton/shared/lib/interfaces/config'
import { PROTON_DOCS_DOCUMENT_MIMETYPE } from '@proton/shared/lib/helpers/mimetype'

import { ApplicationProvider, type ApplicationProviderProps } from '~/utils/application-context'
import { DocsUrlContextProvider } from '~/utils/docs-url-bar'
import { EDITOR_FRAME_READY_TIMEOUT_MS } from './__components/DocumentViewerV2'
import DocumentPageV2 from './page'

let mockIsDriveCompatSDK = false
jest.mock('~/utils/flags', () => ({
  useIsSheetsEnabled: () => true,
  useDriveCompatSDK: () => mockIsDriveCompatSDK,
  useIsDarkThemeEnabled: () => false,
}))
jest.mock('@proton/account/userSettings/hooks', () => ({ useGetUserSettings: () => async () => ({}) }))
jest.mock('@proton/account/user/hooks', () => ({ useUser: () => [{ DisplayName: '', Name: 'member', Email: '' }] }))
// The app shell and its headers need the whole app around them
jest.mock('./__components/DocumentShell', () => ({
  DocumentShell: ({ header, children }: { header: ReactNode; children: ReactNode }) => (
    <>
      {header}
      {children}
    </>
  ),
}))
jest.mock('./__components/ErrorHeader', () => ({ ErrorHeader: () => <div>Error header</div> }))
// A fixed version for the page's log line; the rest of the SDK, such as DocsApiError, stays real.
jest.mock('@proton-docs/realtime-sdk', () => ({ ...jest.requireActual('@proton-docs/realtime-sdk'), version: '0.0.0' }))
const mockCreateSession = jest.fn()
const mockClient = { createSession: mockCreateSession }
jest.mock('./__utils/useRealtimeClient', () => ({ useRealtimeClient: () => mockClient }))
jest.mock('@proton/app-context/useNotifications', () => ({
  useNotifications: () => ({ createNotification: jest.fn() }),
}))
jest.mock('@proton/drive/sdk', () => ({
  ...jest.requireActual('@proton/drive/sdk'),
  getDrive: jest.fn(),
}))

const ORIGIN = 'https://docs.proton.dev'

const driveCompat = { getMyFilesNodeMeta: jest.fn(), createDocumentNode: jest.fn() }
const getNode = jest.fn()
const getNodeHierarchy = jest.fn(async () => [])
const getMyFilesRootFolder = jest.fn()

describe('DocumentPageV2', () => {
  const originalLocation = window.location
  const assign = jest.fn()

  beforeEach(() => {
    mockIsDriveCompatSDK = false
    jest.mocked(getDrive).mockReturnValue({
      getNode,
      getNodeHierarchy,
      getMyFilesRootFolder,
    } as unknown as ReturnType<typeof getDrive>)
    getNode.mockResolvedValue({ mediaType: PROTON_DOCS_DOCUMENT_MIMETYPE })
    mockCreateSession.mockReturnValue(pendingSession(() => new Promise(() => {})))
    driveCompat.getMyFilesNodeMeta.mockResolvedValue({ volumeId: 'MY_VOLUME', linkId: 'MY_FILES' })
    driveCompat.createDocumentNode.mockResolvedValue({ volumeId: 'MY_VOLUME', linkId: 'NEW_DOC' })
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
  })

  afterAll(() => {
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true })
  })

  test('a bare /doc2 creates a document', async () => {
    renderAt('/doc2')

    expect(screen.getByText('Creating new document...')).toBeInTheDocument()
    await waitFor(() => expect(currentUrl()).toBe('/doc2?mode=open&volumeId=MY_VOLUME&linkId=NEW_DOC'))
  })

  test('an unsupported mode shows its error and a way home', async () => {
    renderAt('/doc2?mode=history&volumeId=VOLUME&linkId=LINK')

    expect(screen.getByTestId('invalid-openaction-error')).toHaveTextContent('This link is not supported on this page.')
    expect(screen.getByText('Error header')).toBeInTheDocument()

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

  describe('creating a document', () => {
    test('/new2 creates a document in My files, then opens it on /doc2', async () => {
      renderAt('/new2')

      await waitFor(() => expect(currentUrl()).toBe('/doc2?mode=open&volumeId=MY_VOLUME&linkId=NEW_DOC'))
      expect(driveCompat.createDocumentNode).toHaveBeenCalledWith(
        { volumeId: 'MY_VOLUME', linkId: 'MY_FILES' },
        expect.stringMatching(/^Untitled document /),
        'doc',
      )
      expect(mockCreateSession).toHaveBeenCalledWith({
        documentType: 'doc',
        nodeMeta: { volumeId: 'MY_VOLUME', linkId: 'NEW_DOC' },
        // The page runs on a dev host.
        commitDuLimit: 50,
      })
    })

    test('mode create creates the document in its parent folder', async () => {
      renderAt('/doc2?mode=create&volumeId=VOLUME&parentLinkId=PARENT')

      await waitFor(() => expect(currentUrl()).toBe('/doc2?mode=open&volumeId=MY_VOLUME&linkId=NEW_DOC'))
      expect(driveCompat.getMyFilesNodeMeta).not.toHaveBeenCalled()
      expect(driveCompat.createDocumentNode).toHaveBeenCalledWith(
        { volumeId: 'VOLUME', linkId: 'PARENT' },
        expect.any(String),
        'doc',
      )
    })

    test('with the Drive SDK flag on, still creates through Drive compat', async () => {
      mockIsDriveCompatSDK = true

      renderAt('/new2')

      await waitFor(() => expect(currentUrl()).toBe('/doc2?mode=open&volumeId=MY_VOLUME&linkId=NEW_DOC'))
      expect(driveCompat.createDocumentNode).toHaveBeenCalledWith(
        { volumeId: 'MY_VOLUME', linkId: 'MY_FILES' },
        expect.any(String),
        'doc',
      )
      expect(getMyFilesRootFolder).not.toHaveBeenCalled()
    })

    test('leaving the page during creation leaves the new page URL alone', async () => {
      let resolve: (node: { volumeId: string; linkId: string }) => void = () => {}
      const created = new Promise((resolveCreated) => (resolve = resolveCreated))
      driveCompat.createDocumentNode.mockReturnValue(created)
      renderAt('/new2')
      await waitFor(() => expect(driveCompat.createDocumentNode).toHaveBeenCalled())

      await userEvent.click(screen.getByRole('link', { name: 'Leave' }))
      await act(async () => {
        resolve({ volumeId: 'MY_VOLUME', linkId: 'NEW_DOC' })
        await new Promise((settled) => setTimeout(settled, 0))
      })

      expect(currentUrl()).toBe('/recents')
      expect(screen.getByText('Recents page')).toBeInTheDocument()
      expect(mockCreateSession).not.toHaveBeenCalled()
    })

    test('a creation failure shows the error page, and retry creates the document', async () => {
      driveCompat.createDocumentNode.mockRejectedValueOnce(new Error('Creation failed'))
      renderAt('/new2')

      expect(await screen.findByTestId('invalid-openaction-error')).toHaveTextContent(
        'The document could not be created.',
      )

      await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

      await waitFor(() => expect(currentUrl()).toBe('/doc2?mode=open&volumeId=MY_VOLUME&linkId=NEW_DOC'))
      expect(driveCompat.createDocumentNode).toHaveBeenCalledTimes(2)
    })
  })

  describe('opening a document', () => {
    test('a bootstrap failure shows the error page, and retry bootstraps again', async () => {
      mockCreateSession.mockReturnValueOnce(pendingSession(() => Promise.reject(new Error('Bootstrap failed'))))
      renderAt('/doc2?mode=open&volumeId=VOLUME&linkId=LINK')

      expect(await screen.findByTestId('document-load-error')).toHaveTextContent('Something went wrong')
      expect(screen.getByText('Error header')).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: 'Reload' }))

      await waitFor(() => expect(mockCreateSession).toHaveBeenCalledTimes(2))
      expect(screen.queryByTestId('document-load-error')).not.toBeInTheDocument()
    })

    test('a base state with an unreadable update shows the error page, and retry bootstraps again', async () => {
      let onUnreadable: (event: { uuid: string; origin: string }) => void = () => {}
      mockCreateSession.mockReturnValueOnce({
        on: jest.fn((_event, listener) => {
          onUnreadable = listener
          return jest.fn()
        }),
        bootstrap: async () => {
          onUnreadable({ uuid: 'update-1', origin: 'baseState' })
          return { disconnect: jest.fn(async () => {}) }
        },
      })
      renderAt('/doc2?mode=open&volumeId=VOLUME&linkId=LINK')

      expect(await screen.findByTestId('invalid-openaction-error')).toHaveTextContent(
        "Some of the document's content could not be read.",
      )

      await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

      await waitFor(() => expect(mockCreateSession).toHaveBeenCalledTimes(2))
      expect(screen.queryByTestId('invalid-openaction-error')).not.toBeInTheDocument()
    })

    test('an editor that never gets ready shows the error page, and retry loads the document again', async () => {
      jest.useFakeTimers()
      renderAt('/doc2?mode=open&volumeId=VOLUME&linkId=LINK')
      await waitFor(() => expect(mockCreateSession).toHaveBeenCalledTimes(1))

      act(() => jest.advanceTimersByTime(EDITOR_FRAME_READY_TIMEOUT_MS))

      expect(screen.getByTestId('invalid-openaction-error')).toHaveTextContent('The editor could not be loaded.')

      fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

      expect(screen.queryByTestId('invalid-openaction-error')).not.toBeInTheDocument()
      await waitFor(() => expect(mockCreateSession).toHaveBeenCalledTimes(2))
    })

    test('a node that is not a text document shows the unsupported error, with no retry', async () => {
      getNode.mockResolvedValue({ mediaType: 'application/pdf' })
      renderAt('/doc2?mode=open&volumeId=VOLUME&linkId=LINK')

      expect(await screen.findByTestId('invalid-openaction-error')).toHaveTextContent(
        'This link is not supported on this page.',
      )
      expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
      expect(mockCreateSession).not.toHaveBeenCalled()
    })
  })

  function pendingSession(bootstrap: () => Promise<unknown>) {
    return { on: jest.fn(() => jest.fn()), bootstrap }
  }

  function currentUrl() {
    return screen.getByTestId('location').textContent
  }

  function renderAt(path: string, hash = '') {
    const href = `${ORIGIN}${path}${hash}`
    const { pathname, host, hostname, protocol, port } = new URL(href)
    Object.defineProperty(window, 'location', {
      value: { href, origin: ORIGIN, pathname, hash, host, hostname, protocol, port, assign },
      writable: true,
    })
    const application = {
      logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    } as unknown as ApplicationProviderProps['application']
    const page = <DocumentPageV2 driveCompat={driveCompat as unknown as DriveCompat} />

    render(
      <ConfigContext.Provider value={{ APP_VERSION: '0.0.0' } as ProtonConfig}>
        <AuthenticationContext.Provider value={{ getLocalID: () => 1 } as any}>
          <ApplicationProvider application={application}>
            <MemoryRouter initialEntries={[path]}>
              <CompatRouter>
                <DocsUrlContextProvider>
                  <LocationDisplay />
                  <Link to="/recents">Leave</Link>
                  <Routes>
                    <Route path="/doc2" element={page} />
                    <Route path="/new2" element={page} />
                    <Route path="/u/1/doc2" element={page} />
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
        </AuthenticationContext.Provider>
      </ConfigContext.Provider>,
    )
  }
})

function LocationDisplay() {
  const { pathname, search } = useLocation()
  return <div data-testid="location">{`${pathname}${search}`}</div>
}
