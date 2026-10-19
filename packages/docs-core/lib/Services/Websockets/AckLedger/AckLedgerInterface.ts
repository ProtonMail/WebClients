import type { ClientMessageWithDocumentUpdates } from '@proton/docs-proto/Generated/ClientMessage'
import type { DocumentUpdate } from '@proton/docs-proto/Generated/DocumentUpdate'
import type { ServerMessageWithMessageAcks } from '@proton/docs-proto/Generated/ServerMessage'

export interface AckLedgerInterface {
  messagePosted(message: ClientMessageWithDocumentUpdates): void
  messageAcknowledgementReceived(message: ServerMessageWithMessageAcks): void
  destroy(): void
  hasConcerningMessages(): boolean
  hasErroredMessages(): boolean
  getUnacknowledgedUpdates(): DocumentUpdate[]
}
