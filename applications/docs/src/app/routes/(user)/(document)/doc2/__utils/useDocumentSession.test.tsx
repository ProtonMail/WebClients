import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

import { MemberRole, ValidationError, generateNodeUid, getDrive } from '@proton/drive/sdk'
import { isDevOrBlack } from '@proton/shared/lib/env'
import { PROTON_DOCS_DOCUMENT_MIMETYPE } from '@proton/shared/lib/helpers/mimetype'
import { DocsApiError, DocsApiErrorCode, type SessionStatus } from '@proton-docs/realtime-sdk'

import { ApplicationProvider, type ApplicationProviderProps } from '~/utils/application-context'

import { useDocumentSession } from './useDocumentSession'
import type { useRealtimeClient } from './useRealtimeClient'

jest.mock('@proton/drive/sdk', () => ({
  ...jest.requireActual('@proton/drive/sdk'),
  getDrive: jest.fn(),
}))
jest.mock('@proton/shared/lib/env', () => ({
  ...jest.requireActual('@proton/shared/lib/env'),
  isDevOrBlack: jest.fn(() => false),
}))

const nodeMeta = { volumeId: 'volume-1', linkId: 'link-1' }
const getNode = jest.fn()
const getNodeHierarchy = jest.fn()
const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
const application = { logger } as unknown as ApplicationProviderProps['application']

const wrapper = ({ children }: { children: ReactNode }) => (
  <ApplicationProvider application={application}>{children}</ApplicationProvider>
)

/** A client whose one session records the order of calls and keeps bootstrap() pending until settled by hand. */
function createFakeClient() {
  const calls: string[] = []
  const listeners = new Map<string, (payload: unknown) => void>()
  const snapshotListeners = new Set<(snapshot: { status: SessionStatus }) => void>()
  let snapshot: { status: SessionStatus } = { status: { name: 'ready' } }
  const session = {
    disconnect: jest.fn(async () => {
      calls.push('disconnect')
    }),
    getSnapshot: () => snapshot,
    subscribe: (listener: (snapshot: { status: SessionStatus }) => void) => {
      snapshotListeners.add(listener)
      return () => {
        snapshotListeners.delete(listener)
      }
    },
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
    setStatus: (status: SessionStatus) => {
      snapshot = { status }
      snapshotListeners.forEach((listener) => listener(snapshot))
    },
    snapshotListenerCount: () => snapshotListeners.size,
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
    jest.mocked(getDrive).mockReturnValue({ getNode, getNodeHierarchy } as unknown as ReturnType<typeof getDrive>)
    getNode.mockResolvedValue({ mediaType: PROTON_DOCS_DOCUMENT_MIMETYPE })
    getNodeHierarchy.mockResolvedValue([{ directRole: MemberRole.Inherited }, { directRole: MemberRole.Editor }])
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('creates a doc session, listens for unreadable updates before bootstrapping, and is ready with the session, role and node', async () => {
    const fake = createFakeClient()
    const { result } = renderHook(() => useDocumentSession(fake.client, nodeMeta), { wrapper })

    await waitFor(() => expect(fake.calls).toContain('bootstrap'))
    await act(() => fake.resolveBootstrap())

    expect(getNode).toHaveBeenCalledWith(generateNodeUid('volume-1', 'link-1'))
    expect(getNodeHierarchy).toHaveBeenCalledWith(generateNodeUid('volume-1', 'link-1'))
    expect(fake.client.createSession).toHaveBeenCalledWith({ documentType: 'doc', nodeMeta })
    expect(fake.calls).toEqual(['on:updateUnreadable', 'bootstrap'])
    expect(result.current).toEqual({
      status: 'ready',
      session: fake.session,
      role: 'Editor',
      node: { mediaType: PROTON_DOCS_DOCUMENT_MIMETYPE },
      roleReads: 1,
    })
  })

  test('squashes at 50 document updates on dev and black, as /doc does', async () => {
    jest.mocked(isDevOrBlack).mockReturnValue(true)
    const fake = createFakeClient()
    renderHook(() => useDocumentSession(fake.client, nodeMeta), { wrapper })

    await waitFor(() => expect(fake.calls).toContain('bootstrap'))

    expect(fake.client.createSession).toHaveBeenCalledWith({ documentType: 'doc', nodeMeta, commitDuLimit: 50 })
  })

  test('leaves the commit limit to the SDK elsewhere', async () => {
    jest.mocked(isDevOrBlack).mockReturnValue(false)
    const fake = createFakeClient()
    renderHook(() => useDocumentSession(fake.client, nodeMeta), { wrapper })

    await waitFor(() => expect(fake.calls).toContain('bootstrap'))

    expect(jest.mocked(fake.client.createSession).mock.calls[0][0]).not.toHaveProperty('commitDuLimit')
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
    expect(fake.snapshotListenerCount()).toBe(0)
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

  test('a document in the trash is trashed, with its role and node, and creates no session', async () => {
    const trashed = { mediaType: PROTON_DOCS_DOCUMENT_MIMETYPE, trashTime: new Date(0) }
    getNode.mockResolvedValue(trashed)
    const fake = createFakeClient()

    const { result } = renderHook(() => useDocumentSession(fake.client, nodeMeta), { wrapper })

    await waitFor(() => expect(result.current).toEqual({ status: 'trashed', role: 'Editor', node: trashed }))
    expect(fake.client.createSession).not.toHaveBeenCalled()
  })

  test('a node whose role cannot be read fails to bootstrap, and creates no session', async () => {
    getNodeHierarchy.mockRejectedValue(new Error('Drive failed'))
    const fake = createFakeClient()
    const { result } = renderHook(() => useDocumentSession(fake.client, nodeMeta), { wrapper })

    await waitFor(() => expect(result.current).toEqual({ status: 'failed', reason: 'bootstrapFailed' }))
    expect(fake.client.createSession).not.toHaveBeenCalled()
  })

  test('a node Drive does not find for the user fails as no access, and creates no session', async () => {
    getNode.mockRejectedValue(new ValidationError('Item not found', 2501))
    const fake = createFakeClient()
    const { result } = renderHook(() => useDocumentSession(fake.client, nodeMeta), { wrapper })

    await waitFor(() => expect(result.current).toEqual({ status: 'failed', reason: 'noAccess' }))
    expect(fake.client.createSession).not.toHaveBeenCalled()
  })

  test.each<[string, unknown, string]>([
    ['no access', new DocsApiError('getDocumentMeta', 403), 'noAccess'],
    ['no access', new DocsApiError('getDocumentMeta', 422, DocsApiErrorCode.InsufficientPermissions), 'noAccess'],
    ['not found', new DocsApiError('getDocumentMeta', 404), 'notFound'],
    ['not found', new DocsApiError('getDocumentMeta', 400, DocsApiErrorCode.InvalidID), 'notFound'],
    ['an unreachable Docs API', new DocsApiError('getCommitData'), 'unreachable'],
    ['any other Docs API failure', new DocsApiError('getCommitData', 500), 'bootstrapFailed'],
    ['any other failure', new Error('Drive failed'), 'bootstrapFailed'],
  ])('a bootstrap failure for %s fails with its reason and logs the cause', async (_, cause, reason) => {
    const fake = createFakeClient()
    const { result } = renderHook(() => useDocumentSession(fake.client, nodeMeta), { wrapper })
    await waitFor(() => expect(fake.calls).toContain('bootstrap'))

    await act(() => fake.rejectBootstrap(cause as Error))

    expect(result.current).toEqual({ status: 'failed', reason })
    expect(logger.error).toHaveBeenCalledWith(expect.any(String), cause)
  })

  describe('after a rebootstrap', () => {
    async function renderReady() {
      const fake = createFakeClient()
      const rendered = renderHook(() => useDocumentSession(fake.client, nodeMeta), { wrapper })
      await waitFor(() => expect(fake.calls).toContain('bootstrap'))
      await act(() => fake.resolveBootstrap())
      expect(rendered.result.current).toMatchObject({ status: 'ready', role: 'Editor', roleReads: 1 })
      getNodeHierarchy.mockClear()
      return { fake, ...rendered }
    }

    test('re-reads the role once the session leaves opening, and keeps the session and node', async () => {
      const { fake, result } = await renderReady()
      getNodeHierarchy.mockResolvedValue([{ directRole: MemberRole.Viewer }])

      act(() =>
        fake.setStatus({ name: 'reconnecting', condition: 'permissionsChanged', nextAttemptAt: 0, budgetExpiresAt: 0 }),
      )
      act(() => fake.setStatus({ name: 'opening' }))
      expect(getNodeHierarchy).not.toHaveBeenCalled()

      act(() => fake.setStatus({ name: 'connecting' }))

      await waitFor(() => expect(result.current).toMatchObject({ status: 'ready', role: 'Viewer', roleReads: 2 }))
      expect(getNodeHierarchy).toHaveBeenCalledTimes(1)
      expect(getNodeHierarchy).toHaveBeenCalledWith(generateNodeUid('volume-1', 'link-1'))
      expect(result.current).toMatchObject({
        session: fake.session,
        node: { mediaType: PROTON_DOCS_DOCUMENT_MIMETYPE },
      })
    })

    test('counts a re-read that finds the same role, so the lock is applied again', async () => {
      const { fake, result } = await renderReady()

      act(() => fake.setStatus({ name: 'opening' }))
      act(() => fake.setStatus({ name: 'connected' }))

      await waitFor(() => expect(result.current).toMatchObject({ role: 'Editor', roleReads: 2 }))
    })

    test('does not re-read the role on status changes that skip opening', async () => {
      const { fake, result } = await renderReady()

      act(() => fake.setStatus({ name: 'connecting' }))
      act(() => fake.setStatus({ name: 'connected' }))
      act(() => fake.setStatus({ name: 'reconnecting', condition: 'transient', nextAttemptAt: 0, budgetExpiresAt: 0 }))
      act(() => fake.setStatus({ name: 'connected' }))
      await act(async () => {})

      expect(getNodeHierarchy).not.toHaveBeenCalled()
      expect(result.current).toMatchObject({ roleReads: 1 })
    })

    test('applies only the latest of two overlapping re-reads', async () => {
      const { fake, result } = await renderReady()
      let resolveFirst: (hierarchy: unknown) => void = () => {}
      getNodeHierarchy
        .mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)))
        .mockResolvedValueOnce([{ directRole: MemberRole.Admin }])

      act(() => fake.setStatus({ name: 'opening' }))
      act(() => fake.setStatus({ name: 'connecting' }))
      act(() => fake.setStatus({ name: 'opening' }))
      act(() => fake.setStatus({ name: 'connected' }))
      await waitFor(() => expect(result.current).toMatchObject({ role: 'Admin' }))

      await act(async () => resolveFirst([{ directRole: MemberRole.Viewer }]))

      expect(result.current).toMatchObject({ role: 'Admin' })
    })

    test('keeps the role when the re-read fails', async () => {
      const { fake, result } = await renderReady()
      getNodeHierarchy.mockRejectedValue(new Error('Drive failed'))

      act(() => fake.setStatus({ name: 'opening' }))
      act(() => fake.setStatus({ name: 'connected' }))
      await act(async () => {})

      expect(result.current).toMatchObject({ status: 'ready', role: 'Editor', roleReads: 1 })
      expect(logger.warn).toHaveBeenCalledWith(expect.any(String), expect.any(Error))
    })

    test('a re-read that settles after unmount changes nothing', async () => {
      const { fake, result, unmount } = await renderReady()
      let resolveHierarchy: (hierarchy: unknown) => void = () => {}
      getNodeHierarchy.mockReturnValue(new Promise((resolve) => (resolveHierarchy = resolve)))
      act(() => fake.setStatus({ name: 'opening' }))
      act(() => fake.setStatus({ name: 'connected' }))

      unmount()
      await act(async () => resolveHierarchy([{ directRole: MemberRole.Viewer }]))

      expect(result.current).toMatchObject({ role: 'Editor', roleReads: 1 })
    })
  })
})
