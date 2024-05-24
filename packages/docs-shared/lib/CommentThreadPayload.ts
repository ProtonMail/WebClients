import { CommentThreadState } from './CommentThreadState'
import { CommentPayload } from './CommentPayload'

export type CommentThreadPayload = {
  id: string
  createTime: number
  modifyTime: number
  markID: string
  comments: CommentPayload[]
  isPlaceholder: boolean
  state: CommentThreadState
}
