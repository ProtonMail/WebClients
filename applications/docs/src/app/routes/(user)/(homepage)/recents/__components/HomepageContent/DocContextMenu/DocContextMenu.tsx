import ContextMenu from '@proton/components/components/contextMenu/ContextMenu';
import ContextSeparator from '@proton/components/components/contextMenu/ContextSeparator';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import { useEffect } from 'react'

import { OpenButton } from './buttons/OpenButton'
import type { RecentDocumentsItem } from '@proton/docs-core'
import { rawPermissionToRole } from '@proton/docs-core'
import type { ContextMenuProps } from '@proton/components/components/contextMenu/ContextMenu'
import { OpenFolderButton } from './buttons/OpenFolderButton'
import { ShareButton } from './buttons/ShareButton'
import { MoveToTrashButton } from './buttons/MoveToTrashButton'
import { MoveButton } from './buttons/MoveButton'
import { RenameButton } from './buttons/RenameButton'
import { useDocumentActions } from '../../../__utils/document-actions'
import { useEvent } from '~/utils/misc'
import { useHomepageView } from '../../../__utils/homepage-view'
import { RestoreFromTrashButton } from './buttons/RestoreFromTrash'
import { DeletePermanentlyButton } from './buttons/DeletePermanently'
import { useLoadRecentsWithSdkEnabled, useSharingModalDriveSdkEnabled, useTrashWithSDK } from '~/utils/flags'
import { MemberRole } from '@proton/drive'

export type DocContextMenuProps = Omit<ContextMenuProps, 'children'> & {
  currentDocument: RecentDocumentsItem | undefined
  // NOTE: copied from packages/drive-store/components/sections/ContextMenu/ItemContextMenu.tsx
  // Unsure why it's necessary if the base ContextMenu doesn't take this prop. Its purpose may
  // be related to the effect below.
  open: () => void
}

export function DocContextMenu({ anchorRef, isOpen, position, open, close, currentDocument }: DocContextMenuProps) {
  const canShare = useCanShare(currentDocument)
  const canTrash = useCanTrash(currentDocument)

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

  const {
    updateRecentDocuments,
    state: { view },
  } = useHomepageView()
  const isTrash = view === 'trash'

  const documentActions = useDocumentActions()
  const onTrashed = useEvent((id: string) => {
    if (currentDocument?.uniqueId() === id) {
      close()
    }
    // TODO (after SDK is fully rolled-out): use optimistic update, do not reload everything
    void updateRecentDocuments()
  })
  useEffect(() => {
    documentActions.onTrashed(onTrashed)
  }, [documentActions, onTrashed])

  const onRestored = useEvent((id: string) => {
    if (currentDocument?.uniqueId() === id) {
      close()
    }
    // TODO (after SDK is fully rolled-out): use optimistic update, do not reload everything
    void updateRecentDocuments()
  })
  useEffect(() => {
    documentActions.onRestored(onRestored)
  }, [documentActions, onRestored])

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
        {!isTrash ? (
          <>
            <OpenButton currentDocument={currentDocument} close={close} />
            {canShare ? <ShareButton currentDocument={currentDocument} close={close} /> : null}
            {separator}
            <MoveButton currentDocument={currentDocument} close={close} />
            <OpenFolderButton currentDocument={currentDocument} close={close} />
            <RenameButton currentDocument={currentDocument} close={close} />
            {canTrash ? (
              <>
                {separator}
                <MoveToTrashButton currentDocument={currentDocument} />
              </>
            ) : null}
          </>
        ) : (
          <>
            <RestoreFromTrashButton currentDocument={currentDocument} />
            <DeletePermanentlyButton currentDocument={currentDocument} close={close} />
          </>
        )}
      </ContextMenu>
    </>
  )
}

function useCanShare(currentDocument: RecentDocumentsItem | undefined) {
  const sdkSharingModalEnabled = useSharingModalDriveSdkEnabled()
  const loadRecentsWithSdkEnabled = useLoadRecentsWithSdkEnabled()

  if (!currentDocument) {
    return false
  }

  if (sdkSharingModalEnabled) {
    if (loadRecentsWithSdkEnabled) {
      return currentDocument.effectiveRole === MemberRole.Admin
    } else if (currentDocument.permissions) {
      return rawPermissionToRole(currentDocument.permissions).canShare()
    }
  }
  return !currentDocument.isSharedWithMe
}

function useCanTrash(currentDocument: RecentDocumentsItem | undefined) {
  const trashWithSDK = useTrashWithSDK()
  const loadRecentsWithSdkEnabled = useLoadRecentsWithSdkEnabled()

  if (!currentDocument) {
    return false
  }

  if (trashWithSDK && loadRecentsWithSdkEnabled) {
    return currentDocument.effectiveRole === MemberRole.Admin
  }
  return !currentDocument.isSharedWithMe
}
