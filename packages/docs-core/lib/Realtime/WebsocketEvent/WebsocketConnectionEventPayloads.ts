import type { ConnectionCloseReason, ConnectionReadyPayload } from '@proton/docs-proto'
import type { NodeMeta, PublicNodeMeta } from '@proton/drive-store'
import type { DecryptedMessage, ProcessedIncomingRealtimeEventMessage } from '@proton/docs-shared'
import type { AckLedgerInterface } from '../../Services/Websockets/AckLedger/AckLedgerInterface'
import type { WebsocketConnectionEvent } from './WebsocketConnectionEvent'

type BaseWebsocketPayload = {
  document: NodeMeta | PublicNodeMeta
}

export type WebsocketConnectionEventPayloads = {
  [WebsocketConnectionEvent.Connecting]: BaseWebsocketPayload
  [WebsocketConnectionEvent.DidNotReceiveReadyMessageInTime]: BaseWebsocketPayload
  [WebsocketConnectionEvent.ConnectedAndReady]: BaseWebsocketPayload & {
    readinessInformation?: ConnectionReadyPayload
  }
  [WebsocketConnectionEvent.FailedToGetTokenCommitIdOutOfSync]: BaseWebsocketPayload
  [WebsocketConnectionEvent.NeedsToBeInReadonlyMode]: BaseWebsocketPayload
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
  [WebsocketConnectionEvent.Saving]: BaseWebsocketPayload
  [WebsocketConnectionEvent.Saved]: BaseWebsocketPayload
  [WebsocketConnectionEvent.ConnectionEstablishedButNotYetReady]: BaseWebsocketPayload
  [WebsocketConnectionEvent.ImportUpdateSuccessful]: BaseWebsocketPayload & {
    uuid: string
  }
  [WebsocketConnectionEvent.WillPublishDocumentUpdate]: BaseWebsocketPayload & {
    content: Uint8Array<ArrayBuffer>
    timestamp: number
    authorAddress: string
  }
}
