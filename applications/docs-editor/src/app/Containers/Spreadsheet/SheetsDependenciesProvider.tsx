import type { SheetsActionType } from '@proton/docs-shared/lib/SheetsActionType'
import type { PropsWithChildren } from 'react'
import { createContext, useContext } from 'react'
import type { SheetsLogger } from './contract/SheetsLogger'
import type { SheetsPatchCategory } from './contract/SheetsPatch'
import type { SpreadsheetImportRequest } from './contract/SpreadsheetImportRequest'

export type SheetsExportFormat = 'xlsx' | 'ods' | 'csv' | 'tsv'

export type SheetsFileMenuActions = {
  createSpreadsheet: () => Promise<void>
  createDocument: () => Promise<void>
  import: () => Promise<void>
  makeCopy: () => Promise<void>
  moveToFolder: () => Promise<void>
  viewVersionHistory: () => Promise<void>
  moveToTrash: () => Promise<void>
  print: () => Promise<void>
  download: (format: SheetsExportFormat) => Promise<void>
  openHelp: () => Promise<void>
  viewRecentSpreadsheets: () => Promise<void>
  openProtonDrive: () => Promise<void>
  toggleDebugMode: () => Promise<void>
}

export type CollaboratorCursorNavigationDestination = {
  sheetId: number
  rowIndex: number
  columnIndex: number
}

/** Shell→editor: the shell pushes work or events into the editor. */
export type SheetsShellToEditorActions = {
  subscribeToSheetImport: (callback: (request: SpreadsheetImportRequest) => void) => () => void
  subscribeToCollaboratorCursorNavigation: (
    callback: (destination: CollaboratorCursorNavigationDestination) => void,
  ) => () => void
}

/** Editor→shell: the editor asks the shell to perform a side effect. */
export type SheetsEditorToShellActions = {
  openLink: (url: string) => Promise<void>
  fileMenuActions: SheetsFileMenuActions
  storeSpreadsheetAction: (type: SheetsActionType, content: unknown) => void
  storeSpreadsheetPatches: (patches: unknown, updateHash: string, type?: SheetsPatchCategory) => void
  hasBasePatchesStored: () => Promise<boolean>
  showNotification: (notification: { text: string; type?: 'error' | 'warning' | 'info' | 'success' }) => void
  showGenericInfoModal: (props: { title: string; translatedMessage: string }) => void
  reloadClient: () => void
  reportUserInterfaceError: (
    error: Error,
    extraInfo?: {
      irrecoverable?: boolean
      lockEditor?: boolean
    },
  ) => void
  reportError: (error: unknown, extra?: Record<string, unknown>) => void
  reportSheetsYjsDriftDetected: (reason: 'local-differs-from-yjs' | 'local-change-not-observed-by-yjs' | 'both') => void
  showYjsDriftDetectedErrorModal: (driftLogDetails: Record<string, unknown>) => void
}

export type SheetsFeatureFlags = {
  SheetsActionsStorageEnabled: boolean
  SheetsCustomDateTimeFormatEnabled: boolean
  SheetsCustomNumberFormatEnabled: boolean
  SheetsDriftDetectionEnabled: boolean
  SheetsODSExportEnabled: boolean
  SheetsPatchesStorageEnabled: boolean
  SheetsStatusBarEnabled: boolean
  SheetsTablesEnabled: boolean
}

/** Reactive shell session inputs the editor reads. */
export type SheetsSession = {
  receivedEverythingFromRTS: boolean
  userName: string
  isDevOrBlack: () => boolean
  canEdit: boolean
  canTrash: boolean
  versionInfo: {
    environment: 'alpha' | 'beta' | undefined
    version: string
  }
  logger: SheetsLogger
  appPlatform: 'web' | 'nativeMobileWeb' | null
  theme: 'light' | 'dark'
  featureFlags: SheetsFeatureFlags
}

export type SheetsDependencies = SheetsShellToEditorActions & SheetsEditorToShellActions & SheetsSession

const SheetsDependenciesContext = createContext<SheetsDependencies | undefined>(undefined)

export function SheetsDependenciesProvider({
  children,
  dependencies,
}: PropsWithChildren<{ dependencies: SheetsDependencies }>) {
  return <SheetsDependenciesContext.Provider value={dependencies}>{children}</SheetsDependenciesContext.Provider>
}

export function useSheetsDependencies(): SheetsDependencies {
  const dependencies = useContext(SheetsDependenciesContext)
  if (!dependencies) {
    throw new Error('SheetsDependenciesProvider is missing')
  }
  return dependencies
}
