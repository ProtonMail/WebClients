import ContextMenu from '@proton/components/components/contextMenu/ContextMenu'
import ContextSeparator from '@proton/components/components/contextMenu/ContextSeparator'
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils'
import type { ReactNode } from 'react'
import { useEffect } from 'react'

import { OpenButton } from './buttons/OpenButton'
import type { RecentDocumentsItem } from '@proton/docs-core/Services/recent-documents'
import type { ContextMenuProps } from '@proton/components/components/contextMenu/ContextMenu'
import { OpenFolderButton } from './buttons/OpenFolderButton'
import { ShareButton } from './buttons/ShareButton'
import { MoveToTrashButton } from './buttons/MoveToTrashButton'
import { MoveButton } from './buttons/MoveButton'
import { RenameButton } from './buttons/RenameButton'
import { useDocumentActions } from '../../documentActionsContext'
import { useEvent } from '../../utils/useEvent'
import { useHomepageView } from '../../homepageViewContext'
import { RestoreFromTrashButton } from './buttons/RestoreFromTrash'
import { DeletePermanentlyButton } from './buttons/DeletePermanently'
import type { MemberRole } from '@protontech/drive-sdk'
import { IcArrowsCross } from '@proton/icons/icons/IcArrowsCross'
import { IcTrash } from '@proton/icons/icons/IcTrash'
import { c } from 'ttag'
import { ContextMenuButton } from './ContextMenuButton'

type SelectionActions = { move?: () => void; trash: () => void; disabled: boolean }

export type DocContextMenuProps = Omit<ContextMenuProps, 'children'> & {
  currentDocument: RecentDocumentsItem | undefined
  /** Replaces the document's actions when the menu acts on the whole selection. */
  selectionActions?: SelectionActions
  // NOTE: copied from packages/drive-store/components/sections/ContextMenu/ItemContextMenu.tsx
  // Unsure why it's necessary if the base ContextMenu doesn't take this prop. Its purpose may
  // be related to the effect below.
  open: () => void
}

export function DocContextMenu({
  anchorRef,
  isOpen,
  position,
  open,
  close,
  currentDocument,
  selectionActions,
}: DocContextMenuProps) {
  // NOTE: this effect was copied from packages/drive-store/components/sections/ContextMenu/ItemContextMenu.tsx
  // I'm not actually sure it's necessary here, but I'm leaving it in for now just in case.
  // Only a new position should reopen the menu, so `isOpen`, `open` and `close` are read through
  // `useEvent` instead of being dependencies: `isOpen` changes on every open and close.
  const reopen = useEvent(() => {
    // Close event doesn't fire on mobile when clicking on another context menu target.
    // Unless menu is manually closed, it retains its position.
    if (isOpen) {
      close()
    }
    open()
  })
  const top = position?.top
  const left = position?.left
  useEffect(() => {
    if (top !== undefined && left !== undefined) {
      reopen()
    }
  }, [top, left, reopen])

  const {
    updateRecentDocuments,
    state: { view },
  } = useHomepageView()
  const isTrash = view === 'trash'

  const documentActions = useDocumentActions()
  const trashedListener = useEvent((id: string) => {
    if (currentDocument?.uniqueId() === id) {
      close()
    }
    // TODO (after SDK is fully rolled-out): use optimistic update, do not reload everything
    void updateRecentDocuments()
  })
  useEffect(() => {
    return documentActions.subscribeToTrashed(trashedListener)
  }, [documentActions, trashedListener])

  const restoredListener = useEvent((id: string) => {
    if (currentDocument?.uniqueId() === id) {
      close()
    }
    // TODO (after SDK is fully rolled-out): use optimistic update, do not reload everything
    void updateRecentDocuments()
  })
  useEffect(() => {
    return documentActions.subscribeToRestored(restoredListener)
  }, [documentActions, restoredListener])

  if (!currentDocument) {
    return null
  }

  let menuItems: ReactNode
  if (selectionActions) {
    menuItems = <SelectionMenuItems actions={selectionActions} close={close} />
  } else if (isTrash) {
    menuItems = <TrashedDocumentMenuItems currentDocument={currentDocument} close={close} />
  } else {
    menuItems = <DocumentMenuItems currentDocument={currentDocument} close={close} />
  }

  return (
    <>
      <ContextMenu
        isOpen={isOpen}
        close={close}
        position={position}
        size={{ maxHeight: DropdownSizeUnit.Viewport, maxWidth: DropdownSizeUnit.Viewport }}
        anchorRef={anchorRef}
      >
        {menuItems}
      </ContextMenu>
    </>
  )
}

type DocumentMenuItemsProps = { currentDocument: RecentDocumentsItem; close: () => void }

function DocumentMenuItems({ currentDocument, close }: DocumentMenuItemsProps) {
  const separator = <ContextSeparator className="my-1" />

  return (
    <>
      <OpenButton currentDocument={currentDocument} close={close} />
      {canShare(currentDocument) ? <ShareButton currentDocument={currentDocument} close={close} /> : null}
      {separator}
      <MoveButton currentDocument={currentDocument} close={close} />
      <OpenFolderButton currentDocument={currentDocument} close={close} />
      <RenameButton currentDocument={currentDocument} close={close} />
      {canTrash(currentDocument) ? (
        <>
          {separator}
          <MoveToTrashButton currentDocument={currentDocument} />
        </>
      ) : null}
    </>
  )
}

function TrashedDocumentMenuItems({ currentDocument, close }: DocumentMenuItemsProps) {
  return (
    <>
      <RestoreFromTrashButton currentDocument={currentDocument} />
      <DeletePermanentlyButton currentDocument={currentDocument} close={close} />
    </>
  )
}

type SelectionMenuItemsProps = { actions: SelectionActions; close: () => void }

function SelectionMenuItems({ actions: { move, trash, disabled }, close }: SelectionMenuItemsProps) {
  return (
    <>
      {move ? (
        <>
          <ContextMenuButton
            name={c('Action').t`Move`}
            icon={<IcArrowsCross className="mr-2" />}
            action={move}
            close={close}
            disabled={disabled}
          />
          <ContextSeparator className="my-1" />
        </>
      ) : null}
      <ContextMenuButton
        name={c('Action').t`Move to trash`}
        icon={<IcTrash className="mr-2" />}
        action={trash}
        close={close}
        disabled={disabled}
      />
    </>
  )
}

function canShare(document: RecentDocumentsItem) {
  return isAdmin(document.effectiveRole)
}

export function canTrash(document: RecentDocumentsItem) {
  return isAdmin(document.effectiveRole)
}

// `MemberRole` is imported as type only, so the Drive SDK isn't loaded at runtime.
function isAdmin(role: `${MemberRole}` | undefined) {
  return role === 'admin'
}
