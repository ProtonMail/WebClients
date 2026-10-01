import { isDevOrBlack } from '@proton/shared/lib/env'
import type { PropsWithChildren } from 'react'
import { useMemo, useCallback } from 'react'

import { DocsDependenciesProvider, type DocsDependencies, type DocsLogger } from '../../Docs/public'
import type { EditorRequiresClientMethods, SuggestionSummaryType } from '@proton/docs-shared'
import { reportErrorToSentry } from '../../../Utils/errorMessage'
import type { TelemetryDocsEditorEvents } from '@proton/shared/lib/api/telemetry'
import { useApplication } from '../../ApplicationProvider'

/**
 * Collects the Docs dependencies supplied by the Docs shell and provides them
 * to the standalone Docs editor.
 */
export function DocsAdapter({
  children,
  clientInvoker,
}: PropsWithChildren<{
  clientInvoker: EditorRequiresClientMethods
}>) {
  const { application } = useApplication()
  const logger: DocsLogger = application.logger
  const reportError = useCallback<DocsDependencies['reportError']>((error, extra) => {
    reportErrorToSentry(error, undefined, extra)
  }, [])
  const openLink = useCallback(
    (url: string) => {
      void clientInvoker.openLink(url).catch(reportError)
    },
    [clientInvoker, reportError],
  )

  const showGenericAlertModal = useCallback(
    (message: string) => {
      clientInvoker.showGenericAlertModal(message)
    },
    [clientInvoker],
  )

  const createSuggestionThread = useCallback(
    (suggestionID: string, commentContent: string, suggestionType: SuggestionSummaryType) =>
      clientInvoker.createSuggestionThread(suggestionID, commentContent, suggestionType),
    [clientInvoker],
  )
  const getAllThreads = useCallback(() => clientInvoker.getAllThreads(), [clientInvoker])
  const reopenSuggestion = useCallback((threadId: string) => clientInvoker.reopenSuggestion(threadId), [clientInvoker])
  const rejectSuggestion = useCallback(
    (threadId: string, summary?: string) => clientInvoker.rejectSuggestion(threadId, summary),
    [clientInvoker],
  )

  const getDocumentUrl = useCallback(() => clientInvoker.getDocumentUrl(), [clientInvoker])
  const replaceDocumentUrl = useCallback((url: string) => clientInvoker.replaceDocumentUrl(url), [clientInvoker])
  const reportTelemetry = useCallback(
    (event: TelemetryDocsEditorEvents) => {
      void clientInvoker.editorReportingTelemetry(event)
    },
    [clientInvoker],
  )

  const dependencies = useMemo<DocsDependencies>(
    () => ({
      reportError,
      logger,
      isDevOrBlack,
      openLink,
      showGenericAlertModal,
      createSuggestionThread,
      getAllThreads,
      reopenSuggestion,
      rejectSuggestion,
      getDocumentUrl,
      replaceDocumentUrl,
      reportTelemetry,
    }),
    [
      reportError,
      logger,
      openLink,
      showGenericAlertModal,
      createSuggestionThread,
      getAllThreads,
      reopenSuggestion,
      rejectSuggestion,
      getDocumentUrl,
      replaceDocumentUrl,
      reportTelemetry,
    ],
  )

  return <DocsDependenciesProvider dependencies={dependencies}>{children}</DocsDependenciesProvider>
}
