import type { LoggerInterface } from '@proton/shared/lib/logs'
import type { CommentsEvents, CommentsSnapshot, SessionComments } from '@proton-docs/realtime-sdk'

import type { EditorInvoker } from '../EditorInvoker'

type CommentsEditor = Pick<
  EditorInvoker,
  | 'handleCommentsChange'
  | 'handleTypingStatusChange'
  | 'handleCreateCommentMarkNode'
  | 'handleRemoveCommentMarkNode'
  | 'handleResolveCommentMarkNode'
  | 'handleUnresolveCommentMarkNode'
>

/**
 * Tells the editor of each change to the session's comments: new threads, which it reads again, each thread whose typers
 * changed, and each mark to create, remove, resolve or unresolve. Adapted from
 * `applications/docs/src/app/components/document/DocumentViewer/DocumentViewer.tsx`, which imports docs-core: its
 * `CommentsChanged`, typing and mark node effects. Returns the function that stops it.
 */
export function pushCommentsToEditor(
  comments: Pick<SessionComments, 'getSnapshot' | 'subscribe' | 'on'>,
  editor: CommentsEditor,
  logger: LoggerInterface,
): () => void {
  const warn = (error: Error) => logger.warn('Failed to tell the editor of a comments change', error)
  let previous = comments.getSnapshot()

  const stopSnapshots = comments.subscribe((snapshot) => {
    // Typing alone leaves the threads as they were
    if (snapshot.threads !== previous.threads) {
      editor.handleCommentsChange().catch(warn)
    }
    for (const threadId of threadsWhoseTypersChanged(previous, snapshot)) {
      editor.handleTypingStatusChange(threadId).catch(warn)
    }
    previous = snapshot
  })
  const stopMarks = comments.on('markChange', ({ kind, markId }: CommentsEvents['markChange']) => {
    const push = {
      create: () => editor.handleCreateCommentMarkNode(markId),
      remove: () => editor.handleRemoveCommentMarkNode(markId),
      resolve: () => editor.handleResolveCommentMarkNode(markId),
      unresolve: () => editor.handleUnresolveCommentMarkNode(markId),
    }[kind]
    push().catch(warn)
  })
  return () => {
    stopSnapshots()
    stopMarks()
  }
}

function threadsWhoseTypersChanged(before: CommentsSnapshot, after: CommentsSnapshot): string[] {
  const threadIds = new Set([...Object.keys(before.typers), ...Object.keys(after.typers)])
  return [...threadIds].filter(
    (threadId) => (before.typers[threadId] ?? []).join('\n') !== (after.typers[threadId] ?? []).join('\n'),
  )
}
