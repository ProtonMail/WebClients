import type { PropsWithChildren } from 'react'
import { createContext, useContext } from 'react'

export type DocsDependencies = {
  isDevOrBlack: () => boolean
  openLink: (url: string) => void
}

const DocsDependenciesContext = createContext<DocsDependencies | undefined>(undefined)

export function DocsDependenciesProvider({
  children,
  dependencies,
}: PropsWithChildren<{ dependencies: DocsDependencies }>) {
  return <DocsDependenciesContext.Provider value={dependencies}>{children}</DocsDependenciesContext.Provider>
}

export function useDocsDependencies(): DocsDependencies {
  const dependencies = useContext(DocsDependenciesContext)
  if (!dependencies) {
    throw new Error('DocsDependenciesProvider is missing')
  }
  return dependencies
}
