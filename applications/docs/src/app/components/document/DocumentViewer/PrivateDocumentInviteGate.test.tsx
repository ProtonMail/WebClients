import { ApiContext } from '@proton/app-context/apiContext'
import type { Application } from '@proton/docs-core/Application/Application'
import { generateInvitationUid, getDrive } from '@proton/drive/sdk'
import { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/permissions'
import { render, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { ApplicationProvider } from '~/utils/application-context'
import { PrivateDocumentInviteGate } from './PrivateDocumentInviteGate'

vi.mock('@proton/drive/sdk', async () => ({
  ...(await vi.importActual('@proton/drive/sdk')),
  getDrive: vi.fn(),
}))

const nodeMeta = { volumeId: 'volume-1', linkId: 'link-1' }
const invitation = { ShareID: 'share-1', VolumeID: 'volume-1', InvitationID: 'invitation-1' }
const documentInvitation = { ShareID: 'document-share', VolumeID: 'volume-1', InvitationID: 'document-invitation' }
const folderInvitation = { ShareID: 'folder-share', VolumeID: 'volume-1', InvitationID: 'folder-invitation' }
const { VIEWER, EDITOR } = SHARE_MEMBER_PERMISSIONS

const api = vi.fn()
const drive = { acceptInvitation: vi.fn(), iterateInvitations: vi.fn() }
const application = { logger: { info: vi.fn(), warn: vi.fn() } } as unknown as Application

type InvitationDetails = { sharedLinkId: string; permissions: number } | Error

/** Answers user-link-access with the invitations, and each invitation lookup with its details, keyed by InvitationID. */
function mockApi(invitations: (typeof invitation)[], detailsById: Record<string, InvitationDetails>) {
  api.mockImplementation(async ({ url }: { url: string }) => {
    if (url === 'drive/v2/user-link-access') {
      return { ContextShare: null, Invitations: invitations }
    }
    const invitationId = url.replace('drive/v2/shares/invitations/', '')
    const details = detailsById[invitationId]
    if (!details || details instanceof Error) {
      throw details ?? new Error(`Unexpected request: ${url}`)
    }
    return {
      Invitation: { InvitationID: invitationId, Permissions: details.permissions },
      Link: { LinkID: details.sharedLinkId },
    }
  })
}

function wrapper({ children }: { children: ReactNode }) {
  return (
    <ApiContext.Provider value={api}>
      <ApplicationProvider application={application}>{children}</ApplicationProvider>
    </ApiContext.Provider>
  )
}

function renderGate() {
  const onAccessReady = vi.fn()
  const view = render(<PrivateDocumentInviteGate nodeMeta={nodeMeta} onAccessReady={onAccessReady} />, { wrapper })
  return { onAccessReady, ...view }
}

function deferred<T = void>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('PrivateDocumentInviteGate', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(getDrive).mockReturnValue(drive as unknown as ReturnType<typeof getDrive>)
  })

  it('asks user-link-access about this document only, and never lists pending invitations', async () => {
    api.mockResolvedValue({ ContextShare: { ShareID: 'share-1', LinkID: 'link-1', VolumeID: 'volume-1' } })

    const { onAccessReady } = renderGate()

    await waitFor(() => expect(onAccessReady).toHaveBeenCalledTimes(1))
    expect(api).toHaveBeenCalledTimes(1)
    expect(api).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'get',
        url: 'drive/v2/user-link-access',
        params: { VolumeID: 'volume-1', LinkID: 'link-1', ShareID: undefined },
      }),
    )
    expect(drive.iterateInvitations).not.toHaveBeenCalled()
    expect(drive.acceptInvitation).not.toHaveBeenCalled()
  })

  it('accepts the returned invitation and releases the gate only once acceptance has finished', async () => {
    api.mockResolvedValue({ Invitations: [invitation] })
    const acceptance = deferred()
    drive.acceptInvitation.mockReturnValue(acceptance.promise)

    const { onAccessReady } = renderGate()

    await waitFor(() =>
      expect(drive.acceptInvitation).toHaveBeenCalledWith(generateInvitationUid('share-1', 'invitation-1')),
    )
    expect(onAccessReady).not.toHaveBeenCalled()

    acceptance.resolve()

    await waitFor(() => expect(onAccessReady).toHaveBeenCalledTimes(1))
  })

  it('accepts a single invitation without looking it up', async () => {
    api.mockResolvedValue({ Invitations: [invitation] })
    drive.acceptInvitation.mockResolvedValue(undefined)

    const { onAccessReady } = renderGate()

    await waitFor(() => expect(onAccessReady).toHaveBeenCalledTimes(1))
    expect(api).toHaveBeenCalledTimes(1)
  })

  describe('with invitations to the document and to a folder above it', () => {
    const detailsById = {
      'document-invitation': { sharedLinkId: 'link-1', permissions: EDITOR },
      'folder-invitation': { sharedLinkId: 'folder-link', permissions: VIEWER },
    }

    it.each([
      ['first', [documentInvitation, folderInvitation]],
      ['second', [folderInvitation, documentInvitation]],
    ])(
      "accepts only the document's editor invitation, not the folder's viewer one, when listed %s",
      async (_, invitations) => {
        mockApi(invitations, detailsById)
        drive.acceptInvitation.mockResolvedValue(undefined)

        const { onAccessReady } = renderGate()

        await waitFor(() => expect(onAccessReady).toHaveBeenCalledTimes(1))
        expect(drive.acceptInvitation).toHaveBeenCalledTimes(1)
        expect(drive.acceptInvitation).toHaveBeenCalledWith(
          generateInvitationUid('document-share', 'document-invitation'),
        )
      },
    )

    it.each([
      ['first', [documentInvitation, folderInvitation]],
      ['second', [folderInvitation, documentInvitation]],
    ])(
      "accepts the document's viewer invitation, then the folder's editor one, when listed %s",
      async (_, invitations) => {
        mockApi(invitations, {
          'document-invitation': { sharedLinkId: 'link-1', permissions: VIEWER },
          'folder-invitation': { sharedLinkId: 'folder-link', permissions: EDITOR },
        })
        drive.acceptInvitation.mockResolvedValue(undefined)

        const { onAccessReady } = renderGate()

        await waitFor(() => expect(onAccessReady).toHaveBeenCalledTimes(1))
        expect(drive.acceptInvitation.mock.calls).toEqual([
          [generateInvitationUid('document-share', 'document-invitation')],
          [generateInvitationUid('folder-share', 'folder-invitation')],
        ])
      },
    )

    it("keeps the document's invitation and releases the gate when accepting the folder's fails", async () => {
      mockApi([folderInvitation, documentInvitation], {
        'document-invitation': { sharedLinkId: 'link-1', permissions: VIEWER },
        'folder-invitation': { sharedLinkId: 'folder-link', permissions: EDITOR },
      })
      drive.acceptInvitation.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('Invitation not found'))

      const { onAccessReady } = renderGate()

      await waitFor(() => expect(onAccessReady).toHaveBeenCalledTimes(1))
      expect(drive.acceptInvitation).toHaveBeenNthCalledWith(
        1,
        generateInvitationUid('document-share', 'document-invitation'),
      )
      expect(application.logger.warn).toHaveBeenCalled()
    })

    it("accepts only the document's own invitation when the folder's grants the same", async () => {
      mockApi([folderInvitation, documentInvitation], {
        'document-invitation': { sharedLinkId: 'link-1', permissions: EDITOR },
        'folder-invitation': { sharedLinkId: 'folder-link', permissions: EDITOR },
      })
      drive.acceptInvitation.mockResolvedValue(undefined)

      const { onAccessReady } = renderGate()

      await waitFor(() => expect(onAccessReady).toHaveBeenCalledTimes(1))
      expect(drive.acceptInvitation).toHaveBeenCalledTimes(1)
      expect(drive.acceptInvitation).toHaveBeenCalledWith(
        generateInvitationUid('document-share', 'document-invitation'),
      )
    })

    it("accepts the document's own invitation when only the folder's lookup fails", async () => {
      mockApi([folderInvitation, documentInvitation], {
        'document-invitation': { sharedLinkId: 'link-1', permissions: EDITOR },
        'folder-invitation': new Error('Invitation not found'),
      })
      drive.acceptInvitation.mockResolvedValue(undefined)

      const { onAccessReady } = renderGate()

      await waitFor(() => expect(onAccessReady).toHaveBeenCalledTimes(1))
      expect(drive.acceptInvitation).toHaveBeenCalledTimes(1)
      expect(drive.acceptInvitation).toHaveBeenCalledWith(
        generateInvitationUid('document-share', 'document-invitation'),
      )
    })

    it("accepts the folder's invitation when only the document's lookup fails", async () => {
      mockApi([documentInvitation, folderInvitation], {
        'document-invitation': new Error('Network error'),
        'folder-invitation': { sharedLinkId: 'folder-link', permissions: VIEWER },
      })
      drive.acceptInvitation.mockResolvedValue(undefined)

      const { onAccessReady } = renderGate()

      await waitFor(() => expect(onAccessReady).toHaveBeenCalledTimes(1))
      expect(drive.acceptInvitation).toHaveBeenCalledTimes(1)
      expect(drive.acceptInvitation).toHaveBeenCalledWith(generateInvitationUid('folder-share', 'folder-invitation'))
    })

    it('accepts nothing and releases the gate when every lookup fails', async () => {
      mockApi([folderInvitation, documentInvitation], {
        'document-invitation': new Error('Network error'),
        'folder-invitation': new Error('Network error'),
      })

      const { onAccessReady } = renderGate()

      await waitFor(() => expect(onAccessReady).toHaveBeenCalledTimes(1))
      expect(drive.acceptInvitation).not.toHaveBeenCalled()
      expect(application.logger.warn).toHaveBeenCalled()
    })
  })

  it('accepts the one granting the most when none is to the document itself', async () => {
    const parentInvitation = { ShareID: 'parent-share', VolumeID: 'volume-1', InvitationID: 'parent-invitation' }
    mockApi([folderInvitation, parentInvitation], {
      'folder-invitation': { sharedLinkId: 'folder-link', permissions: VIEWER },
      'parent-invitation': { sharedLinkId: 'parent-link', permissions: EDITOR },
    })
    drive.acceptInvitation.mockResolvedValue(undefined)

    const { onAccessReady } = renderGate()

    await waitFor(() => expect(onAccessReady).toHaveBeenCalledTimes(1))
    expect(drive.acceptInvitation).toHaveBeenCalledTimes(1)
    expect(drive.acceptInvitation).toHaveBeenCalledWith(generateInvitationUid('parent-share', 'parent-invitation'))
  })

  it('releases the gate when the user has neither access nor an invitation', async () => {
    api.mockResolvedValue({ ContextShare: null, Invitations: null })

    const { onAccessReady } = renderGate()

    await waitFor(() => expect(onAccessReady).toHaveBeenCalledTimes(1))
    expect(drive.acceptInvitation).not.toHaveBeenCalled()
  })

  it('releases the gate when acceptance fails, such as for an invitation revoked since the lookup', async () => {
    api.mockResolvedValue({ Invitations: [invitation] })
    drive.acceptInvitation.mockRejectedValue(new Error('Invitation not found'))

    const { onAccessReady } = renderGate()

    await waitFor(() => expect(onAccessReady).toHaveBeenCalledTimes(1))
    expect(application.logger.warn).toHaveBeenCalled()
  })

  it('releases the gate when the lookup fails', async () => {
    api.mockRejectedValue(new Error('Network error'))

    const { onAccessReady } = renderGate()

    await waitFor(() => expect(onAccessReady).toHaveBeenCalledTimes(1))
    expect(drive.acceptInvitation).not.toHaveBeenCalled()
  })

  it('cancels the lookup when unmounted before it answers, and accepts nothing', async () => {
    const lookup = deferred<unknown>()
    api.mockReturnValue(lookup.promise)

    const { onAccessReady, unmount } = renderGate()
    await waitFor(() => expect(api).toHaveBeenCalledTimes(1))
    const { signal } = api.mock.calls[0][0] as { signal: AbortSignal }

    unmount()
    expect(signal.aborted).toBe(true)

    lookup.resolve({ Invitations: [invitation] })
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(drive.acceptInvitation).not.toHaveBeenCalled()
    expect(onAccessReady).not.toHaveBeenCalled()
  })

  it('accepts an invitation once when a second gate for the same document mounts during acceptance', async () => {
    api.mockResolvedValue({ Invitations: [invitation] })
    const acceptance = deferred()
    drive.acceptInvitation.mockReturnValue(acceptance.promise)

    const first = renderGate()
    await waitFor(() => expect(drive.acceptInvitation).toHaveBeenCalledTimes(1))
    first.unmount()
    const second = renderGate()
    await waitFor(() => expect(api).toHaveBeenCalledTimes(2))

    acceptance.resolve()

    await waitFor(() => expect(second.onAccessReady).toHaveBeenCalledTimes(1))
    expect(drive.acceptInvitation).toHaveBeenCalledTimes(1)
  })
})
