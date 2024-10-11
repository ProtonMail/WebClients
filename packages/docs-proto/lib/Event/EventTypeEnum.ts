export enum EventTypeEnum {
  ClientIsBroadcastingItsPresenceState = 2,
  ClientHasSentACommentMessage = 7,
  ClientIsDebugRequestingServerToPerformCommit = 8,
  ServerIsInformingClientThatTheDocumentCommitHasBeenUpdated = 9,
  ClientIsRequestingOtherClientsToBroadcastTheirState = 10,
  ServerIsRequestingClientToBroadcastItsState = 11,
  ServerIsPlacingEmptyActivityIndicatorInStreamToIndicateTheStreamIsStillActive = 12,
  ServerHasMoreOrLessGivenTheClientEverythingItHas = 13,
  ServerIsNotifyingOtherServersToDisconnectAllClientsFromTheStream = 14,
  ServerIsReadyToAcceptClientMessages = 15,
  ServerIsRequestingOtherServersToBroadcastParticipants = 16,
  ServerIsInformingOtherServersOfTheParticipants = 17,
}
