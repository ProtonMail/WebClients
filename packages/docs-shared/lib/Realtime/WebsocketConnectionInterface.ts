import type { BroadcastSource } from '../Bridge/BroadcastSource'
import type { WebsocketCallbacks } from './WebsocketCallbacks'

export enum ConnectionType {
  Normal,
  RetryDueToNotReceivingReadyMessage,
}

export interface WebsocketConnectionInterface {
  connectionType: ConnectionType
  callbacks: WebsocketCallbacks
  connect(
    abortSignal?: () => boolean,
    options?: { invalidateTokenCache: boolean; connectionType?: ConnectionType },
  ): Promise<void>
  destroy(): void
  disconnect(code: number): void
  preventAutoReconnectOnClose(): void
  markAsReadyToAcceptMessages(): void
  canBroadcastMessages(): boolean
  isConnected(): boolean
  broadcastMessage(data: Uint8Array<ArrayBuffer>, source: BroadcastSource): Promise<void>
  queueReconnection(options?: { skipDelay: boolean; connectionType?: ConnectionType }): void
}
