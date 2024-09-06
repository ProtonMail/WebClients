import type { BroadcastSource } from '../Bridge/BroadcastSource'

export interface WebsocketConnectionInterface {
  connect(abortSignal?: () => boolean): Promise<void>
  destroy(): void
  disconnect(code: number): void
  markAsReadyToAcceptMessages(): void
  canBroadcastMessages(): boolean
  isConnected(): boolean
  broadcastMessage(data: Uint8Array, source: BroadcastSource): Promise<void>
}
