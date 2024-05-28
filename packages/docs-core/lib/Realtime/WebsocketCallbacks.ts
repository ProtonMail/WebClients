import { ConnectionCloseReason } from '@proton/docs-proto'
import { RealtimeUrlAndToken } from '@proton/docs-shared'
import { Result } from '@standardnotes/domain-core'

export type WebsocketCallbacks = {
  onConnectionClose: (reason: ConnectionCloseReason) => void
  onConnectionOpen: () => void
  onConnectionConnecting: () => void
  onConnectionMessage: (message: Uint8Array) => void
  getLatestCommitId: () => string | undefined
  getUrlAndToken: () => Promise<Result<RealtimeUrlAndToken>>
}
