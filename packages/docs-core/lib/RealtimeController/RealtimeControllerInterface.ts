import type { WebsocketConnectionInterface } from '@proton/docs-shared/Realtime/WebsocketConnectionInterface'

export interface RealtimeControllerInterface {
  initializeConnection(): WebsocketConnectionInterface
  destroy(): void
}
