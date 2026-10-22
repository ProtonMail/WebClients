import type { EditorRequiresClientMethods } from '@proton/docs-shared/Bridge/EditorRequiresClientMethods'
import type { CommentMarkNodeChangeData } from '@proton/docs-shared/CommentsEvent'
import type { DocsAwarenessStateChangeData } from '@proton/docs-shared/DocAwarenessEvent'
import type { InternalEventBusInterface } from '@proton/docs-shared/Events/InternalEventBusInterface'
import type { LiveCommentsTypeStatusChangeData } from '@proton/docs-shared/LiveCommentsEvent'
import { CommentsEvent } from '@proton/docs-shared/CommentsEvent'
import { DocAwarenessEvent } from '@proton/docs-shared/DocAwarenessEvent'
import { LiveCommentsEvent } from '@proton/docs-shared/LiveCommentsEvent'
import { mergeRegister } from '@lexical/utils'
import type { DocsComments } from '../../Docs/public'

/** Host bridge and event enums terminate at the adapter boundary. */
export function createDocsCommentsService(
  client: EditorRequiresClientMethods,
  eventBus: InternalEventBusInterface,
): DocsComments {
  return {
    getAllThreads: () => client.getAllThreads(),
    createCommentThread: (content, markID, createMarkNode) =>
      client.createCommentThread(content, markID, createMarkNode),
    createSuggestionThread: (id, content, type) => client.createSuggestionThread(id, content, type),
    createComment: (content, threadId) => client.createComment(content, threadId),
    editComment: (threadId, commentId, content) => client.editComment(threadId, commentId, content),
    deleteComment: (threadId, commentId) => client.deleteComment(threadId, commentId),
    resolveThread: (threadId) => client.resolveThread(threadId),
    unresolveThread: (threadId) => client.unresolveThread(threadId),
    deleteThread: (threadId) => client.deleteThread(threadId),
    acceptSuggestion: (threadId, summary) => client.acceptSuggestion(threadId, summary),
    rejectSuggestion: (threadId, summary) => client.rejectSuggestion(threadId, summary),
    reopenSuggestion: (threadId) => client.reopenSuggestion(threadId),
    beganTypingInThread: (threadId) => client.beganTypingInThread(threadId),
    stoppedTypingInThread: (threadId) => client.stoppedTypingInThread(threadId),
    markThreadAsRead: (threadId) => client.markThreadAsRead(threadId),
    getTypersExcludingSelf: (threadId) => client.getTypersExcludingSelf(threadId),
    subscribeToEvents: (callback) =>
      mergeRegister(
        eventBus.addEventCallback(() => callback({ type: 'changed' }), CommentsEvent.CommentsChanged),
        eventBus.addEventCallback<CommentMarkNodeChangeData>(
          ({ markID }) => callback({ type: 'create-mark', markID }),
          CommentsEvent.CreateMarkNode,
        ),
        eventBus.addEventCallback<CommentMarkNodeChangeData>(
          ({ markID }) => callback({ type: 'remove-mark', markID }),
          CommentsEvent.RemoveMarkNode,
        ),
        eventBus.addEventCallback<CommentMarkNodeChangeData>(
          ({ markID }) => callback({ type: 'resolve-mark', markID }),
          CommentsEvent.ResolveMarkNode,
        ),
        eventBus.addEventCallback<CommentMarkNodeChangeData>(
          ({ markID }) => callback({ type: 'unresolve-mark', markID }),
          CommentsEvent.UnresolveMarkNode,
        ),
        eventBus.addEventCallback<LiveCommentsTypeStatusChangeData>(
          ({ threadId }) => callback({ type: 'typing', threadId }),
          LiveCommentsEvent.TypingStatusChange,
        ),
      ),
    subscribeToAwarenessStates: (callback) =>
      eventBus.addEventCallback<DocsAwarenessStateChangeData>(
        ({ states }) => callback(states),
        DocAwarenessEvent.AwarenessStateChange,
      ),
  }
}
