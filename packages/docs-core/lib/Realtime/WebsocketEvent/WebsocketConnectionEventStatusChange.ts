import type { WebsocketConnectionEvent } from './WebsocketConnectionEvent'

export type WebsocketConnectionEventStatusChange =
  | WebsocketConnectionEvent.Connecting
  | WebsocketConnectionEvent.ConnectedAndReady
  | WebsocketConnectionEvent.Disconnected
  | WebsocketConnectionEvent.FailedToConnect
