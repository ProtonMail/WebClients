import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ConfigContext } from '@proton/app-context/configContext'
import { BroadcastSource } from '@proton/docs-shared/Bridge/BroadcastSource'
import type { RtsMessagePayload } from '@proton/docs-shared/Doc/RtsMessagePayload'
import type { DriveCompat } from '@proton/drive-store/lib/useDriveCompat'
import type { NodeEntity } from '@proton/drive/sdk'
import type { ProtonConfig } from '@proton/shared/lib/interfaces/config'
import { decodeAwarenessUpdate, encodeAwarenessUpdate } from '@proton-docs/realtime-sdk'
import type { Participant, RecoveryCondition, SessionStatus } from '@proton-docs/realtime-sdk'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { CompatRouter } from 'react-router-dom-v5-compat'

import { ApplicationProvider, type ApplicationProviderProps } from '~/utils/application-context'
import { DebugModeProvider } from '~/utils/debug-mode-context'

import { ClientEditorBridge } from '../__utils/ClientEditorBridge'
import type { ClientHandler } from '../__utils/createClientHandler'
import { createFakeSession } from '../__utils/createFakeSession'
import type { DocumentRole } from '../__utils/getDocumentRole'
import { DocsLoadMark } from '../__utils/loadMarks'
import { docsLoadMarks, withNodePerformance } from '../__utils/loadMarksTesting'
import type { DocumentSessionState } from '../__utils/useDocumentSession'
import type { DocumentDebugMenuProps } from './DocumentDebugMenu'
import { DocumentViewerV2 } from './DocumentViewerV2'

let mockSessionState: DocumentSessionState = { status: 'loading' }
jest.mock('../__utils/useDocumentSession', () => ({ useDocumentSession: () => mockSessionState }))
const mockRealtimeClient = { seedInitialCommit: jest.fn() }
jest.mock('../__utils/useRealtimeClient', () => ({ useRealtimeClient: () => mockRealtimeClient }))
jest.mock('@proton/components/hooks/useAuthentication', () => () => ({ UID: 'session-uid' }))
const mockIsFlagEnabled = () => false
jest.mock('@proton/unleash/useGetFlag', () => ({ useGetFlag: () => mockIsFlagEnabled }))
jest.mock('@proton/app-context/useNotifications', () => ({
  useNotifications: () => ({ createNotification: jest.fn() }),
}))

jest.mock('~/utils/flags', () => ({ useIsDarkThemeEnabled: () => false }))
jest.mock('~/drive-sdk/event-subscriber', () => ({
  getEventSubscriber: () => ({ initialize: async () => {}, reset: () => {} }),
}))
jest.mock('@proton/account/userSettings/hooks', () => ({ useGetUserSettings: () => async () => ({ Locale: 'fr_FR' }) }))
jest.mock('@proton/account/user/hooks', () => ({
  useUser: () => [{ DisplayName: 'Alice', Name: 'alice', Email: 'alice@example.com' }],
}))
// The app shell and the header need the whole app around them; the header has its own tests
jest.mock('./DocumentShell', () => ({
  DocumentShell: ({ header, children }: { header: ReactNode; children: ReactNode }) => (
    <>
      <div data-testid="shell-header">{header}</div>
      {children}
    </>
  ),
}))
jest.mock('./ErrorHeader', () => ({ ErrorHeader: () => null }))
// The file actions have their own tests; here, that the viewer feeds them and routes the file menu to them
const mockFileActions = {
  trashState: 'not_trashed',
  isCreatingSpreadsheet: false,
  isMakingACopy: false,
  newDocument: jest.fn(),
  newSpreadsheet: jest.fn(),
  makeACopy: jest.fn(),
  moveToFolder: jest.fn(),
  moveToTrash: jest.fn(),
  openProtonDrive: jest.fn(),
  modals: <div>File action modals</div>,
}
const mockUseDocumentFileActions = jest.fn(
  (_options: unknown): Omit<typeof mockFileActions, 'trashState'> & { trashState: string } => mockFileActions,
)
jest.mock('../__utils/useDocumentFileActions', () => ({
  useDocumentFileActions: (options: unknown) => mockUseDocumentFileActions(options),
}))
const DRIVE_COMPAT = { name: 'driveCompat' } as unknown as DriveCompat
const mockApi = jest.fn(async (_request: unknown): Promise<unknown> => ({}))
jest.mock('@proton/app-context/useApi', () => ({ useApi: () => mockApi }))
jest.mock('./DocumentHeaderV2', () => ({
  DocumentHeaderV2: ({
    node,
    role,
    editorInvoker,
    exportInvoker,
    status,
  }: {
    node: { uid: string }
    role: string
    editorInvoker?: object
    exportInvoker?: object
    status?: ReactNode
  }) => (
    <div>
      {`Header for ${node.uid} as ${role}, ${editorInvoker ? 'with' : 'without'} the editor`}
      <span data-testid="header-exports">{exportInvoker ? 'exports enabled' : 'exports disabled'}</span>
      {status}
    </div>
  ),
}))
// Each has its own tests; here, what the viewer asks of them
const mockExportAndDownload = jest.fn(async (..._args: unknown[]) => {})
jest.mock('../__utils/downloadExport', () => ({
  exportAndDownload: (...args: unknown[]) => mockExportAndDownload(...args),
}))
const mockFetchExternalImageAsBase64 = jest.fn(async (..._args: unknown[]) => 'data:image/png;base64,iVBORw0K')
jest.mock('../__utils/fetchExternalImageAsBase64', () => ({
  fetchExternalImageAsBase64: (...args: unknown[]) => mockFetchExternalImageAsBase64(...args),
}))

// It has its own tests; here, that debug mode gates it and what the viewer gives it
let mockDebugMenuProps: DocumentDebugMenuProps | undefined
jest.mock('./DocumentDebugMenu', () => ({
  DocumentDebugMenu: (props: DocumentDebugMenuProps) => {
    mockDebugMenuProps = props
    return <div>Debug menu</div>
  },
}))

jest.mock('./OpenActionError', () => ({
  OpenActionError: ({ reason, onRetry }: { reason: string; onRetry?: () => void }) => (
    <div>
      {`Open failed: ${reason}`}
      {onRetry && <button onClick={onRetry}>Try again</button>}
    </div>
  ),
}))
// It has its own tests; here, only which failure it gets and that Reload opens the document again
jest.mock('./BootstrapErrorPage', () => ({
  BootstrapErrorPage: ({ failure, onRetry }: { failure: string; onRetry: () => void }) => (
    <div>
      {`Bootstrap failed: ${failure}`}
      <button onClick={onRetry}>Try again</button>
    </div>
  ),
}))

const mockEditorCalls: string[] = []
const mockChangeLockedState = jest.fn(async (_locked: boolean) => {})
const mockDestroyBridge = jest.fn()
const mockLoadUserSettings = jest.fn(async () => {})
const mockPrintAsPDF = jest.fn(async () => {})
const EDITOR_CLIENT_ID = 7
const mockReceiveMessage = jest.fn(async ({ content }: RtsMessagePayload) => {
  mockEditorCalls.push(`receiveMessage:${content[0]}`)
})
let mockClientHandler: ClientHandler
jest.mock('../__utils/ClientEditorBridge', () => ({
  ClientEditorBridge: jest.fn().mockImplementation((_frame, clientHandler: ClientHandler) => {
    mockClientHandler = clientHandler
    return {
      editorInvoker: {
        initializeEditor: jest.fn(async () => {
          mockEditorCalls.push('initializeEditor')
        }),
        receiveMessage: mockReceiveMessage,
        showEditor: jest.fn(async () => {
          mockEditorCalls.push('showEditor')
        }),
        changeLockedState: mockChangeLockedState,
        setDarkMode: jest.fn(async () => {}),
        loadUserSettings: mockLoadUserSettings,
        syncProperty: jest.fn(async (property: string) => {
          mockEditorCalls.push(`syncProperty:${property}`)
        }),
        setTableOfContentsVisible: jest.fn(async () => {}),
        getClientId: jest.fn(async () => EDITOR_CLIENT_ID),
        broadcastPresenceState: jest.fn(async () => {
          mockEditorCalls.push('broadcastPresenceState')
        }),
        printAsPDF: mockPrintAsPDF,
      },
      destroy: mockDestroyBridge,
    }
  }),
}))
jest.mock('~/components/document/EditorFrame', () => {
  const { useEffect } = jest.requireActual('react')
  return {
    EditorFrame: ({ onFrameReady }: { onFrameReady: (frame: HTMLIFrameElement) => void }) => {
      useEffect(() => onFrameReady(document.createElement('iframe')), [onFrameReady])
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

function renderViewer(
  fake: ReturnType<typeof createFakeSession>,
  {
    role = 'Viewer',
    onRetry = jest.fn(),
    state,
    downloadOnOpen,
    onDownloadedOnOpen,
  }: {
    role?: DocumentRole
    onRetry?: () => void
    state?: DocumentSessionState
    downloadOnOpen?: boolean
    onDownloadedOnOpen?: () => void
  } = {},
) {
  mockSessionState = state ?? {
    status: 'ready',
    session: fake.session,
    role,
    node: { uid: 'VOLUME~LINK', name: 'Plans' } as unknown as NodeEntity,
    roleReads: 1,
  }
  const application = {
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  } as unknown as ApplicationProviderProps['application']
  const viewer = () => (
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
              />
            </DebugModeProvider>
          </ApplicationProvider>
        </ConfigContext.Provider>
      </CompatRouter>
    </MemoryRouter>
  )

  const rendered = render(viewer())
  return { ...rendered, rerender: () => rendered.rerender(viewer()), logger: application.logger }
}

/** Renders a viewer whose editor shows the document, its Lexical editor rendered */
async function renderShown(fake: ReturnType<typeof createFakeSession>, options?: Parameters<typeof renderViewer>[1]) {
  const rendered = renderViewer(fake, options)
  await waitFor(() => expect(fake.mocks.connect).toHaveBeenCalled())
  act(() => fake.setSnapshot({ status: { name: 'connected' }, caughtUp: true }))
  await waitFor(() => expect(mockEditorCalls).toContain('showEditor'))
  act(() => mockClientHandler.updateFrameSize(480))
  return rendered
}

describe('DocumentViewerV2', () => {
  afterEach(() => {
    mockEditorCalls.length = 0
    jest.clearAllMocks()
  })

  test('connects once the editor holds the base state, and shows the editor only once the session catches up', async () => {
    const fake = createSession()
    renderViewer(fake)
    await waitFor(() => expect(fake.mocks.connect).toHaveBeenCalled())

    act(() => {
      fake.setSnapshot({ status: { name: 'connected' } })
      fake.emit('update', update(REPLAYED_UPDATE))
    })
    await act(async () => {})

    const beforeCatchUp = [
      `receiveMessage:${BASE_UPDATE}`,
      'syncProperty:suggestionsEnabled',
      'syncProperty:userName',
      `receiveMessage:${REPLAYED_UPDATE}`,
    ]
    expect(mockEditorCalls).toEqual(beforeCatchUp)

    act(() => fake.setSnapshot({ caughtUp: true }))

    await waitFor(() =>
      expect(mockEditorCalls).toEqual([...beforeCatchUp, 'initializeEditor', 'showEditor', 'broadcastPresenceState']),
    )
  })

  describe('load marks', () => {
    const performanceSpy = withNodePerformance()

    test('marks the frame ready, the base state sent, then caught up, once each: a rebootstrap that catches up again marks nothing', async () => {
      const fake = createSession()
      renderViewer(fake)
      await waitFor(() => expect(fake.mocks.connect).toHaveBeenCalled())

      expect(docsLoadMarks()).toEqual([DocsLoadMark.FrameReady, DocsLoadMark.BaseStateSent])

      act(() => fake.setSnapshot({ status: { name: 'connected' }, caughtUp: true }))
      await waitFor(() => expect(mockEditorCalls).toContain('showEditor'))
      const marks = performance.getEntriesByType('mark')

      expect(docsLoadMarks()).toEqual([
        DocsLoadMark.FrameReady,
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
          DocsLoadMark.BaseStateSent,
          DocsLoadMark.CaughtUp,
          DocsLoadMark.EditorShown,
          DocsLoadMark.EditorEditable,
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
      const { editorInvoker } = jest.mocked(ClientEditorBridge).mock.results.at(-1)!.value
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

      act(() => mockClientHandler.updateFrameSize(480))

      expect(docsLoadMarks().slice(-2)).toEqual([DocsLoadMark.EditorShown, DocsLoadMark.EditorEditable])
    })

    test('marks the base state sent for the live run only, not for one a new session cut short', async () => {
      const resolvers: (() => void)[] = []
      // Each run's one base update waits for the test to answer it
      const pending = () => new Promise<void>((resolve) => resolvers.push(resolve))
      mockReceiveMessage.mockImplementationOnce(pending).mockImplementationOnce(pending)
      const first = createSession()
      const { rerender } = renderViewer(first)
      await waitFor(() => expect(resolvers).toHaveLength(1))

      const second = createSession()
      mockSessionState = { ...mockSessionState, session: second.session } as DocumentSessionState
      rerender()
      await waitFor(() => expect(resolvers).toHaveLength(2))
      await act(async () => resolvers[0]())

      expect(docsLoadMarks()).toEqual([DocsLoadMark.FrameReady])

      await act(async () => resolvers[1]())

      expect(docsLoadMarks()).toEqual([DocsLoadMark.FrameReady, DocsLoadMark.BaseStateSent])
    })

    test('shows the document in a browser that places no marks', async () => {
      performanceSpy().mockRestore()
      expect(performance.mark).toBeUndefined()

      await renderShown(createSession())

      expect(mockEditorCalls).toContain('showEditor')
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

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    act(() => fake.setSnapshot({ status: { name: 'connected' }, caughtUp: true }))

    expect(fake.mocks.retry).toHaveBeenCalled()
    await waitFor(() => expect(mockEditorCalls).toContain('showEditor'))
  })

  test('shows no header while the session loads, then the header for its node and role, with the editor once there', async () => {
    mockSessionState = { status: 'loading' }
    const application = {
      logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    } as unknown as ApplicationProviderProps['application']
    const viewer = () => (
      <ConfigContext.Provider value={{ APP_VERSION: '0.0.0' } as ProtonConfig}>
        <ApplicationProvider application={application}>
          <DebugModeProvider>
            <DocumentViewerV2
              nodeMeta={{ volumeId: 'VOLUME', linkId: 'LINK' }}
              driveCompat={DRIVE_COMPAT}
              onRetry={jest.fn()}
            />
          </DebugModeProvider>
        </ApplicationProvider>
      </ConfigContext.Provider>
    )
    const { rerender } = render(viewer())
    expect(screen.getByTestId('shell-header')).toBeEmptyDOMElement()

    const fake = createSession()
    mockSessionState = {
      status: 'ready',
      session: fake.session,
      role: 'Editor',
      node: { uid: 'VOLUME~LINK' } as NodeEntity,
      roleReads: 1,
    }
    rerender(viewer())

    await waitFor(() =>
      expect(screen.getByTestId('shell-header')).toHaveTextContent('Header for VOLUME~LINK as Editor, with the editor'),
    )
  })

  test.each<[DocumentRole, boolean]>([
    ['Editor', true],
    ['Admin', false],
  ])('with 20 users, a %s is locked: %s, and below 20 nobody is', async (role, lockedAtLimit) => {
    const fake = createSession()
    renderViewer(fake, { role })
    await waitFor(() => expect(mockChangeLockedState).toHaveBeenLastCalledWith(false))

    act(() => fake.setSnapshot({ participants: users(20) }))
    await waitFor(() => expect(mockChangeLockedState).toHaveBeenLastCalledWith(lockedAtLimit))

    act(() => fake.setSnapshot({ participants: users(19) }))
    await waitFor(() => expect(mockChangeLockedState).toHaveBeenLastCalledWith(false))
  })

  test("gives a private Viewer's editor their user settings, as /doc does", async () => {
    renderViewer(createSession())

    await waitFor(() => expect(mockLoadUserSettings).toHaveBeenCalledWith({ Locale: 'fr_FR' }))
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

  test("records the base state, received updates and the editor's own, which it sends, for the debug menu", async () => {
    localStorage.setItem('proton-docs-debug', 'true')
    const fake = createSession()
    await renderShown(fake, { role: 'Editor' })

    act(() => fake.emit('update', update(REPLAYED_UPDATE)))
    await act(() =>
      mockClientHandler.editorRequestsPropagationOfUpdate(
        { type: { wrapper: 'du' }, content: new Uint8Array([3]) },
        BroadcastSource.DocumentBufferFlush,
      ),
    )

    expect(fake.mocks.sendUpdate).toHaveBeenCalledWith(new Uint8Array([3]))
    expect(mockDebugMenuProps?.session).toBe(fake.session)
    expect(mockDebugMenuProps?.recorder.getUpdates().map(({ origin, content }) => [origin, content[0]])).toEqual([
      ['baseState', BASE_UPDATE],
      ['received', REPLAYED_UPDATE],
      ['sent', 3],
    ])
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
    expect(mockUseDocumentFileActions).toHaveBeenLastCalledWith({
      node: { uid: 'VOLUME~LINK', name: 'Plans' },
      role: 'Admin',
      driveCompat: DRIVE_COMPAT,
      client: mockRealtimeClient,
      exportInvoker: undefined,
    })
  })

  describe('a document opened in the trash', () => {
    const trashedNode = { uid: 'VOLUME~LINK', trashTime: new Date(0) } as NodeEntity

    test('shows the header for its role and the file actions, with no session', async () => {
      renderViewer(createSession(), { state: { status: 'trashed', role: 'Admin', node: trashedNode } })

      expect(await screen.findByText('Header for VOLUME~LINK as Admin, without the editor')).toBeInTheDocument()
      expect(screen.getByText('File action modals')).toBeInTheDocument()
      await act(async () => {})
      // No session, so no editor bridge
      expect(ClientEditorBridge).not.toHaveBeenCalled()
      expect(mockUseDocumentFileActions).toHaveBeenLastCalledWith(
        expect.objectContaining({ node: trashedNode, role: 'Admin' }),
      )
    })

    test('opens once out of the trash, restored here or elsewhere', async () => {
      const onRetry = jest.fn()
      mockUseDocumentFileActions.mockReturnValue({ ...mockFileActions, trashState: 'trashed' })
      const { rerender } = renderViewer(createSession(), {
        onRetry,
        state: { status: 'trashed', role: 'Admin', node: trashedNode },
      })
      await screen.findByText('File action modals')
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
    const bridges = jest.mocked(ClientEditorBridge).mock.calls.length
    const moveToTrash = jest.fn()
    mockUseDocumentFileActions.mockReturnValue({ ...mockFileActions, moveToTrash })

    rerender()
    await act(() => mockClientHandler.handleFileMenuAction({ type: 'move-to-trash' }))

    expect(moveToTrash).toHaveBeenCalledTimes(1)
    expect(jest.mocked(ClientEditorBridge).mock.calls.length).toBe(bridges)
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
    expect(mockEditorCalls).not.toContain('initializeEditor')
  })
  test.each<[DocumentSessionState & { status: 'failed' }, string, boolean]>([
    [{ status: 'failed', reason: 'noAccess' }, 'Bootstrap failed: noAccess', true],
    [{ status: 'failed', reason: 'notFound' }, 'Bootstrap failed: notFound', true],
    [{ status: 'failed', reason: 'unreachable' }, 'Bootstrap failed: unreachable', true],
    [{ status: 'failed', reason: 'bootstrapFailed' }, 'Bootstrap failed: bootstrapFailed', true],
    [{ status: 'failed', reason: 'unreadableUpdate' }, 'Open failed: unreadableUpdate', true],
    [{ status: 'failed', reason: 'unsupported' }, 'Open failed: unsupported', false],
  ])('a session that failed with %j shows "%s", given a retry: %s', async (state, text, canRetry) => {
    const onRetry = jest.fn()
    renderViewer(createSession(), { onRetry, state })

    expect(screen.getByText(text)).toBeInTheDocument()
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
      const onRetry = jest.fn()
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

  test('a role read again locks or unlocks the editor, and applies the lock again when unchanged, without initializing it again', async () => {
    const fake = createSession()
    const { rerender } = await renderShown(fake, { role: 'Editor' })
    await waitFor(() => expect(mockChangeLockedState).toHaveBeenLastCalledWith(false))
    mockChangeLockedState.mockClear()

    mockSessionState = {
      ...(mockSessionState as DocumentSessionState & { status: 'ready' }),
      role: 'Viewer',
      roleReads: 2,
    }
    rerender()
    await waitFor(() => expect(mockChangeLockedState).toHaveBeenLastCalledWith(true))
    expect(screen.getByTestId('shell-header')).toHaveTextContent('as Viewer')

    mockChangeLockedState.mockClear()
    mockSessionState = { ...mockSessionState, roleReads: 3 }
    rerender()
    await waitFor(() => expect(mockChangeLockedState).toHaveBeenCalledWith(true))

    mockSessionState = { ...mockSessionState, role: 'Editor', roleReads: 4 }
    rerender()
    await waitFor(() => expect(mockChangeLockedState).toHaveBeenLastCalledWith(false))

    expect(mockEditorCalls.filter((call) => call === 'initializeEditor')).toHaveLength(1)
  })

  describe('print, download and export', () => {
    test("enables the title menu's exports only once the editor shows the document and its editor is rendered", async () => {
      const fake = createSession()
      renderViewer(fake)
      await waitFor(() => expect(fake.mocks.connect).toHaveBeenCalled())
      expect(screen.getByTestId('header-exports')).toHaveTextContent('exports disabled')

      act(() => fake.setSnapshot({ status: { name: 'connected' }, caughtUp: true }))
      await waitFor(() => expect(mockEditorCalls).toContain('showEditor'))
      await act(async () => {})
      // Shown, but the editor would answer an export with "Could not export data" until its Lexical editor exists
      expect(screen.getByTestId('header-exports')).toHaveTextContent('exports disabled')

      expect(mockUseDocumentFileActions).toHaveBeenLastCalledWith(expect.objectContaining({ exportInvoker: undefined }))

      act(() => mockClientHandler.updateFrameSize(480))

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
      const onDownloadedOnOpen = jest.fn()
      renderViewer(fake, { downloadOnOpen: true, onDownloadedOnOpen })
      await waitFor(() => expect(fake.mocks.connect).toHaveBeenCalled())
      expect(mockExportAndDownload).not.toHaveBeenCalled()

      act(() => fake.setSnapshot({ status: { name: 'connected' }, caughtUp: true }))
      await waitFor(() => expect(mockEditorCalls).toContain('showEditor'))
      await act(async () => {})
      expect(mockExportAndDownload).not.toHaveBeenCalled()

      act(() => mockClientHandler.updateFrameSize(480))
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
})
