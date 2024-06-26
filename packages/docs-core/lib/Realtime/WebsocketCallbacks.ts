import { ConnectionCloseReason } from '@proton/docs-proto'
import { RealtimeUrlAndToken } from '@proton/docs-shared'
import { DocsApiErrorCode } from '@proton/shared/lib/api/docs'
import { ApiResult } from '../Domain/Result/ApiResult'

export type WebsocketCallbacks = {
  onClose: (reason: ConnectionCloseReason) => void
  onFailToGetToken: (errorCode: DocsApiErrorCode) => void
  onFailToConnect(reason: ConnectionCloseReason): void
  onEncryptionError(error: string): void
  onConnecting: () => void
  onMessage: (message: Uint8Array) => void
  getLatestCommitId: () => string | undefined
  getUrlAndToken: () => Promise<ApiResult<RealtimeUrlAndToken>>
}
