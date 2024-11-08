import { InternalEventPublishStrategy, type InternalEventBus } from '@proton/docs-shared'
import type { DecryptedNode, DriveCompat } from '@proton/drive-store'

import type {
  EventRecentDocumentStateUpdated,
  RecentDocument,
  RecentDocumentServiceState,
  RecentDocumentsInterface,
  RecentDocumentsSnapshot,
  RecentDocumentsSnapshotData,
} from './types'
import { RecentDocumentStateUpdatedEvent } from './types'
import type { DocsApi } from '../../Api/DocsApi'
import type { LoggerInterface } from '@proton/utils/logs'

type ResolvedItem = {
  node: DecryptedNode
  nodePath: string[]
  isOwnedByOthers: boolean
}

export class RecentDocumentsService implements RecentDocumentsInterface {
  state: RecentDocumentServiceState = 'not_fetched'
  recentDocuments: RecentDocument[] = []
  record: Map<string, ResolvedItem> = new Map()

  constructor(
    private eventBus: InternalEventBus,
    private driveCompat: DriveCompat,
    private docsApi: DocsApi,
    private logger: LoggerInterface,
  ) {}

  async notifyStateUpdated() {
    const event: EventRecentDocumentStateUpdated = {
      type: RecentDocumentStateUpdatedEvent,
      payload: undefined,
    }

    await this.eventBus.publishSync(event, InternalEventPublishStrategy.SEQUENCE)
  }

  async setStatusAndNotify(status: RecentDocumentServiceState) {
    this.state = status
    await this.notifyStateUpdated()
  }

  async fetch() {
    await this.setStatusAndNotify('fetching')

    const response = await this.docsApi.fetchRecentDocuments()
    if (response.isFailed()) {
      await this.setStatusAndNotify('not_fetched')
      return
    }

    this.recentDocuments = response.getValue().RecentDocuments.map((item) => ({
      linkId: item.LinkID,
      shareId: item.ContextShareID,
      lastViewed: item.LastOpenTime,
    }))

    await this.setStatusAndNotify('resolving')

    const ids = this.recentDocuments.map((recentDocument) => ({
      linkId: recentDocument.linkId,
      shareId: recentDocument.shareId,
    }))

    await Promise.all(ids.map((item) => this.resolveItem(item)))

    await this.setStatusAndNotify('done')
  }

  async resolveItem(item: { linkId: string; shareId: string }) {
    try {
      const [node, nodePath, isNodeAtIndexOwnedByOthers] = await Promise.all([
        this.driveCompat.getNodes([item]).then((nodes) => nodes[0]),
        this.driveCompat.getNodePaths([item]).then((paths) => paths[0]),
        this.driveCompat.getNodesAreShared([item]).then((shared) => shared[0]),
      ])

      const record: ResolvedItem = {
        node,
        nodePath: nodePath.map((pathItem) => pathItem.name),
        isOwnedByOthers: isNodeAtIndexOwnedByOthers,
      }

      this.record.set(item.linkId, record)

      await this.notifyStateUpdated()
    } catch (error) {
      this.logger.error('Failed to resolve recent document', { error, item })
    }
  }

  async trashDocument(recentDocument: RecentDocumentsSnapshotData): Promise<void> {
    await this.setStatusAndNotify('fetching')

    if (!recentDocument.parentLinkId) {
      throw new Error('Node does not have parent link ID')
    }

    await this.driveCompat.trashDocument(
      { linkId: recentDocument.linkId, volumeId: recentDocument.volumeId },
      recentDocument.parentLinkId,
    )

    await this.setStatusAndNotify('done')
  }

  getSnapshot(): RecentDocumentsSnapshot {
    const data: RecentDocumentsSnapshot['data'] = this.recentDocuments
      .map((recentDocument) => {
        const record = this.record.get(recentDocument.linkId)
        if (!record) {
          return undefined
        }

        return {
          name: record.node.name,
          linkId: recentDocument.linkId,
          volumeId: record.node.volumeId,
          parentLinkId: record.node.parentNodeId,
          location: record.isOwnedByOthers ? ['Shared with me'] : record.nodePath,
          isSharedWithMe: record.isOwnedByOthers,
          lastViewed: recentDocument.lastViewed,
          createdBy: record.node.signatureAddress,
        }
      })
      .filter((item) => !!item)

    return {
      data,
      state: this.state,
    }
  }
}
