import type { RecentDocumentsItem } from '@proton/docs-core'
import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useRef, useState } from 'react'

// NOTE: taken from packages/drive-store/components/FileBrowser/hooks/useContextMenuControls.ts
const DROPDOWN_ANIMATION_TIME = 200 // ms
function useContextMenuControls() {
  const lastCloseTime = useRef<number>()
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<{ top: number; left: number }>()

  // NOTE: this was copied verbatim - is it necessary here at all?
  const open = useCallback(() => {
    // Quick hack.
    // Dropdown does not recompute the height right away and if the context
    // menu is opened quickly with another content, scrollbar or empty space
    // is displayed.
    // The better solution would be to not count the new height at the end
    // of the animation but sooner. That is tricky and can affect all apps.
    // Please find better solution once you are around.
    const delay = !lastCloseTime.current ? 0 : DROPDOWN_ANIMATION_TIME - (Date.now() - lastCloseTime.current)
    setTimeout(() => setIsOpen(true), Math.max(delay, 0))
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setPosition(undefined)
    lastCloseTime.current = Date.now()
  }, [])

  const handleContextMenu = (e: React.MouseEvent<Element>) => {
    e.stopPropagation()
    e.preventDefault()

    setPosition({ top: e.clientY, left: e.clientX })
  }

  const handleContextMenuTouch = (e: React.TouchEvent<Element>) => {
    e.stopPropagation()
    e.preventDefault()

    const touchPosition = e.changedTouches[e.changedTouches.length - 1]
    setPosition({ top: touchPosition.clientY, left: touchPosition.clientX })
  }

  const value = {
    isOpen,
    handleContextMenu,
    handleContextMenuTouch,
    open,
    close,
    position,
  }

  return value
}

type Controls = ReturnType<typeof useContextMenuControls>

export type ContextMenuContextValue = Controls & {
  currentDocument: RecentDocumentsItem | undefined
  setCurrentDocument: (value: RecentDocumentsItem) => void
}

const ContextMenuContext = createContext<ContextMenuContextValue | undefined>(undefined)

export function ContextMenuProvider({ children }: { children: ReactNode }) {
  const [currentDocument, setCurrentDocument] = useState<RecentDocumentsItem>()
  const contextMenuControls = useContextMenuControls()
  const value = { ...contextMenuControls, currentDocument, setCurrentDocument }
  return <ContextMenuContext.Provider value={value}>{children}</ContextMenuContext.Provider>
}

export function useContextMenu() {
  const value = useContext(ContextMenuContext)
  if (!value) {
    throw new Error('Missing ContextMenu context')
  }
  return value
}
