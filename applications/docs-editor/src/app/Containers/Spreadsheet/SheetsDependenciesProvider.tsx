import type { PropsWithChildren } from 'react'
import { createContext, useContext } from 'react'

export type SheetsDependencies = {
  isDevOrBlack: () => boolean
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
