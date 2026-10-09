import { isDevOrBlack } from '@proton/shared/lib/env'
import { useNotifications } from '@proton/app-context/useNotifications'
import { useGenericAlertModal } from '@proton/docs-shared/components/GenericAlert'
import type { PropsWithChildren } from 'react'
import { useMemo, useCallback, useEffect, useState } from 'react'

import {
  DocsDependenciesProvider,
  type DocsDependencies,
  type DocsLogger,
  type SuggestionSummaryType,
} from '../../Docs/public'
import type { EditorRequiresClientMethods } from '@proton/docs-shared'
import { EditorEvent } from '@proton/docs-shared'
import { reportErrorToSentry } from '../../../Utils/errorMessage'
import type { TelemetryDocsEditorEvents } from '@proton/shared/lib/api/telemetry'
import { useApplication } from '../../ApplicationProvider'
import { useSyncedState } from '../../../Hooks/useSyncedState'
import { useContactEmails } from '../../../Hooks/useContactEmails'
import { createDocsCommentsService } from './create-docs-comments-service'

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
  const { userName, suggestionsEnabled } = useSyncedState()
  const { displayNameForEmail } = useContactEmails()
  const role = application.getRole()
  const canEdit = role.canEdit()
  const canComment = role.canComment()
  const [languageCode, setLanguageCode] = useState(application.languageCode)
  useEffect(() => application.subscribeToLocale(setLanguageCode), [application])
  const comments = useMemo(
    () => createDocsCommentsService(clientInvoker, application.eventBus),
    [clientInvoker, application.eventBus],
  )
  const { createNotification } = useNotifications()
  const [alertModal, showAlertModal] = useGenericAlertModal()
  const isAlpha = application.environment === 'alpha' || isDevOrBlack()
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
      void clientInvoker.editorReportingTelemetry(event).catch(reportError)
    },
    [clientInvoker, reportError],
  )
  const createWarningNotification = useCallback(
    (message: string) => createNotification({ text: message, type: 'warning' }),
    [createNotification],
  )
  const createInfoNotification = useCallback(
    (message: string) => createNotification({ text: message, type: 'info' }),
    [createNotification],
  )
  const showAlert = useCallback(
    (title: string, message: string) => showAlertModal({ title, translatedMessage: message }),
    [showAlertModal],
  )
  const reportToolbarInteraction = useCallback(() => {
    void clientInvoker.editorReportingEvent(EditorEvent.ToolbarClicked, undefined).catch(reportError)
  }, [clientInvoker, reportError])
  const reportWordCount = useCallback<DocsDependencies['reportWordCount']>(
    (wordCount) => {
      void clientInvoker.reportWordCount(wordCount).catch(reportError)
    },
    [clientInvoker, reportError],
  )
  const subscribeToCollaboratorCursorNavigation = useCallback<
    DocsDependencies['subscribeToCollaboratorCursorNavigation']
  >(
    (callback) => application.syncedState.subscribeToEvent('ScrollToUserCursorData', ({ state }) => callback(state)),
    [application.syncedState],
  )

  const dependencies = useMemo<DocsDependencies>(
    () => ({
      userName,
      suggestionsEnabled,
      isAlpha,
      canEdit,
      canComment,
      languageCode,
      getDisplayNameForEmail: displayNameForEmail,
      comments,
      reportError,
      logger,
      openLink,
      showGenericAlertModal,
      createWarningNotification,
      createInfoNotification,
      showAlert,
      reportToolbarInteraction,
      reportWordCount,
      subscribeToCollaboratorCursorNavigation,
      createSuggestionThread,
      getAllThreads,
      reopenSuggestion,
      rejectSuggestion,
      getDocumentUrl,
      replaceDocumentUrl,
      reportTelemetry,
    }),
    [
      userName,
      suggestionsEnabled,
      isAlpha,
      canEdit,
      canComment,
      languageCode,
      displayNameForEmail,
      comments,
      reportError,
      logger,
      openLink,
      showGenericAlertModal,
      createWarningNotification,
      createInfoNotification,
      showAlert,
      reportToolbarInteraction,
      reportWordCount,
      subscribeToCollaboratorCursorNavigation,
      createSuggestionThread,
      getAllThreads,
      reopenSuggestion,
      rejectSuggestion,
      getDocumentUrl,
      replaceDocumentUrl,
      reportTelemetry,
    ],
  )

  return (
    <DocsDependenciesProvider dependencies={dependencies}>
      {children}
      {alertModal}
    </DocsDependenciesProvider>
  )
}
