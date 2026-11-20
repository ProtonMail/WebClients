import { ApiContext } from '@proton/app-context/apiContext'
import type { Application } from '@proton/docs-core/Application/Application'
import { generateInvitationUid, getDrive } from '@proton/drive/sdk'
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

const api = vi.fn()
const drive = { acceptInvitation: vi.fn(), iterateInvitations: vi.fn() }
const application = { logger: { info: vi.fn(), warn: vi.fn() } } as unknown as Application

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
