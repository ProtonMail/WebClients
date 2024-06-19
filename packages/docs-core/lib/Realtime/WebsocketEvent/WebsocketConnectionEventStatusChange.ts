import { WebsocketConnectionEvent } from './WebsocketConnectionEvent'

export type WebsocketConnectionEventStatusChange =
  | WebsocketConnectionEvent.Connecting
  | WebsocketConnectionEvent.Connected
  | WebsocketConnectionEvent.Disconnected
  | WebsocketConnectionEvent.FailedToConnect
