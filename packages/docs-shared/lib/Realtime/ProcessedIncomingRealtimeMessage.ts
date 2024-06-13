import { EventTypeEnum } from '@proton/docs-proto'

export class ProcessedIncomingRealtimeEventMessage {
  constructor(
    public readonly props:
      | {
          content: Uint8Array
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
        }
      | {
          type: never
        },
  ) {}
}
