import type * as ReactModule from 'react'
import type { MockInstance } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { CompatRouter, Route, Routes } from 'react-router-dom-v5-compat'

import { ConfigContext } from '@proton/app-context/configContext'
import AuthenticationContext from '@proton/components/containers/authentication/authenticationContext'
import type { DriveCompat } from '@proton/drive-store/lib/useDriveCompat'
import { MemberRole, getDrive } from '@proton/drive/sdk'
import { setLocation } from '@proton/vitest-config/setLocation'
import { PROTON_DOCS_DOCUMENT_MIMETYPE } from '@proton/shared/lib/helpers/mimetype'
import type { ProtonConfig } from '@proton/shared/lib/interfaces/config'

import { ApplicationProvider, type ApplicationProviderProps } from '~/utils/application-context'
import { DocsUrlContextProvider } from '~/utils/docs-url-bar'
import type { ClientHandler } from './__utils/createClientHandler'
import { createFakeSession } from './__utils/createFakeSession'
import DocumentPageV2 from './page'

// mode=history through the page and the viewer, on a fake session and a fake Drive: the page's address bar and the
// viewer's Reveal Point. The viewer's own tests cover the history itself; the page's mocked-viewer tests, a retry.
vi.mock('~/utils/flags', () => ({
  useIsSheetsEnabled: () => false,
  useDriveCompatSDK: () => false,
  useIsDarkThemeEnabled: () => false,
  useIsODTEnabled: () => false,
}))
vi.mock('@proton/unleash/useFlag', () => ({ useFlag: () => false }))
vi.mock('@proton/unleash/useGetFlag', () => ({ useGetFlag: () => () => false }))
vi.mock('~/drive-sdk/event-subscriber', () => ({
  getEventSubscriber: () => ({ initialize: async () => {}, reset: () => {} }),
}))
vi.mock('@proton/account/userSettings/hooks', () => ({ useGetUserSettings: () => async () => ({}) }))
vi.mock('@proton/account/user/hooks', () => ({ useUser: () => [{ DisplayName: '', Name: 'member', Email: '' }] }))
vi.mock('@proton/app-context/useApi', () => ({ useApi: () => vi.fn(async () => ({})) }))
vi.mock('@proton/drive/public/moveItemsModal', () => ({
  useMoveItemsModal: () => ({ moveItemsModal: null, showMoveItemsModal: vi.fn() }),
}))
// The app shell and its headers need the whole app around them
vi.mock('./__components/DocumentShell', () => ({
  DocumentShell: ({
    header,
    children,
    loadingScreen,
  }: {
    header: ReactNode
    children?: ReactNode
    loadingScreen?: ReactNode
  }) => (
    <>
      {header}
      {children}
      {loadingScreen}
    </>
  ),
}))
vi.mock('./__components/ErrorHeader', () => ({ ErrorHeader: () => <div>Error header</div> }))
vi.mock('./__components/DocumentHeaderV2', () => ({ DocumentHeaderV2: () => <div>Document header</div> }))
vi.mock('./__components/BootstrapErrorPage', () => ({
  BootstrapErrorPage: ({ onRetry }: { onRetry: () => void }) => <button onClick={onRetry}>Reload</button>,
}))
vi.mock('@proton-docs/realtime-sdk', async () => ({
  ...(await vi.importActual('@proton-docs/realtime-sdk')),
  version: '0.0.0',
}))
const mockCreateSession = vi.fn()
const mockClient = { createSession: mockCreateSession, prefetchBootstrap: () => ({ confirm: () => {}, end: () => {} }) }
vi.mock('./__utils/useRealtimeClient', () => ({ useRealtimeClient: () => mockClient }))
vi.mock('@proton/app-context/useNotifications', () => ({
  useNotifications: () => ({ createNotification: vi.fn(), hideNotification: vi.fn() }),
}))
vi.mock('@proton/drive/sdk', async () => ({
  ...(await vi.importActual('@proton/drive/sdk')),
  getDrive: vi.fn(),
}))

// The editors in their frames: the live one, and the history's revision view
let mockClientHandler: ClientHandler | undefined
const mockShowEditor = vi.fn(async () => {})
vi.mock('./__utils/ClientEditorBridge', () => ({
  ClientEditorBridge: vi.fn().mockImplementation(function (frame: HTMLIFrameElement, clientHandler: ClientHandler) {
    const editorInvoker = {
      initializeEditor: vi.fn(async () => {}),
      receiveMessage: vi.fn(async () => {}),
      showEditor: mockShowEditor,
      changeLockedState: vi.fn(async () => {}),
      setDarkMode: vi.fn(async () => {}),
      loadUserSettings: vi.fn(async () => {}),
      syncProperty: vi.fn(async () => {}),
      setTableOfContentsVisible: vi.fn(async () => {}),
      getClientId: vi.fn(async () => 7),
      broadcastPresenceState: vi.fn(async () => {}),
      getCurrentEditorState: vi.fn(async () => ({ root: { children: [], type: 'root' } })),
      getDocumentState: vi.fn(async () => new Uint8Array()),
      replaceEditorState: vi.fn(async () => {}),
    }
    if (frame.dataset.systemMode !== 'revision') {
      mockClientHandler = clientHandler
    }
    return { editorInvoker, destroy: vi.fn() }
  }),
}))
vi.mock('~/components/document/EditorFrame', async () => {
  const { useEffect } = await vi.importActual<typeof ReactModule>('react')
  return {
    EditorFrame: ({
      onFrameReady,
      systemMode,
    }: {
      onFrameReady: (frame: HTMLIFrameElement) => void
      systemMode: string
    }) => {
      useEffect(() => {
        const frame = document.createElement('iframe')
        frame.dataset.systemMode = systemMode
        void onFrameReady(frame)
      }, [onFrameReady, systemMode])
      return null
    },
  }
})

const ORIGIN = 'https://docs.proton.dev'
const getNodeHierarchy = vi.fn()

describe('DocumentPageV2 with mode history', () => {
  let replaceState: MockInstance

  beforeEach(() => {
    replaceState = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {})
    vi.mocked(getDrive).mockReturnValue({ getNodeHierarchy } as unknown as ReturnType<typeof getDrive>)
  })

  afterEach(() => {
    mockClientHandler = undefined
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  test.each(['Admin', 'Editor', 'Viewer'] as const)(
    'opens the document as %s, then its history once, at the Reveal Point, and the address bar opens it',
    async (role) => {
      readsAs(role)
      const fake = createFakeSession()
      mockCreateSession.mockReturnValue(fake.session)
      renderAt('/doc2?mode=history&volumeId=VOLUME&linkId=LINK')

      expect(addressBar()).toBe('/doc2?mode=open&volumeId=VOLUME&linkId=LINK')
      await reveal(fake)

      await waitFor(() => expect(screen.getByTestId('history-modal')).toBeInTheDocument())
      expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument()
      expect(mockCreateSession).toHaveBeenCalledTimes(1)
      expect(mockCreateSession).toHaveBeenCalledWith(
        expect.objectContaining({ nodeMeta: { volumeId: 'VOLUME', linkId: 'LINK' } }),
      )
      expect(fake.mocks.getHistory).toHaveBeenCalledTimes(1)
    },
  )

  test('does not open the history before the Reveal Point', async () => {
    readsAs('Editor')
    const fake = createFakeSession()
    mockCreateSession.mockReturnValue(fake.session)
    renderAt('/doc2?mode=history&volumeId=VOLUME&linkId=LINK')
    await waitFor(() => expect(fake.mocks.connect).toHaveBeenCalled())

    act(() => fake.setSnapshot({ status: { name: 'connected' }, caughtUp: true }))
    await waitFor(() => expect(mockShowEditor).toHaveBeenCalled())
    await act(async () => {})

    expect(screen.getByTestId('loading-screen')).toBeInTheDocument()
    expect(screen.queryByTestId('history-modal')).not.toBeInTheDocument()
    expect(fake.mocks.getHistory).not.toHaveBeenCalled()
  })

  test('a retry before the Reveal Point still opens the history, once, on the document it opens', async () => {
    readsAs('Editor')
    const fake = createFakeSession()
    mockCreateSession
      .mockReturnValueOnce({ on: vi.fn(() => vi.fn()), bootstrap: () => Promise.reject(new Error('Failed')) })
      .mockReturnValue(fake.session)
    renderAt('/doc2?mode=history&volumeId=VOLUME&linkId=LINK')

    await userEvent.click(await screen.findByRole('button', { name: 'Reload' }))
    await reveal(fake)

    await waitFor(() => expect(screen.getByTestId('history-modal')).toBeInTheDocument())
    expect(mockCreateSession).toHaveBeenCalledTimes(2)
    expect(fake.mocks.getHistory).toHaveBeenCalledTimes(1)
  })

  test('mode open does not open the history', async () => {
    readsAs('Editor')
    const fake = createFakeSession()
    mockCreateSession.mockReturnValue(fake.session)
    renderAt('/doc2?mode=open&volumeId=VOLUME&linkId=LINK')

    await reveal(fake)

    expect(screen.queryByTestId('history-modal')).not.toBeInTheDocument()
    expect(fake.mocks.getHistory).not.toHaveBeenCalled()
    expect(replaceState).not.toHaveBeenCalled()
  })

  /** Drive reads the document, the last item of its hierarchy, with `role` */
  function readsAs(role: 'Admin' | 'Editor' | 'Viewer') {
    getNodeHierarchy.mockImplementation(async (uid: string) => [
      { uid: 'ROOT', directRole: MemberRole.Inherited },
      { uid, name: 'Plans', mediaType: PROTON_DOCS_DOCUMENT_MIMETYPE, directRole: MemberRole[role] },
    ])
  }

  /** The session catches up, the editor shows the document, and its frame sizes: the Reveal Point */
  async function reveal(fake: ReturnType<typeof createFakeSession>) {
    await waitFor(() => expect(fake.mocks.connect).toHaveBeenCalled())
    act(() => fake.setSnapshot({ status: { name: 'connected' }, caughtUp: true }))
    await waitFor(() => expect(mockShowEditor).toHaveBeenCalled())
    await act(async () => mockClientHandler!.updateFrameSize(480))
    await waitFor(() => expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument())
  }

  function addressBar() {
    const url = new URL(replaceState.mock.lastCall![2] as string)
    return url.pathname + url.search
  }

  function renderAt(path: string) {
    setLocation(`${ORIGIN}${path}`)
    const application = {
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    } as unknown as ApplicationProviderProps['application']
    render(
      <ConfigContext.Provider value={{ APP_VERSION: '0.0.0', API_URL: `${ORIGIN}/api` } as ProtonConfig}>
        <AuthenticationContext.Provider value={{ getLocalID: () => 1, UID: 'session-uid' } as any}>
          <ApplicationProvider application={application}>
            <MemoryRouter initialEntries={[path]}>
              <CompatRouter>
                <DocsUrlContextProvider>
                  <Routes>
                    <Route path="/doc2" element={<DocumentPageV2 driveCompat={{} as DriveCompat} />} />
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
