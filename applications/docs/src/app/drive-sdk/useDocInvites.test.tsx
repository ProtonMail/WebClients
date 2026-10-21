import type { NotificationsManager } from '@proton/app-context/notifications/manager'
import { NotificationsContext } from '@proton/app-context/notifications/notificationsContext'
import AuthenticationContext from '@proton/components/containers/authentication/authenticationContext'
import { MemberRole, generateNodeUid, getDrive } from '@proton/drive/sdk'
import { PROTON_DOCS_DOCUMENT_MIMETYPE } from '@proton/shared/lib/helpers/mimetype'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { useDocInvitationsStore } from './use-doc-invitations-store'
import { useDocInvites } from './useDocInvites'

jest.mock('@proton/drive/sdk', () => ({
  ...jest.requireActual('@proton/drive/sdk'),
  getDrive: jest.fn(),
}))

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

function fakeInvitation() {
  return {
    uid: 'invitation-1',
    node: {
      uid: generateNodeUid('volume-1', 'link-1'),
      name: { ok: true, value: 'doc.txt' },
      mediaType: PROTON_DOCS_DOCUMENT_MIMETYPE,
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
})
