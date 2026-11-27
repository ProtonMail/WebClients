import type { CommentPayload } from '../CommentPayload'
import type { CommentThreadPayload } from '../CommentThreadPayload'

export enum CommentsMessageType {
  AddThread = 0,
  AddComment = 1,
  EditComment = 2,
  DeleteComment = 3,
  DeleteThread = 4,
  BeganTyping = 5,
  StoppedTyping = 6,
  ResolveThread = 7,
  UnresolveThread = 8,
  /**
   * A suggestion thread's state was saved, `{ threadId }`. The realtime SDK sends and reads it, so a peer shows the
   * new state; docs-core ignores it. Here so that nothing else takes the value.
   */
  SuggestionStateChanged = 9,
}

export type AddThreadData = CommentThreadPayload

export type AddCommentData = {
  comment: CommentPayload
  threadID: string
}

export type EditCommentData = {
  commentID: string
  threadID: string
  content: string
  markThreadUnread?: boolean
}

export type DeleteCommentData = {
  commentID: string
  threadID: string
}

export type DeleteThreadData = {
  threadId: string
}

export type BeganTypingData = {
  threadID: string
  userId: string
}

export type StoppedTypingData = {
  threadID: string
  userId: string
}

export type ResolveThreadData = {
  threadID: string
}

export type UnresolveThreadData = {
  threadID: string
}

export type AnyCommentMessageData =
  | AddThreadData
  | AddCommentData
  | EditCommentData
  | DeleteCommentData
  | DeleteThreadData
  | BeganTypingData
  | StoppedTypingData
  | ResolveThreadData
  | UnresolveThreadData
