import { createContext, useContext } from 'react'
import type { PropsWithChildren } from 'react'
import type { EditorUserMode } from './contract/EditorUserMode'

const DocsUserModeContext = createContext<EditorUserMode | undefined>(undefined)

/** Controlled by the embedding editor; descendants never read the host's store. */
export function DocsPresentationProvider({ children, userMode }: PropsWithChildren<{ userMode: EditorUserMode }>) {
  return <DocsUserModeContext.Provider value={userMode}>{children}</DocsUserModeContext.Provider>
}

export function useDocsUserMode(): EditorUserMode {
  const userMode = useContext(DocsUserModeContext)
  if (userMode === undefined) {
    throw new Error('DocsPresentationProvider is missing')
  }
  return userMode
}
