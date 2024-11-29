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
  isConnected(document: NodeMeta): boolean

  sendDocumentUpdateMessage(
    document: NodeMeta,
    rawContent: Uint8Array | Uint8Array[],
    source: BroadcastSource,
  ): Promise<void>
  sendEventMessage(
    document: NodeMeta,
    rawContent: Uint8Array,
    type: EventTypeEnum,
    source: BroadcastSource,
  ): Promise<void>

  flushPendingUpdates(): void
  reconnectToDocumentWithoutDelay(document: NodeMeta): Promise<void>
  retryAllFailedDocumentUpdates(): void

  debugSendCommitCommandToRTS(document: NodeMeta, keys: DocumentKeys): Promise<void>
  closeConnection(document: { linkId: string }): void
  destroy(): void
}
