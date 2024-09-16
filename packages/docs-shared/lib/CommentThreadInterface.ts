import type { CommentThreadState } from './CommentThreadState'
import type { CommentInterface } from './CommentInterface'
import type { ServerTime } from './ServerTime'
import type { CommentThreadPayload } from './CommentThreadPayload'
import type { CommentThreadType } from './CommentThreadType'

export type CommentThreadInterface = {
  id: string
  createTime: ServerTime
  modifyTime: ServerTime
  markID: string
  comments: CommentInterface[]
  isPlaceholder: boolean
  state: CommentThreadState
  type: CommentThreadType

  asPayload(): CommentThreadPayload
}
