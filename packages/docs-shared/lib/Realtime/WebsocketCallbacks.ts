import type { ConnectionCloseReason } from '@proton/docs-proto'
import type { DocsApiErrorCode } from '@proton/shared/lib/api/docs'
import type { ConnectionType } from './WebsocketConnectionInterface'

export type WebsocketCallbacks = {
  onClose: (reason: ConnectionCloseReason) => void
  onFailToGetToken: (errorCode: DocsApiErrorCode) => void
  onFailToConnect(reason: ConnectionCloseReason): void
  onEncryptionError(error: string): void
  onConnecting: () => void
  onMessage: (message: Uint8Array<ArrayBuffer>) => void
  onOpen(connectionType: ConnectionType): void
}
