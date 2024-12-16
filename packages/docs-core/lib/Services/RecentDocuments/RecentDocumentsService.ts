import { RecentDocumentState, DefaultValues } from './RecentDocumentState'
import { getErrorString, ServerTime } from '@proton/docs-shared'
import type { DriveCompat } from '@proton/drive-store'
import type { DocsApi } from '../../Api/DocsApi'
import type { LoggerInterface } from '@proton/utils/logs'
import type { LocalStorageValue } from './types'
import { RecentDocumentItem } from './RecentDocumentItem'
import type { RecentDocumentsInterface } from './RecentDocumentsInterface'
import type { RecentDocumentAPIItem } from '../../Api/Types/GetRecentsResponse'
import type { CacheService } from '../CacheService'

const RECENTS_LOCAL_STORAGE_KEY = 'recent-documents'

type LinkId = string

export class RecentDocumentsService implements RecentDocumentsInterface {
  state = new RecentDocumentState(DefaultValues)
  snapshot: Map<LinkId, RecentDocumentItem> = new Map()

  constructor(
    private driveCompat: DriveCompat,
    private docsApi: DocsApi,
    private cacheService: CacheService,
    private logger: LoggerInterface,
  ) {
    this.loadCachedSnapshot().catch((error) => {
      this.logger.error('Failed to load recent documents from cache', getErrorString(error))
    })
  }

  async cacheSnapshot() {
    this.logger.info(`Caching recent document snapshot with ${this.snapshot.size} items`)

    const data: LocalStorageValue[] = Array.from(this.snapshot.values()).map((item) => item.serialize())
    const stringified = JSON.stringify(data)

    await this.cacheService.cacheValue({
      document: undefined,
      key: RECENTS_LOCAL_STORAGE_KEY,
      value: stringified,
    })
  }

  async loadCachedSnapshot(): Promise<void> {
    this.logger.info('Loading recent document snapshot')

    const result = await this.cacheService.getCachedValue({
      document: undefined,
      key: RECENTS_LOCAL_STORAGE_KEY,
    })
    if (result.isFailed()) {
      this.logger.error('Failed to decrypt recent document snapshot', { error: result.getError() })
      return undefined
    }

    const value = result.getValue()
    if (!value) {
      this.logger.info('No recent document snapshot found, skipping load')
      return
    }

    const parsed: LocalStorageValue[] = JSON.parse(value)
    this.logger.info(`Loaded recent document snapshot with ${parsed.length} items`)

    parsed.forEach((raw) => {
      const item = RecentDocumentItem.deserialize(raw)
      this.setSnapshotItem(item)
    })
  }

  setSnapshotItem(item: RecentDocumentItem): void {
    this.snapshot.set(item.uniqueId(), item)

    this.sortRecents()
  }

  private sortRecents(): void {
    const sorted = Array.from(this.snapshot.values()).sort(
      (a, b) => b.lastViewed.date.getTime() - a.lastViewed.date.getTime(),
    )

    this.state.setProperty('recents', sorted)
  }

  getSortedRecents(): RecentDocumentItem[] {
    return this.state.getProperty('recents')
  }

  async fetch() {
    this.state.setProperty('state', 'fetching')

    const response = await this.docsApi.fetchRecentDocuments()
    if (response.isFailed()) {
      this.state.setProperty('state', 'not_fetched')
      return
    }

    this.state.setProperty('state', 'resolving')

    const recents = response.getValue().RecentDocuments

    await Promise.all(recents.map((item) => this.resolveItem(item)))

    void this.cacheSnapshot()

    this.state.setProperty('state', 'done')
  }

  async resolveItem(apiItem: RecentDocumentAPIItem): Promise<void> {
    const subItem = {
      linkId: apiItem.LinkID,
      shareId: apiItem.ContextShareID,
      lastViewed: new ServerTime(apiItem.LastOpenTime),
    }

    try {
      const [node, nodePath, isNodeAtIndexOwnedByOthers] = await Promise.all([
        this.driveCompat.getNodes([subItem]).then((nodes) => nodes[0]),
        this.driveCompat.getNodePaths([subItem]).then((paths) => paths[0]),
        this.driveCompat.getNodesAreShared([subItem]).then((shared) => shared[0]),
      ])

      const nodePathAsStrings = nodePath.map((pathItem) => pathItem.name)

      const record = RecentDocumentItem.create({
        name: node.name,
        linkId: subItem.linkId,
        parentLinkId: node.parentNodeId,
        volumeId: node.volumeId,
        lastViewed: subItem.lastViewed,
        createdBy: node.signatureAddress,
        location: isNodeAtIndexOwnedByOthers ? ['Shared with me'] : nodePathAsStrings,
        isSharedWithMe: isNodeAtIndexOwnedByOthers,
        shareId: subItem.shareId,
        isOwnedByOthers: isNodeAtIndexOwnedByOthers,
        nodePath: nodePathAsStrings,
      })

      this.setSnapshotItem(record)
    } catch (error) {
      this.logger.error('Failed to resolve recent document', { error, item: apiItem })
    }
  }

  async trashDocument(recentDocument: RecentDocumentItem): Promise<void> {
    this.state.setProperty('state', 'fetching')

    if (!recentDocument.parentLinkId) {
      throw new Error('Node does not have parent link ID')
    }

    await this.driveCompat.trashDocument(
      { linkId: recentDocument.linkId, volumeId: recentDocument.volumeId },
      recentDocument.parentLinkId,
    )

    this.state.setProperty('state', 'done')
  }
}
