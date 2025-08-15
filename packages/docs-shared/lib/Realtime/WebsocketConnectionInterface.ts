import type { BroadcastSource } from '../Bridge/BroadcastSource'
import type { WebsocketCallbacks } from './WebsocketCallbacks'

export interface WebsocketConnectionInterface {
  callbacks: WebsocketCallbacks
  connect(abortSignal?: () => boolean, options?: { invalidateTokenCache: boolean }): Promise<void>
  destroy(): void
  disconnect(code: number): void
  markAsReadyToAcceptMessages(): void
  canBroadcastMessages(): boolean
  isConnected(): boolean
  broadcastMessage(data: Uint8Array<ArrayBuffer>, source: BroadcastSource): Promise<void>
}
