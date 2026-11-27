import type {
  EditorRequiresClientMethods,
  FileMenuAction,
} from '@proton/docs-shared/Bridge/EditorRequiresClientMethods'
import { EventTypeEnum } from '@proton/docs-proto/Event/EventTypeEnum'
import { EditorEvent } from '@proton/docs-shared/Bridge/EditorEvent'
import type { WordCountInfoCollection } from '@proton/docs-shared/WordCount/WordCountTypes'
import type { LoggerInterface } from '@proton/shared/lib/logs'
import type { FeatureFlag } from '@proton/unleash/Flags'
import type { Comment, CommentThread, CommentsSnapshot, SessionComments } from '@proton-docs/realtime-sdk'
import { c } from 'ttag'

import {
  type CommentChangeCall,
  type CommentChangeFailure,
  commentTextOf,
  isThreadGone,
} from './comments/commentChangeFailures'
import { toEditorComment, toEditorThread } from './comments/editorComments'
import { isRunningInNativeMobileWeb } from './isRunningInNativeMobileWeb'

export type ClientHandler = EditorRequiresClientMethods

/**
 * Schemes a link from the editor may open: the web, and those of the links Lexical keeps in a document.
 * Mirrors `packages/docs-core/lib/Bridge/EditorToClientRequestHandler.ts`, `OPENABLE_LINK_PROTOCOLS`.
 */
const OPENABLE_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:', 'sms:'])

function canOpenLink(url: string): boolean {
  try {
    return OPENABLE_LINK_PROTOCOLS.has(new URL(url).protocol)
  } catch {
    return false
  }
}

export type ClientHandlerDependencies = {
  editorFrame: HTMLIFrameElement
  /** Where the user's edits go */
  sendUpdate: (update: Uint8Array<ArrayBuffer>) => void
  isFlagEnabled: (flag: FeatureFlag) => boolean
  onEditorError: (error: Error) => void
  onWordCount: (wordCount: WordCountInfoCollection) => void
  /** The editor reported its height, which it does only once its Lexical editor exists */
  onEditorRendered: () => void
  showModal: (props: { title: string; translatedMessage: string }) => void
  onFileMenuAction: (action: FileMenuAction) => void
  /** Where the editor's awareness broadcasts go */
  onPresenceUpdate: (update: Uint8Array<ArrayBuffer>) => void
  fetchExternalImageAsBase64: (url: string) => Promise<string | undefined>
  /** The user clicked the editor's toolbar, which a public viewer's editor reports */
  onToolbarClicked?: () => void
  /** The session's comment threads; undefined for a viewer, who has none */
  comments: SessionComments | undefined
  /** A suggestion call failed, or a change that waited for the connection was refused once sent */
  onCommentChangeFailed: (failure: CommentChangeFailure) => void
  logger: LoggerInterface
}

/**
 * Answers every call from the editor for a text document. Adapted from
 * `packages/docs-core/lib/Bridge/EditorToClientRequestHandler.ts`, which doc2 must not import.
 * The editor never times out a call to the client, so each one gets a reply: a comment call that fails, or that comes
 * with no comments, answers as one that failed.
 *
 * A comment or suggestion change made while the session isn't connected waits for the connection, and the SDK settles
 * it only once the Docs API answers (ADR-0021). The editor would hold its composer, disabled, until then, so such a
 * change answers at once, as taken, with its placeholder. If the Docs API then refuses it, the SDK undoes it, and
 * `onCommentChangeFailed` gets what the user wrote, which the editor no longer holds. A failed suggestion call goes to
 * it too: the editor has already changed the document, and says nothing.
 */
export function createClientHandler({
  editorFrame,
  sendUpdate,
  isFlagEnabled,
  onEditorError,
  onWordCount,
  onEditorRendered,
  showModal,
  onFileMenuAction,
  onPresenceUpdate,
  fetchExternalImageAsBase64,
  onToolbarClicked,
  comments,
  onCommentChangeFailed,
  logger,
}: ClientHandlerDependencies): ClientHandler {
  const answerCommentCall = async <T>(
    call: string,
    run: (comments: SessionComments) => T | Promise<T>,
    failed: T,
  ): Promise<T> => {
    try {
      if (!comments) {
        throw new Error('The session has no comments')
      }
      return await run(comments)
    } catch (error) {
      logger.error('Comment call failed', { call }, error as Error)
      return failed
    }
  }

  const commentChangeFailed = (call: CommentChangeCall, error: unknown, waited: boolean, text?: string) => {
    logger.error('Comment call failed', { call }, error as Error)
    if (waited || SUGGESTION_CALLS.has(call)) {
      onCommentChangeFailed({
        call,
        threadDeleted: isThreadGone(error),
        ...(text !== undefined && { text: commentTextOf(text) }),
      })
    }
  }

  /**
   * Runs a change, and answers once the Docs API has taken it, or, when it waits for the connection, at once with
   * `whileWaiting`'s answer, read from the snapshots before and after the call. One without an answer then, as a
   * placeholder not found, waits as the rest do. `text` is what the user wrote, for a refused change the editor took
   * as saved.
   */
  const changeComments = async <T>(
    call: CommentChangeCall,
    run: (comments: SessionComments) => Promise<T>,
    failed: T,
    options: { text?: string; whileWaiting?: (before: CommentsSnapshot, after: CommentsSnapshot) => T | undefined },
  ): Promise<T> => {
    if (!comments) {
      commentChangeFailed(call, new Error('The session has no comments'), false)
      return failed
    }
    const before = comments.getSnapshot()
    let change: Promise<T>
    try {
      change = run(comments)
    } catch (error) {
      change = Promise.reject(error)
    }
    const after = comments.getSnapshot()
    // The SDK counts a waiting change as the call starts it
    const waits = after.waitingChanges > before.waitingChanges
    const answer = waits ? options.whileWaiting?.(before, after) : undefined
    if (answer !== undefined) {
      change.catch((error) => commentChangeFailed(call, error, true, options.text))
      return answer
    }
    try {
      return await change
    } catch (error) {
      // The editor still holds what the user wrote: it keeps a composer's text when the call fails
      commentChangeFailed(call, error, waits)
      return failed
    }
  }

  return {
    // The editor renders nothing until it knows which editor package to load
    checkIfFeatureFlagIsEnabled: async (flag) => isFlagEnabled(flag),
    reportUserInterfaceError: async (error) => onEditorError(error),

    editorRequestsPropagationOfUpdate: async (message) => {
      if (message.type.wrapper === 'du') {
        sendUpdate(message.content)
      } else if (
        message.type.wrapper === 'events' &&
        message.type.eventType === EventTypeEnum.ClientIsBroadcastingItsPresenceState
      ) {
        onPresenceUpdate(message.content)
      } else {
        // Requests for the other clients' presence, which the SDK makes itself on every ready, and conversions, which
        // doc2 never opens
        logger.debug('Editor message not sent', { type: message.type })
      }
    },
    handleAwarenessStateUpdate: async () => {},

    editorReportingEvent: async (event) => {
      if (event === EditorEvent.ToolbarClicked) {
        onToolbarClicked?.()
      }
    },
    editorReportingTelemetry: async () => {},
    reportWordCount: async (wordCount) => onWordCount(wordCount),
    updateFrameSize: (size) => {
      editorFrame.style.setProperty('--print-min-height', `${size}px`)
      onEditorRendered()
    },
    showGenericAlertModal: (message) =>
      showModal({ title: c('Title').t`Something went wrong`, translatedMessage: message }),
    showGenericInfoModal: (props) => showModal(props),

    getAllThreads: async () => comments?.getSnapshot().threads.map(toEditorThread) ?? [],
    getTypersExcludingSelf: async (threadId) => [...(comments?.getSnapshot().typers[threadId] ?? [])],
    createCommentThread: (content, markId, createMark) =>
      changeComments(
        'createCommentThread',
        async (comments) => toEditorThread(await comments.createThread({ content, markId, createMark })),
        undefined,
        {
          text: content,
          whileWaiting: (before, after) => toEditorThreadOrNot(newPlaceholderThread(before, after, markId)),
        },
      ),
    createComment: (content, threadId) =>
      changeComments(
        'createComment',
        async (comments) => toEditorComment(await comments.reply(threadId, content)),
        undefined,
        {
          text: content,
          whileWaiting: (before, after) => toEditorCommentOrNot(newPlaceholderComment(before, after)),
        },
      ),
    editComment: (threadId, commentId, content) =>
      changeComments('editComment', (comments) => succeeds(comments.editComment(threadId, commentId, content)), false, {
        text: content,
        whileWaiting: () => true,
      }),
    deleteComment: (threadId, commentId) =>
      changeComments('deleteComment', (comments) => succeeds(comments.deleteComment(threadId, commentId)), false, {
        whileWaiting: () => true,
      }),
    resolveThread: (threadId) =>
      changeComments('resolveThread', (comments) => succeeds(comments.resolveThread(threadId)), false, {
        whileWaiting: () => true,
      }),
    unresolveThread: (threadId) =>
      changeComments('unresolveThread', (comments) => succeeds(comments.unresolveThread(threadId)), false, {
        whileWaiting: () => true,
      }),
    deleteThread: (threadId) =>
      changeComments('deleteThread', (comments) => succeeds(comments.deleteThread(threadId)), false, {
        whileWaiting: () => true,
      }),
    markThreadAsRead: (threadId) =>
      answerCommentCall('markThreadAsRead', (comments) => comments.markThreadAsRead(threadId), undefined),
    beganTypingInThread: (threadId) =>
      answerCommentCall('beganTypingInThread', (comments) => comments.setTyping(threadId, true), undefined),
    stoppedTypingInThread: (threadId) =>
      answerCommentCall('stoppedTypingInThread', (comments) => comments.setTyping(threadId, false), undefined),
    // `type` is only /doc's telemetry, which doc2 has none of yet
    createSuggestionThread: (suggestionId, summary) =>
      changeComments(
        'createSuggestionThread',
        async (comments) => toEditorThread(await comments.createSuggestionThread({ markId: suggestionId, summary })),
        undefined,
        { whileWaiting: (before, after) => toEditorThreadOrNot(newPlaceholderThread(before, after, suggestionId)) },
      ),
    acceptSuggestion: (threadId, summary) =>
      changeComments('acceptSuggestion', (comments) => succeeds(comments.acceptSuggestion(threadId, summary)), false, {
        whileWaiting: () => true,
      }),
    rejectSuggestion: (threadId, summary) =>
      changeComments('rejectSuggestion', (comments) => succeeds(comments.rejectSuggestion(threadId, summary)), false, {
        whileWaiting: () => true,
      }),
    reopenSuggestion: (threadId) =>
      changeComments('reopenSuggestion', (comments) => succeeds(comments.reopenSuggestion(threadId)), false, {
        whileWaiting: () => true,
      }),

    openLink: async (url) => {
      // The editor runs in a sandboxed iframe: open only the schemes above, whatever URL it sends
      if (!canOpenLink(url)) {
        return
      }
      const link = document.createElement('a')
      link.href = url
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      link.click()
      link.remove()
    },
    getDocumentUrl: async () => window.location.href,
    replaceDocumentUrl: async (url) => window.history.replaceState(null, '', url),
    reloadClient: async () => window.location.reload(),
    getAppPlatform: async () => (isRunningInNativeMobileWeb() ? 'nativeMobileWeb' : 'web'),
    fetchExternalImageAsBase64,
    handleFileMenuAction: async (action) => onFileMenuAction(action),

    // Sheets only, and doc2 opens text documents only
    storeSpreadsheetPatches: async () => {},
    storeSpreadsheetAction: async () => {},
    hasBasePatchesStored: async () => false,
    reportSheetsYjsDriftDetected: () => {},
    showYjsDriftDetectedErrorModal: () => {},
  }
}

async function succeeds(change: Promise<void>): Promise<true> {
  await change
  return true
}

const SUGGESTION_CALLS = new Set<CommentChangeCall>([
  'createSuggestionThread',
  'acceptSuggestion',
  'rejectSuggestion',
  'reopenSuggestion',
])

/** The placeholder thread the call just added, with the mark id it was given, if any */
function newPlaceholderThread(
  before: CommentsSnapshot,
  after: CommentsSnapshot,
  markId: string | undefined,
): CommentThread | undefined {
  const held = new Set(before.threads.map(({ id }) => id))
  return after.threads.find(
    (thread) => thread.isPlaceholder && !held.has(thread.id) && (markId === undefined || thread.markId === markId),
  )
}

function newPlaceholderComment(before: CommentsSnapshot, after: CommentsSnapshot): Comment | undefined {
  const held = new Set(before.threads.flatMap((thread) => thread.comments.map(({ id }) => id)))
  return after.threads
    .flatMap((thread) => thread.comments)
    .find((comment) => comment.isPlaceholder && !held.has(comment.id))
}

function toEditorThreadOrNot(thread: CommentThread | undefined) {
  return thread && toEditorThread(thread)
}

function toEditorCommentOrNot(comment: Comment | undefined) {
  return comment && toEditorComment(comment)
}
