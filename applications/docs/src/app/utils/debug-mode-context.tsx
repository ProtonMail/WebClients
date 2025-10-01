import { useLocalState } from '@proton/components'
import { DOCS_DEBUG_KEY } from '@proton/docs-shared'
import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useState } from 'react'

type DebugModeContextType = {
  isDebugMode: boolean
  toggleDebugMode: () => void
}

const DebugModeContext = createContext<DebugModeContextType | undefined>(undefined)

export function useDebugMode() {
  const value = useContext(DebugModeContext)
  if (!value) {
    throw new Error('Missing DebugMode context')
  }
  return value
}

export function DebugModeProvider({ children }: { children: ReactNode }) {
  const [persistedDebug, setPersisted] = useLocalState(false, DOCS_DEBUG_KEY)
  const [isDebugMode, setIsDebugMode] = useState(() => persistedDebug)
  const toggleDebugMode = useCallback(() => {
    setIsDebugMode((prev) => !prev)
    setPersisted((prev) => !prev)
  }, [setPersisted])

  return <DebugModeContext.Provider value={{ isDebugMode, toggleDebugMode }}>{children}</DebugModeContext.Provider>
}
