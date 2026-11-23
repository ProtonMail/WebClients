import type * as ReactModule from 'react'
import type * as UseDocumentFileActions from '../__utils/useDocumentFileActions'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ConfigContext } from '@proton/app-context/configContext'
import { BroadcastSource } from '@proton/docs-shared/Bridge/BroadcastSource'
import type { FileMenuAction } from '@proton/docs-shared/Bridge/EditorRequiresClientMethods'
import type { RtsMessagePayload } from '@proton/docs-shared/Doc/RtsMessagePayload'
import type { DriveCompat } from '@proton/drive-store/lib/useDriveCompat'
import { MemberRole, getDrive } from '@proton/drive/sdk'
import { getNewWindow } from '@proton/shared/lib/helpers/window'
import { PROTON_DOCS_DOCUMENT_MIMETYPE } from '@proton/shared/lib/helpers/mimetype'
import type { ProtonConfig } from '@proton/shared/lib/interfaces/config'
import { DocsApiError, SeedError, decodeAwarenessUpdate, encodeAwarenessUpdate } from '@proton-docs/realtime-sdk'
import type { HistoryEntry, Participant, RecoveryCondition, SessionStatus } from '@proton-docs/realtime-sdk'
import { type ReactNode, StrictMode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { CompatRouter } from 'react-router-dom-v5-compat'
import * as Y from 'yjs'

import { ApplicationProvider, type ApplicationProviderProps } from '~/utils/application-context'
import { DebugModeProvider } from '~/utils/debug-mode-context'

import { ClientEditorBridge } from '../__utils/ClientEditorBridge'
import type { ClientHandler } from '../__utils/createClientHandler'
import { createFakeSession } from '../__utils/createFakeSession'
import type { DocumentRole } from '../__utils/getDocumentRole'
import { DocsLoadMark } from '../__utils/loadMarks'
import { docsLoadMarks, withNodePerformance } from '../__utils/loadMarksTesting'
import type { DocumentDebugMenuProps } from './DocumentDebugMenu'
import { DocumentViewerV2 } from './DocumentViewerV2'

const mockRealtimeClient = {
  seedInitialCommit: vi.fn(),
  createSession: vi.fn(),
  prefetchBootstrap: () => ({ confirm: () => {}, end: () => {} }),
}
vi.mock('../__utils/useRealtimeClient', () => ({ useRealtimeClient: () => mockRealtimeClient }))
vi.mock('@proton/drive/sdk', async () => ({
  ...(await vi.importActual('@proton/drive/sdk')),
  getDrive: vi.fn(),
}))
const mockGetNodeHierarchy = vi.fn()
const mockGetAvailableName = vi.fn(async (_parentUid: string, name: string) => name)
vi.mock('@proton/components/hooks/useAuthentication', () => ({
  default: () => ({ UID: 'session-uid', getLocalID: () => 3 }),
}))
vi.mock('@proton/shared/lib/helpers/window', () => ({ getNewWindow: vi.fn() }))
vi.mock('@proton/shared/lib/docs/utils/getPlatformFriendlyDateForFileName', () => ({
  getPlatformFriendlyDateForFileName: () => '2026-11-10 09.00.00',
}))
vi.mock('@proton/drive/public/moveItemsModal', () => ({
  useMoveItemsModal: () => ({ moveItemsModal: null, showMoveItemsModal: vi.fn() }),
}))
const mockIsFlagEnabled = () => false
vi.mock('@proton/unleash/useGetFlag', () => ({ useGetFlag: () => mockIsFlagEnabled }))
/** The toasts shown, in order: each has its text, which may hold a button */
type MockNotification = { type?: string; text: ReactNode; expiration?: number }
const mockNotifications: MockNotification[] = []
const mockCreateNotification = vi.fn((notification: MockNotification) => mockNotifications.push(notification))
const mockHideNotification = vi.fn()
vi.mock('@proton/app-context/useNotifications', () => ({
  useNotifications: () => ({ createNotification: mockCreateNotification, hideNotification: mockHideNotification }),
}))

let mockIsODTEnabled = false
vi.mock('~/utils/flags', () => ({
  useIsDarkThemeEnabled: () => false,
  useIsODTEnabled: () => mockIsODTEnabled,
  useIsSheetsEnabled: () => false,
}))
vi.mock('@proton/unleash/useFlag', () => ({ useFlag: () => false }))
vi.mock('~/drive-sdk/event-subscriber', () => ({
  getEventSubscriber: () => ({ initialize: async () => {}, reset: () => {} }),
}))
vi.mock('@proton/account/userSettings/hooks', () => ({ useGetUserSettings: () => async () => ({ Locale: 'fr_FR' }) }))
vi.mock('@proton/account/user/hooks', () => ({
  useUser: () => [{ DisplayName: 'Alice', Name: 'alice', Email: 'alice@example.com' }],
}))
// The app shell and the header need the whole app around them; the header has its own tests
vi.mock('./DocumentShell', () => ({
  DocumentShell: ({
    header,
    children,
    loadingScreen,
  }: {
    header: ReactNode
    children: ReactNode
    loadingScreen?: ReactNode
  }) => (
    <>
      <div data-testid="shell-header">{header}</div>
      {children}
      {loadingScreen}
    </>
  ),
}))
vi.mock('./ErrorHeader', () => ({ ErrorHeader: () => null }))
// The file actions have their own tests; here, that the viewer feeds them and routes the file menu to them. The
// history's Make a copy runs the real ones, on the fake seeding client and the fake Drive
let mockRealFileActions = false
const mockFileActions = {
  trashState: 'not_trashed',
  isCreatingSpreadsheet: false,
  isMakingACopy: false,
  newDocument: vi.fn(),
  newSpreadsheet: vi.fn(),
  makeACopy: vi.fn(),
  makeACopyOfRevision: vi.fn(async (_state: Uint8Array<ArrayBuffer>) => {}),
  moveToFolder: vi.fn(),
  moveToTrash: vi.fn(),
  openProtonDrive: vi.fn(),
  modals: <div>File action modals</div>,
}
const mockUseDocumentFileActions = vi.fn(
  (_options: unknown): Omit<typeof mockFileActions, 'trashState'> & { trashState: string } => mockFileActions,
)
vi.mock('../__utils/useDocumentFileActions', async () => {
  const actual = await vi.importActual<typeof UseDocumentFileActions>('../__utils/useDocumentFileActions')
  return {
    useDocumentFileActions: (options: unknown) =>
      mockRealFileActions
        ? actual.useDocumentFileActions(options as Parameters<typeof actual.useDocumentFileActions>[0])
        : mockUseDocumentFileActions(options),
  }
})
const mockCreateDocumentNode = vi.fn()
const mockGetMyFilesNodeMeta = vi.fn()
const DRIVE_COMPAT = {
  name: 'driveCompat',
  createDocumentNode: mockCreateDocumentNode,
  getMyFilesNodeMeta: mockGetMyFilesNodeMeta,
} as unknown as DriveCompat
const mockApi = vi.fn(async (_request: unknown): Promise<unknown> => ({}))
vi.mock('@proton/app-context/useApi', () => ({ useApi: () => mockApi }))
vi.mock('./DocumentHeaderV2', () => ({
  DocumentHeaderV2: ({
    node,
    role,
    editorInvoker,
    exportInvoker,
    status,
    onFileMenuAction,
  }: {
    node: { uid: string }
    role: string
    editorInvoker?: object
    exportInvoker?: object
    status?: ReactNode
    onFileMenuAction: (action: FileMenuAction) => void
  }) => (
    <div>
      {`Header for ${node.uid} as ${role}, ${editorInvoker ? 'with' : 'without'} the editor`}
      <span data-testid="header-exports">{exportInvoker ? 'exports enabled' : 'exports disabled'}</span>
      {/* The title menu's item, which its own tests show disabled until the editor shows the document */}
      <button onClick={() => onFileMenuAction({ type: 'see-version-history' })}>See version history</button>
      {status}
    </div>
  ),
}))
// Each has its own tests; here, what the viewer asks of them
const mockExportAndDownload = vi.fn(async (..._args: unknown[]) => {})
vi.mock('../__utils/downloadExport', () => ({
  exportAndDownload: (...args: unknown[]) => mockExportAndDownload(...args),
}))
const mockDownloadJSONFile = vi.fn()
vi.mock('~/utils/download-json-file', () => ({
  downloadJSONFile: (...args: unknown[]) => mockDownloadJSONFile(...args),
}))
const mockDownloadFile = vi.fn()
vi.mock('@proton/shared/lib/helpers/downloadFile', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockDownloadFile(...args),
}))
const mockFetchExternalImageAsBase64 = vi.fn(async (..._args: unknown[]) => 'data:image/png;base64,iVBORw0K')
vi.mock('../__utils/fetchExternalImageAsBase64', () => ({
  fetchExternalImageAsBase64: (...args: unknown[]) => mockFetchExternalImageAsBase64(...args),
}))

// It has its own tests; here, that debug mode gates it and what the viewer gives it
let mockDebugMenuProps: DocumentDebugMenuProps | undefined
vi.mock('./DocumentDebugMenu', () => ({
  DocumentDebugMenu: (props: DocumentDebugMenuProps) => {
    mockDebugMenuProps = props
    return <div>Debug menu</div>
  },
}))

vi.mock('./OpenActionError', () => ({
  OpenActionError: ({ reason, onRetry }: { reason: string; onRetry?: () => void }) => (
    <div>
      {`Open failed: ${reason}`}
      {onRetry && <button onClick={onRetry}>Try again</button>}
    </div>
  ),
}))
// It has its own tests; here, only which failure it gets and that Reload opens the document again
vi.mock('./BootstrapErrorPage', () => ({
  BootstrapErrorPage: ({ failure, onRetry }: { failure: string; onRetry: () => void }) => (
    <div>
      {`Bootstrap failed: ${failure}`}
      <button onClick={onRetry}>Try again</button>
    </div>
  ),
}))

const mockEditorCalls: string[] = []
const mockChangeLockedState = vi.fn(async (_locked: boolean) => {})
const mockDestroyBridge = vi.fn()
const mockLoadUserSettings = vi.fn(async () => {})
const mockPrintAsPDF = vi.fn(async () => {})
/** The live editor's state, as a restore reads it and Undo gives it back */
const LIVE_EDITOR_STATE = { root: { children: [{ type: 'paragraph' }], type: 'root' } }
const mockLiveGetCurrentEditorState = vi.fn(async (): Promise<object | undefined> => LIVE_EDITOR_STATE)
const mockReplaceEditorState = vi.fn(async (_state: unknown) => {})
const EDITOR_CLIENT_ID = 7
const mockReceiveMessage = vi.fn(async ({ content }: RtsMessagePayload) => {
  mockEditorCalls.push(`receiveMessage:${content[0]}`)
})
let mockClientHandler: ClientHandler
/** While set, a revision view's frame waits here to be ready, as a frame still loading does */
let mockHeldRevisionFrames: (() => void)[] | undefined
/** The history's revision view: what it was sent, and its editor's exports */
const mockRevisionCalls: string[] = []
const mockRevisionStates: Uint8Array<ArrayBuffer>[] = []
const REVISION_EDITOR_STATE = { root: { children: [], type: 'root' } }
const REVISION_YJS_STATE = new Uint8Array([9, 9])
const mockRevisionInvoker = {
  initializeEditor: vi.fn(async (..._args: unknown[]) => {
    mockRevisionCalls.push('initializeEditor')
  }),
  receiveMessage: vi.fn(async ({ type, content }: RtsMessagePayload) => {
    mockRevisionCalls.push(`receiveMessage:${type.wrapper}`)
    if (type.wrapper === 'du') {
      mockRevisionStates.push(content)
    }
  }),
  showEditor: vi.fn(async () => {
    mockRevisionCalls.push('showEditor')
  }),
  setDarkMode: vi.fn(async () => {}),
  getCurrentEditorState: vi.fn(async () => REVISION_EDITOR_STATE),
  getDocumentState: vi.fn(async () => REVISION_YJS_STATE),
}
vi.mock('../__utils/ClientEditorBridge', () => ({
  ClientEditorBridge: vi.fn().mockImplementation(function (frame: HTMLIFrameElement, clientHandler: ClientHandler) {
    if (frame.dataset.systemMode === 'revision') {
      return { editorInvoker: mockRevisionInvoker, destroy: vi.fn() }
    }
    mockClientHandler = clientHandler
    return {
      editorInvoker: {
        initializeEditor: vi.fn(async () => {
          mockEditorCalls.push('initializeEditor')
        }),
        receiveMessage: mockReceiveMessage,
        showEditor: vi.fn(async () => {
          mockEditorCalls.push('showEditor')
        }),
        changeLockedState: mockChangeLockedState,
        setDarkMode: vi.fn(async () => {}),
        loadUserSettings: mockLoadUserSettings,
        syncProperty: vi.fn(async (property: string) => {
          mockEditorCalls.push(`syncProperty:${property}`)
        }),
        setTableOfContentsVisible: vi.fn(async () => {}),
        getClientId: vi.fn(async () => EDITOR_CLIENT_ID),
        broadcastPresenceState: vi.fn(async () => {
          mockEditorCalls.push('broadcastPresenceState')
        }),
        printAsPDF: mockPrintAsPDF,
        getCurrentEditorState: mockLiveGetCurrentEditorState,
        replaceEditorState: mockReplaceEditorState,
      },
      destroy: mockDestroyBridge,
    }
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
        if (systemMode === 'revision' && mockHeldRevisionFrames) {
          mockHeldRevisionFrames.push(() => onFrameReady(frame))
          return
        }
        void onFrameReady(frame)
      }, [onFrameReady, systemMode])
      return null
    },
  }
})

const BASE_UPDATE = 1
const REPLAYED_UPDATE = 2

function createSession() {
  const fake = createFakeSession()
  fake.mocks.getBaseState.mockReturnValue({ commitId: undefined, updates: [update(BASE_UPDATE)] })
  return fake
}

function update(firstByte: number) {
  return {
    content: new Uint8Array([firstByte]),
    authorAddress: 'author@example.com',
    timestamp: 0,
    signature: new Uint8Array(),
    aad: '',
  }
}

/** `count` users, one client each, the user's own first */
function users(count: number): Participant[] {
  return Array.from({ length: count }, (_, user) => ({
    id: user,
    isSelf: user === 0,
    state: { name: `user ${user}`, anchorPos: null, focusPos: null, awarenessData: { userId: `user-${user}` } },
    lastSeenAt: 0,
  }))
}

const ROLES = { Admin: MemberRole.Admin, Editor: MemberRole.Editor, Viewer: MemberRole.Viewer }

/** The document's hierarchy as Drive reads it, the document last */
function hierarchy(role: DocumentRole, node: object = {}) {
  return [
    { uid: 'ROOT', directRole: MemberRole.Inherited },
    {
      uid: 'VOLUME~LINK',
      name: 'Plans',
      mediaType: PROTON_DOCS_DOCUMENT_MIMETYPE,
      directRole: ROLES[role],
      ...node,
    },
  ]
}

function renderViewer(
  fake: ReturnType<typeof createFakeSession>,
  {
    role = 'Viewer',
    onRetry = vi.fn(),
    readHierarchy = async () => hierarchy(role),
    downloadOnOpen,
    onDownloadedOnOpen,
    historyOnOpen,
    onHistoryOpenedOnOpen,
    strict = false,
  }: {
    role?: DocumentRole
    onRetry?: () => void
    /** How Drive answers the node read */
    readHierarchy?: () => Promise<unknown>
    downloadOnOpen?: boolean
    onDownloadedOnOpen?: () => void
    historyOnOpen?: boolean
    onHistoryOpenedOnOpen?: () => void
    strict?: boolean
  } = {},
) {
  vi.mocked(getDrive).mockReturnValue({
    getNodeHierarchy: mockGetNodeHierarchy,
    getAvailableName: mockGetAvailableName,
  } as unknown as ReturnType<typeof getDrive>)
  mockGetNodeHierarchy.mockImplementation(readHierarchy)
  mockRealtimeClient.createSession.mockReturnValue(fake.session)
  const application = {
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  } as unknown as ApplicationProviderProps['application']
  const viewer = () => {
    const page = (
      <MemoryRouter>
        <CompatRouter>
          <ConfigContext.Provider
            value={{ APP_VERSION: '0.0.0', API_URL: 'https://docs.proton.dev/api' } as ProtonConfig}
          >
            <ApplicationProvider application={application}>
              <DebugModeProvider>
                <DocumentViewerV2
                  nodeMeta={{ volumeId: 'VOLUME', linkId: 'LINK' }}
                  driveCompat={DRIVE_COMPAT}
                  onRetry={onRetry}
                  downloadOnOpen={downloadOnOpen}
                  onDownloadedOnOpen={onDownloadedOnOpen}
                  historyOnOpen={historyOnOpen}
                  onHistoryOpenedOnOpen={onHistoryOpenedOnOpen}
                />
              </DebugModeProvider>
            </ApplicationProvider>
          </ConfigContext.Provider>
        </CompatRouter>
      </MemoryRouter>
    )
    return strict ? <StrictMode>{page}</StrictMode> : page
  }

  const rendered = render(viewer())
  return { ...rendered, rerender: () => rendered.rerender(viewer()), logger: application.logger }
}

/** Renders a viewer whose editor shows the document, its Lexical editor rendered */
async function renderShown(fake: ReturnType<typeof createFakeSession>, options?: Parameters<typeof renderViewer>[1]) {
  const rendered = renderViewer(fake, options)
  await waitFor(() => expect(fake.mocks.connect).toHaveBeenCalled())
  act(() => fake.setSnapshot({ status: { name: 'connected' }, caughtUp: true }))
  await waitFor(() => expect(mockEditorCalls).toContain('showEditor'))
  await act(async () => mockClientHandler.updateFrameSize(480))
  return rendered
}

/** Renders a viewer, and waits for the Reveal Point */
async function renderRevealed(
  fake: ReturnType<typeof createFakeSession>,
  options?: Parameters<typeof renderViewer>[1],
) {
  const rendered = await renderShown(fake, options)
  await waitFor(() => expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument())
  return rendered
}

describe('DocumentViewerV2', () => {
  afterEach(() => {
    mockEditorCalls.length = 0
    vi.clearAllMocks()
  })

  test('connects once the editor holds the base state, and initializes and shows the editor only once the session catches up', async () => {
    const fake = createSession()
    renderViewer(fake)
    await waitFor(() => expect(fake.mocks.connect).toHaveBeenCalled())

    act(() => {
      fake.setSnapshot({ status: { name: 'connected' } })
      fake.emit('update', update(REPLAYED_UPDATE))
    })
    await act(async () => {})

    const beforeCatchUp = [`receiveMessage:${BASE_UPDATE}`, `receiveMessage:${REPLAYED_UPDATE}`]
    expect(mockEditorCalls).toEqual(beforeCatchUp)

    act(() => fake.setSnapshot({ caughtUp: true }))

    await waitFor(() =>
      expect(mockEditorCalls).toEqual([
        ...beforeCatchUp,
        'syncProperty:suggestionsEnabled',
        'syncProperty:userName',
        'initializeEditor',
        'showEditor',
        'broadcastPresenceState',
      ]),
    )
  })

  describe('load marks', () => {
    const performanceSpy = withNodePerformance()

    test('marks the frame ready, the base state sent, then caught up, once each: a rebootstrap that catches up again marks nothing', async () => {
      const fake = createSession()
      renderViewer(fake)
      await waitFor(() => expect(fake.mocks.connect).toHaveBeenCalled())

      expect(docsLoadMarks()).toEqual([
        DocsLoadMark.FrameReady,
        DocsLoadMark.DocumentLoaded,
        DocsLoadMark.BaseStateSent,
      ])

      act(() => fake.setSnapshot({ status: { name: 'connected' }, caughtUp: true }))
      await waitFor(() => expect(mockEditorCalls).toContain('showEditor'))
      const marks = performance.getEntriesByType('mark')

      expect(docsLoadMarks()).toEqual([
        DocsLoadMark.FrameReady,
        DocsLoadMark.DocumentLoaded,
        DocsLoadMark.BaseStateSent,
        DocsLoadMark.CaughtUp,
        DocsLoadMark.EditorShown,
      ])

      act(() => fake.setSnapshot({ status: { name: 'opening' }, caughtUp: false }))
      act(() => fake.setSnapshot({ status: { name: 'connected' }, caughtUp: true }))
      await act(async () => {})

      expect(performance.getEntriesByType('mark')).toEqual(marks)
    })

    test("places an editor's marks in their order: frame ready, base state sent, caught up, editor shown, then editable", async () => {
      const fake = createSession()
      await renderShown(fake, { role: 'Editor' })

      await waitFor(() =>
        expect(docsLoadMarks()).toEqual([
          DocsLoadMark.FrameReady,
          DocsLoadMark.DocumentLoaded,
          DocsLoadMark.BaseStateSent,
          DocsLoadMark.CaughtUp,
          DocsLoadMark.EditorShown,
          DocsLoadMark.EditorEditable,
          DocsLoadMark.Revealed,
        ]),
      )
      expect(mockChangeLockedState).toHaveBeenLastCalledWith(false)
    })

    test('marks no editable editor for a viewer, whose editor stays locked', async () => {
      await renderShown(createSession(), { role: 'Viewer' })
      await act(async () => {})

      expect(mockChangeLockedState).toHaveBeenLastCalledWith(true)
      expect(docsLoadMarks()).not.toContain(DocsLoadMark.EditorEditable)
      expect(docsLoadMarks()).toContain(DocsLoadMark.EditorShown)
    })

    test('marks the editor shown once it answers showEditor, and editable only once its Lexical editor is rendered', async () => {
      const fake = createSession()
      let answerShowEditor = () => {}
      renderViewer(fake, { role: 'Editor' })
      await waitFor(() => expect(fake.mocks.connect).toHaveBeenCalled())
      const { editorInvoker } = vi.mocked(ClientEditorBridge).mock.results.at(-1)!.value
      editorInvoker.showEditor.mockImplementationOnce(
        () => new Promise<void>((resolve) => (answerShowEditor = resolve)),
      )

      act(() => fake.setSnapshot({ status: { name: 'connected' }, caughtUp: true }))
      await waitFor(() => expect(editorInvoker.showEditor).toHaveBeenCalled())

      expect(docsLoadMarks()).not.toContain(DocsLoadMark.EditorShown)
      expect(docsLoadMarks()).not.toContain(DocsLoadMark.EditorEditable)

      await act(async () => answerShowEditor())

      expect(mockChangeLockedState).toHaveBeenLastCalledWith(false)
      expect(docsLoadMarks().at(-1)).toEqual(DocsLoadMark.EditorShown)

      await act(async () => mockClientHandler.updateFrameSize(480))

      expect(docsLoadMarks().slice(-3)).toEqual([
        DocsLoadMark.EditorShown,
        DocsLoadMark.EditorEditable,
        DocsLoadMark.Revealed,
      ])
    })

    test('in StrictMode, opens the document once: the first run is aborted before it marks anything', async () => {
      // The previous test's viewer may unmount after its mocks were cleared
      mockDestroyBridge.mockClear()
      const fake = createSession()
      renderViewer(fake, { strict: true })
      await waitFor(() => expect(fake.mocks.connect).toHaveBeenCalled())

      expect(docsLoadMarks()).toEqual([
        DocsLoadMark.FrameReady,
        DocsLoadMark.DocumentLoaded,
        DocsLoadMark.BaseStateSent,
      ])
      expect(mockRealtimeClient.createSession).toHaveBeenCalledTimes(1)
      expect(fake.mocks.connect).toHaveBeenCalledTimes(1)
      expect(ClientEditorBridge).toHaveBeenCalledTimes(1)
      expect(mockDestroyBridge).not.toHaveBeenCalled()
    })

    test('shows the document in a browser that places no marks', async () => {
      performanceSpy().mockRestore()
      vi.stubGlobal('performance', {})
      try {
        expect(performance.mark).toBeUndefined()

        await renderShown(createSession())

        expect(mockEditorCalls).toContain('showEditor')
      } finally {
        vi.unstubAllGlobals()
      }
    })
  })

  test('gives the editor the user name before initializing it when the session has already caught up', async () => {
    const fake = createSession()
    fake.setSnapshot({ caughtUp: true })
    renderViewer(fake)

    await waitFor(() => expect(mockEditorCalls).toContain('broadcastPresenceState'))

    expect(mockEditorCalls.indexOf('syncProperty:userName')).toBeGreaterThan(-1)
    expect(mockEditorCalls.indexOf('syncProperty:userName')).toBeLessThan(mockEditorCalls.indexOf('initializeEditor'))
  })

  test.each<[SessionStatus, string]>([
    [{ name: 'reconnecting', condition: 'transient', nextAttemptAt: 0, budgetExpiresAt: 0 }, 'Reconnecting…'],
    [{ name: 'stopped', condition: 'transient', retryable: true }, 'Offline'],
  ])('keeps loading while %j before catching up, and shows "%s"', async (status, text) => {
    const fake = createSession()
    renderViewer(fake)
    await waitFor(() => expect(fake.mocks.connect).toHaveBeenCalled())

    act(() => fake.setSnapshot({ status }))
    await act(async () => {})

    expect(screen.getByTestId('session-status')).toHaveTextContent(text)
    expect(mockEditorCalls).not.toContain('initializeEditor')
  })

  test('shows the status pills in the header, and asks before leaving until every edit is delivered', async () => {
    const fake = createSession()
    const { unmount } = renderViewer(fake)
    await waitFor(() => expect(fake.mocks.connect).toHaveBeenCalled())
    const leave = () => {
      const event = new Event('beforeunload', { cancelable: true })
      window.dispatchEvent(event)
      return event.defaultPrevented
    }

    act(() => fake.setSnapshot({ status: { name: 'connected' }, caughtUp: true, delivery: 'pending' }))
    expect(screen.getByTestId('shell-header')).toContainElement(screen.getByTestId('session-status'))
    expect(screen.getByTestId('session-status')).toHaveAttribute('data-delivery', 'pending')
    expect(leave()).toBe(true)

    act(() => fake.setSnapshot({ delivery: 'synced' }))
    expect(leave()).toBe(false)

    act(() => fake.setSnapshot({ delivery: 'pending' }))
    unmount()
    expect(leave()).toBe(false)
  })

  test('a stopped session before catching up can be retried, and the editor shows once it catches up', async () => {
    const fake = createSession()
    renderViewer(fake)
    await waitFor(() => expect(fake.mocks.connect).toHaveBeenCalled())
    act(() => fake.setSnapshot({ status: { name: 'stopped', condition: 'transient', retryable: true } }))

    await userEvent.click(within(screen.getByTestId('shell-header')).getByRole('button', { name: 'Try again' }))
    act(() => fake.setSnapshot({ status: { name: 'connected' }, caughtUp: true }))

    expect(fake.mocks.retry).toHaveBeenCalled()
    await waitFor(() => expect(mockEditorCalls).toContain('showEditor'))
  })

  test('shows no header while the node loads, then the header for its node and role, with the editor once there', async () => {
    let readNode: () => void = () => {}
    const fake = createSession()
    renderViewer(fake, {
      readHierarchy: () => new Promise((resolve) => (readNode = () => resolve(hierarchy('Editor')))),
    })
    expect(screen.getByTestId('shell-header')).toBeEmptyDOMElement()

    await act(async () => readNode())

    await waitFor(() =>
      expect(screen.getByTestId('shell-header')).toHaveTextContent('Header for VOLUME~LINK as Editor, with the editor'),
    )
  })

  test.each<[DocumentRole, boolean]>([
    ['Editor', true],
    ['Admin', false],
  ])('with 20 users, a %s is locked: %s, and below 20 nobody is', async (role, lockedAtLimit) => {
    const fake = createSession()
    await renderRevealed(fake, { role })
    expect(mockChangeLockedState).toHaveBeenLastCalledWith(false)

    act(() => fake.setSnapshot({ participants: users(20) }))
    await waitFor(() => expect(mockChangeLockedState).toHaveBeenLastCalledWith(lockedAtLimit))

    act(() => fake.setSnapshot({ participants: users(19) }))
    await waitFor(() => expect(mockChangeLockedState).toHaveBeenLastCalledWith(false))
  })

  test("gives a private Viewer's editor their user settings, as /doc does", async () => {
    await renderShown(createSession())

    expect(mockLoadUserSettings).toHaveBeenCalledWith({ Locale: 'fr_FR' })
  })

  test("bridges presence: the editor's own entry to the session, and the other participants to the editor", async () => {
    const fake = createSession()
    renderViewer(fake)
    await waitFor(() => expect(fake.mocks.connect).toHaveBeenCalled())
    await act(async () => {})
    const alice = { name: 'Alice', color: '#f00', anchorPos: null, focusPos: null }
    const bob = { name: 'Bob', color: '#00f', anchorPos: null, focusPos: null }

    await act(() =>
      mockClientHandler.editorRequestsPropagationOfUpdate(
        {
          type: { wrapper: 'events', eventType: 2 },
          content: encodeAwarenessUpdate([
            { clientId: EDITOR_CLIENT_ID, clock: 1, state: alice },
            { clientId: 3, clock: 1, state: bob },
          ]),
        },
        BroadcastSource.AwarenessUpdateHandler,
      ),
    )
    act(() =>
      fake.setSnapshot({
        participants: [
          { id: 100, isSelf: true, state: alice, lastSeenAt: 1 },
          { id: 3, isSelf: false, state: bob, lastSeenAt: 1 },
        ],
      }),
    )

    expect(fake.mocks.setPresence.mock.calls).toEqual([[alice]])
    expect(fake.mocks.sendUpdate).not.toHaveBeenCalled()
    const [[presence]] = mockReceiveMessage.mock.calls.filter(([{ type }]) => type.wrapper === 'events')
    expect(presence.type).toEqual({ wrapper: 'events', eventType: 2 })
    expect(decodeAwarenessUpdate(presence.content)).toEqual([{ clientId: 3, clock: 1, state: bob }])
  })

  test("stops bridging presence and clears the user's presence once the editor fails", async () => {
    const fake = createSession()
    renderViewer(fake)
    await waitFor(() => expect(fake.mocks.connect).toHaveBeenCalled())
    await act(async () => {})
    const alice = { name: 'Alice', color: '#f00', anchorPos: null, focusPos: null }
    await act(() =>
      mockClientHandler.editorRequestsPropagationOfUpdate(
        {
          type: { wrapper: 'events', eventType: 2 },
          content: encodeAwarenessUpdate([{ clientId: EDITOR_CLIENT_ID, clock: 1, state: alice }]),
        },
        BroadcastSource.AwarenessUpdateHandler,
      ),
    )

    await act(() => mockClientHandler.reportUserInterfaceError(new Error('The editor crashed')))
    act(() => fake.setSnapshot({ participants: [{ id: 3, isSelf: false, state: { name: 'Bob' }, lastSeenAt: 1 }] }))

    expect(screen.getByText('Open failed: editorFailed')).toBeInTheDocument()
    expect(fake.mocks.setPresence.mock.calls).toEqual([[alice], [null]])
    expect(mockReceiveMessage.mock.calls.filter(([{ type }]) => type.wrapper === 'events')).toEqual([])
  })

  test("shows the editor's alerts in a modal", async () => {
    renderViewer(createSession())
    await waitFor(() => expect(mockClientHandler).toBeDefined())

    act(() => mockClientHandler.showGenericAlertModal('The export failed.'))

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('The export failed.')).toBeInTheDocument()
  })

  test("the editor's toggle-debug-mode action flips debug mode", async () => {
    localStorage.removeItem('proton-docs-debug')
    renderViewer(createSession())
    await waitFor(() => expect(mockClientHandler).toBeDefined())

    await act(() => mockClientHandler.handleFileMenuAction({ type: 'toggle-debug-mode' }))

    expect(localStorage.getItem('proton-docs-debug')).toBe('true')
  })

  test('shows the debug menu once the editor shows, only while debug mode is on, as the hidden menu item toggles it', async () => {
    localStorage.removeItem('proton-docs-debug')
    await renderShown(createSession(), { role: 'Editor' })
    expect(screen.queryByText('Debug menu')).not.toBeInTheDocument()

    await act(() => mockClientHandler.handleFileMenuAction({ type: 'toggle-debug-mode' }))
    expect(screen.getByText('Debug menu')).toBeInTheDocument()

    await act(() => mockClientHandler.handleFileMenuAction({ type: 'toggle-debug-mode' }))
    expect(screen.queryByText('Debug menu')).not.toBeInTheDocument()
  })

  test("gives the debug menu the session, and sends the editor's own updates to it", async () => {
    localStorage.setItem('proton-docs-debug', 'true')
    const fake = createSession()
    await renderShown(fake, { role: 'Editor' })

    await act(() =>
      mockClientHandler.editorRequestsPropagationOfUpdate(
        { type: { wrapper: 'du' }, content: new Uint8Array([3]) },
        BroadcastSource.DocumentBufferFlush,
      ),
    )

    expect(fake.mocks.sendUpdate).toHaveBeenCalledWith(new Uint8Array([3]))
    expect(mockDebugMenuProps?.session).toBe(fake.session)
    localStorage.removeItem('proton-docs-debug')
  })

  test.each([
    ['new-document', 'newDocument'],
    ['new-spreadsheet', 'newSpreadsheet'],
    ['make-a-copy', 'makeACopy'],
    ['move-to-folder', 'moveToFolder'],
    ['move-to-trash', 'moveToTrash'],
    ['open-proton-drive', 'openProtonDrive'],
  ] as const)("the editor's %s action runs the file action %s", async (type, handler) => {
    renderViewer(createSession(), { role: 'Admin' })
    await waitFor(() => expect(mockClientHandler).toBeDefined())

    await act(() => mockClientHandler.handleFileMenuAction({ type }))

    expect(mockFileActions[handler]).toHaveBeenCalledTimes(1)
  })

  test('feeds the file actions the node, role, Drive compat and SDK client, and shows their modals', async () => {
    renderViewer(createSession(), { role: 'Admin' })

    expect(await screen.findByText('File action modals')).toBeInTheDocument()
    // The node arrives one render after the role
    await waitFor(() =>
      expect(mockUseDocumentFileActions).toHaveBeenLastCalledWith({
        node: expect.objectContaining({ uid: 'VOLUME~LINK', name: 'Plans' }),
        role: 'Admin',
        driveCompat: DRIVE_COMPAT,
        client: mockRealtimeClient,
        exportInvoker: undefined,
      }),
    )
  })

  describe('the loading screen', () => {
    const performanceSpy = withNodePerformance()
    afterEach(() => mockChangeLockedState.mockImplementation(async () => {}))
    const loadingStatus = () => within(screen.getByTestId('loading-screen')).getByRole('status')

    test('covers the page from the start, says the stage of each step, and lifts once the editor is ready', async () => {
      const fake = createSession()
      let readNode: () => void = () => {}
      let bootstrap: () => void = () => {}
      let answerUnlock = () => {}
      fake.mocks.bootstrap.mockReturnValueOnce(new Promise((resolve) => (bootstrap = () => resolve(fake.session))))
      mockChangeLockedState.mockImplementationOnce(() => new Promise<void>((resolve) => (answerUnlock = resolve)))
      renderViewer(fake, {
        role: 'Editor',
        readHierarchy: () => new Promise((resolve) => (readNode = () => resolve(hierarchy('Editor')))),
      })

      expect(loadingStatus()).toHaveTextContent('Opening document…')
      expect(screen.getByRole('progressbar', { name: 'Loading' })).not.toHaveAttribute('aria-valuenow')

      await act(async () => readNode())
      expect(loadingStatus()).toHaveTextContent('Decrypting document…')
      // The header mounts under the screen
      expect(screen.getByTestId('shell-header')).toHaveTextContent('Header for VOLUME~LINK as Editor')

      await act(async () => bootstrap())
      await waitFor(() => expect(fake.mocks.connect).toHaveBeenCalled())
      expect(loadingStatus()).toHaveTextContent('Syncing latest changes…')

      act(() => fake.setSnapshot({ status: { name: 'connected' }, caughtUp: true }))
      await waitFor(() => expect(mockEditorCalls).toContain('showEditor'))
      expect(loadingStatus()).toHaveTextContent('Preparing editor…')

      await act(async () => mockClientHandler.updateFrameSize(480))
      expect(loadingStatus()).toHaveTextContent('Preparing editor…')
      expect(docsLoadMarks()).not.toContain(DocsLoadMark.Revealed)

      await act(async () => answerUnlock())

      expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument()
      expect(docsLoadMarks().slice(-2)).toEqual([DocsLoadMark.EditorEditable, DocsLoadMark.Revealed])
    })

    test.each<[string, DocumentRole, (fake: ReturnType<typeof createSession>) => void]>([
      ['a viewer', 'Viewer', () => {}],
      [
        'an editor of a size-locked document',
        'Editor',
        (fake) => fake.setSnapshot({ editing: { allowed: false, reason: 'sizeLocked' } }),
      ],
      ['an editor at the participant limit', 'Editor', (fake) => fake.setSnapshot({ participants: users(20) })],
    ])('lifts for %s once the editor answers its lock, and marks it revealed, not editable', async (_, role, lock) => {
      const fake = createSession()
      lock(fake)
      await renderShown(fake, { role })
      await act(async () => {})

      expect(mockChangeLockedState).toHaveBeenLastCalledWith(true)
      expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument()
      expect(docsLoadMarks()).toContain(DocsLoadMark.Revealed)
      expect(docsLoadMarks()).not.toContain(DocsLoadMark.EditorEditable)
    })

    test("says it can't connect when the session stops before the reveal, and Try again retries the session", async () => {
      const fake = createSession()
      renderViewer(fake)
      await waitFor(() => expect(fake.mocks.connect).toHaveBeenCalled())

      act(() => fake.setSnapshot({ status: { name: 'stopped', condition: 'transient', retryable: true } }))

      expect(loadingStatus()).toHaveTextContent("Can't connect")
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()

      await userEvent.click(within(screen.getByTestId('loading-screen')).getByRole('button', { name: 'Try again' }))
      expect(fake.mocks.retry).toHaveBeenCalledTimes(1)

      act(() => fake.setSnapshot({ status: { name: 'opening' } }))

      expect(loadingStatus()).toHaveTextContent('Syncing latest changes…')
    })

    test('after Try again, lifts only once the editor answers the unlock, not on the lock it answered while stopped', async () => {
      const fake = createSession()
      const answers: (() => void)[] = []
      mockChangeLockedState.mockImplementation(() => new Promise<void>((resolve) => answers.push(resolve)))
      await renderShown(fake, { role: 'Editor' })
      act(() => fake.setSnapshot({ status: { name: 'stopped', condition: 'transient', retryable: true } }))
      await act(async () => answers.forEach((answer) => answer()))
      expect(loadingStatus()).toHaveTextContent("Can't connect")

      act(() => fake.setSnapshot({ status: { name: 'connected' } }))

      expect(mockChangeLockedState).toHaveBeenLastCalledWith(false)
      expect(loadingStatus()).toHaveTextContent('Preparing editor…')

      await act(async () => answers.at(-1)!())

      expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument()
    })

    test('shows a stop alert over the screen', async () => {
      const fake = createSession()
      renderViewer(fake)
      await waitFor(() => expect(fake.mocks.connect).toHaveBeenCalled())

      act(() => fake.setSnapshot({ status: { name: 'stopped', condition: 'encryptionFailed', retryable: false } }))

      expect(await screen.findByText('Something went wrong')).toBeInTheDocument()
      expect(loadingStatus()).toHaveTextContent("Can't connect")
    })

    test("offers no Try again for a stop the session can't retry", async () => {
      const fake = createSession()
      renderViewer(fake)
      await waitFor(() => expect(fake.mocks.connect).toHaveBeenCalled())

      act(() => fake.setSnapshot({ status: { name: 'stopped', condition: 'permissionsChanged', retryable: false } }))

      expect(loadingStatus()).toHaveTextContent("Can't connect")
      expect(within(screen.getByTestId('loading-screen')).queryByRole('button')).not.toBeInTheDocument()
    })

    test('stays lifted, and marks nothing again, through a reconnect, a rebootstrap and a stop', async () => {
      const fake = createSession()
      await renderShown(fake, { role: 'Editor' })
      await waitFor(() => expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument())
      const marks = performance.getEntriesByType('mark')

      act(() =>
        fake.setSnapshot({
          status: { name: 'reconnecting', condition: 'transient', nextAttemptAt: 0, budgetExpiresAt: 0 },
          caughtUp: false,
        }),
      )
      act(() => fake.setSnapshot({ status: { name: 'opening' } }))
      act(() => fake.setSnapshot({ status: { name: 'stopped', condition: 'transient', retryable: true } }))
      act(() => fake.setSnapshot({ status: { name: 'connected' }, caughtUp: true }))
      await act(async () => {})

      expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument()
      expect(performance.getEntriesByType('mark')).toEqual(marks)
    })

    test('lifting it moves no focus', async () => {
      const fake = createSession()
      const outside = document.body.appendChild(document.createElement('button'))
      outside.focus()
      await renderShown(fake, { role: 'Editor' })
      await waitFor(() => expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument())

      expect(outside).toHaveFocus()
      outside.remove()
    })

    test('lifts in a browser that places no marks', async () => {
      performanceSpy().mockRestore()

      await renderShown(createSession(), { role: 'Editor' })

      await waitFor(() => expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument())
    })

    test.each<[string, () => Promise<unknown>]>([
      ['a bootstrap failure', () => Promise.reject(new DocsApiError('getDocumentMeta', 403))],
      ['an unsupported document', async () => hierarchy('Editor', { mediaType: 'application/pdf' })],
    ])('gives way to the error page for %s', async (_, readHierarchy) => {
      renderViewer(createSession(), { readHierarchy })

      await waitFor(() => expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument())
    })

    test('gives way to the error page for an editor that fails', async () => {
      const fake = createSession()
      mockReceiveMessage.mockRejectedValueOnce(new Error('editor gone'))
      renderViewer(fake)

      expect(await screen.findByText('Open failed: editorFailed')).toBeInTheDocument()
      expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument()
    })
  })

  describe('a document opened in the trash', () => {
    const trashed = async () => hierarchy('Admin', { trashTime: new Date(0) })

    test('shows the header for its role and the file actions, with no session', async () => {
      renderViewer(createSession(), { readHierarchy: trashed })

      expect(await screen.findByText('Header for VOLUME~LINK as Admin, without the editor')).toBeInTheDocument()
      expect(screen.getByText('File action modals')).toBeInTheDocument()
      // The trashed modal shows over the loading screen, which stays until a restore opens the document
      expect(within(screen.getByTestId('loading-screen')).getByRole('status')).toHaveTextContent('Opening document…')
      await act(async () => {})
      // No session, so no editor bridge
      expect(mockRealtimeClient.createSession).not.toHaveBeenCalled()
      expect(ClientEditorBridge).not.toHaveBeenCalled()
      expect(mockUseDocumentFileActions).toHaveBeenLastCalledWith(
        expect.objectContaining({ node: expect.objectContaining({ uid: 'VOLUME~LINK' }), role: 'Admin' }),
      )
    })

    test('opens once out of the trash, restored here or elsewhere', async () => {
      const onRetry = vi.fn()
      mockUseDocumentFileActions.mockReturnValue({ ...mockFileActions, trashState: 'trashed' })
      const { rerender } = renderViewer(createSession(), { onRetry, readHierarchy: trashed })
      await screen.findByText('Header for VOLUME~LINK as Admin, without the editor')
      mockUseDocumentFileActions.mockReturnValue({ ...mockFileActions, trashState: 'restoring' })
      rerender()
      expect(onRetry).not.toHaveBeenCalled()

      mockUseDocumentFileActions.mockReturnValue(mockFileActions)
      rerender()

      expect(onRetry).toHaveBeenCalledTimes(1)
    })
  })

  describe('a document trashed while open, then out of the trash', () => {
    afterEach(() => mockUseDocumentFileActions.mockReturnValue(mockFileActions))

    const trashThenRestore = async (fake: ReturnType<typeof createSession>, stopped: boolean) => {
      const { rerender } = renderViewer(fake, { role: 'Admin' })
      await waitFor(() => expect(fake.mocks.connect).toHaveBeenCalled())
      mockUseDocumentFileActions.mockReturnValue({ ...mockFileActions, trashState: 'trashed' })
      rerender()
      if (stopped) {
        act(() => fake.setSnapshot({ status: { name: 'stopped', condition: 'transient', retryable: true } }))
      }
      mockUseDocumentFileActions.mockReturnValue(mockFileActions)
      rerender()
    }

    test('retries a session that stopped while RTS refused the trashed document', async () => {
      const fake = createSession()

      await trashThenRestore(fake, true)

      expect(fake.mocks.retry).toHaveBeenCalledTimes(1)
    })

    test('leaves a session still trying alone', async () => {
      const fake = createSession()

      await trashThenRestore(fake, false)

      expect(fake.mocks.retry).not.toHaveBeenCalled()
    })

    test('a trash that fails, never trashed, retries nothing', async () => {
      const fake = createSession()
      const { rerender } = renderViewer(fake, { role: 'Admin' })
      await waitFor(() => expect(fake.mocks.connect).toHaveBeenCalled())
      act(() => fake.setSnapshot({ status: { name: 'stopped', condition: 'transient', retryable: true } }))
      mockUseDocumentFileActions.mockReturnValue({ ...mockFileActions, trashState: 'trashing' })
      rerender()

      mockUseDocumentFileActions.mockReturnValue(mockFileActions)
      rerender()

      expect(fake.mocks.retry).not.toHaveBeenCalled()
    })
  })

  test('new file actions on a rerender reach the editor without rebuilding the bridge', async () => {
    const { rerender } = renderViewer(createSession(), { role: 'Admin' })
    await waitFor(() => expect(mockClientHandler).toBeDefined())
    const bridges = vi.mocked(ClientEditorBridge).mock.calls.length
    const moveToTrash = vi.fn()
    mockUseDocumentFileActions.mockReturnValue({ ...mockFileActions, moveToTrash })

    rerender()
    await act(() => mockClientHandler.handleFileMenuAction({ type: 'move-to-trash' }))

    expect(moveToTrash).toHaveBeenCalledTimes(1)
    expect(vi.mocked(ClientEditorBridge).mock.calls.length).toBe(bridges)
    mockUseDocumentFileActions.mockReturnValue(mockFileActions)
  })

  test('unmounting while waiting to catch up never initializes the editor', async () => {
    const fake = createSession()
    const { unmount } = renderViewer(fake)
    await waitFor(() => expect(fake.mocks.connect).toHaveBeenCalled())

    unmount()
    act(() => fake.setSnapshot({ caughtUp: true }))
    await act(async () => {})

    expect(mockDestroyBridge).toHaveBeenCalled()
    expect(fake.mocks.disconnect).toHaveBeenCalledTimes(1)
    expect(fake.listenerCount()).toBe(0)
    expect(mockEditorCalls).not.toContain('initializeEditor')
  })
  test.each<[string, string, boolean, (fake: ReturnType<typeof createSession>) => Parameters<typeof renderViewer>[1]]>([
    [
      'no access',
      'Bootstrap failed: noAccess',
      true,
      () => ({ readHierarchy: () => Promise.reject(new DocsApiError('getDocumentMeta', 403)) }),
    ],
    [
      'not found',
      'Bootstrap failed: notFound',
      true,
      (fake) => (fake.mocks.bootstrap.mockRejectedValueOnce(new DocsApiError('getDocumentMeta', 404)), {}),
    ],
    [
      'no Docs API',
      'Bootstrap failed: unreachable',
      true,
      (fake) => (fake.mocks.bootstrap.mockRejectedValueOnce(new DocsApiError('getCommitData')), {}),
    ],
    [
      'any other failure',
      'Bootstrap failed: bootstrapFailed',
      true,
      (fake) => (fake.mocks.bootstrap.mockRejectedValueOnce(new Error('Boom')), {}),
    ],
    [
      'an unreadable base state',
      'Open failed: unreadableUpdate',
      true,
      (fake) => (
        fake.mocks.bootstrap.mockImplementationOnce(async () => {
          fake.emit('updateUnreadable', { uuid: 'update-1', origin: 'baseState' })
          return fake.session
        }),
        {}
      ),
    ],
    [
      'an unsupported document',
      'Open failed: unsupported',
      false,
      () => ({ readHierarchy: async () => hierarchy('Editor', { mediaType: 'application/pdf' }) }),
    ],
  ])('a load that failed for %s shows "%s", given a retry: %s', async (_, text, canRetry, failure) => {
    const onRetry = vi.fn()
    const fake = createSession()
    renderViewer(fake, { onRetry, ...failure(fake) })

    expect(await screen.findByText(text)).toBeInTheDocument()
    const retryButtons = screen.queryAllByRole('button', { name: 'Try again' })
    expect(retryButtons).toHaveLength(canRetry ? 1 : 0)
    if (canRetry) {
      await userEvent.click(retryButtons[0])
      expect(onRetry).toHaveBeenCalledTimes(1)
    }
  })

  test('an idle-evicted session covers and unfocuses the editor until the next activity, which retries it', async () => {
    const fake = createSession()
    fake.mocks.retry.mockImplementation(async () => fake.setSnapshot({ status: { name: 'connecting' } }))
    await renderShown(fake)
    expect(screen.queryByTestId('idle-activity-catcher')).not.toBeInTheDocument()

    act(() => fake.setSnapshot({ status: { name: 'stopped', condition: 'idleEvicted', retryable: true } }))

    const catcher = screen.getByTestId('idle-activity-catcher')
    expect(catcher).toHaveFocus()

    fireEvent.wheel(catcher)

    expect(fake.mocks.retry).toHaveBeenCalledTimes(1)
    expect(screen.queryByTestId('idle-activity-catcher')).not.toBeInTheDocument()
  })

  test.each<RecoveryCondition>(['permissionsChanged', 'authExpired', 'clientRejected'])(
    "a session stopped for %s shows /doc's Offline pill, with no action of its own",
    async (condition) => {
      const onRetry = vi.fn()
      const fake = createSession()
      await renderShown(fake, { onRetry })

      act(() => fake.setSnapshot({ status: { name: 'stopped', condition, retryable: false } }))

      expect(screen.getByTestId('session-status')).toHaveTextContent('Offline')
      expect(screen.queryByRole('button', { name: /Try again|Reopen|Reload|Sign in/ })).not.toBeInTheDocument()
      expect(onRetry).not.toHaveBeenCalled()
    },
  )

  test("a session stopped for an encryption failure shows /doc's alert", async () => {
    const fake = createSession()
    await renderShown(fake, { role: 'Editor' })

    act(() => fake.setSnapshot({ status: { name: 'stopped', condition: 'encryptionFailed', retryable: false } }))

    expect(
      await screen.findByText('We are having trouble saving recent edits. Please refresh the page.'),
    ).toBeInTheDocument()
  })

  test('a session stopped for expired credentials is retried, with no app session check', async () => {
    const fake = createSession()
    await renderShown(fake)

    await act(async () => fake.setSnapshot({ status: { name: 'stopped', condition: 'authExpired', retryable: false } }))

    expect(mockApi).not.toHaveBeenCalled()
    expect(fake.mocks.retry).toHaveBeenCalledTimes(1)
  })

  test.each<RecoveryCondition>(['idleEvicted', 'transient'])(
    'Try again after a %s stop retries the session once',
    async (condition) => {
      const fake = createSession()
      fake.mocks.retry.mockImplementation(async () => fake.setSnapshot({ status: { name: 'connecting' } }))
      await renderShown(fake)
      act(() => fake.setSnapshot({ status: { name: 'stopped', condition, retryable: true } }))

      // For idleEvicted, the pointer press of the click is activity that retries too
      await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

      expect(fake.mocks.retry).toHaveBeenCalledTimes(1)
    },
  )

  test('an idle-evicted session retries on the next key press', async () => {
    const fake = createSession()
    await renderShown(fake)
    act(() => fake.setSnapshot({ status: { name: 'stopped', condition: 'idleEvicted', retryable: true } }))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
    })

    expect(fake.mocks.retry).toHaveBeenCalledTimes(1)
  })

  test('a role read again after a rebootstrap locks or unlocks the editor, and shows in the header, without initializing it again', async () => {
    const fake = createSession()
    await renderRevealed(fake, { role: 'Editor' })
    expect(mockChangeLockedState).toHaveBeenLastCalledWith(false)
    const rebootstrap = () => {
      act(() => fake.setSnapshot({ status: { name: 'opening' } }))
      act(() => fake.setSnapshot({ status: { name: 'connected' } }))
    }

    mockGetNodeHierarchy.mockResolvedValue(hierarchy('Viewer'))
    rebootstrap()
    await waitFor(() => expect(mockChangeLockedState).toHaveBeenLastCalledWith(true))
    expect(screen.getByTestId('shell-header')).toHaveTextContent('as Viewer')

    mockGetNodeHierarchy.mockResolvedValue(hierarchy('Editor'))
    rebootstrap()
    await waitFor(() => expect(mockChangeLockedState).toHaveBeenLastCalledWith(false))

    expect(mockEditorCalls.filter((call) => call === 'initializeEditor')).toHaveLength(1)
    expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument()
  })

  describe('print, download and export', () => {
    test("enables the title menu's exports only once the editor shows the document and its editor is rendered", async () => {
      const fake = createSession()
      renderViewer(fake)
      await waitFor(() => expect(fake.mocks.connect).toHaveBeenCalled())
      // The header renders after the connection starts
      expect(await screen.findByTestId('header-exports')).toHaveTextContent('exports disabled')

      act(() => fake.setSnapshot({ status: { name: 'connected' }, caughtUp: true }))
      await waitFor(() => expect(mockEditorCalls).toContain('showEditor'))
      await act(async () => {})
      // Shown, but the editor would answer an export with "Could not export data" until its Lexical editor exists
      expect(screen.getByTestId('header-exports')).toHaveTextContent('exports disabled')

      expect(mockUseDocumentFileActions).toHaveBeenLastCalledWith(expect.objectContaining({ exportInvoker: undefined }))

      await act(async () => mockClientHandler.updateFrameSize(480))

      expect(screen.getByTestId('header-exports')).toHaveTextContent('exports enabled')
      expect(mockUseDocumentFileActions).toHaveBeenLastCalledWith(
        expect.objectContaining({ exportInvoker: expect.objectContaining({ printAsPDF: mockPrintAsPDF }) }),
      )
    })

    test('print and download do nothing before the editor shows the document, which may miss edits then', async () => {
      const fake = createSession()
      renderViewer(fake)
      await waitFor(() => expect(mockClientHandler).toBeDefined())

      await act(() => mockClientHandler.handleFileMenuAction({ type: 'print' }))
      await act(() => mockClientHandler.handleFileMenuAction({ type: 'download', format: 'docx' }))

      expect(mockPrintAsPDF).not.toHaveBeenCalled()
      expect(mockExportAndDownload).not.toHaveBeenCalled()
    })

    test('the print action has the editor print', async () => {
      await renderShown(createSession())

      await act(() => mockClientHandler.handleFileMenuAction({ type: 'print' }))

      expect(mockPrintAsPDF).toHaveBeenCalledTimes(1)
    })

    test('the download action saves the export as the document name, in its format', async () => {
      await renderShown(createSession())

      await act(() => mockClientHandler.handleFileMenuAction({ type: 'download', format: 'md' }))

      expect(mockExportAndDownload).toHaveBeenCalledWith(
        expect.objectContaining({ printAsPDF: mockPrintAsPDF }),
        'Plans',
        'md',
      )
    })

    test('a failed download is logged, not thrown', async () => {
      const error = new Error('Editor did not answer exportData')
      mockExportAndDownload.mockRejectedValueOnce(error)
      const { logger } = await renderShown(createSession())

      await act(() => mockClientHandler.handleFileMenuAction({ type: 'download', format: 'docx' }))

      await waitFor(() => expect(logger.error).toHaveBeenCalledWith('Failed to download the document', error))
    })

    test("answers the editor's external images through the image proxy, for this session", async () => {
      renderViewer(createSession())
      await waitFor(() => expect(mockClientHandler).toBeDefined())

      const image = await mockClientHandler.fetchExternalImageAsBase64('https://example.com/cat.png')

      expect(image).toBe('data:image/png;base64,iVBORw0K')
      expect(mockFetchExternalImageAsBase64).toHaveBeenCalledWith('https://example.com/cat.png', {
        apiUrl: 'https://docs.proton.dev/api',
        uid: 'session-uid',
      })
    })

    test("Drive's Download saves the document as docx once the editor shows it, says so, and only once", async () => {
      const fake = createSession()
      const onDownloadedOnOpen = vi.fn()
      renderViewer(fake, { downloadOnOpen: true, onDownloadedOnOpen })
      await waitFor(() => expect(fake.mocks.connect).toHaveBeenCalled())
      expect(mockExportAndDownload).not.toHaveBeenCalled()

      act(() => fake.setSnapshot({ status: { name: 'connected' }, caughtUp: true }))
      await waitFor(() => expect(mockEditorCalls).toContain('showEditor'))
      await act(async () => {})
      expect(mockExportAndDownload).not.toHaveBeenCalled()

      await act(async () => mockClientHandler.updateFrameSize(480))
      await waitFor(() => expect(mockExportAndDownload).toHaveBeenCalledWith(expect.anything(), 'Plans', 'docx'))
      expect(onDownloadedOnOpen).toHaveBeenCalledTimes(1)

      // A reconnect catches up again, and the editor shows the document again
      act(() =>
        fake.setSnapshot({
          status: { name: 'reconnecting', condition: 'transient', nextAttemptAt: 0, budgetExpiresAt: 0 },
          caughtUp: false,
        }),
      )
      act(() => fake.setSnapshot({ status: { name: 'connected' }, caughtUp: true }))
      await act(async () => {})
      expect(mockExportAndDownload).toHaveBeenCalledTimes(1)
    })

    test("opening a document without Drive's Download saves nothing", async () => {
      await renderShown(createSession())

      expect(mockExportAndDownload).not.toHaveBeenCalled()
    })

    test('the size-limit modal downloads a copy as docx', async () => {
      const fake = createSession()
      await renderShown(fake, { role: 'Editor' })
      act(() => fake.emit('refusal', { reason: 'documentSizeLimitReached', attemptedBytes: 2, limitBytes: 1 }))

      await userEvent.click(await screen.findByRole('button', { name: 'Download a copy (as docx)', hidden: true }))

      expect(mockExportAndDownload).toHaveBeenCalledWith(expect.anything(), 'Plans', 'docx')
    })
  })

  test('opens the size-limit modal when the SDK refuses an edit for the document size', async () => {
    const fake = createSession()
    await renderShown(fake, { role: 'Editor' })

    act(() => fake.emit('refusal', { reason: 'documentSizeLimitReached', attemptedBytes: 2, limitBytes: 1 }))

    expect(await screen.findByText('Document Size Limit Exceeded')).toBeInTheDocument()
  })

  describe('version history', () => {
    const NOW = Date.now()
    const DAY_MS = 24 * 60 * 60 * 1000

    /**
     * A History Log of `count` entries, each typing one character: the first `earlier` three days ago, the rest today,
     * a minute apart
     */
    function historyLog(count: number, earlier = 0): HistoryEntry[] {
      const doc = new Y.Doc()
      const entries: HistoryEntry[] = []
      doc.on('update', (update) => {
        const index = entries.length
        const timestamp = (index < earlier ? NOW - 3 * DAY_MS : NOW - count * 60_000) + index * 60_000
        entries.push({
          uuid: `update-${index}`,
          origin: 'baseState',
          timestamp,
          authorAddress: 'author@example.com',
          content: new Uint8Array(update),
          acknowledged: true,
        })
      })
      for (let index = 0; index < count; index++) {
        doc.getText('text').insert(index, String.fromCharCode(97 + (index % 26)))
      }
      return entries
    }

    function textOf(state: Uint8Array<ArrayBuffer>) {
      const doc = new Y.Doc()
      Y.applyUpdate(doc, state)
      return doc.getText('text').toString()
    }

    function modal() {
      return screen.getByTestId('history-modal')
    }

    /** The timeline's revisions, newest first, as their times and labels read */
    function timeline() {
      return [...modal().querySelectorAll<HTMLButtonElement>('button[data-batch-index]')]
    }

    async function openHistory(fake: ReturnType<typeof createFakeSession>, role: DocumentRole = 'Editor') {
      await renderRevealed(fake, { role })
      await userEvent.click(screen.getByRole('button', { name: 'See version history' }))
      await waitFor(() => expect(mockRevisionCalls).toContain('showEditor'))
    }

    afterEach(() => {
      mockRevisionCalls.length = 0
      mockRevisionStates.length = 0
      mockIsODTEnabled = false
      localStorage.removeItem('proton-docs-debug')
    })

    test.each<DocumentRole>(['Admin', 'Editor', 'Viewer'])(
      'See version history opens the history for an %s, read from the History Log once, as it opens',
      async (role) => {
        const fake = createSession()
        fake.mocks.getHistory.mockReturnValue(historyLog(25))
        await renderRevealed(fake, { role })
        expect(fake.mocks.getHistory).not.toHaveBeenCalled()

        await userEvent.click(screen.getByRole('button', { name: 'See version history' }))

        expect(modal()).toBeInTheDocument()
        expect(fake.mocks.getHistory).toHaveBeenCalledTimes(1)
        expect(timeline()).toHaveLength(3)
      },
    )

    test.each<DocumentRole>(['Admin', 'Editor', 'Viewer'])(
      'mode history opens it as %s at the Reveal Point, says so, and only once',
      async (role) => {
        const fake = createSession()
        fake.mocks.getHistory.mockReturnValue(historyLog(25))
        const onHistoryOpenedOnOpen = vi.fn()
        renderViewer(fake, { role, historyOnOpen: true, onHistoryOpenedOnOpen })
        await waitFor(() => expect(fake.mocks.connect).toHaveBeenCalled())

        act(() => fake.setSnapshot({ status: { name: 'connected' }, caughtUp: true }))
        await waitFor(() => expect(mockEditorCalls).toContain('showEditor'))
        await act(async () => {})
        // The editor holds the document, but the Loading Screen still covers it
        expect(screen.getByTestId('loading-screen')).toBeInTheDocument()
        expect(screen.queryByTestId('history-modal')).not.toBeInTheDocument()
        expect(onHistoryOpenedOnOpen).not.toHaveBeenCalled()

        await act(async () => mockClientHandler.updateFrameSize(480))

        await waitFor(() => expect(modal()).toBeInTheDocument())
        expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument()
        expect(timeline()).toHaveLength(3)
        expect(onHistoryOpenedOnOpen).toHaveBeenCalledTimes(1)
        expect(fake.mocks.getHistory).toHaveBeenCalledTimes(1)

        // A reconnect catches up again, and the editor shows the document again
        act(() =>
          fake.setSnapshot({
            status: { name: 'reconnecting', condition: 'transient', nextAttemptAt: 0, budgetExpiresAt: 0 },
            caughtUp: false,
          }),
        )
        act(() => fake.setSnapshot({ status: { name: 'connected' }, caughtUp: true }))
        await act(async () => {})
        expect(onHistoryOpenedOnOpen).toHaveBeenCalledTimes(1)
        expect(fake.mocks.getHistory).toHaveBeenCalledTimes(1)
      },
    )

    test('mode history opens it once in StrictMode too', async () => {
      const fake = createSession()
      fake.mocks.getHistory.mockReturnValue(historyLog(3))
      const onHistoryOpenedOnOpen = vi.fn()
      await renderRevealed(fake, { historyOnOpen: true, onHistoryOpenedOnOpen, strict: true })

      await waitFor(() => expect(modal()).toBeInTheDocument())
      expect(onHistoryOpenedOnOpen).toHaveBeenCalledTimes(1)
      expect(fake.mocks.getHistory).toHaveBeenCalledTimes(1)
    })

    test('opening a document without mode history does not open it', async () => {
      const fake = createSession()
      await renderRevealed(fake)

      expect(screen.queryByTestId('history-modal')).not.toBeInTheDocument()
      expect(fake.mocks.getHistory).not.toHaveBeenCalled()
    })

    test("the editor's file menu opens it too", async () => {
      const fake = createSession()
      fake.mocks.getHistory.mockReturnValue(historyLog(3))
      await renderRevealed(fake)

      await act(() => mockClientHandler.handleFileMenuAction({ type: 'see-version-history' }))

      expect(modal()).toBeInTheDocument()
    })

    test('it opens nothing before the editor shows the document', async () => {
      const fake = createSession()
      fake.mocks.getHistory.mockReturnValue(historyLog(3))
      renderViewer(fake)
      await waitFor(() => expect(mockClientHandler).toBeDefined())

      await act(() => mockClientHandler.handleFileMenuAction({ type: 'see-version-history' }))

      expect(screen.queryByTestId('history-modal')).not.toBeInTheDocument()
      expect(fake.mocks.getHistory).not.toHaveBeenCalled()
    })

    test('the timeline groups ten entries a revision by day, newest first, and marks the current version, which it shows first', async () => {
      const fake = createSession()
      // Revision 0 three days ago, revisions 1 and 2 today
      fake.mocks.getHistory.mockReturnValue(historyLog(25, 10))
      await openHistory(fake)

      expect(timeline().map((revision) => revision.dataset.batchIndex)).toEqual(['2', '1', '0'])
      expect(timeline()[0]).toHaveTextContent('Current version')
      expect(timeline()[1]).not.toHaveTextContent('Current version')
      expect(within(modal()).getByText('today')).toBeInTheDocument()
      expect(within(modal()).getByText('The Beginning')).toBeInTheDocument()
      expect(within(modal()).getByText('View only')).toBeInTheDocument()
      expect(within(modal()).getByTestId('history-selected-time')).toHaveTextContent(
        new Date(NOW - 60_000).toLocaleString(),
      )

      // The view is a viewer in revision mode, sent the current version as one update, then that it has everything
      expect(mockRevisionCalls).toEqual([
        'initializeEditor',
        'receiveMessage:du',
        'receiveMessage:events',
        'showEditor',
      ])
      expect(mockRevisionInvoker.initializeEditor.mock.calls[0][2]).toBe('Viewer')
      expect(textOf(mockRevisionStates[0])).toBe('abcdefghijklmnopqrstuvwxy')
      // No button on the current version
      expect(within(modal()).queryByTestId('export-revision')).not.toBeInTheDocument()
    })

    test('selecting a revision shows its state, every entry up to it merged, in a new view', async () => {
      const fake = createSession()
      fake.mocks.getHistory.mockReturnValue(historyLog(25))
      await openHistory(fake)

      await userEvent.click(timeline()[2])

      await waitFor(() => expect(mockRevisionStates).toHaveLength(2))
      expect(textOf(mockRevisionStates[1])).toBe('abcdefghij')
      expect(within(modal()).getByTestId('history-selected-time')).toHaveTextContent(
        new Date(NOW - 16 * 60_000).toLocaleString(),
      )
      expect(timeline()[2].className).toContain('signal-success')
    })

    test("exports the selected revision as docx, from the view's editor, as the document name", async () => {
      const fake = createSession()
      fake.mocks.getHistory.mockReturnValue(historyLog(25))
      await openHistory(fake)
      await userEvent.click(timeline()[1])
      expect(within(modal()).queryByTestId('export-revision-odt')).not.toBeInTheDocument()

      await userEvent.click(within(modal()).getByTestId('export-revision'))

      await waitFor(() => expect(mockExportAndDownload).toHaveBeenCalledWith(mockRevisionInvoker, 'Plans', 'docx'))
    })

    test('selecting the revision that is already selected keeps its view, and its exports', async () => {
      const fake = createSession()
      fake.mocks.getHistory.mockReturnValue(historyLog(25))
      await openHistory(fake)
      await userEvent.click(timeline()[1])
      await waitFor(() => expect(mockRevisionStates).toHaveLength(2))
      await waitFor(() => expect(within(modal()).getByTestId('export-revision')).toBeEnabled())

      await userEvent.click(timeline()[1])

      expect(mockRevisionStates).toHaveLength(2)
      expect(within(modal()).getByTestId('export-revision')).toBeEnabled()
      await userEvent.click(within(modal()).getByTestId('export-revision'))
      await waitFor(() => expect(mockExportAndDownload).toHaveBeenCalledWith(mockRevisionInvoker, 'Plans', 'docx'))
    })

    test('entering the batch size it already has then exports work from another revision', async () => {
      localStorage.setItem('proton-docs-debug', 'true')
      const fake = createSession()
      fake.mocks.getHistory.mockReturnValue(historyLog(25))
      await openHistory(fake)
      fireEvent.change(within(modal()).getByTestId('history-batch-granularity'), { target: { value: '5' } })
      await waitFor(() => expect(mockRevisionStates).toHaveLength(2))

      // 1, then 0, which clamps to 1 again: the same size, on the same (current) revision
      fireEvent.change(within(modal()).getByTestId('history-batch-granularity'), { target: { value: '1' } })
      await waitFor(() => expect(mockRevisionStates).toHaveLength(3))
      fireEvent.change(within(modal()).getByTestId('history-batch-granularity'), { target: { value: '0' } })

      await userEvent.click(timeline()[1])
      await waitFor(() => expect(within(modal()).getByTestId('export-revision')).toBeEnabled())
      await userEvent.click(within(modal()).getByTestId('export-revision'))
      await waitFor(() => expect(mockExportAndDownload).toHaveBeenCalledWith(mockRevisionInvoker, 'Plans', 'docx'))
    })

    test('exports it as odt with the DocsODTEnabled flag', async () => {
      mockIsODTEnabled = true
      const fake = createSession()
      fake.mocks.getHistory.mockReturnValue(historyLog(25))
      await openHistory(fake)
      await userEvent.click(timeline()[1])

      await userEvent.click(within(modal()).getByTestId('export-revision-odt'))

      await waitFor(() => expect(mockExportAndDownload).toHaveBeenCalledWith(mockRevisionInvoker, 'Plans', 'odt'))
    })

    test('a failed export is logged, not thrown', async () => {
      const error = new Error('Editor did not answer exportData')
      mockExportAndDownload.mockRejectedValueOnce(error)
      const fake = createSession()
      fake.mocks.getHistory.mockReturnValue(historyLog(25))
      const { logger } = await renderRevealed(fake)
      await userEvent.click(screen.getByRole('button', { name: 'See version history' }))
      await userEvent.click(timeline()[1])

      await userEvent.click(within(modal()).getByTestId('export-revision'))

      await waitFor(() => expect(logger.error).toHaveBeenCalledWith('Failed to export the version', error))
    })

    test('Debug Mode adds the batch granularity, and the editor state and yjs state exports', async () => {
      localStorage.setItem('proton-docs-debug', 'true')
      const fake = createSession()
      fake.mocks.getHistory.mockReturnValue(historyLog(25))
      await openHistory(fake)

      fireEvent.change(within(modal()).getByTestId('history-batch-granularity'), { target: { value: '5' } })
      expect(timeline()).toHaveLength(5)
      await userEvent.click(timeline()[4])

      await userEvent.click(within(modal()).getByTestId('export-revision-editor-state'))
      await waitFor(() =>
        expect(mockDownloadJSONFile).toHaveBeenCalledWith(
          REVISION_EDITOR_STATE,
          expect.stringMatching(/^Plans-editor-state-.+\.json$/),
        ),
      )

      await userEvent.click(within(modal()).getByTestId('export-revision-yjs-state'))
      await waitFor(() =>
        expect(mockDownloadFile).toHaveBeenCalledWith(
          expect.any(Blob),
          expect.stringMatching(/^Plans-yjs-state-.+\.bin$/),
        ),
      )
    })

    test('a new batch granularity shows the newest revision again, in a new view, even at the same index', async () => {
      localStorage.setItem('proton-docs-debug', 'true')
      const fake = createSession()
      fake.mocks.getHistory.mockReturnValue(historyLog(25))
      await openHistory(fake)
      await userEvent.click(timeline()[1])
      await waitFor(() => expect(mockRevisionStates).toHaveLength(2))
      expect(textOf(mockRevisionStates[1])).toBe('abcdefghijklmnopqrst')

      // Two revisions now, of 20 and 5 entries: index 1 is the current version
      fireEvent.change(within(modal()).getByTestId('history-batch-granularity'), { target: { value: '20' } })

      await waitFor(() => expect(mockRevisionStates).toHaveLength(3))
      expect(textOf(mockRevisionStates[2])).toBe('abcdefghijklmnopqrstuvwxy')
      expect(timeline()[0]).toHaveTextContent('Current version')
      expect(within(modal()).queryByTestId('export-revision')).not.toBeInTheDocument()
    })

    test('without Debug Mode, no batch granularity and no state exports', async () => {
      const fake = createSession()
      fake.mocks.getHistory.mockReturnValue(historyLog(25))
      await openHistory(fake)
      await userEvent.click(timeline()[1])

      expect(within(modal()).queryByTestId('history-batch-granularity')).not.toBeInTheDocument()
      expect(within(modal()).queryByTestId('export-revision-editor-state')).not.toBeInTheDocument()
      expect(within(modal()).queryByTestId('export-revision-yjs-state')).not.toBeInTheDocument()
    })

    test('an empty History Log shows that there is no version history', async () => {
      const fake = createSession()
      fake.mocks.getHistory.mockReturnValue([])
      await renderRevealed(fake)

      await userEvent.click(screen.getByRole('button', { name: 'See version history' }))

      expect(within(modal()).getByText('No version history available')).toBeInTheDocument()
      expect(mockRevisionCalls).toEqual([])
    })

    test('Close closes the history', async () => {
      const fake = createSession()
      fake.mocks.getHistory.mockReturnValue(historyLog(3))
      await openHistory(fake)

      await userEvent.click(within(modal()).getByTestId('history-close'))

      // Gone once its exit animation ends, which jsdom never runs
      await waitFor(() => expect(modal().closest('.modal-two--out')).not.toBeNull())
    })

    describe('Make a copy', () => {
      const newWindow = { handle: { location: { assign: vi.fn() } }, close: vi.fn() }

      beforeEach(() => {
        mockRealFileActions = true
        vi.mocked(getNewWindow).mockReturnValue(newWindow as unknown as ReturnType<typeof getNewWindow>)
        mockCreateDocumentNode.mockResolvedValue({ volumeId: 'VOLUME', linkId: 'COPY', keys: {} })
        mockGetMyFilesNodeMeta.mockResolvedValue({ volumeId: 'MYVOLUME', linkId: 'MYFILES' })
        mockRealtimeClient.seedInitialCommit.mockResolvedValue({ commitId: 'COMMIT' })
      })

      afterEach(() => {
        mockRealFileActions = false
        mockHeldRevisionFrames = undefined
        mockRealtimeClient.seedInitialCommit.mockReset()
        mockCreateDocumentNode.mockReset()
      })

      function copyButton() {
        return within(modal()).queryByTestId('restore-revision-by-copy')
      }

      /** Opens the history as `role` on the older of two revisions, its view loaded, the document in folder PARENT */
      async function openOlderRevision(role: DocumentRole = 'Editor') {
        const fake = createSession()
        fake.mocks.getHistory.mockReturnValue(historyLog(15))
        const rendered = await renderRevealed(fake, {
          role,
          readHierarchy: async () => hierarchy(role, { parentUid: 'VOLUME~PARENT' }),
        })
        await userEvent.click(screen.getByRole('button', { name: 'See version history' }))
        await userEvent.click(timeline()[1])
        await waitFor(() => expect(mockRevisionStates).toHaveLength(2))
        await waitFor(() => expect(copyButton()).toBeEnabled())
        return { fake, ...rendered }
      }

      test.each<[DocumentRole, object]>([
        ['Admin', { volumeId: 'VOLUME', linkId: 'PARENT' }],
        ['Editor', { volumeId: 'VOLUME', linkId: 'PARENT' }],
        ['Viewer', { volumeId: 'MYVOLUME', linkId: 'MYFILES' }],
      ])(
        "%s: seeds a new document with the revision's state and opens it in doc2 in a window opened on the click",
        async (role, folder) => {
          await openOlderRevision(role)
          const revisionState = mockRevisionStates[1]
          expect(textOf(revisionState)).toBe('abcdefghij')

          await userEvent.click(copyButton()!)

          expect(getNewWindow).toHaveBeenCalledWith()
          await waitFor(() =>
            expect(newWindow.handle.location.assign).toHaveBeenCalledWith(
              'http://docs.localhost/u/3/doc2?mode=open&volumeId=VOLUME&linkId=COPY',
            ),
          )
          // The revision's merged state as the timeline holds it, not a round trip through the view's editor
          expect(mockRealtimeClient.seedInitialCommit).toHaveBeenCalledTimes(1)
          expect(mockRealtimeClient.seedInitialCommit).toHaveBeenCalledWith({
            nodeMeta: { volumeId: 'VOLUME', linkId: 'COPY' },
            state: revisionState,
          })
          expect(mockRevisionInvoker.getDocumentState).not.toHaveBeenCalled()
          // Next to the document, or in My files for a user who can't organize it, named as Make a copy names it
          expect(mockCreateDocumentNode).toHaveBeenCalledWith(folder, 'Plans (copy 2026-11-10 09.00.00)', 'doc')
          expect(newWindow.close).not.toHaveBeenCalled()
          // The history stays open
          expect(modal().closest('.modal-two--out')).toBeNull()
        },
      )

      test('shows first, before the restore and the exports, and never on the current version', async () => {
        const fake = createSession()
        fake.mocks.getHistory.mockReturnValue(historyLog(15))
        await openHistory(fake)
        expect(copyButton()).not.toBeInTheDocument()

        await userEvent.click(timeline()[1])

        await waitFor(() => expect(copyButton()).toBeEnabled())
        expect(copyButton()).toHaveTextContent('Make a copy')
        const buttons = within(modal())
          .getAllByRole('button')
          .map((button) => button.dataset.testid)
        expect(buttons.indexOf('restore-revision-by-copy')).toBeLessThan(buttons.indexOf('restore-revision-by-replace'))
        expect(buttons.indexOf('restore-revision-by-copy')).toBeLessThan(buttons.indexOf('export-revision'))
      })

      test("is disabled until the view's editor exists", async () => {
        mockHeldRevisionFrames = []
        const fake = createSession()
        fake.mocks.getHistory.mockReturnValue(historyLog(15))
        await renderRevealed(fake, { role: 'Editor' })
        await userEvent.click(screen.getByRole('button', { name: 'See version history' }))
        await userEvent.click(timeline()[1])

        expect(copyButton()).toBeDisabled()
        await userEvent.click(copyButton()!)
        expect(getNewWindow).not.toHaveBeenCalled()
        expect(mockRealtimeClient.seedInitialCommit).not.toHaveBeenCalled()

        act(() => mockHeldRevisionFrames?.forEach((ready) => ready()))

        await waitFor(() => expect(copyButton()).toBeEnabled())
      })

      test('shows a loading state while copying, and copies once', async () => {
        let finishSeed!: () => void
        mockRealtimeClient.seedInitialCommit.mockReturnValue(
          new Promise((resolve) => {
            finishSeed = () => resolve({ commitId: 'COMMIT' })
          }),
        )
        await openOlderRevision()

        await userEvent.click(copyButton()!)

        await waitFor(() => expect(copyButton()).toHaveAttribute('aria-busy', 'true'))
        await userEvent.click(copyButton()!)
        await waitFor(() => expect(mockRealtimeClient.seedInitialCommit).toHaveBeenCalledTimes(1))
        await act(async () => finishSeed())
        await waitFor(() => expect(copyButton()).not.toHaveAttribute('aria-busy', 'true'))
        expect(getNewWindow).toHaveBeenCalledTimes(1)
        expect(mockCreateDocumentNode).toHaveBeenCalledTimes(1)
        expect(newWindow.handle.location.assign).toHaveBeenCalledTimes(1)
      })

      test.each([
        [
          'a state over the size limit',
          new SeedError('stateTooLarge', { attemptedBytes: 26_000_000, limitBytes: 25_000_000 }),
          'Document Size Limit Exceeded',
          'This document is too large to copy. Download it to keep a copy of your work.',
        ],
        [
          'a seed the Docs API refuses',
          new DocsApiError('seedInitialCommit', 422, 250003),
          'Something went wrong',
          'An error occurred while attempting to duplicate the document. Please try again.',
        ],
      ])(
        "%s closes the window and shows Make a copy's error modal over the history",
        async (_case, error, title, message) => {
          mockRealtimeClient.seedInitialCommit.mockRejectedValue(error)
          const { logger } = await openOlderRevision()

          await userEvent.click(copyButton()!)

          const alert = await screen.findByRole('dialog', { name: title })
          expect(alert).toHaveTextContent(message)
          expect(newWindow.close).toHaveBeenCalled()
          expect(newWindow.handle.location.assign).not.toHaveBeenCalled()
          expect(logger.error).toHaveBeenCalledWith('Failed to make a copy of the document', error)
          expect(copyButton()).not.toHaveAttribute('aria-busy', 'true')
          expect(modal().closest('.modal-two--out')).toBeNull()
        },
      )
    })

    describe('Restore this version', () => {
      afterEach(() => {
        mockNotifications.length = 0
        mockHeldRevisionFrames = undefined
        mockReplaceEditorState.mockImplementation(async () => {})
        mockLiveGetCurrentEditorState.mockImplementation(async () => LIVE_EDITOR_STATE)
      })

      function restoreButton() {
        return within(modal()).queryByTestId('restore-revision-by-replace')
      }

      /** The confirmation, which opens over the history */
      function confirmation() {
        return screen.getByRole('dialog', { name: 'Restore this version?' })
      }

      /** Opens the history as `role` on the older of two revisions, its view loaded */
      async function openOlderRevision(role: DocumentRole = 'Editor') {
        const fake = createSession()
        fake.mocks.getHistory.mockReturnValue(historyLog(15))
        const rendered = await renderRevealed(fake, { role })
        await userEvent.click(screen.getByRole('button', { name: 'See version history' }))
        await userEvent.click(timeline()[1])
        await waitFor(() => expect(mockRevisionStates).toHaveLength(2))
        return { fake, ...rendered }
      }

      /** Restores the selected revision, confirmed */
      async function restore() {
        await userEvent.click(restoreButton()!)
        expect(
          within(confirmation()).getByText(/Your current document will be replaced with this version\./),
        ).toBeInTheDocument()
        await userEvent.click(within(confirmation()).getByRole('button', { name: 'Restore' }))
      }

      /** Clicks the toast's Undo */
      async function undo(notification: MockNotification) {
        render(<>{notification.text}</>)
        await userEvent.click(screen.getByRole('button', { name: 'Undo' }))
      }

      test.each<DocumentRole>(['Editor', 'Admin'])(
        "shows for an %s on an older revision, never on the current version, before the view's exports",
        async (role) => {
          const fake = createSession()
          fake.mocks.getHistory.mockReturnValue(historyLog(15))
          await openHistory(fake, role)
          expect(restoreButton()).not.toBeInTheDocument()

          await userEvent.click(timeline()[1])

          await waitFor(() => expect(restoreButton()).toBeEnabled())
          expect(restoreButton()).toHaveTextContent('Restore this version')
          const buttons = within(modal())
            .getAllByRole('button')
            .map((button) => button.dataset.testid)
          expect(buttons.indexOf('restore-revision-by-replace')).toBeLessThan(buttons.indexOf('export-revision'))
        },
      )

      test('is hidden for a Viewer, who keeps the exports', async () => {
        await openOlderRevision('Viewer')

        expect(restoreButton()).not.toBeInTheDocument()
        expect(within(modal()).getByTestId('export-revision')).toBeInTheDocument()
      })

      test('hides as soon as a role read again while the history is open makes the user a Viewer', async () => {
        const { fake } = await openOlderRevision('Editor')
        expect(restoreButton()).toBeInTheDocument()

        mockGetNodeHierarchy.mockResolvedValue(hierarchy('Viewer'))
        act(() => fake.setSnapshot({ status: { name: 'opening' } }))
        act(() => fake.setSnapshot({ status: { name: 'connected' } }))

        await waitFor(() => expect(restoreButton()).not.toBeInTheDocument())
        expect(modal()).toBeInTheDocument()
      })

      test("is disabled until the view's editor exists", async () => {
        mockHeldRevisionFrames = []
        const fake = createSession()
        fake.mocks.getHistory.mockReturnValue(historyLog(15))
        await renderRevealed(fake, { role: 'Editor' })
        await userEvent.click(screen.getByRole('button', { name: 'See version history' }))
        await userEvent.click(timeline()[1])

        expect(restoreButton()).toBeDisabled()
        await userEvent.click(restoreButton()!)
        expect(screen.queryByRole('dialog', { name: 'Restore this version?' })).not.toBeInTheDocument()

        act(() => mockHeldRevisionFrames?.forEach((ready) => ready()))

        await waitFor(() => expect(restoreButton()).toBeEnabled())
      })

      test("confirmed, replaces the live editor's state with the view's, closes the history and offers Undo", async () => {
        await openOlderRevision()

        await restore()

        await waitFor(() => expect(mockReplaceEditorState).toHaveBeenCalledWith(REVISION_EDITOR_STATE))
        expect(mockLiveGetCurrentEditorState).toHaveBeenCalledTimes(1)
        expect(mockRevisionInvoker.getCurrentEditorState).toHaveBeenCalledTimes(1)
        // The live state is read before it is replaced
        expect(mockLiveGetCurrentEditorState.mock.invocationCallOrder[0]).toBeLessThan(
          mockReplaceEditorState.mock.invocationCallOrder[0],
        )
        await waitFor(() => expect(modal().closest('.modal-two--out')).not.toBeNull())
        expect(mockNotifications).toHaveLength(1)
        const [toast] = mockNotifications
        expect(toast).toEqual(expect.objectContaining({ type: 'success', expiration: 7500 }))
        render(<>{toast.text}</>)
        expect(screen.getByText(/Restored version to/)).toHaveTextContent(
          // The older revision's last entry, the tenth
          new Date(NOW - 6 * 60_000).toLocaleString('en-US', {
            year: '2-digit',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }),
        )
      })

      test('Undo gives the live editor back its state from before the restore, and says so', async () => {
        await openOlderRevision()
        await restore()
        await waitFor(() => expect(mockNotifications).toHaveLength(1))

        await undo(mockNotifications[0])

        await waitFor(() => expect(mockReplaceEditorState).toHaveBeenLastCalledWith(LIVE_EDITOR_STATE))
        expect(mockReplaceEditorState).toHaveBeenCalledTimes(2)
        expect(mockHideNotification).toHaveBeenCalled()
        await waitFor(() => expect(mockNotifications).toHaveLength(2))
        expect(mockNotifications[1]).toEqual(expect.objectContaining({ type: 'success', text: 'Undo successful' }))
      })

      test("the restore's edits, and Undo's, leave through the session as the editor's own do", async () => {
        const { fake } = await openOlderRevision()
        // The live editor sends what a replaced state changes, as any edit
        let edit = 10
        mockReplaceEditorState.mockImplementation(async () => {
          await mockClientHandler.editorRequestsPropagationOfUpdate(
            { type: { wrapper: 'du' }, content: new Uint8Array([edit++]) },
            BroadcastSource.DocumentBufferFlush,
          )
        })

        await restore()
        await waitFor(() => expect(fake.mocks.sendUpdate).toHaveBeenCalledWith(new Uint8Array([10])))

        await undo(mockNotifications[0])
        await waitFor(() => expect(fake.mocks.sendUpdate).toHaveBeenCalledWith(new Uint8Array([11])))
      })

      test('a confirmation submitted after the role was read again as Viewer restores nothing', async () => {
        const { fake } = await openOlderRevision('Editor')
        await userEvent.click(restoreButton()!)
        const dialog = confirmation()

        mockGetNodeHierarchy.mockResolvedValue(hierarchy('Viewer'))
        act(() => fake.setSnapshot({ status: { name: 'opening' } }))
        act(() => fake.setSnapshot({ status: { name: 'connected' } }))
        await waitFor(() => expect(restoreButton()).not.toBeInTheDocument())
        await userEvent.click(within(dialog).getByRole('button', { name: 'Restore' }))

        // The confirmation closes, gone once its exit animation ends, which jsdom never runs
        await waitFor(() => expect(dialog.closest('.modal-two--out')).not.toBeNull())
        expect(mockLiveGetCurrentEditorState).not.toHaveBeenCalled()
        expect(mockReplaceEditorState).not.toHaveBeenCalled()
        expect(mockNotifications).toEqual([])
      })

      // Every lock cause but the role, which the tests above cover: a locked editor's restore couldn't be saved
      test.each<[string, (fake: ReturnType<typeof createSession>) => void]>([
        [
          'a stopped session',
          (fake) => fake.setSnapshot({ status: { name: 'stopped', condition: 'transient', retryable: true } }),
        ],
        ['a failed delivery', (fake) => fake.setSnapshot({ delivery: 'failed' })],
        ['a size-locked document', (fake) => fake.setSnapshot({ editing: { allowed: false, reason: 'sizeLocked' } })],
        [
          'an incomplete base state',
          (fake) => fake.setSnapshot({ editing: { allowed: false, reason: 'incompleteBaseState' } }),
        ],
        [
          'an edit the SDK refused',
          (fake) => fake.emit('refusal', { reason: 'updateTooLarge', attemptedBytes: 2, limitBytes: 1 }),
        ],
        ['an editor at the participant limit', (fake) => fake.setSnapshot({ participants: users(20) })],
      ])('hides as soon as the live editor locks for %s, the history left open', async (_, lock) => {
        const { fake } = await openOlderRevision('Editor')
        expect(restoreButton()).toBeInTheDocument()

        act(() => lock(fake))

        await waitFor(() => expect(restoreButton()).not.toBeInTheDocument())
        expect(within(modal()).getByTestId('export-revision')).toBeInTheDocument()
      })

      test('stays for an Admin at the participant limit, who keeps editing', async () => {
        const { fake } = await openOlderRevision('Admin')

        act(() => fake.setSnapshot({ participants: users(20) }))

        expect(restoreButton()).toBeInTheDocument()
      })

      test('a confirmation submitted after the live editor locked restores nothing, with no toast', async () => {
        const { fake } = await openOlderRevision('Editor')
        await userEvent.click(restoreButton()!)
        const dialog = confirmation()

        act(() => fake.setSnapshot({ delivery: 'failed' }))
        await waitFor(() => expect(restoreButton()).not.toBeInTheDocument())
        await userEvent.click(within(dialog).getByRole('button', { name: 'Restore' }))

        await waitFor(() => expect(dialog.closest('.modal-two--out')).not.toBeNull())
        expect(mockLiveGetCurrentEditorState).not.toHaveBeenCalled()
        expect(mockReplaceEditorState).not.toHaveBeenCalled()
        expect(mockNotifications).toEqual([])
      })

      test('a lock that arrives while the restore reads the editors replaces nothing, with no toast', async () => {
        let answerRead: () => void = () => {}
        mockLiveGetCurrentEditorState.mockImplementation(
          () => new Promise((resolve) => (answerRead = () => resolve(LIVE_EDITOR_STATE))),
        )
        const { fake } = await openOlderRevision('Editor')

        await restore()
        await waitFor(() => expect(mockLiveGetCurrentEditorState).toHaveBeenCalled())
        act(() => fake.setSnapshot({ editing: { allowed: false, reason: 'sizeLocked' } }))
        await act(async () => answerRead())

        await waitFor(() => expect(mockRevisionInvoker.getCurrentEditorState).toHaveBeenCalled())
        await act(async () => {})
        expect(mockReplaceEditorState).not.toHaveBeenCalled()
        expect(mockNotifications).toEqual([])
        expect(modal().closest('.modal-two--out')).toBeNull()
      })

      test('Undo while the live editor is locked gives nothing back and keeps the toast, for a click once it lifts', async () => {
        const { fake } = await openOlderRevision()
        await restore()
        await waitFor(() => expect(mockNotifications).toHaveLength(1))
        expect(mockReplaceEditorState).toHaveBeenCalledTimes(1)

        // The history has closed: the page still has the lock for the toast's Undo
        act(() => fake.setSnapshot({ delivery: 'failed' }))
        await undo(mockNotifications[0])

        await act(async () => {})
        expect(mockReplaceEditorState).toHaveBeenCalledTimes(1)
        expect(mockHideNotification).not.toHaveBeenCalled()
        expect(mockNotifications).toHaveLength(1)

        act(() => fake.setSnapshot({ delivery: 'synced' }))
        await userEvent.click(screen.getByRole('button', { name: 'Undo' }))

        await waitFor(() => expect(mockReplaceEditorState).toHaveBeenLastCalledWith(LIVE_EDITOR_STATE))
        expect(mockHideNotification).toHaveBeenCalled()
      })

      test.each<[string, (rendered: Awaited<ReturnType<typeof openOlderRevision>>) => Promise<void> | void]>([
        [
          'the live editor failed',
          (_) => act(() => mockClientHandler.reportUserInterfaceError(new Error('The editor crashed'))),
        ],
        ['the page is gone', ({ unmount }) => unmount()],
      ])('Undo after %s gives nothing back', async (_, end) => {
        const rendered = await openOlderRevision()
        await restore()
        await waitFor(() => expect(mockNotifications).toHaveLength(1))

        await end(rendered)
        await undo(mockNotifications[0])

        await act(async () => {})
        expect(mockReplaceEditorState).toHaveBeenCalledTimes(1)
        expect(mockNotifications).toHaveLength(1)
      })

      test('an editor that gives no state restores nothing', async () => {
        mockLiveGetCurrentEditorState.mockImplementation(async () => undefined)
        await openOlderRevision()

        await restore()

        await waitFor(() => expect(mockLiveGetCurrentEditorState).toHaveBeenCalled())
        expect(mockReplaceEditorState).not.toHaveBeenCalled()
        expect(mockNotifications).toEqual([])
        expect(modal().closest('.modal-two--out')).toBeNull()
      })

      test('Cancel restores nothing and leaves the history open', async () => {
        await openOlderRevision()

        await userEvent.click(restoreButton()!)
        await userEvent.click(within(confirmation()).getByRole('button', { name: 'Cancel' }))

        expect(mockReplaceEditorState).not.toHaveBeenCalled()
        expect(mockNotifications).toEqual([])
        expect(modal().closest('.modal-two--out')).toBeNull()
        expect(restoreButton()).not.toHaveAttribute('aria-busy', 'true')
      })

      test('a failed restore is logged, and leaves the history open', async () => {
        const error = new Error('Editor did not answer replaceEditorState')
        mockReplaceEditorState.mockRejectedValueOnce(error)
        const { logger } = await openOlderRevision()

        await restore()

        await waitFor(() => expect(logger.error).toHaveBeenCalledWith('Failed to restore the version', error))
        expect(mockNotifications).toEqual([])
        expect(modal().closest('.modal-two--out')).toBeNull()
      })
    })
  })
})
