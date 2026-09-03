import type { NotificationsManager } from '@proton/app-context/notifications/manager'
import { NotificationsContext } from '@proton/app-context/notifications/notificationsContext'
import AuthenticationContext from '@proton/components/containers/authentication/authenticationContext'
import { MemberRole, generateNodeUid, getDrive } from '@proton/drive'
import { PROTON_DOCS_DOCUMENT_MIMETYPE } from '@proton/shared/lib/helpers/mimetype'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { useDocInvitationsStore } from './use-doc-invitations-store'
import { useDocInvites } from './useDocInvites'

jest.mock('@proton/drive', () => ({
  ...jest.requireActual('@proton/drive'),
  getDrive: jest.fn(),
}))

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
})
