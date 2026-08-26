import type { FileMenuAction } from '@proton/docs-shared'
import type { FeatureFlag } from '@proton/unleash/Flags'
import type { LoggerInterface } from '@proton/utils/logs'
import type { PropsWithChildren } from 'react'
import { createContext, useContext } from 'react'

export type SheetsLogger = Pick<LoggerInterface, 'info' | 'warn' | 'error'>

export type SheetsDependencies = {
  isDevOrBlack: () => boolean
  canEdit: boolean
  canTrash: boolean
  isFeatureFlagEnabled: (featureFlag: FeatureFlag) => Promise<boolean>
  versionInfo: {
    environment: 'alpha' | 'beta' | undefined
    version: string
  }
  logger: SheetsLogger
  showNotification: (notification: { text: string; type?: 'error' | 'warning' | 'info' | 'success' }) => void
  // Dependencies that use the clientInvoker
  openLink: (url: string) => void
  handleFileMenuAction: (action: FileMenuAction) => Promise<void>
}

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
