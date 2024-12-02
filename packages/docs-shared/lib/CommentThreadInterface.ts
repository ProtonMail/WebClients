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
  /**
   * We need a stable local ID to allow positioned threads to be
   * keyed in a where the placeholder element for a thread is keyed
   * with the same ID as the normal one to prevent react from creating
   * a new DOM element. On thread creation, we use the ID of the placeholder
   * for this and on subsequent reloads we just use the normal ID.
   */
  localID: string

  asPayload(): CommentThreadPayload
}
