import { CommentPayload } from '../CommentPayload'
import { CommentThreadPayload } from '../CommentThreadPayload'

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
