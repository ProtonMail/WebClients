import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { RecentDocumentsItem } from '../recentDocumentsItem'
import type { RecentDocumentsItemValue } from '../recentDocumentsItem'
import { ServerTime } from '../utils/serverTime'
import { generateNodeUid } from '@protontech/drive-sdk'
import { HomepageViewContext, type HomepageViewValue } from '../homepageViewContext'
import { useBulkMove } from './useBulkMove'
import { TelemetryEvent } from '../utils/telemetry'

const openMoveItemsModal = jest.fn()

const reportTelemetry = jest.fn()
const updateMovedDocuments = jest.fn()

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <HomepageViewContext.Provider value={{ updateMovedDocuments, reportTelemetry } as unknown as HomepageViewValue}>
      {children}
    </HomepageViewContext.Provider>
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
const renderBulkMove = () => renderHook(() => useBulkMove({ openMoveItemsModal }), { wrapper: Wrapper })

describe('useBulkMove', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('opens one move modal for every document and reports telemetry per document', () => {
    const { result } = renderBulkMove()

    act(() => result.current.move([d1, d2]))

    expect(openMoveItemsModal).toHaveBeenCalledTimes(1)
    expect(openMoveItemsModal).toHaveBeenCalledWith({
      nodeUids: [generateNodeUid('volume1', 'link1'), generateNodeUid('volume1', 'link2')],
      onMoved: expect.any(Function),
    })
    expect(reportTelemetry).toHaveBeenCalledTimes(2)
    expect(reportTelemetry).toHaveBeenCalledWith(TelemetryEvent.document_moved)
  })

  it('moves only the documents the move modal reports as moved', () => {
    const onMoved = jest.fn()
    const { result } = renderBulkMove()
    act(() => result.current.move([d1, d2], onMoved))
    const [{ onMoved: onModalMoved }] = openMoveItemsModal.mock.calls[0]

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
