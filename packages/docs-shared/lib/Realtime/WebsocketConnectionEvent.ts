import { ConnectionCloseReason } from '@proton/docs-proto'
import { NodeMeta } from '@proton/drive-store'
import { DecryptedMessage } from './DecryptedMessage'
import { ProcessedIncomingRealtimeEventMessage } from './ProcessedIncomingRealtimeMessage'

export enum WebsocketConnectionEvent {
  Connecting = 'connecting',
  Connected = 'connected',
  Disconnected = 'disconnected',
  FailedToConnect = 'failed-to-connect',
  DocumentUpdateMessage = 'du-message',
  EventMessage = 'event-message',
  EncryptionError = 'encryption-error',
}

export type WebsocketConnectionEventStatusChange =
  | WebsocketConnectionEvent.Connecting
  | WebsocketConnectionEvent.Connected
  | WebsocketConnectionEvent.Disconnected
  | WebsocketConnectionEvent.FailedToConnect

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
