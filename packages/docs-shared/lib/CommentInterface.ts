import type { ServerTime } from './ServerTime'
import type { CommentPayload } from './CommentPayload'

export interface CommentInterface {
  id: string
  createTime: ServerTime
  modifyTime: ServerTime
  content: string
  parentCommentID: string | null
  author: string
  comments: CommentInterface[]
  isPlaceholder: boolean

  asPayload(): CommentPayload
}
