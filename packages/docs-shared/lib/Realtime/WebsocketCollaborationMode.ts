export enum WebsocketCollaborationMode {
  /** All document updates are sent immediately */
  Realtime = 'realtime',
  /** No one else is in the doc, so updates are buffered for up to 30s before being sent in batches */
  Buffered = 'buffered',
}
