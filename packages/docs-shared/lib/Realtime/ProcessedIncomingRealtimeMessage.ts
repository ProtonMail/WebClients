import type { EventTypeEnum } from '@proton/docs-proto'

export class ProcessedIncomingRealtimeEventMessage {
  constructor(
    public readonly props:
      | {
          content: Uint8Array<ArrayBuffer>
          type:
            | EventTypeEnum.ServerIsInformingClientThatTheDocumentCommitHasBeenUpdated
            | EventTypeEnum.ClientHasSentACommentMessage
            | EventTypeEnum.ClientIsBroadcastingItsPresenceState
        }
      | {
          type:
            | EventTypeEnum.ClientIsRequestingOtherClientsToBroadcastTheirState
            | EventTypeEnum.ServerIsRequestingClientToBroadcastItsState
            | EventTypeEnum.ServerHasMoreOrLessGivenTheClientEverythingItHas
            | EventTypeEnum.ServerIsPlacingEmptyActivityIndicatorInStreamToIndicateTheStreamIsStillActive
            | EventTypeEnum.ClientIsDebugRequestingServerToPerformCommit
            | EventTypeEnum.ServerIsReadyToAcceptClientMessages
            | EventTypeEnum.ServerIsNotifyingOtherServersToDisconnectAllClientsFromTheStream
        }
      | {
          type: never
        },
  ) {}
}
