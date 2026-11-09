import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ConfigContext } from '@proton/app-context/configContext'
import { BroadcastSource } from '@proton/docs-shared/Bridge/BroadcastSource'
import type { RtsMessagePayload } from '@proton/docs-shared/Doc/RtsMessagePayload'
import type { NodeEntity } from '@proton/drive/sdk'
import type { ProtonConfig } from '@proton/shared/lib/interfaces/config'
import { decodeAwarenessUpdate, encodeAwarenessUpdate } from '@proton-docs/realtime-sdk'
import type { SessionStatus } from '@proton-docs/realtime-sdk'
import type { ReactNode } from 'react'

import { ApplicationProvider, type ApplicationProviderProps } from '~/utils/application-context'
import { DebugModeProvider } from '~/utils/debug-mode-context'

import type { ClientHandler } from '../__utils/createClientHandler'
import { createFakeSession } from '../__utils/createFakeSession'
import type { DocumentSessionState } from '../__utils/useDocumentSession'
import { DocumentViewerV2 } from './DocumentViewerV2'

let mockSessionState: DocumentSessionState = { status: 'loading' }
jest.mock('../__utils/useDocumentSession', () => ({ useDocumentSession: () => mockSessionState }))
jest.mock('../__utils/useRealtimeClient', () => ({ useRealtimeClient: () => ({}) }))
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
jest.mock('./DocumentHeaderV2', () => ({
  DocumentHeaderV2: ({
    node,
    role,
    editorInvoker,
  }: {
    node: { uid: string }
    role: string
    editorInvoker?: object
  }) => <div>{`Header for ${node.uid} as ${role}, ${editorInvoker ? 'with' : 'without'} the editor`}</div>,
}))

jest.mock('./OpenActionError', () => ({
  OpenActionError: ({ reason }: { reason: string }) => <div>{`Open failed: ${reason}`}</div>,
}))

const mockEditorCalls: string[] = []
const mockDestroyBridge = jest.fn()
const mockLoadUserSettings = jest.fn(async () => {})
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
        changeLockedState: jest.fn(async () => {}),
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

function renderViewer(fake: ReturnType<typeof createFakeSession>) {
  mockSessionState = {
    status: 'ready',
    session: fake.session,
    role: 'Viewer',
    node: { uid: 'VOLUME~LINK' } as NodeEntity,
  }
  const application = {
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  } as unknown as ApplicationProviderProps['application']

  return render(
    <ConfigContext.Provider value={{ APP_VERSION: '0.0.0' } as ProtonConfig}>
      <ApplicationProvider application={application}>
        <DebugModeProvider>
          <DocumentViewerV2 nodeMeta={{ volumeId: 'VOLUME', linkId: 'LINK' }} onRetry={jest.fn()} />
        </DebugModeProvider>
      </ApplicationProvider>
    </ConfigContext.Provider>,
  )
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
    [{ name: 'stopped', condition: 'transient', retryable: true }, 'The connection to the server was lost.'],
  ])('keeps loading while %j before catching up, and shows "%s"', async (status, text) => {
    const fake = createSession()
    renderViewer(fake)
    await waitFor(() => expect(fake.mocks.connect).toHaveBeenCalled())

    act(() => fake.setSnapshot({ status }))
    await act(async () => {})

    expect(screen.getByTestId('session-status')).toHaveTextContent(text)
    expect(mockEditorCalls).not.toContain('initializeEditor')
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
            <DocumentViewerV2 nodeMeta={{ volumeId: 'VOLUME', linkId: 'LINK' }} onRetry={jest.fn()} />
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
    }
    rerender(viewer())

    await waitFor(() =>
      expect(screen.getByTestId('shell-header')).toHaveTextContent('Header for VOLUME~LINK as Editor, with the editor'),
    )
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
})
