import { ConnectionCloseReason } from '@proton/docs-proto'
import { NodeMeta } from '@proton/drive-store'
import { DecryptedMessage, ProcessedIncomingRealtimeEventMessage } from '@proton/docs-shared'
import { AckLedgerInterface } from '../../Services/Websockets/AckLedger/AckLedgerInterface'

export type BaseWebsocketPayload = {
  document: NodeMeta
}

export type WebsocketConnectedPayload = BaseWebsocketPayload

export type WebsocketDisconnectedPayload = BaseWebsocketPayload & {
  serverReason: ConnectionCloseReason
}

export type WebsocketFailedToConnectPayload = BaseWebsocketPayload & {
  serverReason: ConnectionCloseReason
}

export type WebsocketEncryptionErrorPayload = BaseWebsocketPayload & {
  error: string
}

export type WebsocketDocumentUpdateMessagePayload = BaseWebsocketPayload & {
  message: DecryptedMessage
}

export type WebsocketEventMessagePayload = BaseWebsocketPayload & {
  message: ProcessedIncomingRealtimeEventMessage[]
}

export type WebsocketAckStatusChangePayload = {
  ledger: AckLedgerInterface
}
