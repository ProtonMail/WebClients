import type { CreateNotificationOptions } from '@proton/app-context/notifications/interfaces'
import { DocsApiError, DocsApiErrorCode } from '@proton-docs/realtime-sdk'
import { c } from 'ttag'

/** The editor's calls that change a comment thread or a suggestion's, through `session.comments` */
export type CommentChangeCall =
  | 'createCommentThread'
  | 'createComment'
  | 'editComment'
  | 'deleteComment'
  | 'resolveThread'
  | 'unresolveThread'
  | 'deleteThread'
  | 'createSuggestionThread'
  | 'acceptSuggestion'
  | 'rejectSuggestion'
  | 'reopenSuggestion'

/** A change the user is told didn't save: a suggestion call that failed, or a waiting change refused once sent */
export type CommentChangeFailure = {
  call: CommentChangeCall
  /** The Docs API no longer has the thread, or the comment: it was deleted meanwhile */
  threadDeleted: boolean
  /**
   * What the user wrote, as plain text, when the editor no longer holds it: a new thread, a reply or an edit it had
   * taken as saved while the change waited for the connection
   */
  text?: string
}

/** A 404, or the Docs API's NotExists: what the change names is gone, as when a peer deleted the thread meanwhile */
export function isThreadGone(error: unknown): boolean {
  return error instanceof DocsApiError && (error.status === 404 || error.code === DocsApiErrorCode.NotExists)
}

/**
 * A comment's text, from the content the editor's comment composer writes: a Lexical editor state as JSON, one line
 * per paragraph. Content that isn't one, as an old plain-text comment, is its own text.
 */
export function commentTextOf(content: string): string {
  let state: unknown
  try {
    state = JSON.parse(content)
  } catch {
    return content
  }
  const root = isNode(state) && isNode(state.root) ? state.root : undefined
  if (!root || !Array.isArray(root.children)) {
    return content
  }
  return root.children.map(textOf).join('\n')
}

type LexicalNode = { type?: unknown; text?: unknown; children?: unknown; root?: unknown }

function isNode(value: unknown): value is LexicalNode {
  return typeof value === 'object' && value !== null
}

function textOf(node: unknown): string {
  if (!isNode(node)) {
    return ''
  }
  if (typeof node.text === 'string') {
    return node.text
  }
  if (node.type === 'linebreak') {
    return '\n'
  }
  return Array.isArray(node.children) ? node.children.map(textOf).join('') : ''
}

export function commentFailureMessage({ call, threadDeleted, text }: CommentChangeFailure): string {
  const message = (threadDeleted && THREAD_DELETED[call]?.()) || FAILED[call]()
  return text ? `${message}\n\n${c('Info').t`What you wrote:`}\n${text}` : message
}

const FAILED: Record<CommentChangeCall, () => string> = {
  createCommentThread: () => c('Error').t`Your comment wasn't saved.`,
  createComment: () => c('Error').t`Your reply wasn't saved.`,
  editComment: () => c('Error').t`Your edit to a comment wasn't saved.`,
  deleteComment: () => c('Error').t`The comment wasn't deleted.`,
  resolveThread: () => c('Error').t`The comment thread wasn't resolved.`,
  unresolveThread: () => c('Error').t`The comment thread wasn't reopened.`,
  deleteThread: () => c('Error').t`The comment thread wasn't deleted.`,
  createSuggestionThread: () => c('Error').t`Your suggestion wasn't saved, so no one can accept or reject it.`,
  acceptSuggestion: () => c('Error').t`The suggestion wasn't accepted.`,
  rejectSuggestion: () => c('Error').t`The suggestion wasn't rejected.`,
  reopenSuggestion: () => c('Error').t`The suggestion wasn't restored.`,
}

/** A delete of what is already gone has nothing to say; a new thread names no thread that could be */
const THREAD_DELETED: Partial<Record<CommentChangeCall, () => string>> = {
  createComment: () => c('Error').t`Your reply wasn't saved: the comment thread was deleted.`,
  editComment: () => c('Error').t`Your edit wasn't saved: the comment or its thread was deleted.`,
  resolveThread: () => c('Error').t`The comment thread wasn't resolved: it was deleted.`,
  unresolveThread: () => c('Error').t`The comment thread wasn't reopened: it was deleted.`,
  acceptSuggestion: () => c('Error').t`The suggestion wasn't accepted: its thread was deleted.`,
  rejectSuggestion: () => c('Error').t`The suggestion wasn't rejected: its thread was deleted.`,
  reopenSuggestion: () => c('Error').t`The suggestion wasn't restored: its thread was deleted.`,
}

/**
 * Tells the user of a change that didn't save, with an error notification. One holding what they wrote stays until
 * closed, so they can copy it. A delete refused because what it deletes is gone did what was asked, and says nothing.
 */
export function notifyCommentChangeFailure(
  createNotification: (options: CreateNotificationOptions) => unknown,
  failure: CommentChangeFailure,
): void {
  if (failure.threadDeleted && (failure.call === 'deleteComment' || failure.call === 'deleteThread')) {
    return
  }
  createNotification({
    type: 'error',
    // A node, not a string: the notification parses a string as HTML, which would change what the user wrote
    text: <span className="text-pre-wrap">{commentFailureMessage(failure)}</span>,
    ...(failure.text && { expiration: -1, showCloseButton: true }),
  })
}
