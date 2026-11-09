import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { RecentDocumentsItem } from '@proton/docs-core/Services/recent-documents'
import { generateNodeUid, type ProtonDriveClient } from '@protontech/drive-sdk'
import { ServerTime } from '@proton/docs-shared/ServerTime'
import type { RecentDocumentsItemValue } from '@proton/docs-core/Services/recent-documents'
import { TelemetryDocsHomepageEvents } from '@proton/shared/lib/api/telemetry'
import { trashManyAndNotify } from './driveSdk/trashRestoreNotify'
import { HomepageViewContext, type HomepageViewValue } from './homepageViewContext'
import { useBulkTrash } from './useBulkTrash'

jest.mock('./driveSdk/trashRestoreNotify', () => ({ trashManyAndNotify: jest.fn() }))

const mockCreateNotification = jest.fn()
jest.mock('@proton/app-context/useNotifications', () => ({
  __esModule: true,
  useNotifications: () => ({ createNotification: mockCreateNotification }),
}))

const mockUpdateRecentDocuments = jest.fn()

const mockReportHomepageTelemetry = jest.fn()
jest.mock('~/utils/application-context', () => ({
  useApplication: () => ({ metrics: { reportHomepageTelemetry: mockReportHomepageTelemetry } }),
}))

function createMockRecentDocument(data: Partial<RecentDocumentsItemValue> = {}): RecentDocumentsItem {
  return RecentDocumentsItem.create({
    type: 'document',
    name: 'Untitled',
    linkId: 'link1',
    parentLinkId: undefined,
    volumeId: 'volume1',
    lastViewed: new ServerTime(Date.now()),
    lastModified: new ServerTime(Date.now()),
    createdBy: 'Me',
    location: { type: 'root' },
    isSharedWithMe: false,
    shareId: 'share1',
    ...data,
  })
}

const d1 = createMockRecentDocument({ name: 'Document1', linkId: 'link1' })
const d2 = createMockRecentDocument({ name: 'Document2', linkId: 'link2' })
const uid = (doc: RecentDocumentsItem) => generateNodeUid(doc.volumeId, doc.linkId)
const drive = {} as ProtonDriveClient
function Wrapper({ children }: { children: ReactNode }) {
  return (
    <HomepageViewContext.Provider
      value={{ updateRecentDocuments: mockUpdateRecentDocuments } as unknown as HomepageViewValue}
    >
      {children}
    </HomepageViewContext.Provider>
  )
}
const renderBulkTrash = () => renderHook(() => useBulkTrash({ drive }), { wrapper: Wrapper })

describe('useBulkTrash', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(trashManyAndNotify).mockResolvedValue({ succeeded: [], failed: [] })
  })

  it('trashes node uids built from volumeId and linkId and reloads on undo', async () => {
    const { result } = renderBulkTrash()

    await act(() => result.current.trash([d1, d2]))

    expect(trashManyAndNotify).toHaveBeenCalledWith(
      drive,
      mockCreateNotification,
      [uid(d1), uid(d2)],
      expect.any(Function),
    )
    const onRestored = jest.mocked(trashManyAndNotify).mock.calls[0][3]
    onRestored()
    expect(mockUpdateRecentDocuments).toHaveBeenCalled()
  })

  it('reloads once and reports telemetry per trashed item', async () => {
    jest.mocked(trashManyAndNotify).mockResolvedValue({ succeeded: [uid(d1), uid(d2)], failed: [] })
    const { result } = renderBulkTrash()

    let failed: RecentDocumentsItem[] = []
    await act(async () => {
      failed = await result.current.trash([d1, d2])
    })

    expect(mockUpdateRecentDocuments).toHaveBeenCalledTimes(1)
    expect(mockReportHomepageTelemetry).toHaveBeenCalledTimes(2)
    expect(mockReportHomepageTelemetry).toHaveBeenCalledWith(TelemetryDocsHomepageEvents.document_trashed)
    expect(failed).toEqual([])
  })

  it('returns the failed documents and does not reload when nothing succeeded', async () => {
    jest.mocked(trashManyAndNotify).mockResolvedValue({
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
    expect(mockReportHomepageTelemetry).not.toHaveBeenCalled()
  })

  it('isTrashing is true while the batch runs', async () => {
    let resolve!: (value: { succeeded: string[]; failed: never[] }) => void
    jest.mocked(trashManyAndNotify).mockReturnValue(new Promise((r) => (resolve = r)))
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
    jest.mocked(trashManyAndNotify).mockRejectedValue(new Error('boom'))
    const { result } = renderBulkTrash()

    await act(async () => {
      await expect(result.current.trash([d1])).rejects.toThrow('boom')
    })

    expect(result.current.isTrashing).toBe(false)
  })
})
