import {
  CommentInterface,
  CommentThreadInterface,
  CommentThreadState,
  CommentsEvent,
  EditCommentData,
  InternalEventBusInterface,
} from '@proton/docs-shared'

export class LocalCommentsState {
  private threads: CommentThreadInterface[] = []

  constructor(private eventBus: InternalEventBusInterface) {}

  getAllThreads() {
    return this.threads
  }

  findThreadById(threadId: string): CommentThreadInterface | undefined {
    return this.threads.find((thread) => thread.id === threadId)
  }

  addThread(thread: CommentThreadInterface) {
    this.threads.push(thread)
    this.notifyLocalListeners()
  }

  deleteThread(id: string): void {
    this.threads = this.threads.filter((thread) => thread.id !== id)
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

  addComment(comment: CommentInterface, threadID: string): void {
    const thread = this.findThreadById(threadID)
    if (!thread) {
      return
    }
    thread.comments.push(comment)
    this.notifyLocalListeners()
  }

  editComment({ commentID, threadID, content }: EditCommentData): void {
    const thread = this.findThreadById(threadID)
    if (!thread) {
      return
    }

    const comment = thread.comments.find((comment) => comment.id === commentID)
    if (!comment) {
      return
    }

    comment.content = content

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
    this.eventBus.publish({
      type: CommentsEvent.CommentsChanged,
      payload: undefined,
    })
  }
}
