import type { CommentThreadState } from './CommentThreadState'
import type { CommentPayload } from './CommentPayload'
import type { CommentThreadType } from './CommentThreadType'

export type CommentThreadPayload = {
  id: string
  createTime: number
  modifyTime: number
  markID: string
  comments: CommentPayload[]
  isPlaceholder: boolean
  state: CommentThreadState
  type: CommentThreadType
}
