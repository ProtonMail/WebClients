import type { EditorRequiresClientMethods } from '@proton/docs-shared'

/** Explicit local implementations keep unsupported host actions visible during development. */
export function createStandaloneDocClient(
  reportUnavailable: (action: string) => void,
  reportError: (error: unknown, lockEditor?: boolean) => void,
): EditorRequiresClientMethods {
  const unavailable = async (action: string) => reportUnavailable(action)
  const unavailableMutation = async (action: string) => {
    reportUnavailable(action)
    return false
  }

  return {
    editorRequestsPropagationOfUpdate: async () => {},
    editorReportingEvent: async () => {},
    editorReportingTelemetry: async () => {},
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
    handleAwarenessStateUpdate: async () => {},
    openLink: async (url) => {
      window.open(url, '_blank', 'noopener,noreferrer')
    },
    reportUserInterfaceError: async (error, extra) => reportError(error, extra?.lockEditor || extra?.irrecoverable),
    reportWordCount: async () => {},
    updateFrameSize: () => {},
    showGenericAlertModal: (message) => window.alert(message),
    showGenericInfoModal: ({ title, translatedMessage }) => window.alert(`${title}\n\n${translatedMessage}`),
    fetchExternalImageAsBase64: async () => {
      reportUnavailable('fetch external image')
      return undefined
    },
    getAppPlatform: async () => 'web',
    handleFileMenuAction: (action) => unavailable(`file action: ${action.type}`),
    checkIfFeatureFlagIsEnabled: async () => false,
    reloadClient: async () => window.location.reload(),
    storeSpreadsheetPatches: () => unavailable('store spreadsheet patches'),
    storeSpreadsheetAction: () => unavailable('store spreadsheet action'),
    hasBasePatchesStored: async () => false,
    getDocumentUrl: async () => window.location.href,
    replaceDocumentUrl: async (url) => window.history.replaceState(null, '', url),
    reportSheetsYjsDriftDetected: (reason) => reportError(new Error(reason)),
    showYjsDriftDetectedErrorModal: (details) => reportError(new Error(JSON.stringify(details))),
  }
}
