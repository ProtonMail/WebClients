import { ClientMessageWithDocumentUpdates, ClientMessageWithEvents } from '@proton/docs-proto'

export interface WebsocketConnectionInterface {
  connect(): Promise<void>
  destroy(): void
  broadcastMessage(message: ClientMessageWithDocumentUpdates | ClientMessageWithEvents, source: string): Promise<void>
}
