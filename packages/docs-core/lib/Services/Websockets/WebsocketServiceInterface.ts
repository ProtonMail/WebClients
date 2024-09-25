import type { DocumentKeys, NodeMeta } from '@proton/drive-store'
import type { BroadcastSource, WebsocketConnectionInterface } from '@proton/docs-shared'
import type { EventTypeEnum } from '@proton/docs-proto'

export interface WebsocketServiceInterface {
  createConnection(
    nodeMeta: NodeMeta,
    keys: DocumentKeys,
    options: { commitId: () => string | undefined },
  ): WebsocketConnectionInterface

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
