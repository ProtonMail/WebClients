export enum CommentThreadState {
  Active = 1,

  /** Normal threads only */
  Resolved = 2,

  /** Suggestion threads only */
  Accepted = 4,
  Rejected = 5,
}
