import * as Ariakit from '@ariakit/react'
import type { ReactNode, RefObject } from 'react'
import { useEffect, useRef } from 'react'

import { OpenButton } from './buttons/OpenButton'
import type { RecentDocumentsItem } from '../../recentDocumentsItem'
import { DropdownMenu, DropdownMenuSeparator } from '../menu'
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
import type { MenuPosition } from './context'

type SelectionActions = { move?: () => void; trash: () => void; disabled: boolean }

export type DocContextMenuProps = {
  isOpen: boolean
  /** Where the menu opens: the pointer, or the "Actions" button when a key pressed it. */
  position: MenuPosition | undefined
  close: () => void
  currentDocument: RecentDocumentsItem | undefined
  /** Replaces the document's actions when the menu acts on the whole selection. */
  selectionActions?: SelectionActions
  // NOTE: copied from packages/drive-store/components/sections/ContextMenu/ItemContextMenu.tsx, for the
  // effect below that reopens the menu at a new position.
  open: () => void
}

export function DocContextMenu({
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
  const width = position?.width
  const height = position?.height
  // Kept while the menu fades out, after `close` has cleared `position`.
  const anchorRect = useRef({ x: 0, y: 0, width: 0, height: 0 })
  // Proton's dropdown gives focus back to what had it when it opened, unless a pointer closed it.
  const focusBeforeOpen = useRef<HTMLElement | null>(null)
  // Proton's dropdown focuses itself on open. Ariakit only focuses a menu on its own when a `MenuButton` opened it.
  const menuRef = useRef<HTMLDivElement>(null)
  const closedByPointer = useCloseLikeProtonContextMenu(isOpen, close, menuRef)
  useEffect(() => {
    if (top !== undefined && left !== undefined) {
      anchorRect.current = { x: left, y: top, width: width ?? 0, height: height ?? 0 }
      focusBeforeOpen.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      reopen()
    }
  }, [top, left, width, height, reopen])

  const menu = Ariakit.useMenuStore({
    open: isOpen,
    setOpen: (nextOpen) => {
      if (!nextOpen) {
        close()
      }
    },
    placement: 'bottom-start',
    focusLoop: true,
  })

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
    <Ariakit.MenuProvider store={menu}>
      <DropdownMenu
        ref={menuRef}
        initialFocus={menuRef}
        gutter={1}
        // Proton's corner placements, in its popper's fallback order from `bottom-start`.
        flip="bottom-end top-start top-end right-start right-end left-end left-start"
        getAnchorRect={() => anchorRect.current}
        finalFocus={focusBeforeOpen}
        autoFocusOnHide={() => !closedByPointer.current}
        onContextMenu={(e) => e.stopPropagation()}
        // Proton's dropdown closes on a click its items don't stop, such as on a separator.
        onClick={close}
      >
        {menuItems}
      </DropdownMenu>
    </Ariakit.MenuProvider>
  )
}

type DocumentMenuItemsProps = { currentDocument: RecentDocumentsItem; close: () => void }

function DocumentMenuItems({ currentDocument, close }: DocumentMenuItemsProps) {
  const separator = <DropdownMenuSeparator />

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
          <DropdownMenuSeparator />
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

/**
 * As Proton's `ContextMenu` (packages/components/components/contextMenu/ContextMenu.tsx) and its dropdown: any
 * right-click and any click outside the menu close it, and the dropdown's focus trap tells whether a pointer or a key
 * came last. Ariakit's own outside check skips the element focused when the menu opened, such as the row.
 */
function useCloseLikeProtonContextMenu(isOpen: boolean, close: () => void, menuRef: RefObject<HTMLElement>) {
  const closedByPointer = useRef(false)
  useEffect(() => {
    if (!isOpen) {
      return
    }
    closedByPointer.current = false
    const closeOnClickOutside = ({ target }: MouseEvent) => {
      if (!(target instanceof Node && menuRef.current?.contains(target))) {
        close()
      }
    }
    const onMouseUp = () => (closedByPointer.current = true)
    const onKeyDown = () => (closedByPointer.current = false)
    document.addEventListener('contextmenu', close, true)
    document.addEventListener('click', closeOnClickOutside, true)
    document.addEventListener('mouseup', onMouseUp, true)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('contextmenu', close, true)
      document.removeEventListener('click', closeOnClickOutside, true)
      document.removeEventListener('mouseup', onMouseUp, true)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [isOpen, close, menuRef])
  return closedByPointer
}
