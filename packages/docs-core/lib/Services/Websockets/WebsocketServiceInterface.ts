import type { DocumentKeys, NodeMeta, PublicNodeMeta } from '@proton/drive-store'
import type { BroadcastSource, WebsocketConnectionInterface } from '@proton/docs-shared'
import type { EventTypeEnum } from '@proton/docs-proto'
import type { PublicDocumentKeys } from '../../Types/DocumentEntitlements'

export interface WebsocketServiceInterface {
  createConnection(
    nodeMeta: NodeMeta | PublicNodeMeta,
    keys: DocumentKeys | PublicDocumentKeys,
    options: { commitId: () => string | undefined },
  ): WebsocketConnectionInterface
  isConnected(nodeMeta: NodeMeta | PublicNodeMeta): boolean

  sendDocumentUpdateMessage(
    document: NodeMeta | PublicNodeMeta,
    rawContent: Uint8Array | Uint8Array[],
    source: BroadcastSource,
  ): Promise<void>
  sendEventMessage(
    document: NodeMeta | PublicNodeMeta,
    rawContent: Uint8Array,
    type: EventTypeEnum,
    source: BroadcastSource,
  ): Promise<void>

  flushPendingUpdates(): void
  reconnectToDocumentWithoutDelay(nodeMeta: NodeMeta | PublicNodeMeta): Promise<void>
  retryAllFailedDocumentUpdates(): void

  debugSendCommitCommandToRTS(nodeMeta: NodeMeta | PublicNodeMeta, keys: DocumentKeys): Promise<void>
  closeConnection(nodeMeta: NodeMeta | PublicNodeMeta): void
  destroy(): void
}
