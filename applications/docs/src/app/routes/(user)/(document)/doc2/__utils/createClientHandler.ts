import type {
  EditorRequiresClientMethods,
  FileMenuAction,
} from '@proton/docs-shared/Bridge/EditorRequiresClientMethods'
import { EventTypeEnum } from '@proton/docs-proto/Event/EventTypeEnum'
import { EditorEvent } from '@proton/docs-shared/Bridge/EditorEvent'
import type { WordCountInfoCollection } from '@proton/docs-shared/WordCount/WordCountTypes'
import type { LoggerInterface } from '@proton/shared/lib/logs'
import type { FeatureFlag } from '@proton/unleash/Flags'
import type { SessionComments } from '@proton-docs/realtime-sdk'
import { c } from 'ttag'

import { toEditorComment, toEditorThread } from './comments/editorComments'
import { isRunningInNativeMobileWeb } from './isRunningInNativeMobileWeb'

export type ClientHandler = EditorRequiresClientMethods

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
  logger: LoggerInterface
}

/**
 * Answers every call from the editor for a text document. Adapted from
 * `packages/docs-core/lib/Bridge/EditorToClientRequestHandler.ts`, which doc2 must not import.
 * The editor never times out a call to the client, so each one gets a reply: a comment call that fails, or that comes
 * with no comments, answers as one that failed. The suggestion calls change nothing and answer as if there were none.
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
      answerCommentCall(
        'createCommentThread',
        async (comments) => toEditorThread(await comments.createThread({ content, markId, createMark })),
        undefined,
      ),
    createComment: (content, threadId) =>
      answerCommentCall(
        'createComment',
        async (comments) => toEditorComment(await comments.reply(threadId, content)),
        undefined,
      ),
    editComment: (threadId, commentId, content) =>
      answerCommentCall(
        'editComment',
        (comments) => succeeds(comments.editComment(threadId, commentId, content)),
        false,
      ),
    deleteComment: (threadId, commentId) =>
      answerCommentCall('deleteComment', (comments) => succeeds(comments.deleteComment(threadId, commentId)), false),
    resolveThread: (threadId) =>
      answerCommentCall('resolveThread', (comments) => succeeds(comments.resolveThread(threadId)), false),
    unresolveThread: (threadId) =>
      answerCommentCall('unresolveThread', (comments) => succeeds(comments.unresolveThread(threadId)), false),
    deleteThread: (threadId) =>
      answerCommentCall('deleteThread', (comments) => succeeds(comments.deleteThread(threadId)), false),
    markThreadAsRead: (threadId) =>
      answerCommentCall('markThreadAsRead', (comments) => comments.markThreadAsRead(threadId), undefined),
    beganTypingInThread: (threadId) =>
      answerCommentCall('beganTypingInThread', (comments) => comments.setTyping(threadId, true), undefined),
    stoppedTypingInThread: (threadId) =>
      answerCommentCall('stoppedTypingInThread', (comments) => comments.setTyping(threadId, false), undefined),
    // Suggesting stays off in doc2's editor
    createSuggestionThread: async () => undefined,
    acceptSuggestion: async () => false,
    rejectSuggestion: async () => false,
    reopenSuggestion: async () => false,

    openLink: async (url) => {
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
