import { Comment } from './Comments'
import type {
  CommentThreadPayload,
  CommentThreadInterface,
  CommentThreadState,
  CommentInterface,
} from '@proton/docs-shared'
import { ServerTime } from '@proton/docs-shared'
import type { CommentThreadType } from '@proton/docs-shared'

export class CommentThread implements CommentThreadInterface {
  constructor(
    public id: string,
    public createTime: ServerTime,
    public modifyTime: ServerTime,
    public markID: string,
    public comments: CommentInterface[],
    public isPlaceholder: boolean,
    public state: CommentThreadState,
    public type: CommentThreadType,
  ) {}

  public asPayload(): CommentThreadPayload {
    return {
      id: this.id,
      createTime: this.createTime.serverTimestamp,
      modifyTime: this.modifyTime.serverTimestamp,
      markID: this.markID,
      comments: this.comments.map((comment) => comment.asPayload()),
      isPlaceholder: this.isPlaceholder,
      state: this.state,
      type: this.type,
    }
  }

  static fromPayload(payload: CommentThreadPayload): CommentThreadInterface {
    return new CommentThread(
      payload.id,
      new ServerTime(payload.createTime),
      new ServerTime(payload.modifyTime),
      payload.markID,
      payload.comments.map((comment) => Comment.fromPayload(comment)),
      payload.isPlaceholder,
      payload.state,
      payload.type,
    )
  }
}
