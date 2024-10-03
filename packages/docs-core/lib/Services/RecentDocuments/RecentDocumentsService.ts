import { type InternalEventBus } from '@proton/docs-shared'
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
import { RecentDocumentsLocalStorage } from './RecentDocumentsLocalStorage'

export class StubRecentDocumentsService implements RecentDocumentsInterface {
  state: RecentDocumentServiceState = 'not_fetched'
  recentDocuments?: RecentDocument[] = undefined
  nodes?: DecryptedNode[] = undefined
  nodePaths?: string[][] = undefined
  isNodeAtIndexOwnedByOthers?: boolean[] = undefined

  constructor(
    private eventBus: InternalEventBus,
    private driveCompat: DriveCompat,
  ) {}

  setState(newState: RecentDocumentServiceState) {
    this.state = newState
    const event: EventRecentDocumentStateUpdated = {
      type: RecentDocumentStateUpdatedEvent,
      payload: newState,
    }
    this.eventBus.publish(event)
  }

  async fetch() {
    this.setState('fetching')
    this.recentDocuments = RecentDocumentsLocalStorage.load()
    const ids = this.recentDocuments.map((recentDocument) => ({
      linkId: recentDocument.linkId,
      shareId: recentDocument.shareId,
    }))
    try {
      this.nodes = await this.driveCompat.getNodes(ids)
      this.nodePaths = (await this.driveCompat.getNodePaths(ids)).map((pathItems) =>
        pathItems.map((pathItem) => pathItem.name),
      )
      this.isNodeAtIndexOwnedByOthers = await this.driveCompat.getNodesAreShared(ids)
    } catch (e) {
      RecentDocumentsLocalStorage.clear()
    } finally {
      this.setState('fetched')
    }
  }

  async trashDocument(recentDocument: RecentDocumentsSnapshotData): Promise<void> {
    this.setState('fetching')

    if (!recentDocument.parentLinkId) {
      throw new Error('Node does not have parent link ID')
    }

    await this.driveCompat.trashDocument(
      { linkId: recentDocument.linkId, volumeId: recentDocument.volumeId },
      recentDocument.parentLinkId,
    )

    this.setState('fetched')
  }

  getSnapshot(): RecentDocumentsSnapshot {
    const data: RecentDocumentsSnapshot['data'] = this.recentDocuments
      ?.map((recentDocument, i) => {
        const decryptedNode = this.nodes?.find((node) => node.nodeId === recentDocument.linkId)

        if (!decryptedNode) {
          return undefined
        }

        return {
          name: decryptedNode.name,
          linkId: recentDocument.linkId,
          volumeId: decryptedNode.volumeId,
          parentLinkId: decryptedNode.parentNodeId,
          location: this.isNodeAtIndexOwnedByOthers?.[i] ? ['Shared with me'] : this.nodePaths?.[i],
          isSharedWithMe: this.isNodeAtIndexOwnedByOthers?.[i],
          lastViewed: recentDocument.lastViewed,
          createdBy: decryptedNode.signatureAddress,
        }
      })
      .filter((item) => !!item)

    return {
      data,
      state: this.state,
    }
  }
}
