import type { CommentThreadState } from './CommentThreadState'
import type { CommentInterface } from './CommentInterface'
import type { ServerTime } from './ServerTime'
import type { CommentThreadPayload } from './CommentThreadPayload'

export type CommentThreadInterface = {
  id: string
  createTime: ServerTime
  modifyTime: ServerTime
  markID: string
  comments: CommentInterface[]
  isPlaceholder: boolean
  state: CommentThreadState

  asPayload(): CommentThreadPayload
}
