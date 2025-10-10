import { createContext, useContext } from 'react'

export interface SidebarDialogStore {
  id: string
  open: boolean
  setOpen: (open: boolean) => void
}

export interface SidebarDialogContextValue {
  sidebarDialog: SidebarDialogStore
}

export const SidebarDialogContext = createContext<SidebarDialogContextValue | undefined>(undefined)

export function useSidebarDialogContext() {
  const context = useContext(SidebarDialogContext)
  if (context === undefined) {
    throw new Error('useSidebarDialogContext must be used within SidebarDialogContext.Provider')
  }

  return context
}

export type SidebarContextValue = {
  activeDialogId: string | null
  onChange: (dialog: SidebarDialogStore) => void
  closeDialog: (dialogId: string) => void
}

export const SidebarContext = createContext<SidebarContextValue | undefined>(undefined)

export function useSidebarContext() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebarContext must be used within SidebarContext.Provider')
  }

  return context
}
