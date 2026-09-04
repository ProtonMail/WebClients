import type { SheetsPatchesType } from '@proton/docs-core/lib/Database/SheetsDBSchema'
import type { AppPlatform, FileMenuAction, SheetImportData, SheetsUserState } from '@proton/docs-shared'
import type { SheetsActionType } from '@proton/docs-shared/lib/SheetsActionType'
import type { FeatureFlag } from '@proton/unleash/Flags'
import type { LoggerInterface } from '@proton/shared/lib/logs'
import type { PropsWithChildren } from 'react'
import { createContext, useContext } from 'react'

type SheetsLogger = Pick<LoggerInterface, 'info' | 'warn' | 'error'>

/** Shell→editor: the shell pushes work or events into the editor. */
export type SheetsShellToEditorActions = {
  subscribeToSheetImport: (callback: (data: SheetImportData) => void) => () => void
  subscribeToCollaboratorCursorNavigation: (callback: (userState: SheetsUserState) => void) => () => void
}

/** Editor→shell: the editor asks the shell to perform a side effect. */
export type SheetsEditorToShellActions = {
  isFeatureFlagEnabled: (featureFlag: FeatureFlag) => Promise<boolean>
  openLink: (url: string) => Promise<void>
  handleFileMenuAction: (action: FileMenuAction) => Promise<void>
  storeSpreadsheetAction: (type: SheetsActionType, content: unknown) => void
  storeSpreadsheetPatches: (patches: unknown, updateHash: string, type?: SheetsPatchesType) => void
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
  reportSheetsYjsDriftDetected: (reason: 'local-differs-from-yjs' | 'local-change-not-observed-by-yjs') => void
  showYjsDriftDetectedErrorModal: (driftLogDetails: Record<string, unknown>) => void
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
  appPlatform: AppPlatform | null
  theme: 'light' | 'dark'
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
