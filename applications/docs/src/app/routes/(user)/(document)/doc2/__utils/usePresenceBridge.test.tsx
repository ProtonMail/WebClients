import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

import { decodeAwarenessUpdate, encodeAwarenessUpdate } from '@proton-docs/realtime-sdk'
import type { Session } from '@proton-docs/realtime-sdk'
import type { RtsMessagePayload } from '@proton/docs-shared/Doc/RtsMessagePayload'

import { ApplicationProvider, type ApplicationProviderProps } from '~/utils/application-context'

import { createFakeSession } from './createFakeSession'
import type { EditorInvoker } from './EditorInvoker'
import { usePresenceBridge } from './usePresenceBridge'

const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
const application = { logger } as unknown as ApplicationProviderProps['application']
const wrapper = ({ children }: { children: ReactNode }) => (
  <ApplicationProvider application={application}>{children}</ApplicationProvider>
)

const EDITOR_ID = 7
const ALICE = { name: 'Alice', color: '#f00', anchorPos: null, focusPos: null, awarenessData: { userId: 'alice' } }
const BOB = { name: 'Bob', color: '#00f', anchorPos: null, focusPos: null, awarenessData: { userId: 'bob' } }

function createInvoker(getClientId: () => Promise<number> = async () => EDITOR_ID) {
  return { getClientId: jest.fn(getClientId), receiveMessage: jest.fn(async (_message: RtsMessagePayload) => {}) }
}

function renderBridge(session: Session | undefined, invoker: ReturnType<typeof createInvoker> | undefined) {
  return renderHook(
    ({ session, invoker }) => usePresenceBridge(session, invoker as unknown as EditorInvoker | undefined),
    { wrapper, initialProps: { session, invoker } },
  )
}

function editorBroadcast(state: object | null, others = [{ clientId: 3, clock: 5, state: BOB }], editorId = EDITOR_ID) {
  return encodeAwarenessUpdate([...others, { clientId: editorId, clock: 1, state: state as never }])
}

function fedToEditor(invoker: ReturnType<typeof createInvoker>) {
  return invoker.receiveMessage.mock.calls.map(([message]) => {
    expect(message.type).toEqual({ wrapper: 'events', eventType: 2 })
    return decodeAwarenessUpdate(message.content)
  })
}

describe('usePresenceBridge', () => {
  afterEach(() => jest.clearAllMocks())

  test("sets the editor's own entry as the session's presence, only when it changes", async () => {
    const fake = createFakeSession()
    const invoker = createInvoker()
    const { result } = renderBridge(fake.session, invoker)
    await waitFor(() => expect(invoker.getClientId).toHaveBeenCalled())
    await act(async () => {})

    result.current(editorBroadcast(ALICE))
    result.current(editorBroadcast({ ...ALICE }, []))
    result.current(editorBroadcast({ ...ALICE, anchorPos: 'moved' }))

    expect(fake.mocks.setPresence.mock.calls).toEqual([[ALICE], [{ ...ALICE, anchorPos: 'moved' }]])
  })

  test("holds the editor's newest broadcast until it knows the editor's id", async () => {
    const fake = createFakeSession()
    let answerClientId: (id: number) => void = () => {}
    const invoker = createInvoker(() => new Promise((resolve) => (answerClientId = resolve)))
    const { result } = renderBridge(fake.session, invoker)

    result.current(editorBroadcast(BOB))
    result.current(editorBroadcast(ALICE))
    expect(fake.mocks.setPresence).not.toHaveBeenCalled()

    await act(async () => answerClientId(EDITOR_ID))

    expect(fake.mocks.setPresence.mock.calls).toEqual([[ALICE]])
  })

  test("ignores a broadcast without the editor's entry, and logs a malformed one", async () => {
    const fake = createFakeSession()
    const invoker = createInvoker()
    const { result } = renderBridge(fake.session, invoker)
    await act(async () => {})

    result.current(encodeAwarenessUpdate([{ clientId: 3, clock: 5, state: BOB }]))
    result.current(new Uint8Array([5]))

    expect(fake.mocks.setPresence).not.toHaveBeenCalled()
    expect(logger.warn).toHaveBeenCalledWith('Failed to read the editor presence', {
      error: expect.stringContaining('Malformed awareness update'),
    })
  })

  test('feeds the editor the participants as they change, never self nor the editor itself', async () => {
    const fake = createFakeSession({
      participants: [
        { id: 100, isSelf: true, state: ALICE, lastSeenAt: 1 },
        { id: 3, isSelf: false, state: BOB, lastSeenAt: 1 },
      ],
    })
    const invoker = createInvoker()
    renderBridge(fake.session, invoker)
    await waitFor(() => expect(invoker.receiveMessage).toHaveBeenCalled())

    act(() =>
      fake.setSnapshot({
        participants: [
          { id: 100, isSelf: true, state: ALICE, lastSeenAt: 2 },
          { id: EDITOR_ID, isSelf: false, state: ALICE, lastSeenAt: 2 },
        ],
      }),
    )
    act(() => fake.setSnapshot({ status: { name: 'paused' } }))

    expect(fedToEditor(invoker)).toEqual([
      [{ clientId: 3, clock: 1, state: BOB }],
      [{ clientId: 3, clock: 2, state: null }],
    ])
  })

  test('stops once the editor goes, and starts over at clock 1 with a new editor, holding its broadcast until it gives its id', async () => {
    const fake = createFakeSession({ participants: [{ id: 3, isSelf: false, state: BOB, lastSeenAt: 1 }] })
    const first = createInvoker()
    const { result, rerender } = renderBridge(fake.session, first)
    await waitFor(() => expect(first.receiveMessage).toHaveBeenCalledTimes(1))

    rerender({ session: fake.session, invoker: undefined })
    act(() => fake.setSnapshot({ participants: [{ id: 3, isSelf: false, state: BOB, lastSeenAt: 2 }] }))
    result.current(editorBroadcast(ALICE, [], 8))

    expect(first.receiveMessage).toHaveBeenCalledTimes(1)
    expect(fake.mocks.setPresence).not.toHaveBeenCalled()

    const second = createInvoker(async () => 8)
    rerender({ session: fake.session, invoker: second })
    await waitFor(() => expect(second.receiveMessage).toHaveBeenCalled())

    expect(fedToEditor(second)).toEqual([[{ clientId: 3, clock: 1, state: BOB }]])
    expect(fake.mocks.setPresence.mock.calls).toEqual([[ALICE]])
  })

  test('goes on from the clocks the editor holds when a new invoker reaches the same editor', async () => {
    const fake = createFakeSession({ participants: [{ id: 3, isSelf: false, state: BOB, lastSeenAt: 1 }] })
    const first = createInvoker()
    const { rerender } = renderBridge(fake.session, first)
    await waitFor(() => expect(first.receiveMessage).toHaveBeenCalledTimes(1))

    rerender({ session: fake.session, invoker: undefined })
    act(() => fake.setSnapshot({ participants: [{ id: 4, isSelf: false, state: ALICE, lastSeenAt: 2 }] }))
    const second = createInvoker()
    rerender({ session: fake.session, invoker: second })
    await waitFor(() => expect(second.receiveMessage).toHaveBeenCalled())

    expect(fedToEditor(second)).toEqual([
      [
        { clientId: 4, clock: 1, state: ALICE },
        { clientId: 3, clock: 2, state: null },
      ],
    ])
  })

  test('does nothing once the editor goes before it gives its id', async () => {
    const fake = createFakeSession({ participants: [{ id: 3, isSelf: false, state: BOB, lastSeenAt: 1 }] })
    let answerClientId: (id: number) => void = () => {}
    const invoker = createInvoker(() => new Promise((resolve) => (answerClientId = resolve)))
    const { result, rerender } = renderBridge(fake.session, invoker)
    result.current(editorBroadcast(ALICE))

    rerender({ session: fake.session, invoker: undefined })
    await act(async () => answerClientId(EDITOR_ID))

    expect(invoker.receiveMessage).not.toHaveBeenCalled()
    expect(fake.mocks.setPresence).not.toHaveBeenCalled()
  })

  test("logs and leaves presence off when the editor doesn't give its id", async () => {
    const fake = createFakeSession({ participants: [{ id: 3, isSelf: false, state: BOB, lastSeenAt: 1 }] })
    const invoker = createInvoker(async () => Promise.reject(new Error('Editor did not answer getClientId')))
    renderBridge(fake.session, invoker)

    await waitFor(() =>
      expect(logger.warn).toHaveBeenCalledWith('Failed to get the editor client id for presence', expect.any(Error)),
    )
    expect(invoker.receiveMessage).not.toHaveBeenCalled()
  })
})
