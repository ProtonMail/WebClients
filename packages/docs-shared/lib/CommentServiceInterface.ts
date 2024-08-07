import type { CommentInterface } from './CommentInterface'
import type { CommentThreadInterface } from './CommentThreadInterface'
import type { InternalEventBusInterface } from './Events/InternalEventBusInterface'

export interface CommentServiceInterface {
  userDisplayName: string
  readonly eventBus: InternalEventBusInterface
  initialize(): void

  getAllThreads(): CommentThreadInterface[]

  createThread(commentContent: string): Promise<CommentThreadInterface | undefined>

  createComment(content: string, threadID: string): Promise<CommentInterface | undefined>

  editComment(threadID: string, commentID: string, content: string): Promise<boolean>

  deleteComment(threadID: string, commentID: string): Promise<boolean>

  deleteThread(id: string): Promise<boolean>

  resolveThread(threadId: string): Promise<boolean>

  unresolveThread(threadId: string): Promise<boolean>

  markThreadAsRead(id: string): void

  getTypersExcludingSelf(threadId: string): string[]
  beganTypingInThread(threadID: string): void
  stoppedTypingInThread(threadID: string): void
}
