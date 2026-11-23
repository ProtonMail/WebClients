import type { CommentInterface } from '@proton/docs-shared/CommentInterface'
import type { CommentPayload } from '@proton/docs-shared/CommentPayload'
import type { CommentThreadInterface } from '@proton/docs-shared/CommentThreadInterface'
import type { CommentThreadPayload } from '@proton/docs-shared/CommentThreadPayload'
import { CommentThreadState } from '@proton/docs-shared/CommentThreadState'
import { CommentThreadType } from '@proton/docs-shared/CommentThreadType'
import { CommentType } from '@proton/docs-shared/CommentType'
import type { CommentVerificationResult } from '@proton/docs-shared/CommentVerificationResult'
import { ServerTime } from '@proton/docs-shared/ServerTime'
import type { Comment as SdkComment, CommentThread as SdkCommentThread } from '@proton-docs/realtime-sdk'

/** A session's comment thread as the editor takes it, its mark id as its local id */
export function toEditorThread(thread: SdkCommentThread): CommentThreadInterface {
  return new CommentThread(
    thread.id,
    toServerTime(thread.createTime),
    toServerTime(thread.modifyTime),
    thread.markId,
    thread.comments.map(toEditorComment),
    thread.isPlaceholder,
    THREAD_STATES[thread.state],
    thread.type === 'suggestion' ? CommentThreadType.Suggestion : CommentThreadType.Comment,
    // The editor keys a thread by it, so it must not change when the placeholder becomes the created thread: the mark
    // id is the one id both share
    thread.markId,
  )
}

export function toEditorComment(comment: SdkComment): CommentInterface {
  return new Comment(
    comment.id,
    toServerTime(comment.createTime),
    toServerTime(comment.modifyTime),
    comment.content,
    null,
    comment.authorAddress,
    [],
    comment.isPlaceholder,
    VERIFICATION_RESULTS[comment.verification],
    comment.type === 'suggestion' ? CommentType.Suggestion : CommentType.Comment,
  )
}

const THREAD_STATES: Record<SdkCommentThread['state'], CommentThreadState> = {
  active: CommentThreadState.Active,
  resolved: CommentThreadState.Resolved,
  accepted: CommentThreadState.Accepted,
  rejected: CommentThreadState.Rejected,
}

const VERIFICATION_RESULTS: Record<SdkComment['verification'], CommentVerificationResult> = {
  verified: { verified: true },
  invalid: { verified: false, verificationAvailable: true },
  unavailable: { verified: false, verificationAvailable: false },
}

/** In seconds, as the Docs API gives /doc its times */
function toServerTime(epochMs: number) {
  return new ServerTime(Math.floor(epochMs / 1000))
}

// Copied from `packages/docs-core/lib/Models/Comments.ts`, which doc2 must not import, without `fromPayload`. A class,
// as a function in an own property would fail the bridge's postMessage.
class Comment implements CommentInterface {
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
}

// Copied from `packages/docs-core/lib/Models/CommentThread.ts`, which doc2 must not import, without `fromPayload`.
class CommentThread implements CommentThreadInterface {
  constructor(
    public id: string,
    public createTime: ServerTime,
    public modifyTime: ServerTime,
    public markID: string,
    public comments: CommentInterface[],
    public isPlaceholder: boolean,
    public state: CommentThreadState,
    public type: CommentThreadType,
    public localID: string,
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
}
