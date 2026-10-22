import type { CommentInterface } from '@proton/docs-shared/CommentInterface'
import type { CommentPayload } from '@proton/docs-shared/CommentPayload'
import type { CommentType } from '@proton/docs-shared/CommentType'
import type { CommentVerificationResult } from '@proton/docs-shared/CommentVerificationResult'
import { ServerTime } from '@proton/docs-shared/ServerTime'

export class Comment implements CommentInterface {
  constructor(
    public id: string,
    public createTime: ServerTime,
    public modifyTime: ServerTime,
    public content: string,
    public parentCommentID: string | null,
    public author: string | undefined,
    public comments: CommentInterface[],
    public isPlaceholder: boolean,
    public verificationResult: CommentVerificationResult,
    public type: CommentType,
  ) {}

  public asPayload(): CommentPayload {
    return {
      id: this.id,
      createTime: this.createTime.serverTimestamp,
      modifyTime: this.modifyTime.serverTimestamp,
      content: this.content,
      parentCommentID: this.parentCommentID,
      author: this.author,
      comments: this.comments.map((comment) => comment.asPayload()),
      isPlaceholder: this.isPlaceholder,
      type: this.type,
      verificationResult: this.verificationResult,
    }
  }

  static fromPayload(payload: CommentPayload): CommentInterface {
    return new Comment(
      payload.id,
      new ServerTime(payload.createTime),
      new ServerTime(payload.modifyTime),
      payload.content,
      payload.parentCommentID,
      payload.author,
      payload.comments.map((comment) => Comment.fromPayload(comment)),
      payload.isPlaceholder,
      payload.verificationResult,
      payload.type,
    )
  }
}
