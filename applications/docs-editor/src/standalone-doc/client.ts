import {
  CommentThreadStates,
  CommentThreadTypes,
  CommentTypes,
  type DocsComment,
  type DocsCommentEvent,
  type DocsComments,
  type DocsCommentThread,
} from '../app/Containers/Docs/public'

/**
 * Keeps comment threads in page memory, emitting the events the full app's host emits for each change.
 * There is one user, so nobody else types, and nothing is ever unread.
 */
export function createStandaloneDocClient(
  userAddress: string,
  subscribeToAwarenessStates: DocsComments['subscribeToAwarenessStates'],
): DocsComments {
  let threads: DocsCommentThread[] = []
  const listeners = new Set<(event: DocsCommentEvent) => void>()
  const emit = (event: DocsCommentEvent) => listeners.forEach((callback) => callback(event))

  const findThread = (threadId: string) => threads.find((thread) => thread.id === threadId)
  const findComment = (threadId: string, commentId: string) =>
    findThread(threadId)?.comments.find((comment) => comment.id === commentId)

  const newComment = (content: string, type: DocsComment['type']): DocsComment => ({
    id: crypto.randomUUID(),
    content,
    author: userAddress,
    isPlaceholder: false,
    verificationResult: { verified: true },
    createTime: { serverTimestamp: Math.round(Date.now() / 1000) },
    type,
  })

  const setThreadState = (threadId: string, state: DocsCommentThread['state']) => {
    const thread = findThread(threadId)
    if (!thread) {
      return undefined
    }
    thread.state = state
    emit({ type: 'changed' })
    return thread
  }

  const addThread = (markID: string, type: DocsCommentThread['type'], firstComment: DocsComment) => {
    const id = crypto.randomUUID()
    const thread: DocsCommentThread = {
      id,
      localID: id,
      markID,
      state: CommentThreadStates.Active,
      type,
      isPlaceholder: false,
      createTime: firstComment.createTime,
      comments: [firstComment],
    }
    threads = [...threads, thread]
    emit({ type: 'changed' })
    return thread
  }

  const changeSuggestionState = (threadId: string, state: DocsCommentThread['state'], summary?: string) => {
    const thread = findThread(threadId)
    if (!thread) {
      return false
    }
    if (summary) {
      thread.comments.push(newComment(summary, CommentTypes.Suggestion))
      emit({ type: 'changed' })
    }
    setThreadState(threadId, state)
    return true
  }

  return {
    getTypersExcludingSelf: async () => [],
    createComment: async (content, threadId) => {
      const thread = findThread(threadId)
      if (!thread) {
        return undefined
      }
      const comment = newComment(content, CommentTypes.Comment)
      thread.comments.push(comment)
      emit({ type: 'changed' })
      return structuredClone(comment)
    },
    beganTypingInThread: async () => {},
    stoppedTypingInThread: async () => {},
    editComment: async (threadId, commentId, content) => {
      const comment = findComment(threadId, commentId)
      if (!comment) {
        return false
      }
      comment.content = content
      emit({ type: 'changed' })
      return true
    },
    deleteComment: async (threadId, commentId) => {
      const thread = findThread(threadId)
      if (!thread?.comments.some((comment) => comment.id === commentId)) {
        return false
      }
      thread.comments = thread.comments.filter((comment) => comment.id !== commentId)
      emit({ type: 'changed' })
      return true
    },
    // Threads cross the bridge as structured clones in the full app, so the editor never holds this state.
    // The host lists resolved threads last, otherwise in creation order, which a stable sort keeps.
    getAllThreads: async () =>
      structuredClone(threads).sort(
        (a, b) => Number(a.state === CommentThreadStates.Resolved) - Number(b.state === CommentThreadStates.Resolved),
      ),
    createCommentThread: async (content, markID = crypto.randomUUID(), createMarkNode = true) => {
      const thread = addThread(markID, CommentThreadTypes.Comment, newComment(content, CommentTypes.Comment))
      if (createMarkNode) {
        emit({ type: 'create-mark', markID })
      }
      return structuredClone(thread)
    },
    // The suggestion node already marks the text, so the host creates no comment mark for it.
    createSuggestionThread: async (suggestionID, content) =>
      structuredClone(
        addThread(suggestionID, CommentThreadTypes.Suggestion, newComment(content, CommentTypes.Suggestion)),
      ),
    resolveThread: async (threadId) => {
      const thread = setThreadState(threadId, CommentThreadStates.Resolved)
      if (!thread) {
        return false
      }
      emit({ type: 'resolve-mark', markID: thread.markID })
      return true
    },
    unresolveThread: async (threadId) => {
      const thread = setThreadState(threadId, CommentThreadStates.Active)
      if (!thread) {
        return false
      }
      emit({ type: 'unresolve-mark', markID: thread.markID })
      return true
    },
    acceptSuggestion: async (threadId, summary) =>
      changeSuggestionState(threadId, CommentThreadStates.Accepted, summary),
    rejectSuggestion: async (threadId, summary) =>
      changeSuggestionState(threadId, CommentThreadStates.Rejected, summary),
    reopenSuggestion: async (threadId) => changeSuggestionState(threadId, CommentThreadStates.Active),
    // Like the host, this leaves the mark: the editor removes it once the delete succeeds.
    deleteThread: async (threadId) => {
      if (!findThread(threadId)) {
        return false
      }
      threads = threads.filter((thread) => thread.id !== threadId)
      emit({ type: 'changed' })
      return true
    },
    markThreadAsRead: async () => {},
    subscribeToEvents: (callback) => {
      listeners.add(callback)
      return () => listeners.delete(callback)
    },
    subscribeToAwarenessStates,
  }
}
