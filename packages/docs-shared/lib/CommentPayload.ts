import type { CommentType } from './CommentType'
import type { CommentVerificationResult } from './CommentVerificationResult'

export type CommentPayload = {
  id: string
  createTime: number
  modifyTime: number
  content: string
  parentCommentID: string | null
  author: string | undefined
  comments: CommentPayload[]
  isPlaceholder: boolean
  type: CommentType
  verificationResult: CommentVerificationResult
}
