export enum EventTypeEnum {
  PresenceChangeUnknown = 1,
  PresenceChangeEnteredDocument = 4,
  PresenceChangeExitedDocument = 5,
  PresenceChangeBlurredDocument = 6,
  Comments = 7,
  DebugRequestCommit = 8,
  DocumentCommitUpdated = 9,
  RequestPresenceState = 10,
  RefreshPresenceState = 11,
  WebsocketConnectionResponded = 12,
}
