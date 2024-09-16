import type { CommentThreadState } from '@proton/docs-shared'
import type { CommentResponseDto } from './CommentResponseDto'
import type { CommentThreadType } from '@proton/docs-shared'

export type CommentThreadResponseDto = {
  CommentThreadID: string
  CreateTime: number
  ModifyTime: number
  Mark: string
  Comments: CommentResponseDto[]
  State: CommentThreadState
  Type: CommentThreadType
}
