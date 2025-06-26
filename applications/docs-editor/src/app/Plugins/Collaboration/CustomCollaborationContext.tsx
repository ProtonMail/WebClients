import { CollaborationContext, type CollaborationContextType } from '@lexical/react/LexicalCollaborationContext'
import { createContext, useContext } from 'react'
import type { UndoManager } from 'yjs'

export interface CustomCollaborationContextType extends CollaborationContextType {
  undoManager: UndoManager | null
}

export const CustomCollaborationContext = createContext<CustomCollaborationContextType>({
  clientID: 0,
  color: '',
  isCollabActive: false,
  name: '',
  yjsDocMap: new Map(),
  undoManager: null,
})

export function useCustomCollaborationContext(): CustomCollaborationContextType {
  const context = useContext(CustomCollaborationContext)
  if (!context) {
    throw new Error('useCustomCollaborationContext must be used within a CustomCollaborationContext.Provider')
  }
  return context
}

/**
 * Wrapper around the Lexical CollaborationContextProvider to add undoManager
 * to the context. The wrapping is necessary because some stuff depends on
 * the original which we don't want to change right now.
 */
export function CustomCollaborationContextProvider({
  value,
  children,
}: {
  value: CustomCollaborationContextType
  children: React.ReactNode
}) {
  return (
    <CustomCollaborationContext.Provider value={value}>
      <CollaborationContext.Provider value={value}>{children}</CollaborationContext.Provider>
    </CustomCollaborationContext.Provider>
  )
}
