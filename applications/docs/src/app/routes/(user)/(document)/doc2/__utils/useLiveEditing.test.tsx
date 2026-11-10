import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

import type { Refusal, Session, SessionSnapshot, SessionStatus } from '@proton-docs/realtime-sdk'

import { ApplicationProvider, type ApplicationProviderProps } from '~/utils/application-context'

import { createFakeSession } from './createFakeSession'
import type { DocumentRole } from './getDocumentRole'
import { useLiveEditing } from './useLiveEditing'

const mockCreateNotification = jest.fn()
jest.mock('@proton/app-context/useNotifications', () => ({
  useNotifications: () => ({ createNotification: mockCreateNotification }),
}))

const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
const application = { logger } as unknown as ApplicationProviderProps['application']

const wrapper = ({ children }: { children: ReactNode }) => (
  <ApplicationProvider application={application}>{children}</ApplicationProvider>
)

function createEditorInvoker() {
  return {
    receiveMessage: jest.fn(async () => {}),
    changeLockedState: jest.fn(async () => {}),
  }
}

type EditorInvokerMock = ReturnType<typeof createEditorInvoker>
type LiveEditingProps = { editorInvoker?: EditorInvokerMock; participantLimitReached?: boolean }

function renderLiveEditing({
  session,
  editorInvoker,
  role = 'Editor',
}: {
  session: Session
  editorInvoker?: EditorInvokerMock
  role?: DocumentRole
}) {
  const onEditorError = jest.fn()
  const hook = renderHook(
    ({ editorInvoker, participantLimitReached }: LiveEditingProps) =>
      useLiveEditing({ session, editorInvoker, role, participantLimitReached, onEditorError }),
    { wrapper, initialProps: { editorInvoker } as LiveEditingProps },
  )
  return { ...hook, onEditorError }
}

const update = (content: Uint8Array<ArrayBuffer>) => ({
  content,
  authorAddress: 'author@example.com',
  timestamp: 0,
  signature: new Uint8Array(),
  aad: '',
})

describe('useLiveEditing', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('waits for the editor before it connects or follows updates', () => {
    const fake = createFakeSession()

    const { result } = renderLiveEditing({ session: fake.session })

    expect(fake.mocks.on).not.toHaveBeenCalledWith('update', expect.anything())
    expect(fake.mocks.connect).not.toHaveBeenCalled()
    expect(result.current).toBe(fake.session.getSnapshot())
  })

  test('once the editor holds the base state, listens to every event before connecting, and follows the snapshot', () => {
    const fake = createFakeSession()
    const calls: string[] = []
    fake.mocks.on.mockImplementation((event: string) => {
      calls.push(`on:${event}`)
      return () => {}
    })
    fake.mocks.connect.mockImplementation(async () => {
      calls.push('connect')
    })

    const { result, rerender } = renderLiveEditing({ session: fake.session })
    rerender({ editorInvoker: createEditorInvoker() })

    expect(calls).toEqual([
      'on:refusal',
      'on:invalidation',
      'on:updateUnreadable',
      'on:update',
      'on:baseStateReplaced',
      'connect',
    ])

    act(() => fake.setSnapshot({ status: { name: 'connected' } }))

    expect(result.current?.status).toEqual({ name: 'connected' })
  })

  test('sends each update from another client to the editor', () => {
    const fake = createFakeSession()
    const editorInvoker = createEditorInvoker()
    renderLiveEditing({ session: fake.session, editorInvoker })
    const content = new Uint8Array([1])

    fake.emit('update', update(content))

    expect(editorInvoker.receiveMessage).toHaveBeenCalledWith({ type: { wrapper: 'du' }, content })
  })

  test('merges each update of a replaced base state into the editor as the base commit, in order', () => {
    const fake = createFakeSession()
    const editorInvoker = createEditorInvoker()
    renderLiveEditing({ session: fake.session, editorInvoker })
    const first = new Uint8Array([1])
    const second = new Uint8Array([2])

    fake.emit('baseStateReplaced', { base: { commitId: 'commit-2', updates: [update(first), update(second)] } })

    expect(editorInvoker.receiveMessage.mock.calls).toEqual([
      [{ type: { wrapper: 'du' }, content: first, origin: 'BaseCommit' }],
      [{ type: { wrapper: 'du' }, content: second, origin: 'BaseCommit' }],
    ])
  })

  test('an editor that fails to take an update fails the editor', async () => {
    const fake = createFakeSession()
    const editorInvoker = createEditorInvoker()
    const error = new Error('Editor did not answer')
    editorInvoker.receiveMessage.mockRejectedValue(error)
    const { onEditorError } = renderLiveEditing({ session: fake.session, editorInvoker })

    fake.emit('update', update(new Uint8Array([1])))

    await waitFor(() => expect(onEditorError).toHaveBeenCalledWith(error))
  })

  test.each<[Refusal, string]>([
    [{ reason: 'updateTooLarge', attemptedBytes: 2, limitBytes: 1 }, 'Your last change is too large to save'],
    [{ reason: 'incompleteBaseState' }, 'Some of the document could not be read'],
  ])('a refusal for %j tells the user and locks the editor', (refusal, text) => {
    const fake = createFakeSession()
    const editorInvoker = createEditorInvoker()
    renderLiveEditing({ session: fake.session, editorInvoker })
    expect(editorInvoker.changeLockedState).toHaveBeenLastCalledWith(false)

    act(() => fake.emit('refusal', refusal))

    expect(mockCreateNotification).toHaveBeenCalledWith({ type: 'error', text: expect.stringContaining(text) })
    expect(logger.warn).toHaveBeenCalledWith(expect.any(String), refusal)
    expect(editorInvoker.changeLockedState).toHaveBeenLastCalledWith(true)
  })

  test('a refusal for the document size locks the editor and leaves telling the user to the size-limit modal', () => {
    const fake = createFakeSession()
    const editorInvoker = createEditorInvoker()
    renderLiveEditing({ session: fake.session, editorInvoker })
    const refusal: Refusal = { reason: 'documentSizeLimitReached', attemptedBytes: 2, limitBytes: 1 }

    act(() => fake.emit('refusal', refusal))

    expect(mockCreateNotification).not.toHaveBeenCalled()
    expect(logger.warn).toHaveBeenCalledWith(expect.any(String), refusal)
    expect(editorInvoker.changeLockedState).toHaveBeenLastCalledWith(true)
  })

  test('an invalidation tells the user a change was not saved', () => {
    const fake = createFakeSession()
    renderLiveEditing({ session: fake.session, editorInvoker: createEditorInvoker() })
    const invalidation = { updateId: 'update-1', condition: 'divergedFromServer' } as const

    fake.emit('invalidation', invalidation)

    expect(mockCreateNotification).toHaveBeenCalledWith({
      type: 'error',
      text: expect.stringContaining('could not be saved'),
    })
    expect(logger.error).toHaveBeenCalledWith(expect.any(String), invalidation)
  })

  test.each([
    ['live', 'A change from another editor could not be read'],
    ['baseState', 'Some of the document could not be read'],
  ] as const)('an unreadable %s update tells the user', (origin, text) => {
    const fake = createFakeSession()
    renderLiveEditing({ session: fake.session, editorInvoker: createEditorInvoker() })

    fake.emit('updateUnreadable', { uuid: 'update-1', origin })

    expect(mockCreateNotification).toHaveBeenCalledWith({ type: 'warning', text: expect.stringContaining(text) })
  })

  test('a failed connect is logged, and leaves the editor locked while the session is stopped', async () => {
    const fake = createFakeSession({
      status: { name: 'stopped', condition: 'clientRejected', retryable: false },
      editing: { allowed: false, reason: 'stopped' },
    })
    const error = new Error('Session stopped: clientRejected')
    fake.mocks.connect.mockRejectedValue(error)
    const editorInvoker = createEditorInvoker()

    renderLiveEditing({ session: fake.session, editorInvoker })

    await waitFor(() => expect(logger.error).toHaveBeenCalledWith(expect.any(String), error))
    expect(editorInvoker.changeLockedState).toHaveBeenLastCalledWith(true)
  })

  test('unlocks the editor while editing is allowed, and locks it again when it is not', () => {
    const fake = createFakeSession({ editing: { allowed: false, reason: 'noBaseState' } })
    const editorInvoker = createEditorInvoker()
    renderLiveEditing({ session: fake.session, editorInvoker })

    expect(editorInvoker.changeLockedState).toHaveBeenLastCalledWith(true)

    act(() => fake.setSnapshot({ editing: { allowed: true } }))
    expect(editorInvoker.changeLockedState).toHaveBeenLastCalledWith(false)

    act(() => fake.setSnapshot({ editing: { allowed: false, reason: 'sizeLocked' } }))
    expect(editorInvoker.changeLockedState).toHaveBeenLastCalledWith(true)
  })

  // Editing while offline (ADR-0012): the SDK's outbox carries what is typed until the session connects again
  test.each<SessionStatus>([
    { name: 'paused' },
    { name: 'reconnecting', condition: 'transient', nextAttemptAt: 0, budgetExpiresAt: 0 },
    { name: 'connecting' },
    { name: 'closed' },
  ])('keeps the editor editable while the session is %j with work waiting', (status) => {
    const fake = createFakeSession({ status: { name: 'connected' } })
    const editorInvoker = createEditorInvoker()
    renderLiveEditing({ session: fake.session, editorInvoker })

    act(() => fake.setSnapshot({ status, delivery: 'pending' }))
    act(() => fake.setSnapshot({ delivery: 'degraded' }))

    expect(editorInvoker.changeLockedState).toHaveBeenCalledTimes(1)
    expect(editorInvoker.changeLockedState).toHaveBeenLastCalledWith(false)
  })

  test.each<[string, Partial<SessionSnapshot>]>([
    ['a stopped session', { status: { name: 'stopped', condition: 'transient', retryable: true } }],
    ['a failed delivery', { delivery: 'failed' }],
    ['a size-locked session', { editing: { allowed: false, reason: 'sizeLocked' } }],
    ['an incomplete base state', { editing: { allowed: false, reason: 'incompleteBaseState' } }],
  ])('%s alone locks the editor, and the lock lifts once it clears', (_, cause) => {
    const fake = createFakeSession({ status: { name: 'connected' } })
    const editorInvoker = createEditorInvoker()
    renderLiveEditing({ session: fake.session, editorInvoker })

    act(() => fake.setSnapshot(cause))
    expect(editorInvoker.changeLockedState).toHaveBeenLastCalledWith(true)

    act(() => fake.setSnapshot({ status: { name: 'connected' }, delivery: 'synced', editing: { allowed: true } }))
    expect(editorInvoker.changeLockedState).toHaveBeenLastCalledWith(false)
  })

  test('the participant limit locks the editor, and the lock lifts once it clears', () => {
    const fake = createFakeSession({ status: { name: 'connected' } })
    const editorInvoker = createEditorInvoker()
    const { rerender } = renderLiveEditing({ session: fake.session, editorInvoker })

    rerender({ editorInvoker, participantLimitReached: true })
    expect(editorInvoker.changeLockedState).toHaveBeenLastCalledWith(true)

    rerender({ editorInvoker, participantLimitReached: false })
    expect(editorInvoker.changeLockedState).toHaveBeenLastCalledWith(false)
  })

  test('with several causes at once, the editor stays locked until the last one clears', () => {
    const fake = createFakeSession({ status: { name: 'connected' } })
    const editorInvoker = createEditorInvoker()
    const { rerender } = renderLiveEditing({ session: fake.session, editorInvoker })

    act(() =>
      fake.setSnapshot({
        status: { name: 'stopped', condition: 'transient', retryable: true },
        editing: { allowed: false, reason: 'stopped' },
      }),
    )
    rerender({ editorInvoker, participantLimitReached: true })
    act(() => fake.setSnapshot({ status: { name: 'connected' }, editing: { allowed: true } }))
    expect(editorInvoker.changeLockedState).toHaveBeenLastCalledWith(true)

    rerender({ editorInvoker, participantLimitReached: false })
    expect(editorInvoker.changeLockedState).toHaveBeenLastCalledWith(false)
  })

  // As the SDK does: it emits `invalidation` in the step that sets `delivery` to `failed`, which never clears
  test('an invalidation locks the editor through the failed delivery, even across a reconnect', () => {
    const fake = createFakeSession({ status: { name: 'connected' } })
    const editorInvoker = createEditorInvoker()
    renderLiveEditing({ session: fake.session, editorInvoker })
    expect(editorInvoker.changeLockedState).toHaveBeenLastCalledWith(false)

    act(() => {
      fake.setSnapshot({ delivery: 'failed' })
      fake.emit('invalidation', { updateId: 'update-1', condition: 'divergedFromServer' })
    })
    expect(editorInvoker.changeLockedState).toHaveBeenLastCalledWith(true)

    act(() => fake.setSnapshot({ status: { name: 'connecting' } }))
    act(() => fake.setSnapshot({ status: { name: 'connected' } }))
    expect(editorInvoker.changeLockedState).toHaveBeenLastCalledWith(true)
  })

  // As the SDK does: a commit with unreadable updates becomes the base state, then each one is emitted
  test('an unreadable base state update after bootstrap locks the editor through incompleteBaseState', () => {
    const fake = createFakeSession({ status: { name: 'connected' } })
    const editorInvoker = createEditorInvoker()
    renderLiveEditing({ session: fake.session, editorInvoker })
    expect(editorInvoker.changeLockedState).toHaveBeenLastCalledWith(false)

    act(() => {
      fake.setSnapshot({ editing: { allowed: false, reason: 'incompleteBaseState' } })
      fake.emit('updateUnreadable', { uuid: 'update-1', origin: 'baseState' })
    })

    expect(editorInvoker.changeLockedState).toHaveBeenLastCalledWith(true)
    expect(mockCreateNotification).toHaveBeenCalledWith({
      type: 'warning',
      text: expect.stringContaining('editing is disabled'),
    })
  })

  test('never unlocks the editor for a viewer', () => {
    const fake = createFakeSession({ status: { name: 'connected' } })
    const editorInvoker = createEditorInvoker()

    renderLiveEditing({ session: fake.session, editorInvoker, role: 'Viewer' })

    expect(editorInvoker.changeLockedState).toHaveBeenCalledTimes(1)
    expect(editorInvoker.changeLockedState).toHaveBeenCalledWith(true)
  })

  test('unmounting removes its listeners', () => {
    const fake = createFakeSession()
    const { unmount } = renderLiveEditing({ session: fake.session, editorInvoker: createEditorInvoker() })
    expect(fake.listenerCount()).toBe(5)

    unmount()

    expect(fake.listenerCount()).toBe(0)
  })
})
