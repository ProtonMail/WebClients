export enum WebsocketConnectionEvent {
  Connecting = 'connecting',
  Connected = 'connected',
  Disconnected = 'disconnected',
  FailedToConnect = 'failed-to-connect',
  DocumentUpdateMessage = 'du-message',
  EventMessage = 'event-message',
  EncryptionError = 'encryption-error',
  AckStatusChange = 'ack-status-change',
  FailedToGetTokenCommitIdOutOfSync = 'commit-id-out-of-sync',
  Saving = 'saving',
  Saved = 'saved',
}
