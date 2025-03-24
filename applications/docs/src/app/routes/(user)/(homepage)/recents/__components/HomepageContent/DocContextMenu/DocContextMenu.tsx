import { useEffect } from 'react'

import { ContextMenu, DropdownSizeUnit } from '@proton/components'
import { OpenButton } from './buttons/OpenButton'
import type { RecentDocumentsItem } from '@proton/docs-core'
import type { ContextMenuProps } from '@proton/components/components/contextMenu/ContextMenu'
import { OpenFolder } from './buttons/OpenFolder'

export type DocContextMenuProps = Omit<ContextMenuProps, 'children'> & {
  currentDocument: RecentDocumentsItem | undefined
  // NOTE: copied from packages/drive-store/components/sections/ContextMenu/ItemContextMenu.tsx
  // Unsure why it's necessary if the base ContextMenu doesn't take this prop. Its purpose may
  // be related to the effect below.
  open: () => void
}

export function DocContextMenu({ anchorRef, isOpen, position, open, close, currentDocument }: DocContextMenuProps) {
  // NOTE: this effect was copied from packages/drive-store/components/sections/ContextMenu/ItemContextMenu.tsx
  // I'm not actually sure it's necessary here, but I'm leaving it in for now just in case.
  useEffect(() => {
    if (position) {
      // Close event doesn't fire on mobile when clicking on another context menu target.
      // Unless menu is manually closed, it retains its position.
      if (isOpen) {
        close()
      }
      open()
    }
  }, [position?.left, position?.top])

  return (
    <>
      <ContextMenu
        isOpen={isOpen}
        close={close}
        position={position}
        size={{ maxHeight: DropdownSizeUnit.Viewport, maxWidth: DropdownSizeUnit.Viewport }}
        anchorRef={anchorRef}
      >
        {currentDocument ? <OpenButton currentDocument={currentDocument} close={close} /> : null}
        {currentDocument?.parentLinkId ? <OpenFolder currentDocument={currentDocument} close={close} /> : null}
      </ContextMenu>
    </>
  )
}
