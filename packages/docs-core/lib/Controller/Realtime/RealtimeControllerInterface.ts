import type { DocumentEntitlements } from '../../Types/DocumentEntitlements'
import type { WebsocketConnectionInterface } from '@proton/docs-shared'

export interface RealtimeControllerInterface {
  initializeConnection(entitlements: DocumentEntitlements): WebsocketConnectionInterface
  destroy(): void
}
