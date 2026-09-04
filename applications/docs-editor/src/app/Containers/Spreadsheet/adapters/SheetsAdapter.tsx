import { useNotifications } from '@proton/app-context/useNotifications'
import type { EditorRequiresClientMethods, SheetsUserState } from '@proton/docs-shared'
import { SheetImportEvent } from '@proton/docs-shared'
import { isDevOrBlack } from '@proton/shared/lib/env'
import type { PropsWithChildren } from 'react'
import { useMemo } from 'react'

import { useSyncedState } from '../../../Hooks/useSyncedState'
import { reportErrorToSentry } from '../../../Utils/errorMessage'
import { useApplication } from '../../ApplicationProvider'
import { useEditorTheme } from '../../../Theme/EditorThemeProvider'
import {
  SheetsDependenciesProvider,
  type SheetsDependencies,
  type SheetsEditorToShellActions,
  type SheetsSession,
  type SheetsShellToEditorActions,
} from '../SheetsDependenciesProvider'
import { useResolvedAppPlatform } from './useResolvedAppPlatform'

type SheetsAdapterProps = PropsWithChildren<{
  clientInvoker: EditorRequiresClientMethods
}>

/**
 * The glue layer that collects all the SheetsDependencies required by the sheets editor and
 * provides them to the standalone sheets editor.
 */
export function SheetsAdapter({ children, clientInvoker }: SheetsAdapterProps) {
  const { createNotification } = useNotifications()
  const { application } = useApplication()
  const { theme } = useEditorTheme()
  const appPlatform = useResolvedAppPlatform(clientInvoker)

  const { userName, receivedEverythingFromRTS } = useSyncedState()
  const role = application.getRole()
  const canEdit = role.canEdit()
  const canTrash = role.canTrash()

  const shellToEditorActions = useMemo<SheetsShellToEditorActions>(
    () => ({
      subscribeToSheetImport: (callback) => application.eventBus.addEventCallback(callback, SheetImportEvent),
      subscribeToCollaboratorCursorNavigation: (callback) =>
        application.syncedState.subscribeToEvent('ScrollToUserCursorData', (data) => {
          callback(data.state as unknown as SheetsUserState)
        }),
    }),
    [application.eventBus, application.syncedState],
  )

  const editorToShellActions = useMemo<SheetsEditorToShellActions>(
    () => ({
      isFeatureFlagEnabled: (featureFlag) => clientInvoker.checkIfFeatureFlagIsEnabled(featureFlag),
      openLink: (url) => clientInvoker.openLink(url),
      handleFileMenuAction: (action) => clientInvoker.handleFileMenuAction(action),
      storeSpreadsheetAction: (type, content) => {
        void clientInvoker.storeSpreadsheetAction(type, content).catch(console.error)
      },
      storeSpreadsheetPatches: (patches, updateHash, type) => {
        void clientInvoker.storeSpreadsheetPatches(patches, updateHash, type).catch(console.error)
      },
      hasBasePatchesStored: () => clientInvoker.hasBasePatchesStored(),
      showGenericInfoModal: (props) => {
        clientInvoker.showGenericInfoModal(props)
      },
      showNotification: (notification) => createNotification(notification),
      reloadClient: () => {
        void clientInvoker.reloadClient()
      },
      reportUserInterfaceError: (error, extraInfo) => {
        void clientInvoker.reportUserInterfaceError(error, extraInfo)
      },
      reportError: (error, extra) => {
        reportErrorToSentry(error, undefined, extra)
      },
      reportSheetsYjsDriftDetected: (reason) => {
        void clientInvoker.reportSheetsYjsDriftDetected(reason)
      },
      showYjsDriftDetectedErrorModal: (driftLogDetails) => {
        void clientInvoker.showYjsDriftDetectedErrorModal(driftLogDetails)
      },
    }),
    [clientInvoker, createNotification],
  )

  const session = useMemo<SheetsSession>(
    () => ({
      receivedEverythingFromRTS,
      userName,
      isDevOrBlack,
      canEdit,
      canTrash,
      versionInfo: {
        environment: application.environment,
        version: application.appVersion,
      },
      logger: application.logger,
      appPlatform,
      theme,
    }),
    [
      appPlatform,
      application.appVersion,
      application.environment,
      application.logger,
      canEdit,
      canTrash,
      theme,
      receivedEverythingFromRTS,
      userName,
    ],
  )

  const dependencies = useMemo<SheetsDependencies>(
    () => ({ ...shellToEditorActions, ...editorToShellActions, ...session }),
    [shellToEditorActions, editorToShellActions, session],
  )

  return <SheetsDependenciesProvider dependencies={dependencies}>{children}</SheetsDependenciesProvider>
}
