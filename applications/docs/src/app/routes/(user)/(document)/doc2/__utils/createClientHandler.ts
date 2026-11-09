import type {
  EditorRequiresClientMethods,
  FileMenuAction,
} from '@proton/docs-shared/Bridge/EditorRequiresClientMethods'
import type { WordCountInfoCollection } from '@proton/docs-shared/WordCount/WordCountTypes'
import type { LoggerInterface } from '@proton/shared/lib/logs'
import type { FeatureFlag } from '@proton/unleash/Flags'
import { c } from 'ttag'

import { isRunningInNativeMobileWeb } from './isRunningInNativeMobileWeb'

export type ClientHandler = EditorRequiresClientMethods

export type ClientHandlerDependencies = {
  editorFrame: HTMLIFrameElement
  /** Where the user's edits go */
  sendUpdate: (update: Uint8Array<ArrayBuffer>) => void
  isFlagEnabled: (flag: FeatureFlag) => boolean
  onEditorError: (error: Error) => void
  onWordCount: (wordCount: WordCountInfoCollection) => void
  showModal: (props: { title: string; translatedMessage: string }) => void
  onFileMenuAction: (action: FileMenuAction) => void
  logger: LoggerInterface
}

/**
 * Answers every call from the editor for a text document, after docs-core `Bridge/EditorToClientRequestHandler.ts`.
 * The editor never times out a call to the client, so each one gets a reply. With no comments or presence yet, the
 * calls for those change nothing and answer as if there were none.
 */
export function createClientHandler({
  editorFrame,
  sendUpdate,
  isFlagEnabled,
  onEditorError,
  onWordCount,
  showModal,
  onFileMenuAction,
  logger,
}: ClientHandlerDependencies): ClientHandler {
  return {
    // The editor renders nothing until it knows which editor package to load
    checkIfFeatureFlagIsEnabled: async (flag) => isFlagEnabled(flag),
    reportUserInterfaceError: async (error) => onEditorError(error),

    editorRequestsPropagationOfUpdate: async (message) => {
      // The other wrappers are presence events, which doc2 doesn't send yet, and conversions, which it never opens
      if (message.type.wrapper !== 'du') {
        logger.debug('Editor message not sent', { wrapper: message.type.wrapper })
        return
      }
      sendUpdate(message.content)
    },
    handleAwarenessStateUpdate: async () => {},

    editorReportingEvent: async () => {},
    editorReportingTelemetry: async () => {},
    reportWordCount: async (wordCount) => onWordCount(wordCount),
    updateFrameSize: (size) => {
      editorFrame.style.setProperty('--print-min-height', `${size}px`)
    },
    showGenericAlertModal: (message) =>
      showModal({ title: c('Title').t`Something went wrong`, translatedMessage: message }),
    showGenericInfoModal: (props) => showModal(props),

    getAllThreads: async () => [],
    getTypersExcludingSelf: async () => [],
    createCommentThread: async () => undefined,
    createSuggestionThread: async () => undefined,
    createComment: async () => undefined,
    editComment: async () => false,
    deleteComment: async () => false,
    resolveThread: async () => false,
    unresolveThread: async () => false,
    deleteThread: async () => false,
    acceptSuggestion: async () => false,
    rejectSuggestion: async () => false,
    reopenSuggestion: async () => false,
    markThreadAsRead: async () => {},
    beganTypingInThread: async () => {},
    stoppedTypingInThread: async () => {},

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
    fetchExternalImageAsBase64: async () => undefined,
    handleFileMenuAction: async (action) => onFileMenuAction(action),

    // Sheets only, and doc2 opens text documents only
    storeSpreadsheetPatches: async () => {},
    storeSpreadsheetAction: async () => {},
    hasBasePatchesStored: async () => false,
    reportSheetsYjsDriftDetected: () => {},
    showYjsDriftDetectedErrorModal: () => {},
  }
}
