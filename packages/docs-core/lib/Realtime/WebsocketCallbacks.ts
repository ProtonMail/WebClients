import { ConnectionCloseReason } from '@proton/docs-proto'
import { RealtimeUrlAndToken } from '@proton/docs-shared'
import { Result } from '@standardnotes/domain-core'

export type WebsocketCallbacks = {
  onClose: (reason: ConnectionCloseReason) => void
  onOpen: () => void
  onFailToConnect(reason: ConnectionCloseReason): void
  onEncryptionError(error: string): void
  onConnecting: () => void
  onMessage: (message: Uint8Array) => void
  getLatestCommitId: () => string | undefined
  getUrlAndToken: () => Promise<Result<RealtimeUrlAndToken>>
}
