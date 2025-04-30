import { useEffect } from 'react'

import { ContextMenu, ContextSeparator, DropdownSizeUnit } from '@proton/components'
import { OpenButton } from './buttons/OpenButton'
import type { RecentDocumentsItem } from '@proton/docs-core'
import type { ContextMenuProps } from '@proton/components/components/contextMenu/ContextMenu'
import { OpenFolderButton } from './buttons/OpenFolderButton'
import { ShareButton } from './buttons/ShareButton'
import { MoveToTrashButton } from './buttons/MoveToTrashButton'
import { MoveButton } from './buttons/MoveButton'
import { RenameButton } from './buttons/RenameButton'
import { IS_MOVE_ENABLED, IS_RENAME_ENABLED } from '../../../__utils/features'
import { useDocumentActions } from '../../../__utils/document-actions'
import { useEvent } from '~/utils/misc'

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

  const documentActions = useDocumentActions()
  const onTrashed = useEvent((id: string) => {
    if (currentDocument?.uniqueId() === id) {
      close()
    }
  })
  useEffect(() => {
    documentActions.onTrashed(onTrashed)
  }, [documentActions, onTrashed])

  if (!currentDocument) {
    return null
  }

  const separator = <ContextSeparator className="my-1" />

  return (
    <>
      <ContextMenu
        isOpen={isOpen}
        close={close}
        position={position}
        size={{ maxHeight: DropdownSizeUnit.Viewport, maxWidth: DropdownSizeUnit.Viewport }}
        anchorRef={anchorRef}
      >
        <OpenButton currentDocument={currentDocument} close={close} />
        {!currentDocument.isSharedWithMe ? <ShareButton currentDocument={currentDocument} close={close} /> : null}
        {separator}
        {IS_MOVE_ENABLED && !currentDocument.isSharedWithMe ? (
          <MoveButton currentDocument={currentDocument} close={close} />
        ) : null}
        <OpenFolderButton currentDocument={currentDocument} close={close} />
        {IS_RENAME_ENABLED && !currentDocument.isSharedWithMe ? (
          <RenameButton currentDocument={currentDocument} close={close} />
        ) : null}
        {!currentDocument.isSharedWithMe ? (
          <>
            {separator}
            <MoveToTrashButton currentDocument={currentDocument} />
          </>
        ) : null}
      </ContextMenu>
    </>
  )
}
