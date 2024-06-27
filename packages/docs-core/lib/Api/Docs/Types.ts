import { CommentThreadState } from '@proton/docs-shared'

export type CommentResponseDto = {
  CommentID: string
  CreateTime: number
  ModifyTime: number
  Content: string
  Author: string
  ParentCommentID: string | null
  Comments: CommentResponseDto[]
}

export type CommentThreadResponseDto = {
  CommentThreadID: string
  CreateTime: number
  ModifyTime: number
  Mark: string
  Comments: CommentResponseDto[]
  State: CommentThreadState
}

export type GetAllThreadIDsResponse = {
  Code: 1000
  CommentThreads: string[]
}

export type CreateThreadResponse = {
  Code: 1000
  CommentThread: CommentThreadResponseDto
}

export type GetCommentThreadResponse = {
  Code: 1000
  CommentThread: CommentThreadResponseDto
}

export type AddCommentToThreadResponse = {
  Code: 1000
  Comment: CommentResponseDto
}

export type EditCommentResponse = {
  Code: 1000
  Comment: CommentResponseDto
}

export type DeleteThreadResponse = {
  Code: 1000
}

export type ResolveThreadResponse = {
  Code: 1000
}

export type UnresolveThreadResponse = {
  Code: 1000
}

export type DeleteCommentResponse = {
  Code: 1000
}
