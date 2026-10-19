export const CommentThreadStates = {
  Active: 1,

  /** Normal threads only */
  Resolved: 2,

  /** Suggestion threads only */
  Accepted: 4,
  Rejected: 5,
} as const
type CommentThreadState = (typeof CommentThreadStates)[keyof typeof CommentThreadStates]

export const CommentThreadTypes = {
  Comment: 1,
  Suggestion: 2,
} as const
type CommentThreadType = (typeof CommentThreadTypes)[keyof typeof CommentThreadTypes]

export const CommentTypes = {
  Comment: 1,
  Suggestion: 2,
} as const
type CommentType = (typeof CommentTypes)[keyof typeof CommentTypes]

/**
 * A host time object crosses the bridge as structured-cloned data, which keeps own properties and
 * drops everything the host computes on its prototype. `serverTimestamp` is therefore all the
 * container can read; `Utils/commentTime` derives the rest.
 */
export type DocsCommentTime = {
  serverTimestamp: number
}

export type DocsComment = {
  id: string
  content: string
  author: string | undefined
  isPlaceholder: boolean
  verificationResult: { verified: true } | { verified: false; verificationAvailable: boolean }
  createTime: DocsCommentTime
  type: CommentType
}

export type DocsCommentThread = {
  id: string
  state: CommentThreadState
  markID: string
  isPlaceholder: boolean
  createTime: DocsCommentTime
  comments: DocsComment[]
  type: CommentThreadType
  /** Stable across the placeholder a thread is created as and the thread the host returns. */
  localID: string
}
