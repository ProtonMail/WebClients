import type { ConnectionCloseReason } from '@proton/docs-proto'
import type { RealtimeUrlAndToken } from '@proton/docs-shared'
import type { DocsApiErrorCode } from '@proton/shared/lib/api/docs'
import type { ApiResult } from '../ApiResult'

export type WebsocketCallbacks = {
  onClose: (reason: ConnectionCloseReason) => void
  onFailToGetToken: (errorCode: DocsApiErrorCode) => void
  onFailToConnect(reason: ConnectionCloseReason): void
  onEncryptionError(error: string): void
  onConnecting: () => void
  onMessage: (message: Uint8Array) => void
  onOpen(): void
  getUrlAndToken: () => Promise<ApiResult<RealtimeUrlAndToken>>
}
