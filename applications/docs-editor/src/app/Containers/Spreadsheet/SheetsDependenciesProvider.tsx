import type { FeatureFlag } from '@proton/unleash/Flags'
import type { PropsWithChildren } from 'react'
import { createContext, useContext } from 'react'

export type SheetsDependencies = {
  isDevOrBlack: () => boolean
  canEdit: boolean
  canTrash: boolean
  isFeatureFlagEnabled: (featureFlag: FeatureFlag) => Promise<boolean>
  versionInfo: {
    environment: 'alpha' | 'beta' | undefined
    version: string
  }
  showNotification: (notification: { text: string; type?: 'error' | 'warning' | 'info' | 'success' }) => void
  // Dependencies that use the clientInvoker
  openLink: (url: string) => void
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
