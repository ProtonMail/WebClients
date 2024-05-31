import { DecryptedMessage } from '../../Models/DecryptedMessage'

export enum DocControllerEvent {
  CommitVerificationFailed = 'CommitVerificationFailed',
  RealtimeCommentMessageReceived = 'RealtimeCommentMessageReceived',
}

export type CommitVerificationFailedPayload = {
  commitId: string
}

export type RealtimeCommentMessageReceivedPayload = {
  message: DecryptedMessage
}
