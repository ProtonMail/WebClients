import { ClientMessageWithDocumentUpdates, ClientMessageWithEvents } from '@proton/docs-proto'
import { BroadcastSources } from '../Bridge/BroadcastSources'

export interface WebsocketConnectionInterface {
  connect(): Promise<void>
  destroy(): void
  disconnect(): void
  broadcastMessage(
    message: ClientMessageWithDocumentUpdates | ClientMessageWithEvents,
    source: BroadcastSources,
  ): Promise<void>
}
