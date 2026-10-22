import type { NodeMeta, PublicNodeMeta, DocumentType } from '@proton/docs-shared/BasicTypes'
import type { BroadcastSource } from '@proton/docs-shared/Bridge/BroadcastSource'
import type { DocumentKeys } from '@proton/docs-shared/CryptoTypes'
import type { WebsocketConnectionInterface } from '@proton/docs-shared/Realtime/WebsocketConnectionInterface'
import type { EventTypeEnum } from '@proton/docs-proto/Event/EventTypeEnum'
import type { DocumentUpdate } from '@proton/docs-proto/Generated/DocumentUpdate'
import type { DocumentState, PublicDocumentState } from '../../State/DocumentState'

export interface WebsocketServiceInterface {
  setDocumentType(type: DocumentType): void

  createConnection(documentState: DocumentState | PublicDocumentState): WebsocketConnectionInterface
  isConnected(nodeMeta: NodeMeta | PublicNodeMeta): boolean

  sendDocumentUpdateMessage(
    document: NodeMeta | PublicNodeMeta,
    rawContent: Uint8Array<ArrayBuffer> | Uint8Array<ArrayBuffer>[],
    source: BroadcastSource,
    uuid?: string,
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
