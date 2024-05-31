export enum EventTypeEnum {
  ClientHasDetectedAPresenceChange = 1,
  ClientIsBroadcastingItsPresenceState = 2,
  PresenceChangeEnteredDocument = 4,
  PresenceChangeExitedDocument = 5,
  PresenceChangeBlurredDocument = 6,
  ClientHasSentACommentMessage = 7,
  ClientIsDebugRequestingServerToPerformCommit = 8,
  ServerIsInformingClientThatTheDocumentCommitHasBeenUpdated = 9,
  ClientIsRequestingOtherClientsToBroadcastTheirState = 10,
  ServerIsRequestingClientToBroadcastItsState = 11,
  ServerIsPlacingEmptyActivityIndicatorInStreamToIndicateTheStreamIsStillActive = 12,
  ServerHasMoreOrLessGivenTheClientEverythingItHas = 13,
}
