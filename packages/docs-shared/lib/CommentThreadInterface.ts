import { CommentThreadState } from './CommentThreadState'
import { CommentInterface } from './CommentInterface'
import { ServerTime } from './ServerTime'
import { CommentThreadPayload } from './CommentThreadPayload'

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
