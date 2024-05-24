export enum WebsocketConnectionEvent {
  StatusChanged = 'status-changed',
  SocketClientRelayEventReceived = 'socket-client-relay-event-received',
}

export enum WebsocketConnectionStatus {
  Connecting = 'connecting',
  Connected = 'connected',
  Disconnected = 'disconnected',
}

export enum WebsocketDisconnectedReason {
  Unknown = 'unknown',
  StaleCommitId = 'stale-commit',
  RateLimited = 'rate-limited',
  DocumentAccessRevoked = 'access-revoked',
}

export type WebsocketStatusChangedPayload =
  | {
      status: WebsocketConnectionStatus.Connecting | WebsocketConnectionStatus.Connected
    }
  | {
      status: WebsocketConnectionStatus.Disconnected
      reason?: WebsocketDisconnectedReason
    }
