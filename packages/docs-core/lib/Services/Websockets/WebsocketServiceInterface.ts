import type { DocumentKeys, NodeMeta, PublicNodeMeta } from '@proton/drive-store'
import type { BroadcastSource, WebsocketConnectionInterface } from '@proton/docs-shared'
import type { DocumentUpdate, EventTypeEnum } from '@proton/docs-proto'
import type { DocumentState, PublicDocumentState } from '../../State/DocumentState'
import type { DocumentType } from '@proton/drive-store/store/_documents'

export interface WebsocketServiceInterface {
  setDocumentType(type: DocumentType): void

  createConnection(documentState: DocumentState | PublicDocumentState): WebsocketConnectionInterface
  isConnected(nodeMeta: NodeMeta | PublicNodeMeta): boolean

  sendDocumentUpdateMessage(
    document: NodeMeta | PublicNodeMeta,
    rawContent: Uint8Array<ArrayBuffer> | Uint8Array<ArrayBuffer>[],
    source: BroadcastSource,
  ): Promise<void>
  sendEventMessage(
    document: NodeMeta | PublicNodeMeta,
    rawContent: Uint8Array<ArrayBuffer>,
    type: EventTypeEnum,
    source: BroadcastSource,
  ): Promise<void>
  handleInitialConversionContent(
    document: NodeMeta | PublicNodeMeta,
    content: Uint8Array<ArrayBuffer>,
    createInitialCommit: (content: DocumentUpdate) => void,
  ): Promise<void>

  flushPendingUpdates(): void

  /**
   * invalidateTokenCache refers to whether the websocket connection should reuse the connection token it has,
   * or re-fetch it from the network.
   */
  reconnectToDocumentWithoutDelay(
    nodeMeta: NodeMeta | PublicNodeMeta,
    options: { invalidateTokenCache: boolean },
  ): Promise<void>
  retryAllFailedDocumentUpdates(): void

  debugSendCommitCommandToRTS(nodeMeta: NodeMeta | PublicNodeMeta, keys: DocumentKeys): Promise<void>
  closeConnection(nodeMeta: NodeMeta | PublicNodeMeta, code?: number): void
  destroy(): void
}
