import type { DocsComments } from '../app/Containers/Docs/public'

/** Explicit local implementations keep unsupported host actions visible during development. */
export function createStandaloneDocClient(
  reportUnavailable: (action: string) => void,
  subscribeToAwarenessStates: DocsComments['subscribeToAwarenessStates'],
): DocsComments {
  const unavailableMutation = async (action: string) => {
    reportUnavailable(action)
    return false
  }

  return {
    getTypersExcludingSelf: async () => [],
    createComment: async () => {
      reportUnavailable('create comment')
      return undefined
    },
    beganTypingInThread: async () => {},
    stoppedTypingInThread: async () => {},
    editComment: () => unavailableMutation('edit comment'),
    deleteComment: () => unavailableMutation('delete comment'),
    getAllThreads: async () => [],
    createCommentThread: async () => {
      reportUnavailable('create comment thread')
      return undefined
    },
    createSuggestionThread: async () => {
      reportUnavailable('create suggestion')
      return undefined
    },
    resolveThread: () => unavailableMutation('resolve comment thread'),
    unresolveThread: () => unavailableMutation('reopen comment thread'),
    acceptSuggestion: () => unavailableMutation('accept suggestion'),
    rejectSuggestion: () => unavailableMutation('reject suggestion'),
    reopenSuggestion: () => unavailableMutation('reopen suggestion'),
    deleteThread: () => unavailableMutation('delete comment thread'),
    markThreadAsRead: async () => {},
    subscribeToEvents: () => () => {},
    subscribeToAwarenessStates,
  }
}
