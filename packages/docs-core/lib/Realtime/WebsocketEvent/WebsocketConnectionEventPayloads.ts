import { ConnectionCloseReason } from '@proton/docs-proto'
import { NodeMeta } from '@proton/drive-store'
import { DecryptedMessage, ProcessedIncomingRealtimeEventMessage } from '@proton/docs-shared'
import { AckLedgerInterface } from '../../Services/Websockets/AckLedger/AckLedgerInterface'
import { WebsocketConnectionEvent } from './WebsocketConnectionEvent'

type BaseWebsocketPayload = {
  document: NodeMeta
}

export type WebsocketConnectionEventPayloads = {
  [WebsocketConnectionEvent.Connecting]: BaseWebsocketPayload
  [WebsocketConnectionEvent.Connected]: BaseWebsocketPayload
  [WebsocketConnectionEvent.CommitIdOutOfSync]: BaseWebsocketPayload
  [WebsocketConnectionEvent.Disconnected]: BaseWebsocketPayload & {
    serverReason: ConnectionCloseReason
  }
  [WebsocketConnectionEvent.FailedToConnect]: BaseWebsocketPayload & {
    serverReason: ConnectionCloseReason
  }
  [WebsocketConnectionEvent.DocumentUpdateMessage]: BaseWebsocketPayload & {
    message: DecryptedMessage
  }
  [WebsocketConnectionEvent.EventMessage]: BaseWebsocketPayload & {
    message: ProcessedIncomingRealtimeEventMessage[]
  }
  [WebsocketConnectionEvent.EncryptionError]: BaseWebsocketPayload & {
    error: string
  }
  [WebsocketConnectionEvent.AckStatusChange]: {
    ledger: AckLedgerInterface
  }
}
