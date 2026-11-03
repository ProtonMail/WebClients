import type { NotificationsManager } from '@proton/app-context/notifications/manager'
import { NotificationsContext } from '@proton/app-context/notifications/notificationsContext'
import AuthenticationContext from '@proton/components/containers/authentication/authenticationContext'
import { traceErrorSDK } from '@proton/docs-core/DriveSDK/traceErrorSDK'
import { MemberRole, ValidationError, generateNodeUid, getDrive } from '@proton/drive/sdk'
import { PROTON_DOCS_DOCUMENT_MIMETYPE, PROTON_DOCS_SPREADSHEET_MIMETYPE } from '@proton/shared/lib/helpers/mimetype'
import { act, cleanup, render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { sharedLogger } from './logger'
import { useDocInvitationsStore } from './use-doc-invitations-store'
import { useDocInvites } from './useDocInvites'

jest.mock('@proton/drive/sdk', () => ({
  ...jest.requireActual('@proton/drive/sdk'),
  getDrive: jest.fn(),
}))

jest.mock('@proton/docs-core/DriveSDK/traceErrorSDK')

const mockCoreEventListeners = new Set<() => void>()
jest.mock('./core-event-subscriber', () => ({
  getCoreEventSubscriber: () => ({
    addListener: (listener: () => void) => {
      mockCoreEventListeners.add(listener)
      return () => mockCoreEventListeners.delete(listener)
    },
  }),
}))

function emitSharedWithMeUpdated() {
  act(() => mockCoreEventListeners.forEach((listener) => listener()))
}

const createNotification = jest.fn()

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthenticationContext.Provider value={{ getLocalID: () => undefined } as any}>
    <NotificationsContext.Provider value={{ createNotification } as unknown as NotificationsManager}>
      {children}
    </NotificationsContext.Provider>
  </AuthenticationContext.Provider>
)

async function* asyncIteratorFrom<T>(items: T[]): AsyncGenerator<T> {
  for (const item of items) {
    yield item
  }
}

async function* delayedIteratorFrom<T>(delay: Promise<void>, items: T[]): AsyncGenerator<T> {
  await delay
  yield* items
}

async function* failingIterator(error: Error): AsyncGenerator<never> {
  throw error
}

async function* pendingIterator(): AsyncGenerator<never> {
  await new Promise(() => {})
}

/** Renders the confirm modal too, which rejectInvite needs to be submitted */
function renderDocInvitesWithModal() {
  const hook = {} as { current: ReturnType<typeof useDocInvites> }
  function DocInvites() {
    hook.current = useDocInvites()
    return hook.current.confirmModal
  }
  render(<DocInvites />, { wrapper })
  return hook
}

function fakeInvitation({
  uid = 'invitation-1',
  linkId = 'link-1',
  mediaType = PROTON_DOCS_DOCUMENT_MIMETYPE,
}: { uid?: string; linkId?: string; mediaType?: string } = {}) {
  return {
    uid,
    node: {
      uid: generateNodeUid('volume-1', linkId),
      name: { ok: true, value: 'doc.txt' },
      mediaType,
    },
    addedByEmail: { ok: true, value: 'inviter@example.com' },
    inviteeEmail: 'invitee@example.com',
    role: MemberRole.Viewer,
    invitationTime: new Date(),
  }
}

afterEach(() => {
  cleanup()
  jest.clearAllMocks()
  useDocInvitationsStore.setState({ rawInvitations: [], convertedInvitations: [] })
})

describe('useDocInvites', () => {
  test('is not left loading when the drive SDK is unavailable', async () => {
    // @ts-ignore It CAN be undefined
    jest.mocked(getDrive).mockReturnValue(undefined)

    const { result } = renderHook(() => useDocInvites(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
  })

  test('acceptInvite throws when the drive SDK is not initialized', async () => {
    // @ts-ignore It CAN be undefined
    jest.mocked(getDrive).mockReturnValue(undefined)

    const { result } = renderHook(() => useDocInvites(), { wrapper })

    await expect(result.current.acceptInvite(fakeInvitation() as any)).rejects.toThrow('Drive SDK not initialized')
  })

  test('fetches invitations once the drive SDK becomes available on a re-render', async () => {
    // @ts-ignore It CAN be undefined
    jest.mocked(getDrive).mockReturnValue(undefined)

    const invitation = fakeInvitation()
    const drive = { iterateInvitations: jest.fn(() => asyncIteratorFrom([invitation])) }

    const { result, rerender } = renderHook(() => useDocInvites(), { wrapper })

    expect(drive.iterateInvitations).not.toHaveBeenCalled()

    jest.mocked(getDrive).mockReturnValue(drive as any)
    act(() => rerender())

    await waitFor(() => expect(drive.iterateInvitations).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(result.current.invitations).toHaveLength(1))
  })

  test('reload during accept keeps the invitation locked', async () => {
    const invitation = fakeInvitation()
    const drive = {
      // Server did not process the accept yet
      iterateInvitations: jest.fn(() => asyncIteratorFrom([invitation])),
      acceptInvitation: jest.fn(() => new Promise<void>(() => {})),
    }
    jest.mocked(getDrive).mockReturnValue(drive as any)

    const { result } = renderHook(() => useDocInvites(), { wrapper })
    await waitFor(() => expect(result.current.invitations).toHaveLength(1))

    act(() => {
      void result.current.acceptInvite(result.current.invitations[0])
    })
    emitSharedWithMeUpdated()

    await waitFor(() => expect(drive.iterateInvitations).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(result.current.invitations).toEqual([expect.objectContaining({ isLocked: true })]))
  })

  test('reload pending during accept does not bring the invitation back', async () => {
    const invitation = fakeInvitation()
    let resolveAccept!: () => void
    let releaseStaleReload!: () => void
    const staleReload = new Promise<void>((resolve) => (releaseStaleReload = resolve))
    const drive = {
      iterateInvitations: jest
        .fn()
        .mockImplementationOnce(() => asyncIteratorFrom([invitation]))
        // Started before server processed the accept, finishes after it
        .mockImplementationOnce(() => delayedIteratorFrom(staleReload, [invitation]))
        .mockImplementation(() => asyncIteratorFrom([])),
      acceptInvitation: jest.fn(() => new Promise<void>((resolve) => (resolveAccept = resolve))),
    }
    jest.mocked(getDrive).mockReturnValue(drive as any)

    const { result } = renderHook(() => useDocInvites(), { wrapper })
    await waitFor(() => expect(result.current.invitations).toHaveLength(1))

    let acceptPromise!: Promise<unknown>
    act(() => {
      acceptPromise = result.current.acceptInvite(result.current.invitations[0])
    })
    emitSharedWithMeUpdated()
    await waitFor(() => expect(drive.iterateInvitations).toHaveBeenCalledTimes(2))

    await act(async () => {
      resolveAccept()
      await acceptPromise
    })
    await act(async () => {
      releaseStaleReload()
      await new Promise((resolve) => setTimeout(resolve, 0)) // Let reloads finish
    })

    expect(drive.iterateInvitations).toHaveBeenCalledTimes(3)
    expect(result.current.invitations).toHaveLength(0)
  })

  test('acceptInvite returns where the document is, remembers it as recently accepted and reloads', async () => {
    const drive = {
      iterateInvitations: jest
        .fn()
        .mockImplementationOnce(() => asyncIteratorFrom([fakeInvitation()]))
        .mockImplementation(() => asyncIteratorFrom([])),
      acceptInvitation: jest.fn(() => Promise.resolve()),
    }
    jest.mocked(getDrive).mockReturnValue(drive as any)

    const { result } = renderHook(() => useDocInvites(), { wrapper })
    await waitFor(() => expect(result.current.invitations).toHaveLength(1))

    let location: unknown
    await act(async () => {
      location = await result.current.acceptInvite(result.current.invitations[0])
    })

    expect(drive.acceptInvitation).toHaveBeenCalledWith('invitation-1')
    expect(location).toEqual({ shareId: '', linkId: 'link-1', volumeId: 'volume-1' })
    expect(result.current.recentlyAcceptedInvites).toEqual([
      expect.objectContaining({ invitation: expect.objectContaining({ invitationId: 'invitation-1' }) }),
    ])
    await waitFor(() => expect(drive.iterateInvitations).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(result.current.invitations).toHaveLength(0))
  })

  test.each([
    ['traces an unexpected error', new Error('Network down'), true],
    ['does not trace a ValidationError', new ValidationError('Invitation expired'), false],
  ])('acceptInvite failure unlocks the invitation, rethrows and %s', async (_, failure, traced) => {
    let failAccept!: (error: Error) => void
    const drive = {
      iterateInvitations: jest.fn(() => asyncIteratorFrom([fakeInvitation()])),
      acceptInvitation: jest.fn(() => new Promise<void>((_resolve, reject) => (failAccept = reject))),
    }
    jest.mocked(getDrive).mockReturnValue(drive as any)

    const { result } = renderHook(() => useDocInvites(), { wrapper })
    await waitFor(() => expect(result.current.invitations).toHaveLength(1))

    let acceptPromise!: Promise<unknown>
    act(() => {
      acceptPromise = result.current.acceptInvite(result.current.invitations[0])
    })
    expect(result.current.invitations[0].isLocked).toBe(true)

    let thrown: unknown
    await act(async () => {
      failAccept(failure)
      await acceptPromise.catch((error) => (thrown = error))
    })

    expect(thrown).toBe(failure)
    expect(result.current.invitations[0].isLocked).toBe(false)
    expect(result.current.recentlyAcceptedInvites).toEqual([])
    if (traced) {
      expect(traceErrorSDK).toHaveBeenCalledWith(failure, 'DocsInvitationsDriveSDK')
    } else {
      expect(traceErrorSDK).not.toHaveBeenCalled()
    }
  })

  test('rejectInvite asks for confirmation, locks the invitation while rejecting, then reloads', async () => {
    let resolveReject!: () => void
    const drive = {
      iterateInvitations: jest
        .fn()
        .mockImplementationOnce(() => asyncIteratorFrom([fakeInvitation()]))
        .mockImplementation(() => asyncIteratorFrom([])),
      rejectInvitation: jest.fn(() => new Promise<void>((resolve) => (resolveReject = resolve))),
    }
    jest.mocked(getDrive).mockReturnValue(drive as any)

    const hook = renderDocInvitesWithModal()
    await waitFor(() => expect(hook.current.invitations).toHaveLength(1))

    act(() => {
      void hook.current.rejectInvite(hook.current.invitations[0])
    })

    expect(screen.getByText('Decline invitation?')).toBeInTheDocument()
    expect(drive.rejectInvitation).not.toHaveBeenCalled()

    await userEvent.click(screen.getByText('Decline invite'))

    expect(drive.rejectInvitation).toHaveBeenCalledWith('invitation-1')
    expect(hook.current.invitations[0].isLocked).toBe(true)
    expect(drive.iterateInvitations).toHaveBeenCalledTimes(1)

    await act(async () => resolveReject())

    await waitFor(() => expect(drive.iterateInvitations).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(hook.current.invitations).toHaveLength(0))
  })

  test('rejectInvite failure unlocks the invitation, traces and shows an error toast', async () => {
    const failure = new Error('Network down')
    const drive = {
      iterateInvitations: jest.fn(() => asyncIteratorFrom([fakeInvitation()])),
      rejectInvitation: jest.fn(() => Promise.reject(failure)),
    }
    jest.mocked(getDrive).mockReturnValue(drive as any)

    const hook = renderDocInvitesWithModal()
    await waitFor(() => expect(hook.current.invitations).toHaveLength(1))

    act(() => {
      void hook.current.rejectInvite(hook.current.invitations[0])
    })
    await userEvent.click(screen.getByText('Decline invite'))

    await waitFor(() =>
      expect(createNotification).toHaveBeenCalledWith({ type: 'error', text: 'Failed to reject invitation' }),
    )
    expect(traceErrorSDK).toHaveBeenCalledWith(failure, 'DocsInvitationsDriveSDK')
    expect(hook.current.invitations).toEqual([expect.objectContaining({ isLocked: false })])
    expect(drive.iterateInvitations).toHaveBeenCalledTimes(1)
  })

  test('lists only text document and sheet invitations', async () => {
    const noMediaType = {
      ...fakeInvitation({ uid: 'no-media-type' }),
      node: { ...fakeInvitation().node, mediaType: undefined },
    }
    const drive = {
      iterateInvitations: jest.fn(() =>
        asyncIteratorFrom([
          fakeInvitation({ uid: 'document' }),
          fakeInvitation({ uid: 'sheet', mediaType: PROTON_DOCS_SPREADSHEET_MIMETYPE }),
          fakeInvitation({ uid: 'pdf', mediaType: 'application/pdf' }),
          noMediaType,
        ]),
      ),
    }
    jest.mocked(getDrive).mockReturnValue(drive as any)

    const { result } = renderHook(() => useDocInvites(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.invitations.map(({ invitation }) => invitation.invitationId)).toEqual(['document', 'sheet'])
  })

  test('logs and traces a failed fetch, and stops loading', async () => {
    const failure = new Error('Network down')
    const logError = jest.spyOn(sharedLogger, 'error').mockImplementation(() => {})
    const drive = { iterateInvitations: jest.fn(() => failingIterator(failure)) }
    jest.mocked(getDrive).mockReturnValue(drive as any)

    const { result } = renderHook(() => useDocInvites(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(logError).toHaveBeenCalledWith('Failed to load invitations', failure)
    expect(traceErrorSDK).toHaveBeenCalledWith(failure, 'DocsInvitationsDriveSDK')
    expect(result.current.invitations).toEqual([])
    logError.mockRestore()
  })

  test('inviteForNodeMeta finds a loaded invitation by its linkId', async () => {
    const drive = {
      iterateInvitations: jest.fn(() =>
        asyncIteratorFrom([
          fakeInvitation({ uid: 'invitation-1', linkId: 'link-1' }),
          fakeInvitation({ uid: 'invitation-2', linkId: 'link-2' }),
        ]),
      ),
    }
    jest.mocked(getDrive).mockReturnValue(drive as any)

    const { result } = renderHook(() => useDocInvites(), { wrapper })
    await waitFor(() => expect(result.current.invitations).toHaveLength(2))

    const inviteFor = (linkId: string) => result.current.inviteForNodeMeta({ volumeId: 'volume-1', linkId })
    expect(inviteFor('link-2')?.invitation.invitationId).toBe('invitation-2')
    expect(inviteFor('unknown')).toBeUndefined()
  })

  test('unmount stops listening to core events and aborts the pending fetch', async () => {
    let fetchSignal!: AbortSignal
    const drive = {
      iterateInvitations: jest.fn((signal: AbortSignal) => {
        fetchSignal = signal
        return pendingIterator()
      }),
    }
    jest.mocked(getDrive).mockReturnValue(drive as any)

    const { unmount } = renderHook(() => useDocInvites(), { wrapper })
    await waitFor(() => expect(drive.iterateInvitations).toHaveBeenCalledTimes(1))
    expect(mockCoreEventListeners.size).toBe(1)
    expect(fetchSignal.aborted).toBe(false)

    unmount()

    expect(mockCoreEventListeners.size).toBe(0)
    expect(fetchSignal.aborted).toBe(true)
  })
})
