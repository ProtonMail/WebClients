import { useNotifications } from '@proton/app-context/useNotifications'
import { SheetsPatchesType as StoredSheetsPatchesType } from '@proton/docs-core/lib/Database/SheetsDBSchema'
import type { EditorRequiresClientMethods, SheetImportData } from '@proton/docs-shared'
import { SheetImportDestination, SheetImportEvent } from '@proton/docs-shared'
import { isDevOrBlack } from '@proton/shared/lib/env'
import type { PropsWithChildren } from 'react'
import { useMemo } from 'react'

import { useSyncedState } from '../../Hooks/useSyncedState'
import { reportErrorToSentry } from '../../Utils/errorMessage'
import { useApplication } from '../ApplicationProvider'
import { useEditorTheme } from '../../Theme/EditorThemeProvider'
import {
  SheetsDependenciesProvider,
  type SheetsPatchCategory,
  type SheetsDependencies,
  type SheetsEditorToShellActions,
  type SheetsLogger,
  type SheetsSession,
  type SheetsShellToEditorActions,
  type SpreadsheetImportDestination,
  type SpreadsheetImportRequest,
} from '../Spreadsheet/public'
import { useResolvedAppPlatform } from './useResolvedAppPlatform'
import { createSheetsFileMenuActions } from './createSheetsFileMenuActions'
import { toCollaboratorCursorNavigationDestination } from './collaboratorCursorNavigationAdapter'
import { useSheetsFeatureFlags } from './useSheetsFeatureFlags'

type SheetsAdapterProps = PropsWithChildren<{
  clientInvoker: EditorRequiresClientMethods
}>

const storedSheetsPatchesTypes = {
  Base: StoredSheetsPatchesType.Base,
  Delta: StoredSheetsPatchesType.Delta,
  Drifted: StoredSheetsPatchesType.Drifted,
} satisfies Record<SheetsPatchCategory, StoredSheetsPatchesType>

function toStoredSheetsPatchesType(type: SheetsPatchCategory | undefined): StoredSheetsPatchesType | undefined {
  return type === undefined ? undefined : storedSheetsPatchesTypes[type]
}

/**
 * Docs host glue that collects SheetsDependencies and provides them to the sheets editor.
 */
export function SheetsAdapter({ children, clientInvoker }: SheetsAdapterProps) {
  const { createNotification } = useNotifications()
  const { application } = useApplication()
  const { theme } = useEditorTheme()
  const appPlatform = useResolvedAppPlatform(clientInvoker)
  const featureFlags = useSheetsFeatureFlags(clientInvoker)

  const { userName, receivedEverythingFromRTS } = useSyncedState()
  const role = application.getRole()
  const canEdit = role.canEdit()
  const canTrash = role.canTrash()
  const logger: SheetsLogger = application.logger

  const shellToEditorActions = useMemo<SheetsShellToEditorActions>(
    () => ({
      subscribeToSheetImport: (callback) =>
        application.eventBus.addEventCallback<SheetImportData>((data) => {
          const destinations: Record<SheetImportDestination, SpreadsheetImportDestination> = {
            [SheetImportDestination.InsertAsNewSheet]: 'insert-as-new-sheet',
            [SheetImportDestination.ReplaceAtSelectedCell]: 'replace-at-selected-cell',
            [SheetImportDestination.ReplaceCurrentSheet]: 'replace-current-sheet',
            [SheetImportDestination.ReplaceSpreadsheet]: 'replace-spreadsheet',
          }
          const request: SpreadsheetImportRequest = {
            file: data.file,
            shouldConvertCellContents: data.shouldConvertCellContents,
            destination: destinations[data.destination],
          }
          callback(request)
        }, SheetImportEvent),
      subscribeToCollaboratorCursorNavigation: (callback) =>
        application.syncedState.subscribeToEvent('ScrollToUserCursorData', (data) => {
          const destination = toCollaboratorCursorNavigationDestination(data.state)
          if (destination) {
            callback(destination)
          }
        }),
    }),
    [application.eventBus, application.syncedState],
  )

  const editorToShellActions = useMemo<SheetsEditorToShellActions>(
    () => ({
      openLink: (url) => clientInvoker.openLink(url),
      fileMenuActions: createSheetsFileMenuActions(clientInvoker),
      storeSpreadsheetAction: (type, content) => {
        void clientInvoker.storeSpreadsheetAction(type, content).catch(console.error)
      },
      storeSpreadsheetPatches: (patches, updateHash, type) => {
        void clientInvoker
          .storeSpreadsheetPatches(patches, updateHash, toStoredSheetsPatchesType(type))
          .catch(console.error)
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
      logger,
      appPlatform,
      theme,
      featureFlags,
    }),
    [
      appPlatform,
      application.appVersion,
      application.environment,
      canEdit,
      canTrash,
      logger,
      theme,
      featureFlags,
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
