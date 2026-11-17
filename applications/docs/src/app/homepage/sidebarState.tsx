import { createContext, useContext, useMemo, type PropsWithChildren } from 'react'

import { useToggle } from './utils/useToggle'

type SidebarState = {
  expanded: boolean
  toggleExpanded: () => void
  setExpanded: (expanded: boolean) => void
}

const SidebarStateContext = createContext<SidebarState | undefined>(undefined)

export function useSidebarState() {
  const value = useContext(SidebarStateContext)
  if (!value) {
    throw new Error('Sidebar state is missing from SidebarStateProvider')
  }
  return value
}

export type SidebarStateProviderProps = PropsWithChildren

export function SidebarStateProvider({ children }: SidebarStateProviderProps) {
  const { state: expanded, toggle: toggleExpanded, set: setExpanded } = useToggle()
  const value = useMemo(() => ({ expanded, toggleExpanded, setExpanded }), [expanded, setExpanded, toggleExpanded])

  return <SidebarStateContext.Provider value={value}>{children}</SidebarStateContext.Provider>
}
