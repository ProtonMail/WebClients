import { InternalEventBus } from '@proton/docs-shared'
import { StubRecentDocumentsService } from './RecentDocumentsService'
import { RecentDocumentsLocalStorage } from './RecentDocumentsLocalStorage'
import type { DecryptedNode, DriveCompat } from '@proton/drive-store/lib'
import { type RecentDocument, type RecentDocumentsSnapshotData } from './types'

jest.mock('./RecentDocumentsLocalStorage', () => ({
  RecentDocumentsLocalStorage: {
    load: jest.fn().mockImplementation(() => []),
    add: jest.fn(),
    clear: jest.fn(),
    persist: jest.fn(),
  },
}))

describe('fetch', () => {
  test('Load recent documents from local storage', async () => {
    const eventBus = new InternalEventBus()
    const driveCompat = {} as DriveCompat
    const service = new StubRecentDocumentsService(eventBus, driveCompat)

    await service.fetch()

    expect(RecentDocumentsLocalStorage.load).toHaveBeenCalled()
  })

  test('Load links from driveCompat for every id returned from local storage', async () => {
    const mockData: RecentDocument[] = [{ linkId: 'link1', shareId: 'share1', lastViewed: 1 }]
    const mockDecryptedNodes: DecryptedNode[] = [
      { volumeId: 'volume1', nodeId: 'link1', name: 'name1', hash: 'hash', createTime: 1, mimeType: '' },
    ]
    ;(RecentDocumentsLocalStorage.load as jest.Mock).mockImplementation(() => mockData)
    const eventBus = new InternalEventBus()
    const driveCompat = {
      getNodes: jest.fn().mockResolvedValue(mockDecryptedNodes),
      getNodePaths: jest.fn().mockResolvedValue(['location', 'link1']),
    } as unknown as DriveCompat
    const service = new StubRecentDocumentsService(eventBus, driveCompat)

    await service.fetch()

    expect(driveCompat.getNodes).toHaveBeenCalled()
    expect(driveCompat.getNodePaths).toHaveBeenCalled()
  })

  test('service state will be "fetching until fetch resolves"', async () => {
    const mockData: RecentDocument[] = [{ linkId: 'link1', shareId: 'share1', lastViewed: 1 }]
    const mockDecryptedNodes: DecryptedNode[] = [
      { volumeId: 'volume1', nodeId: 'link1', name: 'name1', hash: 'hash', createTime: 1, mimeType: '' },
    ]
    ;(RecentDocumentsLocalStorage.load as jest.Mock).mockImplementation(() => mockData)
    const eventBus = new InternalEventBus()
    const driveCompat = {
      getNodes: jest.fn().mockResolvedValue(mockDecryptedNodes),
      getNodePaths: jest.fn().mockResolvedValue(['location', 'link1']),
    } as unknown as DriveCompat
    const service = new StubRecentDocumentsService(eventBus, driveCompat)

    const promise = service.fetch()

    expect(service.state).toBe('fetching')

    await promise

    expect(service.state).toBe('fetched')
  })

  test('service state will be "fetching until fetch resolves"', async () => {
    const mockData: RecentDocument[] = [{ linkId: 'link1', shareId: 'share1', lastViewed: 1 }]
    const mockDecryptedNodes: DecryptedNode[] = [
      { volumeId: 'volume1', nodeId: 'link1', name: 'name1', hash: 'hash', createTime: 1, mimeType: '' },
    ]
    ;(RecentDocumentsLocalStorage.load as jest.Mock).mockImplementation(() => mockData)
    const eventBus = new InternalEventBus()
    const driveCompat = {
      getNodes: jest.fn().mockResolvedValue(mockDecryptedNodes),
      getNodePaths: jest.fn().mockResolvedValue(['location', 'link1']),
    } as unknown as DriveCompat
    const service = new StubRecentDocumentsService(eventBus, driveCompat)

    const promise = service.fetch()

    expect(service.state).toBe('fetching')

    await promise

    expect(service.state).toBe('fetched')
  })
})

describe('getSnapshot', () => {
  test('Will return populated recent document data when fetch completes', async () => {
    const mockData: RecentDocument[] = [{ linkId: 'link1', shareId: 'share1', lastViewed: 1 }]
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
    const mockSnapshotData: RecentDocumentsSnapshotData = {
      name: 'name1',
      volumeId: 'volume1',
      linkId: 'link1',
      lastViewed: 1,
      parentLinkId: 'parentLink1',
      createdBy: 'me@proton.ch',
    }

    ;(RecentDocumentsLocalStorage.load as jest.Mock).mockImplementation(() => mockData)
    const eventBus = new InternalEventBus()
    const driveCompat = {
      getNodes: jest.fn().mockResolvedValue(mockDecryptedNodes),
      getNodePaths: jest.fn().mockResolvedValue(['location', 'link1']),
    } as unknown as DriveCompat
    const service = new StubRecentDocumentsService(eventBus, driveCompat)

    const promise = service.fetch()

    expect(service.getSnapshot().data).toEqual([])

    await promise

    expect(service.getSnapshot().data?.[0]).toMatchObject(mockSnapshotData)
  })
})
