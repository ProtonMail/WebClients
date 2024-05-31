import { ConnectionCloseReason } from '@proton/docs-proto'
import { NodeMeta } from '@proton/drive-store'

export enum WebsocketConnectionEvent {
  Connecting = 'connecting',
  Connected = 'connected',
  Disconnected = 'disconnected',
  FailedToConnect = 'failed-to-connect',
  Message = 'message',
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

export type WebsocketMessagePayload = BaseWebsocketPayload & {
  message: Uint8Array
}
