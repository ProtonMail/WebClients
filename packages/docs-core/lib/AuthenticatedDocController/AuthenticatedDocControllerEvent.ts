export enum DocControllerEvent {
  RealtimeCommentMessageReceived = 'RealtimeCommentMessageReceived',
  SquashVerificationObjectionDecisionRequired = 'SquashVerificationObjectionDecisionRequired',
  UnableToResolveCommitIdConflict = 'UnableToResolveCommitIdConflict',
}

export type DocControllerEventPayloads = {
  [DocControllerEvent.RealtimeCommentMessageReceived]: {
    message: Uint8Array
  }
  [DocControllerEvent.SquashVerificationObjectionDecisionRequired]: {}
  [DocControllerEvent.UnableToResolveCommitIdConflict]: {}
}
