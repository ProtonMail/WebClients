import { DecryptedMessage } from '../../Models/DecryptedMessage'

export enum DocControllerEvent {
  RealtimeCommentMessageReceived = 'RealtimeCommentMessageReceived',
  SquashVerificationObjectionDecisionRequired = 'SquashVerificationObjectionDecisionRequired',
}

export type RealtimeCommentMessageReceivedPayload = {
  message: DecryptedMessage
}
