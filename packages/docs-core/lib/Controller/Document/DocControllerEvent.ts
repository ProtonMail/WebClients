export enum DocControllerEvent {
  RealtimeCommentMessageReceived = 'RealtimeCommentMessageReceived',
  SquashVerificationObjectionDecisionRequired = 'SquashVerificationObjectionDecisionRequired',
}

export type RealtimeCommentMessageReceivedPayload = {
  message: Uint8Array
}
