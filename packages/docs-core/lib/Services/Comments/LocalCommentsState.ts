import type {
  CommentInterface,
  CommentThreadInterface,
  CommentsChangedData,
  EditCommentData,
  InternalEventBusInterface,
} from '@proton/docs-shared'
import { CommentThreadState, CommentsEvent } from '@proton/docs-shared'

export class LocalCommentsState {
  private threads: CommentThreadInterface[] = []
  private unreadThreadIDs = new Set<string>()

  constructor(private eventBus: InternalEventBusInterface) {}

  getAllThreads(): CommentThreadInterface[] {
    return this.threads
  }

  hasUnreadThreads(): boolean {
    return this.unreadThreadIDs.size > 0
  }

  markThreadAsRead(id: string): void {
    if (this.unreadThreadIDs.has(id)) {
      this.unreadThreadIDs.delete(id)
      this.notifyLocalListeners()
    }
  }

  findThreadById(threadId: string): CommentThreadInterface | undefined {
    return this.threads.find((thread) => thread.id === threadId)
  }

  addThread(thread: CommentThreadInterface, markUnread = false) {
    this.threads = this.threads.filter((existing) => existing.id !== thread.id)

    this.threads.push(thread)

    if (markUnread) {
      this.unreadThreadIDs.add(thread.id)
    }

    this.notifyLocalListeners()
  }

  deleteThread(id: string): void {
    this.threads = this.threads.filter((thread) => thread.id !== id)

    if (this.unreadThreadIDs.has(id)) {
      this.unreadThreadIDs.delete(id)
    }

    this.notifyLocalListeners()
  }

  resolveThread(threadId: string) {
    const thread = this.findThreadById(threadId)
    if (!thread) {
      return
    }
    thread.state = CommentThreadState.Resolved
    this.sortThreadsAndNotify()
    return thread
  }

  unresolveThread(threadId: string) {
    const thread = this.findThreadById(threadId)
    if (!thread) {
      return
    }
    thread.state = CommentThreadState.Active
    this.sortThreadsAndNotify()
    return thread
  }

  changeThreadState(threadId: string, state: CommentThreadState) {
    const thread = this.findThreadById(threadId)
    if (!thread) {
      return
    }
    thread.state = state
    this.sortThreadsAndNotify()
    return thread
  }

  addComment(comment: CommentInterface, threadID: string, markUnread = false): void {
    const thread = this.findThreadById(threadID)
    if (!thread) {
      return
    }
    thread.comments.push(comment)
    if (markUnread) {
      this.unreadThreadIDs.add(thread.id)
    }
    this.notifyLocalListeners()
  }

  editComment({ commentID, threadID, content, markThreadUnread = false }: EditCommentData): void {
    const thread = this.findThreadById(threadID)
    if (!thread) {
      return
    }

    const comment = thread.comments.find((comment) => comment.id === commentID)
    if (!comment) {
      return
    }

    comment.content = content

    if (markThreadUnread) {
      this.unreadThreadIDs.add(thread.id)
    }

    this.notifyLocalListeners()
  }

  deleteComment({ commentID, threadID }: { commentID: string; threadID: string }): void {
    const thread = this.findThreadById(threadID)
    if (!thread) {
      return
    }
    thread.comments = thread.comments.filter((comment) => comment.id !== commentID)
    this.notifyLocalListeners()
  }

  replacePlaceholderThread(placeholderID: string, thread: CommentThreadInterface) {
    const index = this.threads.findIndex((thread) => thread.id === placeholderID)
    if (index === -1) {
      return
    }

    this.threads[index] = {
      ...thread,
      isPlaceholder: false,
    }

    this.notifyLocalListeners()
  }

  replacePlaceholderComment(placeholderID: string, comment: CommentInterface) {
    this.threads.forEach((thread) => {
      const index = thread.comments.findIndex((comment) => comment.id === placeholderID)
      if (index !== -1) {
        thread.comments[index] = {
          ...comment,
          isPlaceholder: false,
        }
      }
    })
    this.notifyLocalListeners()
  }

  sortThreadsAndNotify(): void {
    this.threads.sort((a, b) => {
      if (a.state === CommentThreadState.Resolved && b.state !== CommentThreadState.Resolved) {
        return 1
      } else if (a.state !== CommentThreadState.Resolved && b.state === CommentThreadState.Resolved) {
        return -1
      } else {
        return a.createTime.milliseconds - b.createTime.milliseconds
      }
    })
    this.notifyLocalListeners()
  }

  private notifyLocalListeners(): void {
    this.eventBus.publish<CommentsChangedData>({
      type: CommentsEvent.CommentsChanged,
      payload: {
        hasUnreadThreads: this.hasUnreadThreads(),
      },
    })
  }
}
