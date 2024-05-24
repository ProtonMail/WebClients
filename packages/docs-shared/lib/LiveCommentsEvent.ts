export enum LiveCommentsEvent {
  TypingStatusChange = 'TypingStatusChange',
}

export type LiveCommentsTypeStatusChangeData = {
  threadId: string
}
