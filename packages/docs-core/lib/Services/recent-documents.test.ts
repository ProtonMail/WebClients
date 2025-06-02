import { Result, ServerTime } from '@proton/docs-shared'
import { RecentDocumentsItem, RecentDocumentsService } from './recent-documents'
import type { DecryptedNode, DriveCompat } from '@proton/drive-store/lib'
import type { DocsApi } from './../Api/DocsApi'
import type { LoggerInterface } from '@proton/utils/logs'
import type { RecentDocumentAPIItem } from './../Api/Types/GetRecentsResponse'
import type { DecryptedAddressKey } from '@proton/shared/lib/interfaces'
import type { CacheService } from './CacheService'

describe('RecentDocumentsService', () => {
  const mockData: RecentDocumentAPIItem[] = [
    { LinkID: 'link1', ContextShareID: 'share1', LastOpenTime: 1698765432 } as RecentDocumentAPIItem,
  ]
  const mockDecryptedNodes: DecryptedNode[] = [
    {
      volumeId: 'volume1',
      nodeId: 'link1',
      name: 'name1',
      hash: 'hash',
      createTime: 1698765432,
      mimeType: '',
      parentNodeId: 'parentLink1',
      signatureAddress: 'me@proton.ch',
    },
  ]

  let service: RecentDocumentsService
  let driveCompat: DriveCompat
  let docsApi: DocsApi
  let cacheService: CacheService
  let logger: LoggerInterface

  beforeEach(() => {
    logger = {
      error: jest.fn(),
      info: jest.fn(),
    } as unknown as LoggerInterface

    driveCompat = {
      getNodes: jest.fn().mockResolvedValue(mockDecryptedNodes),
      getNodePaths: jest.fn().mockResolvedValue([[{ name: 'location' }, { name: 'link1' }]]),
      getNodesAreShared: jest.fn().mockResolvedValue([false]),
      userId: Promise.resolve('testUser'),
      getKeysForLocalStorageEncryption: jest.fn().mockResolvedValue({
        keys: [{ privateKey: 'mockKey' } as unknown as DecryptedAddressKey],
        namespace: 'testUser',
      }),
      trashDocument: jest.fn().mockResolvedValue(undefined),
    } as unknown as DriveCompat

    docsApi = {
      fetchRecentDocuments: jest.fn().mockResolvedValue({
        isFailed: () => false,
        getValue: () => ({ RecentDocuments: mockData }),
      }),
    } as unknown as DocsApi

    cacheService = {
      getCachedValue: jest.fn().mockResolvedValue(Result.ok('[]')),
      cacheValue: jest.fn().mockResolvedValue(Result.ok('[]')),
    } as unknown as CacheService

    service = new RecentDocumentsService(driveCompat, docsApi, cacheService, logger)
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

      expect(service.state.getProperty('state')).toBe('fetching')

      await promise

      expect(service.state.getProperty('state')).toBe('done')
    })
  })

  describe('loadCachedSnapshot', () => {
    test('should skip loading if no address key is found', async () => {
      driveCompat.getKeysForLocalStorageEncryption = jest.fn().mockResolvedValue(undefined)
      const newService = new RecentDocumentsService(driveCompat, docsApi, cacheService, logger)

      // Wait for loadCachedSnapshot to complete
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(newService.snapshot.size).toBe(0)
    })

    test('should load and decrypt cached snapshot', async () => {
      const mockSnapshot = [
        {
          name: 'test',
          linkId: 'link1',
          parentLinkId: 'parent1',
          volumeId: 'volume1',
          lastViewed: { date: new Date().toISOString() },
          signatureAddress: 'test@proton.ch',
          location: ['folder', 'doc'],
          isShared: false,
          shareId: 'share1',
          isOwnedByOther: false,
          path: ['folder', 'doc'],
        },
      ]

      localStorage.setItem('recentDocumentsSnapshot-testUser', 'encrypted')
      cacheService.getCachedValue = jest.fn().mockResolvedValue(Result.ok(JSON.stringify(mockSnapshot)))

      const newService = new RecentDocumentsService(driveCompat, docsApi, cacheService, logger)

      // Wait for loadCachedSnapshot to complete
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(newService.snapshot.size).toBe(1)
    })
  })

  describe('resolveItem', () => {
    test('should handle failed item resolution', async () => {
      driveCompat.getNodes = jest.fn().mockRejectedValue(new Error('Failed to get nodes'))

      await service.resolveItem({
        LinkID: 'link1',
        ContextShareID: 'share1',
        LastOpenTime: 1698765432,
      } as RecentDocumentAPIItem)

      expect(service.snapshot.size).toBe(0)
    })

    test('should resolve and store item correctly', async () => {
      await service.resolveItem({
        LinkID: 'link1',
        VolumeID: 'volume1',
        ContextShareID: 'share1',
        LastOpenTime: 1698765432,
      } as RecentDocumentAPIItem)

      const item = service.snapshot.get('volume1-link1')
      expect(item).toBeDefined()
      expect(item?.linkId).toBe('link1')
      expect(item?.shareId).toBe('share1')
    })
  })

  describe('trashDocument', () => {
    test('should throw error if document has no parent link ID', async () => {
      const mockItem = RecentDocumentsItem.create({
        type: 'document',
        name: 'test',
        linkId: 'link1',
        parentLinkId: '', // empty parentLinkId
        volumeId: 'volume1',
        lastViewed: new ServerTime(1698765432),
        lastModified: new ServerTime(1698765432),
        createdBy: 'test@proton.ch',
        location: { type: 'root' },
        isSharedWithMe: false,
        shareId: 'share1',
      })

      await expect(service.trashDocument(mockItem)).rejects.toThrow('Node does not have parent link ID')
    })

    test('should successfully trash document', async () => {
      const mockItem = RecentDocumentsItem.create({
        type: 'document',
        name: 'test',
        linkId: 'link1',
        parentLinkId: 'parent1',
        volumeId: 'volume1',
        lastViewed: new ServerTime(1698765432),
        lastModified: new ServerTime(1698765432),
        createdBy: 'test@proton.ch',
        location: { type: 'root' },
        isSharedWithMe: false,
        shareId: 'share1',
      })

      await service.trashDocument(mockItem)

      expect(driveCompat.trashDocument).toHaveBeenCalledWith({ linkId: 'link1', volumeId: 'volume1' }, 'parent1')
      expect(service.state.getProperty('state')).toBe('done')
    })
  })

  describe('cacheSnapshot', () => {
    test('should successfully cache snapshot', async () => {
      const mockItem = RecentDocumentsItem.create({
        type: 'document',
        name: 'test',
        linkId: 'link1',
        parentLinkId: 'parent1',
        volumeId: 'volume1',
        lastViewed: new ServerTime(1698765432),
        lastModified: new ServerTime(1698765432),
        createdBy: 'test@proton.ch',
        location: { type: 'root' },
        isSharedWithMe: false,
        shareId: 'share1',
      })

      service.setSnapshotItem(mockItem)
      await service.cacheSnapshot()

      expect(cacheService.cacheValue).toHaveBeenCalled()
      expect(localStorage.getItem('recentDocumentsSnapshot-testUser')).toBe('encrypted')
    })
  })
})
