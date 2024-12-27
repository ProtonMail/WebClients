import type { ServerTime } from './ServerTime'
import type { CommentPayload } from './CommentPayload'
import type { CommentType } from './CommentType'
import type { CommentVerificationResult } from './CommentVerificationResult'

export interface CommentInterface {
  id: string
  createTime: ServerTime
  modifyTime: ServerTime
  content: string
  parentCommentID: string | null
  author: string | undefined
  comments: CommentInterface[]
  isPlaceholder: boolean
  type: CommentType
  verificationResult: CommentVerificationResult

  asPayload(): CommentPayload
}
