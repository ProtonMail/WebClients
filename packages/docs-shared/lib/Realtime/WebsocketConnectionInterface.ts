import { BroadcastSource } from '../Bridge/BroadcastSource'

export interface WebsocketConnectionInterface {
  connect(): Promise<void>
  destroy(): void
  disconnect(code: number): void
  markAsReadyToAcceptMessages(): void
  broadcastMessage(data: Uint8Array, source: BroadcastSource): Promise<void>
}
