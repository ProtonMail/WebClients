import type { WebsocketConnectionInterface } from '@proton/docs-shared'

export interface RealtimeControllerInterface {
  initializeConnection(): WebsocketConnectionInterface
  destroy(): void
}
