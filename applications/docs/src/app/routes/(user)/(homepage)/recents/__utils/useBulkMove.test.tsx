import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { Application } from '@proton/docs-core/Application/Application'
import { RecentDocumentsItem } from '@proton/docs-core/Services/recent-documents'
import type { RecentDocumentsItemValue } from '@proton/docs-core/Services/recent-documents'
import { ServerTime } from '@proton/docs-shared/ServerTime'
import { generateNodeUid } from '@proton/drive/sdk'
import { TelemetryDocsHomepageEvents } from '@proton/shared/lib/api/telemetry'
import { ApplicationProvider } from '~/utils/application-context'
import { useBulkMove } from './useBulkMove'

const mockShowMoveItemsModal = jest.fn()
jest.mock('@proton/drive/public/moveItemsModal', () => ({
  useMoveItemsModal: () => ({ moveItemsModal: null, showMoveItemsModal: mockShowMoveItemsModal }),
}))

const reportHomepageTelemetry = jest.fn()

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <ApplicationProvider application={{ metrics: { reportHomepageTelemetry } } as unknown as Application}>
      {children}
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

describe('useBulkMove', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('opens one move modal for every document and reports telemetry per document', () => {
    const { result } = renderHook(() => useBulkMove(), { wrapper: Wrapper })

    act(() => result.current.move([d1, d2]))

    expect(mockShowMoveItemsModal).toHaveBeenCalledTimes(1)
    expect(mockShowMoveItemsModal).toHaveBeenCalledWith({
      nodeUids: [generateNodeUid('volume1', 'link1'), generateNodeUid('volume1', 'link2')],
    })
    expect(reportHomepageTelemetry).toHaveBeenCalledTimes(2)
    expect(reportHomepageTelemetry).toHaveBeenCalledWith(TelemetryDocsHomepageEvents.document_moved)
  })
})
