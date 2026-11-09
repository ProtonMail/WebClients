import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { Application } from '@proton/docs-core/Application/Application'
import { RecentDocumentsItem } from '@proton/docs-core/Services/recent-documents'
import type { RecentDocumentsItemValue } from '@proton/docs-core/Services/recent-documents'
import { ServerTime } from '@proton/docs-shared/ServerTime'
import { generateNodeUid } from '@protontech/drive-sdk'
import { TelemetryDocsHomepageEvents } from '@proton/shared/lib/api/telemetry'
import { ApplicationProvider } from '~/utils/application-context'
import { HomepageViewContext, type HomepageViewValue } from './homepageViewContext'
import { useBulkMove, type UseMoveItemsModal } from './useBulkMove'

const mockShowMoveItemsModal = jest.fn()
const useMockMoveItemsModal: UseMoveItemsModal = () => ({
  moveItemsModal: null,
  showMoveItemsModal: mockShowMoveItemsModal,
})

const reportHomepageTelemetry = jest.fn()
const updateMovedDocuments = jest.fn()

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <ApplicationProvider application={{ metrics: { reportHomepageTelemetry } } as unknown as Application}>
      <HomepageViewContext.Provider value={{ updateMovedDocuments } as unknown as HomepageViewValue}>
        {children}
      </HomepageViewContext.Provider>
    </ApplicationProvider>
  )
}

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
const renderBulkMove = () =>
  renderHook(() => useBulkMove({ useMoveItemsModal: useMockMoveItemsModal }), { wrapper: Wrapper })

describe('useBulkMove', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('opens one move modal for every document and reports telemetry per document', () => {
    const { result } = renderBulkMove()

    act(() => result.current.move([d1, d2]))

    expect(mockShowMoveItemsModal).toHaveBeenCalledTimes(1)
    expect(mockShowMoveItemsModal).toHaveBeenCalledWith({
      nodeUids: [generateNodeUid('volume1', 'link1'), generateNodeUid('volume1', 'link2')],
      onMoved: expect.any(Function),
    })
    expect(reportHomepageTelemetry).toHaveBeenCalledTimes(2)
    expect(reportHomepageTelemetry).toHaveBeenCalledWith(TelemetryDocsHomepageEvents.document_moved)
  })

  it('moves only the documents the move modal reports as moved', () => {
    const onMoved = jest.fn()
    const { result } = renderBulkMove()
    act(() => result.current.move([d1, d2], onMoved))
    const [{ onMoved: onModalMoved }] = mockShowMoveItemsModal.mock.calls[0]

    onModalMoved({
      movedUids: [generateNodeUid('volume1', 'link1')],
      failedItems: [{ uid: generateNodeUid('volume1', 'link2'), error: new Error('Failed') }],
      targetFolderUid: generateNodeUid('volume1', 'folder'),
    })

    expect(updateMovedDocuments).toHaveBeenCalledTimes(1)
    expect(updateMovedDocuments).toHaveBeenCalledWith([generateNodeUid('volume1', 'link1')])
    expect(onMoved).toHaveBeenCalledWith([d1])
  })
})
