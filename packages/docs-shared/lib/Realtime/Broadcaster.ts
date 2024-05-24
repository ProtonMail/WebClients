import { ClientMessageWithDocumentUpdates, ClientMessageWithEvents } from '@proton/docs-proto'

export interface Broadcaster {
  broadcastMessage(
    message: ClientMessageWithEvents | ClientMessageWithDocumentUpdates,
    originator: any,
    debugSource: string,
  ): Promise<void>
}
