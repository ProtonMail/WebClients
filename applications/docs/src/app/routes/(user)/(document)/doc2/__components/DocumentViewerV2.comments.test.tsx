import type { Mock } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ConfigContext } from '@proton/app-context/configContext'
import { CommentThreadState } from '@proton/docs-shared/CommentThreadState'
import { DocsApiError } from '@proton-docs/realtime-sdk'
import type { DriveCompat } from '@proton/drive-store/lib/useDriveCompat'
import { MemberRole, getDrive } from '@proton/drive/sdk'
import { PROTON_DOCS_DOCUMENT_MIMETYPE } from '@proton/shared/lib/helpers/mimetype'
import type { ProtonConfig } from '@proton/shared/lib/interfaces/config'
import type * as ReactModule from 'react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { CompatRouter } from 'react-router-dom-v5-compat'

import { ApplicationProvider, type ApplicationProviderProps } from '~/utils/application-context'
import { DebugModeProvider } from '~/utils/debug-mode-context'

import type { ClientHandler } from '../__utils/createClientHandler'
import { createFakeSession, fakeThread } from '../__utils/createFakeSession'
import type { DocumentRole } from '../__utils/getDocumentRole'
import { DocumentViewerV2 } from './DocumentViewerV2'

// The comments on the page: the real header and comments button, the session's comments faked, and the editor a fake
// invoker
const mockRealtimeClient = {
  createSession: vi.fn(),
  prefetchBootstrap: () => ({ confirm: () => {}, end: () => {} }),
}
vi.mock('../__utils/useRealtimeClient', () => ({ useRealtimeClient: () => mockRealtimeClient }))
vi.mock('@proton/app-context/useApi', () => ({ useApi: () => vi.fn() }))
vi.mock('@proton/drive/sdk', async () => ({ ...(await vi.importActual('@proton/drive/sdk')), getDrive: vi.fn() }))
vi.mock('@proton/components/hooks/useAuthentication', () => ({ default: () => ({ UID: 'session-uid' }) }))
vi.mock('@proton/unleash/useGetFlag', () => ({ useGetFlag: () => () => false }))
const mockCreateNotification = vi.fn()

/** What a notification shows, as the user reads it */
function shownText(options: { text: ReactNode }) {
  return render(<>{options.text}</>).container.textContent
}
vi.mock('@proton/app-context/useNotifications', () => ({
  useNotifications: () => ({ createNotification: mockCreateNotification }),
}))
const mockFlags = new Set<string>()
vi.mock('@proton/unleash/useFlag', () => ({ useFlag: (flag: string) => mockFlags.has(flag) }))
let mockIsLocalEnvironment = false
vi.mock('@proton/shared/lib/env', async () => ({
  ...(await vi.importActual('@proton/shared/lib/env')),
  isLocalEnvironment: () => mockIsLocalEnvironment,
}))
vi.mock('~/utils/flags', () => ({ useIsDarkThemeEnabled: () => false }))
vi.mock('~/drive-sdk/event-subscriber', () => ({
  getEventSubscriber: () => ({ initialize: async () => {}, reset: () => {} }),
}))
vi.mock('@proton/account/userSettings/hooks', () => ({ useGetUserSettings: () => async () => ({ Locale: 'fr_FR' }) }))
vi.mock('@proton/account/user/hooks', () => ({
  useUser: () => [{ DisplayName: 'Alice', Name: 'alice', Email: 'alice@example.com' }],
}))
vi.mock('./DocumentShell', () => ({
  DocumentShell: ({ header, children }: { header: ReactNode; children: ReactNode }) => (
    <>
      {header}
      {children}
    </>
  ),
}))
// The header's other parts need the whole app; they have their own tests
vi.mock('@proton/components/containers/heading/UserDropdown', () => ({ default: () => <div>User menu</div> }))
vi.mock('~/components/document/DocumentViewer/WorkspacePromoBanner', () => ({ WorkspacePromoBanner: () => null }))
vi.mock('./DocumentTitleMenu', () => ({ DocumentTitleMenu: () => <div>Title menu</div> }))
vi.mock('@proton/drive/public/sharingModal', () => ({
  useSharingModal: () => ({ sharingModal: null, showSharingModal: vi.fn() }),
}))
vi.mock('../__utils/useDocumentFileActions', () => ({
  useDocumentFileActions: () => ({ trashState: 'not_trashed', isCreatingSpreadsheet: false, isMakingACopy: false }),
}))

const COMMENT_PUSHES = [
  'showCommentsPanel',
  'handleCommentsChange',
  'handleTypingStatusChange',
  'handleCreateCommentMarkNode',
  'handleRemoveCommentMarkNode',
  'handleResolveCommentMarkNode',
  'handleUnresolveCommentMarkNode',
] as const
const mockEditor: Record<string, Mock> = {}
let mockClientHandler: ClientHandler
vi.mock('../__utils/ClientEditorBridge', () => ({
  ClientEditorBridge: vi.fn().mockImplementation(function (_frame: HTMLIFrameElement, clientHandler: ClientHandler) {
    mockClientHandler = clientHandler
    return { editorInvoker: mockEditor, destroy: vi.fn() }
  }),
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

function resetEditor() {
  const calls = [
    'initializeEditor',
    'receiveMessage',
    'showEditor',
    'changeLockedState',
    'setDarkMode',
    'loadUserSettings',
    'syncProperty',
    'setTableOfContentsVisible',
    'broadcastPresenceState',
    ...COMMENT_PUSHES,
  ]
  calls.forEach((call) => (mockEditor[call] = vi.fn(async () => {})))
  mockEditor.getClientId = vi.fn(async () => 7)
}

const ROLES = { Admin: MemberRole.Admin, Editor: MemberRole.Editor, Viewer: MemberRole.Viewer }
const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }

function renderViewer(role: DocumentRole, { withComments = true } = {}) {
  const fake = createFakeSession()
  if (!withComments) {
    Object.assign(fake.mocks, { comments: undefined })
  }
  mockDriveRole(role)
  mockRealtimeClient.createSession.mockReturnValue(fake.session)
  const application = { logger } as unknown as ApplicationProviderProps['application']
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
                driveCompat={{} as DriveCompat}
                onRetry={vi.fn()}
              />
            </DebugModeProvider>
          </ApplicationProvider>
        </ConfigContext.Provider>
      </CompatRouter>
    </MemoryRouter>
  )
  const { rerender } = render(viewer())
  return { ...fake, rerender: () => rerender(viewer()) }
}

/** The user's role on the document, as the node's hierarchy gives it */
function mockDriveRole(role: DocumentRole) {
  vi.mocked(getDrive).mockReturnValue({
    getNodeHierarchy: async () => [
      { uid: 'ROOT', directRole: MemberRole.Inherited },
      {
        uid: 'VOLUME~LINK',
        name: { ok: true, value: 'Plans' },
        mediaType: PROTON_DOCS_DOCUMENT_MIMETYPE,
        directRole: ROLES[role],
      },
    ],
  } as unknown as ReturnType<typeof getDrive>)
}

/** Renders the viewer and takes it to the Reveal Point */
async function renderRevealed(role: DocumentRole = 'Editor') {
  const fake = renderViewer(role)
  await waitFor(() => expect(fake.mocks.connect).toHaveBeenCalled())
  act(() => fake.setSnapshot({ status: { name: 'connected' }, caughtUp: true }))
  await waitFor(() => expect(mockEditor.showEditor).toHaveBeenCalled())
  await act(async () => mockClientHandler.updateFrameSize(480))
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Comments' }) ?? undefined).not.toBeDisabled())
  return fake
}

describe('DocumentViewerV2 comments', () => {
  beforeEach(() => {
    resetEditor()
    mockFlags.clear()
    mockIsLocalEnvironment = false
  })

  afterEach(() => vi.clearAllMocks())

  test('the comments button is disabled until the editor shows the document, then opens the comments panel', async () => {
    const fake = renderViewer('Editor')
    await waitFor(() => expect(fake.mocks.connect).toHaveBeenCalled())

    expect(screen.getByRole('button', { name: 'Comments' })).toBeDisabled()

    act(() => fake.setSnapshot({ status: { name: 'connected' }, caughtUp: true }))
    await waitFor(() => expect(mockEditor.showEditor).toHaveBeenCalled())
    await act(async () => mockClientHandler.updateFrameSize(480))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Comments' })).toBeEnabled())

    await userEvent.click(screen.getByRole('button', { name: 'Comments' }))

    expect(mockEditor.showCommentsPanel).toHaveBeenCalledTimes(1)
  })

  test.each<DocumentRole>(['Editor', 'Admin'])('a %s has the comments button, and comments on', async (role) => {
    await renderRevealed(role)

    expect(screen.getByRole('button', { name: 'Comments' })).toBeEnabled()
    expect(mockRealtimeClient.createSession).toHaveBeenCalledWith(
      expect.objectContaining({ comments: { getDocumentNameForEmails: expect.any(Function) } }),
    )
    const [{ comments }] = mockRealtimeClient.createSession.mock.calls[0]
    expect(comments.getDocumentNameForEmails()).toBe('Plans')
  })

  test('a viewer has no comments button, and comments off', async () => {
    const fake = renderViewer('Viewer')
    await waitFor(() => expect(fake.mocks.connect).toHaveBeenCalled())

    expect(screen.queryByRole('button', { name: 'Comments' })).not.toBeInTheDocument()
    expect(mockRealtimeClient.createSession).toHaveBeenCalledWith(
      expect.not.objectContaining({ comments: expect.anything() }),
    )
  })

  test('a session without comments, as for a viewer made an editor after it opened, has no comments button', async () => {
    const fake = renderViewer('Editor', { withComments: false })
    await waitFor(() => expect(fake.mocks.connect).toHaveBeenCalled())
    act(() => fake.setSnapshot({ status: { name: 'connected' }, caughtUp: true }))
    await waitFor(() => expect(mockEditor.showEditor).toHaveBeenCalled())
    await act(async () => mockClientHandler.updateFrameSize(480))
    await waitFor(() => expect(mockEditor.changeLockedState).toHaveBeenCalled())

    expect(screen.queryByRole('button', { name: 'Comments' })).not.toBeInTheDocument()
    expect(await mockClientHandler.getAllThreads()).toEqual([])
    expect(await mockClientHandler.editComment('thread-1', 'comment-1', 'Edited')).toBe(false)
  })

  test('an editor made a viewer after a rebootstrap loses the comments button, though the session keeps its comments', async () => {
    const fake = await renderRevealed('Editor')
    expect(screen.getByRole('button', { name: 'Comments' })).toBeEnabled()

    mockDriveRole('Viewer')
    act(() => fake.setSnapshot({ status: { name: 'opening' } }))
    act(() => fake.setSnapshot({ status: { name: 'connected' } }))

    await waitFor(() => expect(screen.queryByRole('button', { name: 'Comments' })).not.toBeInTheDocument())
    expect(fake.session.comments).toBeDefined()
  })

  test('the comments button shows a dot while a thread is unread', async () => {
    const fake = await renderRevealed()
    expect(screen.queryByTestId('comments-unread-dot')).not.toBeInTheDocument()

    act(() => fake.setComments({ threads: [fakeThread({ unread: true })], hasUnread: true }))
    expect(screen.getByTestId('comments-unread-dot')).toBeInTheDocument()

    act(() => fake.setComments({ threads: [fakeThread()], hasUnread: false }))
    expect(screen.queryByTestId('comments-unread-dot')).not.toBeInTheDocument()
  })

  test("the editor reads the session's threads in its own types, and hears of each change", async () => {
    const fake = await renderRevealed()
    const resolved = fakeThread({
      id: 'thread-2',
      markId: 'mark-2',
      state: 'resolved',
      createTime: 1_763_900_001_000,
      comments: [{ ...fakeThread().comments[0], id: 'comment-2', verification: 'invalid', authorAddress: undefined }],
    })

    act(() => fake.setComments({ threads: [fakeThread(), resolved] }))

    expect(mockEditor.handleCommentsChange).toHaveBeenCalledTimes(1)
    const threads = await mockClientHandler.getAllThreads()
    expect(threads.map(({ id, markID, localID, state }) => ({ id, markID, localID, state }))).toEqual([
      { id: 'thread-1', markID: 'mark-1', localID: 'mark-1', state: CommentThreadState.Active },
      { id: 'thread-2', markID: 'mark-2', localID: 'mark-2', state: CommentThreadState.Resolved },
    ])
    expect(threads[1].createTime.serverTimestamp).toBe(1_763_900_001)
    expect(threads[0].comments[0]).toMatchObject({
      id: 'comment-1',
      content: 'First',
      author: 'peer@example.com',
      verificationResult: { verified: true },
    })
    expect(threads[1].comments[0]).toMatchObject({
      author: undefined,
      verificationResult: { verified: false, verificationAvailable: true },
    })
  })

  test("the editor's comment calls reach the session's comments", async () => {
    const fake = await renderRevealed()
    const comments = fake.mocks.comments

    const thread = await mockClientHandler.createCommentThread('First', 'mark-1', false)
    expect(comments.createThread).toHaveBeenCalledWith({ content: 'First', markId: 'mark-1', createMark: false })
    expect(thread).toMatchObject({ id: 'thread-1', markID: 'mark-1' })

    expect(await mockClientHandler.createComment('Reply', 'thread-1')).toMatchObject({ id: 'comment-1' })
    expect(comments.reply).toHaveBeenCalledWith('thread-1', 'Reply')

    expect(await mockClientHandler.editComment('thread-1', 'comment-1', 'Edited')).toBe(true)
    expect(comments.editComment).toHaveBeenCalledWith('thread-1', 'comment-1', 'Edited')
    expect(await mockClientHandler.deleteComment('thread-1', 'comment-1')).toBe(true)
    expect(comments.deleteComment).toHaveBeenCalledWith('thread-1', 'comment-1')
    expect(await mockClientHandler.resolveThread('thread-1')).toBe(true)
    expect(comments.resolveThread).toHaveBeenCalledWith('thread-1')
    expect(await mockClientHandler.unresolveThread('thread-1')).toBe(true)
    expect(comments.unresolveThread).toHaveBeenCalledWith('thread-1')
    expect(await mockClientHandler.deleteThread('thread-1')).toBe(true)
    expect(comments.deleteThread).toHaveBeenCalledWith('thread-1')

    await mockClientHandler.markThreadAsRead('thread-1')
    expect(comments.markThreadAsRead).toHaveBeenCalledWith('thread-1')
    await mockClientHandler.beganTypingInThread('thread-1')
    await mockClientHandler.stoppedTypingInThread('thread-1')
    expect(comments.setTyping.mock.calls).toEqual([
      ['thread-1', true],
      ['thread-1', false],
    ])
  })

  test('a comment call that fails answers as failed, as the editor never times one out', async () => {
    const fake = await renderRevealed()
    const comments = fake.mocks.comments
    const failure = new Error('The Docs API did not answer')
    for (const verb of ['createThread', 'reply', 'editComment', 'deleteComment', 'deleteThread'] as const) {
      comments[verb].mockRejectedValueOnce(failure)
    }
    comments.resolveThread.mockRejectedValueOnce(failure)
    comments.unresolveThread.mockRejectedValueOnce(failure)
    comments.setTyping.mockImplementationOnce(() => {
      throw new Error('No signMessage')
    })

    expect(await mockClientHandler.createCommentThread('First')).toBeUndefined()
    expect(await mockClientHandler.createComment('Reply', 'thread-1')).toBeUndefined()
    expect(await mockClientHandler.editComment('thread-1', 'comment-1', 'Edited')).toBe(false)
    expect(await mockClientHandler.deleteComment('thread-1', 'comment-1')).toBe(false)
    expect(await mockClientHandler.resolveThread('thread-1')).toBe(false)
    expect(await mockClientHandler.unresolveThread('thread-1')).toBe(false)
    expect(await mockClientHandler.deleteThread('thread-1')).toBe(false)
    expect(await mockClientHandler.beganTypingInThread('thread-1')).toBeUndefined()
    expect(logger.error).toHaveBeenCalledWith('Comment call failed', { call: 'createCommentThread' }, failure)
  })

  test("each mark change reaches the editor's mark nodes", async () => {
    const fake = await renderRevealed()

    act(() => {
      fake.emitMarkChange({ kind: 'create', markId: 'mark-1' })
      fake.emitMarkChange({ kind: 'remove', markId: 'mark-2' })
      fake.emitMarkChange({ kind: 'resolve', markId: 'mark-3' })
      fake.emitMarkChange({ kind: 'unresolve', markId: 'mark-4' })
    })

    expect(mockEditor.handleCreateCommentMarkNode).toHaveBeenCalledWith('mark-1')
    expect(mockEditor.handleRemoveCommentMarkNode).toHaveBeenCalledWith('mark-2')
    expect(mockEditor.handleResolveCommentMarkNode).toHaveBeenCalledWith('mark-3')
    expect(mockEditor.handleUnresolveCommentMarkNode).toHaveBeenCalledWith('mark-4')
  })

  test("a peer's typing reaches the editor for each thread whose typers changed, and the editor reads them", async () => {
    const fake = await renderRevealed()

    act(() => fake.setComments({ typers: { 'thread-1': ['peer@example.com'] } }))
    expect(mockEditor.handleTypingStatusChange.mock.calls).toEqual([['thread-1']])
    expect(await mockClientHandler.getTypersExcludingSelf('thread-1')).toEqual(['peer@example.com'])

    mockEditor.handleTypingStatusChange.mockClear()
    act(() => fake.setComments({ typers: { 'thread-1': ['peer@example.com'], 'thread-2': ['other@example.com'] } }))
    act(() => fake.setComments({ typers: { 'thread-2': ['other@example.com'] } }))

    expect(mockEditor.handleTypingStatusChange.mock.calls).toEqual([['thread-2'], ['thread-1']])
    expect(await mockClientHandler.getTypersExcludingSelf('thread-1')).toEqual([])
    // Typing alone leaves the threads as they were
    expect(mockEditor.handleCommentsChange).not.toHaveBeenCalled()
  })

  test.each<[string, { disabled: boolean; local: boolean; withComments: boolean }, boolean]>([
    ['on by default', { disabled: false, local: false, withComments: true }, true],
    ['off with DocsSuggestionsDisabled', { disabled: true, local: false, withComments: true }, false],
    [
      'on with DocsSuggestionsDisabled in a local environment',
      { disabled: true, local: true, withComments: true },
      true,
    ],
    ['off for a session without comments', { disabled: false, local: false, withComments: false }, false],
  ])('Suggesting is %s, given to the editor before it initializes', async (_name, setup, enabled) => {
    if (setup.disabled) {
      mockFlags.add('DocsSuggestionsDisabled')
    }
    mockIsLocalEnvironment = setup.local
    const fake = renderViewer('Editor', { withComments: setup.withComments })
    await waitFor(() => expect(fake.mocks.connect).toHaveBeenCalled())
    act(() => fake.setSnapshot({ status: { name: 'connected' }, caughtUp: true }))
    await waitFor(() => expect(mockEditor.initializeEditor).toHaveBeenCalled())

    const suggestionsCall = mockEditor.syncProperty.mock.calls.findIndex(([name]) => name === 'suggestionsEnabled')
    expect(mockEditor.syncProperty.mock.calls[suggestionsCall]).toEqual(['suggestionsEnabled', enabled])
    expect(mockEditor.syncProperty.mock.invocationCallOrder[suggestionsCall]).toBeLessThan(
      mockEditor.initializeEditor.mock.invocationCallOrder[0],
    )
  })

  test('Suggesting follows DocsSuggestionsDisabled while the page is open', async () => {
    const view = await renderRevealed()
    expect(mockEditor.syncProperty).toHaveBeenLastCalledWith('suggestionsEnabled', true)

    mockFlags.add('DocsSuggestionsDisabled')
    view.rerender()

    await waitFor(() => expect(mockEditor.syncProperty).toHaveBeenLastCalledWith('suggestionsEnabled', false))
  })

  test("the editor's suggestion calls reach the session's comments, and answer once the server takes them", async () => {
    const fake = await renderRevealed()
    const comments = fake.mocks.comments

    const thread = await mockClientHandler.createSuggestionThread('suggestion-1', 'Summary', 'insert')
    expect(comments.createSuggestionThread).toHaveBeenCalledWith({ markId: 'suggestion-1', summary: 'Summary' })
    expect(thread).toMatchObject({ id: 'suggestion-thread-1', markID: 'suggestion-1' })

    expect(await mockClientHandler.acceptSuggestion('thread-1', 'Accepted summary')).toBe(true)
    expect(comments.acceptSuggestion).toHaveBeenCalledWith('thread-1', 'Accepted summary')
    expect(await mockClientHandler.rejectSuggestion('thread-1')).toBe(true)
    expect(comments.rejectSuggestion).toHaveBeenCalledWith('thread-1', undefined)
    expect(await mockClientHandler.reopenSuggestion('thread-1')).toBe(true)
    expect(comments.reopenSuggestion).toHaveBeenCalledWith('thread-1')
    expect(mockCreateNotification).not.toHaveBeenCalled()
  })

  test('a failed suggestion call answers as failed and shows an error notification', async () => {
    const fake = await renderRevealed()
    fake.mocks.comments.acceptSuggestion.mockRejectedValueOnce(new DocsApiError('acceptSuggestion', 500))

    expect(await mockClientHandler.acceptSuggestion('thread-1', 'Summary')).toBe(false)

    expect(mockCreateNotification).toHaveBeenCalledTimes(1)
    expect(mockCreateNotification.mock.calls[0][0]).toMatchObject({ type: 'error' })
    expect(shownText(mockCreateNotification.mock.calls[0][0])).toBe("The suggestion wasn't accepted.")
  })

  test('a reply that waited and is refused because its thread was deleted says so, with its text', async () => {
    const fake = await renderRevealed()
    const comments = fake.mocks.comments
    act(() => fake.setComments({ threads: [fakeThread()] }))
    const placeholder = { ...fakeThread().comments[0], id: 'placeholder-1', isPlaceholder: true }
    let refuse: (error: unknown) => void = () => {}
    comments.reply.mockImplementationOnce(() => {
      fake.setComments({
        threads: [fakeThread({ comments: [...fakeThread().comments, placeholder] })],
        waitingChanges: 1,
      })
      return new Promise((_resolve, reject) => (refuse = reject))
    })
    const content = JSON.stringify({ root: { children: [{ type: 'paragraph', children: [{ text: 'On my way' }] }] } })

    expect(await act(() => mockClientHandler.createComment(content, 'thread-1'))).toMatchObject({ id: 'placeholder-1' })
    act(() => fake.setComments({ waitingChanges: 0 }))
    refuse(new DocsApiError('addComment', 404))

    await waitFor(() => expect(mockCreateNotification).toHaveBeenCalledTimes(1))
    const [[notification]] = mockCreateNotification.mock.calls
    expect(notification).toMatchObject({ type: 'error', expiration: -1, showCloseButton: true })
    expect(shownText(notification)).toBe(
      "Your reply wasn't saved: the comment thread was deleted.\n\nWhat you wrote:\nOn my way",
    )
  })

  test('leaving warns while comment changes wait for the connection', async () => {
    const fake = await renderRevealed()
    const leave = () => {
      const event = new Event('beforeunload', { cancelable: true })
      window.dispatchEvent(event)
      return event.defaultPrevented
    }
    expect(leave()).toBe(false)

    act(() => fake.setComments({ waitingChanges: 1 }))
    expect(leave()).toBe(true)

    act(() => fake.setComments({ waitingChanges: 0 }))
    expect(leave()).toBe(false)
  })
})
