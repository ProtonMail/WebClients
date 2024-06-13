import { BroadcastSource } from '../Bridge/BroadcastSource'

export interface WebsocketConnectionInterface {
  connect(): Promise<void>
  destroy(): void
  disconnect(): void
  broadcastMessage(data: Uint8Array, source: BroadcastSource): Promise<void>
}
