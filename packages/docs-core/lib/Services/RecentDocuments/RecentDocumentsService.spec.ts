import { InternalEventBus } from '@proton/docs-shared'
import { RecentDocumentsService } from './RecentDocumentsService'
import type { DecryptedNode, DriveCompat } from '@proton/drive-store/lib'
import { type RecentDocumentsSnapshotData } from './types'
import type { DocsApi } from '../../Api/DocsApi'
import type { LoggerInterface } from '@proton/utils/logs'
import type { RecentDocumentAPIItem } from '../../Api/Types/GetRecentsResponse'

describe('RecentDocumentsService', () => {
  const mockData: RecentDocumentAPIItem[] = [
    { LinkID: 'link1', ContextShareID: 'share1', LastOpenTime: 1 } as RecentDocumentAPIItem,
  ]
  const mockDecryptedNodes: DecryptedNode[] = [
    {
      volumeId: 'volume1',
      nodeId: 'link1',
      name: 'name1',
      hash: 'hash',
      createTime: 1,
      mimeType: '',
      parentNodeId: 'parentLink1',
      signatureAddress: 'me@proton.ch',
    },
  ]

  let service: RecentDocumentsService
  let driveCompat: DriveCompat
  let docsApi: DocsApi

  beforeEach(() => {
    const eventBus = new InternalEventBus()
    driveCompat = {
      getNodes: jest.fn().mockResolvedValue(mockDecryptedNodes),
      getNodePaths: jest.fn().mockResolvedValue([['location', 'link1']]),
      getNodesAreShared: jest.fn().mockResolvedValue([false]),
    } as unknown as DriveCompat

    docsApi = {
      fetchRecentDocuments: jest.fn().mockResolvedValue({
        isFailed: () => false,
        getValue: () => ({ RecentDocuments: mockData }),
      }),
    } as unknown as DocsApi

    const logger = {
      error: console.error,
    } as unknown as LoggerInterface

    service = new RecentDocumentsService(eventBus, driveCompat, docsApi, logger)
  })

  describe('fetch', () => {
    test('Load recent documents from local storage', async () => {
      await service.fetch()
    })

    test('Load links from driveCompat for every id returned from local storage', async () => {
      await service.fetch()

      expect(driveCompat.getNodes).toHaveBeenCalled()
      expect(driveCompat.getNodePaths).toHaveBeenCalled()
    })

    test('service state will be "fetching until fetch resolves"', async () => {
      const promise = service.fetch()

      expect(service.state).toBe('fetching')

      await promise

      expect(service.state).toBe('done')
    })

    test('service state will be "fetching until fetch resolves"', async () => {
      const promise = service.fetch()

      expect(service.state).toBe('fetching')

      await promise

      expect(service.state).toBe('done')
    })
  })

  describe('getSnapshot', () => {
    test('Will return populated recent document data when fetch completes', async () => {
      const mockSnapshotData: RecentDocumentsSnapshotData = {
        name: 'name1',
        volumeId: 'volume1',
        linkId: 'link1',
        lastViewed: 1,
        parentLinkId: 'parentLink1',
        createdBy: 'me@proton.ch',
      }

      const promise = service.fetch()

      expect(service.getSnapshot().data).toEqual([])

      await promise

      expect(service.getSnapshot().data?.[0]).toMatchObject(mockSnapshotData)
    })
  })
})
