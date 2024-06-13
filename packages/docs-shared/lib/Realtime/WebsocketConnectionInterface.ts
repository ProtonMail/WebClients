import { BroadcastSources } from '../Bridge/BroadcastSources'

export interface WebsocketConnectionInterface {
  connect(): Promise<void>
  destroy(): void
  disconnect(): void
  broadcastMessage(data: Uint8Array, source: BroadcastSources): Promise<void>
}
