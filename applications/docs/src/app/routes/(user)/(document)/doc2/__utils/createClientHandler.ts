import type { EditorRequiresClientMethods } from '@proton/docs-shared/Bridge/EditorRequiresClientMethods'
import type { LoggerInterface } from '@proton/shared/lib/logs'
import type { FeatureFlag } from '@proton/unleash/Flags'

export type ClientHandler = EditorRequiresClientMethods

export type ClientHandlerDependencies = {
  editorFrame: HTMLIFrameElement
  isFlagEnabled: (flag: FeatureFlag) => boolean
  onEditorError: (error: Error) => void
  logger: LoggerInterface
}

type NativeMobileWindow = Window & { Android?: unknown; webkit?: { messageHandlers?: { iOS?: unknown } } }

/**
 * Answers every call from the editor for a read-only text document, after docs-core
 * `Bridge/EditorToClientRequestHandler.ts`. The editor never times out a call to the client, so each one gets a reply.
 * With no websocket, comments or editing yet, the calls for those change nothing and answer as if there were none.
 */
export function createClientHandler({
  editorFrame,
  isFlagEnabled,
  onEditorError,
  logger,
}: ClientHandlerDependencies): ClientHandler {
  return {
    // The editor renders nothing until it knows which editor package to load
    checkIfFeatureFlagIsEnabled: async (flag) => isFlagEnabled(flag),
    reportUserInterfaceError: async (error) => onEditorError(error),

    // Never sent: the document is read-only and has no websocket to send it on
    editorRequestsPropagationOfUpdate: async () => {
      logger.warn('Editor asked to propagate an update of a read-only document')
    },
    handleAwarenessStateUpdate: async () => {},

    editorReportingEvent: async () => {},
    editorReportingTelemetry: async () => {},
    reportWordCount: async () => {},
    updateFrameSize: (size) => {
      editorFrame.style.setProperty('--print-min-height', `${size}px`)
    },
    showGenericAlertModal: (message) => logger.warn('Editor alert not shown', { message }),
    showGenericInfoModal: ({ title }) => logger.warn('Editor info not shown', { title }),

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
    getAppPlatform: async () => {
      const { Android, webkit } = window as NativeMobileWindow
      return Android != null || webkit?.messageHandlers?.iOS != null ? 'nativeMobileWeb' : 'web'
    },
    fetchExternalImageAsBase64: async () => undefined,
    handleFileMenuAction: async () => {},

    // Sheets only, and doc2 opens text documents only
    storeSpreadsheetPatches: async () => {},
    storeSpreadsheetAction: async () => {},
    hasBasePatchesStored: async () => false,
    reportSheetsYjsDriftDetected: () => {},
    showYjsDriftDetectedErrorModal: () => {},
  }
}
