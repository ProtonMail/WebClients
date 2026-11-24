import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import type * as ReactModule from 'react'
import { MemoryRouter } from 'react-router-dom'
import { CompatRouter } from 'react-router-dom-v5-compat'
import type { MockInstance } from 'vitest'

import { ConfigContext } from '@proton/app-context/configContext'
import AuthenticationContext from '@proton/components/containers/authentication/authenticationContext'
import { type ProtonDrivePublicLinkClient, generateNodeUid } from '@proton/drive/sdk'
import { SHARE_URL_PERMISSIONS } from '@proton/shared/lib/drive/permissions'
import { PROTON_DOCS_DOCUMENT_MIMETYPE } from '@proton/shared/lib/helpers/mimetype'
import type { ProtonConfig } from '@proton/shared/lib/interfaces/config'
import { setLocation } from '@proton/vitest-config/setLocation'

import { ApplicationProvider, type ApplicationProviderProps } from '~/utils/application-context'
import { DocsUrlContextProvider } from '~/utils/docs-url-bar'
import type { ClientHandler } from './__utils/createClientHandler'
import { createFakePublicSession } from './__utils/createFakeSession'
import type { PublicLinkHandoff } from './__utils/publicLink'
import PublicDocumentPageV2 from './publicPage'

let mockPublicEditing = false
vi.mock('./__utils/flags', () => ({ usePublicEditingEnabled: () => mockPublicEditing }))
vi.mock('~/utils/flags', () => ({
  useIsSheetsEnabled: () => true,
  useIsDarkThemeEnabled: () => false,
}))
vi.mock('@proton/shared/lib/helpers/location')
vi.mock('@proton/unleash/useGetFlag', () => ({ useGetFlag: () => () => false }))
vi.mock('@proton/app-context/useNotifications', () => ({
  useNotifications: () => ({ createNotification: vi.fn(), hideNotification: vi.fn() }),
}))
vi.mock('./__components/DocumentShell', () => ({
  DocumentShell: ({ header, children, loadingScreen }: Record<string, ReactNode>) => (
    <>
      {header}
      {children}
      {loadingScreen}
    </>
  ),
}))
vi.mock('./__components/ErrorHeader', () => ({ ErrorHeader: () => null }))
vi.mock('./__components/DocumentHeaderV2', () => ({ DocumentHeaderV2: () => <div>Document header</div> }))
// It has its own tests; here, only which failure it gets and that Try again opens the document again
vi.mock('./__components/BootstrapErrorPage', () => ({
  BootstrapErrorPage: ({ failure, onRetry }: { failure: string; onRetry: () => void }) => (
    <div>
      {`Bootstrap failed: ${failure}`}
      <button onClick={onRetry}>Try again</button>
    </div>
  ),
}))
const mockCreateSession = vi.fn()
vi.mock('./__utils/usePublicRealtimeClient', () => ({
  usePublicRealtimeClient: () => ({ createSession: mockCreateSession }),
}))
const mockExportAndDownload = vi.fn(async (..._args: unknown[]) => {})
vi.mock('./__utils/downloadExport', () => ({
  exportAndDownload: (...args: unknown[]) => mockExportAndDownload(...args),
}))
vi.mock('~/components/document/EditorFrame', async () => {
  const { useEffect } = await vi.importActual<typeof ReactModule>('react')
  return {
    EditorFrame: ({ onFrameReady }: { onFrameReady: (frame: HTMLIFrameElement) => void }) => {
      useEffect(() => onFrameReady(document.createElement('iframe')), [onFrameReady])
      return null
    },
  }
})
let mockClientHandler: ClientHandler | undefined
vi.mock('./__utils/ClientEditorBridge', () => ({
  ClientEditorBridge: vi.fn().mockImplementation(function (_frame: HTMLIFrameElement, clientHandler: ClientHandler) {
    mockClientHandler = clientHandler
    const answer = vi.fn(async () => {})
    return {
      editorInvoker: {
        initializeEditor: answer,
        receiveMessage: answer,
        showEditor: answer,
        changeLockedState: answer,
        setDarkMode: answer,
        loadUserSettings: answer,
        syncProperty: answer,
        setTableOfContentsVisible: answer,
        getClientId: vi.fn(async () => 7),
        broadcastPresenceState: answer,
      },
      destroy: vi.fn(),
    }
  }),
}))

const ORIGIN = 'https://docs.proton.dev'
const DOWNLOAD_URL = '/doc2?mode=open-url-download&token=TOKEN&linkId=LINK'

const getPublicNode = vi.fn()

describe("PublicDocumentPageV2 with Drive's Download of a public link", () => {
  let replaceState: MockInstance

  beforeEach(() => {
    mockPublicEditing = false
    mockClientHandler = undefined
    getPublicNode.mockResolvedValue({
      uid: generateNodeUid('VOLUME', 'LINK'),
      name: 'Plans',
      mediaType: PROTON_DOCS_DOCUMENT_MIMETYPE,
    })
    replaceState = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  test.each([
    { visitor: 'an anonymous viewer', publicEditing: false, user: undefined },
    { visitor: 'a signed-in editor', publicEditing: true, user: { DisplayName: 'Alice', Email: 'alice@example.com' } },
  ])(
    'for $visitor, saves the docx once the editor shows the document, then the address opens the public link',
    async ({ publicEditing, user }) => {
      mockPublicEditing = publicEditing
      const fake = start({ user })

      if (publicEditing) {
        await waitFor(() => expect(fake.mocks.connect).toHaveBeenCalled())
        act(() => fake.setSnapshot({ status: { name: 'connected' }, caughtUp: true }))
      }
      await waitFor(() => expect(mockClientHandler).toBeDefined())
      expect(mockExportAndDownload).not.toHaveBeenCalled()

      await reveal()

      await waitFor(() => expect(replaceState).toHaveBeenCalled())
      expect(mockExportAndDownload).toHaveBeenCalledTimes(1)
      expect(mockExportAndDownload).toHaveBeenCalledWith(expect.anything(), 'Plans', 'docx')
      const address = new URL(replaceState.mock.lastCall![2] as string)
      expect(`${address.pathname}${address.search}${address.hash}`).toBe(
        '/doc2?mode=open-url&token=TOKEN&linkId=LINK#urlPassword',
      )
    },
  )

  test('a failed save leaves the address, so a reload downloads again, and logs the failure', async () => {
    const error = new Error('Editor did not answer exportData')
    mockExportAndDownload.mockRejectedValueOnce(error)
    start()

    await waitFor(() => expect(mockClientHandler).toBeDefined())
    await reveal()

    await waitFor(() => expect(logError).toHaveBeenCalledWith('Failed to download the document', error))
    expect(mockExportAndDownload).toHaveBeenCalledTimes(1)
    expect(replaceState).not.toHaveBeenCalled()
  })

  test('a retry after a failed open downloads once', async () => {
    getPublicNode.mockRejectedValueOnce(new Error('Network error'))
    start()

    await userEvent.click(await screen.findByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(mockClientHandler).toBeDefined())
    await reveal()

    await waitFor(() => expect(replaceState).toHaveBeenCalled())
    expect(mockExportAndDownload).toHaveBeenCalledTimes(1)
  })

  test('a public link opened without the download saves nothing and keeps the address', async () => {
    start({ path: '/doc2?mode=open-url&token=TOKEN&linkId=LINK' })

    await waitFor(() => expect(mockClientHandler).toBeDefined())
    await reveal()

    expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument()
    expect(mockExportAndDownload).not.toHaveBeenCalled()
    expect(replaceState).not.toHaveBeenCalled()
  })

  /** The editor shows the document, its Lexical editor rendered: the Reveal Point */
  async function reveal() {
    await act(async () => mockClientHandler!.updateFrameSize(480))
    await waitFor(() => expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument())
  }
})

const logError = vi.fn()

function start(options: { path?: string; user?: object } = {}) {
  const { path = DOWNLOAD_URL, user } = options
  const fake = createFakePublicSession({}, { userOwnAddress: user ? 'alice@example.com' : undefined })
  mockCreateSession.mockReturnValue(fake.session)
  setLocation(`${ORIGIN}${path}#urlPassword`)
  const application = {
    logger: { info: vi.fn(), warn: vi.fn(), error: logError, debug: vi.fn() },
  } as unknown as ApplicationProviderProps['application']
  const handoff = {
    publicDrive: {
      getNode: getPublicNode,
      experimental: { getSessionInfo: () => ({ uid: 'PUBLIC_UID' }) },
    } as unknown as ProtonDrivePublicLinkClient,
    linkInfo: {
      linkId: 'LINK',
      volumeId: 'VOLUME',
      permissions: user ? SHARE_URL_PERMISSIONS.EDITOR : SHARE_URL_PERMISSIONS.VIEWER,
      isSharedUrlAFolder: false,
      hasDirectAccess: false,
    },
    user,
    providerType: user ? 'public-authenticated' : 'public-unauthenticated',
  } as PublicLinkHandoff

  render(
    <ConfigContext.Provider value={{ APP_VERSION: '0.0.0', API_URL: `${ORIGIN}/api` } as ProtonConfig}>
      <AuthenticationContext.Provider value={{ getLocalID: () => undefined } as any}>
        <ApplicationProvider application={application}>
          <MemoryRouter initialEntries={[path]}>
            <CompatRouter>
              <DocsUrlContextProvider>
                <PublicDocumentPageV2 {...handoff} />
              </DocsUrlContextProvider>
            </CompatRouter>
          </MemoryRouter>
        </ApplicationProvider>
      </AuthenticationContext.Provider>
    </ConfigContext.Provider>,
  )
  return fake
}
