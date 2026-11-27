import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { RecentDocumentsItem } from '../recentDocumentsItem'
import { generateNodeUid, type ProtonDriveClient } from '@protontech/drive-sdk'
import { createRecentDocument } from '../test-helpers'
import { trashManyAndNotify } from './trashRestoreNotify'
import { HomepageViewContext, type HomepageViewValue } from '../homepageViewContext'
import type { ErrorTracking } from '../utils/errorTracking'
import { useBulkTrash } from './useBulkTrash'
import { defaultHomepageMessages } from '../messages/defaultHomepageMessages'
import { TelemetryEvent } from '../utils/telemetry'

vi.mock('./trashRestoreNotify', () => ({ trashManyAndNotify: vi.fn() }))

const mockCreateNotification = vi.fn()

const mockUpdateRecentDocuments = vi.fn()

const mockReportTelemetry = vi.fn()

const d1 = createRecentDocument({ name: 'Document1', linkId: 'link1' })
const d2 = createRecentDocument({ name: 'Document2', linkId: 'link2' })
const uid = (doc: RecentDocumentsItem) => generateNodeUid(doc.volumeId, doc.linkId)
const drive = {} as ProtonDriveClient
const errorTracking = {} as ErrorTracking
function Wrapper({ children }: { children: ReactNode }) {
  return (
    <HomepageViewContext.Provider
      value={
        {
          updateRecentDocuments: mockUpdateRecentDocuments,
          reportTelemetry: mockReportTelemetry,
          createNotification: mockCreateNotification,
          errorTracking,
        } as unknown as HomepageViewValue
      }
    >
      {children}
    </HomepageViewContext.Provider>
  )
}
const renderBulkTrash = () => renderHook(() => useBulkTrash({ drive }), { wrapper: Wrapper })

describe('useBulkTrash', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(trashManyAndNotify).mockResolvedValue({ succeeded: [], failed: [] })
  })

  it('trashes node uids built from volumeId and linkId and reloads on undo', async () => {
    const { result } = renderBulkTrash()

    await act(() => result.current.trash([d1, d2]))

    expect(trashManyAndNotify).toHaveBeenCalledWith(
      drive,
      mockCreateNotification,
      errorTracking,
      [uid(d1), uid(d2)],
      expect.any(Function),
      true,
      defaultHomepageMessages.trash,
    )
    const onRestored = vi.mocked(trashManyAndNotify).mock.calls[0][4]
    onRestored()
    expect(mockUpdateRecentDocuments).toHaveBeenCalled()
  })

  it("offers Undo only when every document is the user's own", async () => {
    const shared = createRecentDocument({ name: 'Shared', linkId: 'link3', isSharedWithMe: true })
    const { result } = renderBulkTrash()

    await act(() => result.current.trash([d1, shared]))

    expect(vi.mocked(trashManyAndNotify).mock.calls[0][5]).toBe(false)
  })

  it('reloads once and reports telemetry per trashed item', async () => {
    vi.mocked(trashManyAndNotify).mockResolvedValue({ succeeded: [uid(d1), uid(d2)], failed: [] })
    const { result } = renderBulkTrash()

    let failed: RecentDocumentsItem[] = []
    await act(async () => {
      failed = await result.current.trash([d1, d2])
    })

    expect(mockUpdateRecentDocuments).toHaveBeenCalledTimes(1)
    expect(mockReportTelemetry).toHaveBeenCalledTimes(2)
    expect(mockReportTelemetry).toHaveBeenCalledWith(TelemetryEvent.document_trashed)
    expect(failed).toEqual([])
  })

  it('returns the failed documents and does not reload when nothing succeeded', async () => {
    vi.mocked(trashManyAndNotify).mockResolvedValue({
      succeeded: [],
      failed: [{ uid: uid(d2), error: new Error('nope') }],
    })
    const { result } = renderBulkTrash()

    let failed: RecentDocumentsItem[] = []
    await act(async () => {
      failed = await result.current.trash([d1, d2])
    })

    expect(failed).toEqual([d2])
    expect(mockUpdateRecentDocuments).not.toHaveBeenCalled()
    expect(mockReportTelemetry).not.toHaveBeenCalled()
  })

  it('isTrashing is true while the batch runs', async () => {
    let resolve!: (value: { succeeded: string[]; failed: never[] }) => void
    vi.mocked(trashManyAndNotify).mockReturnValue(new Promise((r) => (resolve = r)))
    const { result } = renderBulkTrash()

    let promise!: Promise<RecentDocumentsItem[]>
    act(() => {
      promise = result.current.trash([d1])
    })
    expect(result.current.isTrashing).toBe(true)

    resolve({ succeeded: [], failed: [] })
    await act(() => promise)
    await waitFor(() => expect(result.current.isTrashing).toBe(false))
  })

  it('isTrashing resets when trashManyAndNotify rejects', async () => {
    vi.mocked(trashManyAndNotify).mockRejectedValue(new Error('boom'))
    const { result } = renderBulkTrash()

    await act(async () => {
      await expect(result.current.trash([d1])).rejects.toThrow('boom')
    })

    expect(result.current.isTrashing).toBe(false)
  })
})
