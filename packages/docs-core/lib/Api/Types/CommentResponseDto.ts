import type { CommentType } from '@proton/docs-shared'

export type CommentResponseDto = {
  CommentID: string
  CreateTime: number
  ModifyTime: number
  Content: string
  /** @deprecated Use AuthorEmail instead if available */
  Author: string | undefined
  AuthorEmail: string | undefined
  ParentCommentID: string | null
  Comments: CommentResponseDto[]
  Type: CommentType
}
