import type { ClientMessageWithDocumentUpdates, DocumentUpdate, ServerMessageWithMessageAcks } from '@proton/docs-proto'

export interface AckLedgerInterface {
  messagePosted(message: ClientMessageWithDocumentUpdates): void
  messageAcknowledgementReceived(message: ServerMessageWithMessageAcks): void
  destroy(): void
  hasConcerningMessages(): boolean
  hasErroredMessages(): boolean
  getUnacknowledgedUpdates(): DocumentUpdate[]
}
