import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

import { generateNodeUid, getDrive } from '@proton/drive/sdk'
import { PROTON_DOCS_DOCUMENT_MIMETYPE } from '@proton/shared/lib/helpers/mimetype'

import { ApplicationProvider, type ApplicationProviderProps } from '~/utils/application-context'

import { useDocumentSession } from './useDocumentSession'
import type { useRealtimeClient } from './useRealtimeClient'

jest.mock('@proton/drive/sdk', () => ({
  ...jest.requireActual('@proton/drive/sdk'),
  getDrive: jest.fn(),
}))

const nodeMeta = { volumeId: 'volume-1', linkId: 'link-1' }
const getNode = jest.fn()
const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
const application = { logger } as unknown as ApplicationProviderProps['application']

const wrapper = ({ children }: { children: ReactNode }) => (
  <ApplicationProvider application={application}>{children}</ApplicationProvider>
)

/** A client whose one session records the order of calls and keeps bootstrap() pending until settled by hand. */
function createFakeClient() {
  const calls: string[] = []
  const listeners = new Map<string, (payload: unknown) => void>()
  const session = {
    disconnect: jest.fn(async () => {
      calls.push('disconnect')
    }),
  }
  let resolveBootstrap: () => void = () => {}
  let rejectBootstrap: (error: Error) => void = () => {}
  const bootstrapped = new Promise<typeof session>((resolve, reject) => {
    resolveBootstrap = () => resolve(session)
    rejectBootstrap = reject
  })
  const pending = {
    on: jest.fn((event: string, listener: (payload: unknown) => void) => {
      calls.push(`on:${event}`)
      listeners.set(event, listener)
      return () => listeners.delete(event)
    }),
    bootstrap: jest.fn(() => {
      calls.push('bootstrap')
      return bootstrapped
    }),
  }
  const client = { createSession: jest.fn(() => pending) } as unknown as ReturnType<typeof useRealtimeClient>

  return {
    client,
    session,
    calls,
    listeners,
    emit: (event: string, payload: unknown) => listeners.get(event)?.(payload),
    resolveBootstrap: async () => {
      resolveBootstrap()
      await bootstrapped
    },
    rejectBootstrap: async (error: Error) => {
      rejectBootstrap(error)
      await bootstrapped.catch(() => {})
    },
  }
}

describe('useDocumentSession', () => {
  beforeEach(() => {
    jest.mocked(getDrive).mockReturnValue({ getNode } as unknown as ReturnType<typeof getDrive>)
    getNode.mockResolvedValue({ mediaType: PROTON_DOCS_DOCUMENT_MIMETYPE })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('creates a doc session, listens for unreadable updates before bootstrapping, and is ready with the session', async () => {
    const fake = createFakeClient()
    const { result } = renderHook(() => useDocumentSession(fake.client, nodeMeta), { wrapper })

    await waitFor(() => expect(fake.calls).toContain('bootstrap'))
    await act(() => fake.resolveBootstrap())

    expect(getNode).toHaveBeenCalledWith(generateNodeUid('volume-1', 'link-1'))
    expect(fake.client.createSession).toHaveBeenCalledWith({ documentType: 'doc', nodeMeta })
    expect(fake.calls).toEqual(['on:updateUnreadable', 'bootstrap'])
    expect(result.current).toEqual({ status: 'ready', session: fake.session })
  })

  test('an unreadable base state update fails the load, leaves no listener and disconnects the session', async () => {
    const fake = createFakeClient()
    const statuses: string[] = []
    const { result } = renderHook(
      () => {
        const state = useDocumentSession(fake.client, nodeMeta)
        statuses.push(state.status)
        return state
      },
      { wrapper },
    )
    await waitFor(() => expect(fake.calls).toContain('bootstrap'))

    fake.emit('updateUnreadable', { uuid: 'update-1', origin: 'baseState' })

    expect(logger.error).toHaveBeenCalledWith(expect.any(String), { uuid: 'update-1', origin: 'baseState' })

    await act(() => fake.resolveBootstrap())

    expect(result.current).toEqual({ status: 'failed', reason: 'unreadableUpdate' })
    expect(statuses).not.toContain('ready')
    expect(fake.listeners.size).toBe(0)
    expect(fake.session.disconnect).toHaveBeenCalledTimes(1)
  })

  test('unmounting during bootstrap leaves no listener, and disconnects the session once bootstrapped', async () => {
    const fake = createFakeClient()
    const { result, unmount } = renderHook(() => useDocumentSession(fake.client, nodeMeta), { wrapper })
    await waitFor(() => expect(fake.calls).toContain('bootstrap'))

    unmount()

    expect(fake.listeners.size).toBe(0)
    expect(fake.session.disconnect).not.toHaveBeenCalled()

    await fake.resolveBootstrap()

    expect(fake.session.disconnect).toHaveBeenCalledTimes(1)
    expect(result.current).toEqual({ status: 'loading' })
  })

  test('unmounting once ready removes the listener and disconnects the session', async () => {
    const fake = createFakeClient()
    const { result, unmount } = renderHook(() => useDocumentSession(fake.client, nodeMeta), { wrapper })
    await waitFor(() => expect(fake.calls).toContain('bootstrap'))
    await act(() => fake.resolveBootstrap())
    expect(result.current.status).toBe('ready')

    unmount()

    expect(fake.listeners.size).toBe(0)
    expect(fake.session.disconnect).toHaveBeenCalledTimes(1)
  })

  test('unmounting while the node loads creates no session', async () => {
    let resolveNode: (node: unknown) => void = () => {}
    getNode.mockReturnValue(new Promise((resolve) => (resolveNode = resolve)))
    const fake = createFakeClient()
    const { unmount } = renderHook(() => useDocumentSession(fake.client, nodeMeta), { wrapper })

    unmount()
    await act(async () => resolveNode({ mediaType: PROTON_DOCS_DOCUMENT_MIMETYPE }))

    expect(fake.client.createSession).not.toHaveBeenCalled()
  })

  test('a node that is not a text document is unsupported, and creates no session', async () => {
    getNode.mockResolvedValue({ mediaType: 'application/vnd.proton.sheet' })
    const fake = createFakeClient()
    const { result } = renderHook(() => useDocumentSession(fake.client, nodeMeta), { wrapper })

    await waitFor(() => expect(result.current).toEqual({ status: 'failed', reason: 'unsupported' }))
    expect(fake.client.createSession).not.toHaveBeenCalled()
  })

  test('a bootstrap failure fails with its reason and logs the cause', async () => {
    const fake = createFakeClient()
    const { result } = renderHook(() => useDocumentSession(fake.client, nodeMeta), { wrapper })
    await waitFor(() => expect(fake.calls).toContain('bootstrap'))
    const cause = new Error('Docs API failed')

    await act(() => fake.rejectBootstrap(cause))

    expect(result.current).toEqual({ status: 'failed', reason: 'bootstrapFailed' })
    expect(logger.error).toHaveBeenCalledWith(expect.any(String), cause)
  })
})
