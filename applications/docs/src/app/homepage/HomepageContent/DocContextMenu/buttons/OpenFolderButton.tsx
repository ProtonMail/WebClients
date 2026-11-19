import { IcFolderOpen } from '@proton/icons/icons/IcFolderOpen'

import { ContextMenuButton } from '../ContextMenuButton'
import { useDocumentActions } from '../../../documentActionsContext'
import type { RecentDocumentsItem } from '../../../recentDocumentsItem'
import { createContextMenuMessages } from '../../../messages/contextMenu'

export type OpenFolderButtonProps = {
  currentDocument: RecentDocumentsItem
  close: () => void
}

export function OpenFolderButton({ currentDocument, close }: OpenFolderButtonProps) {
  const documentActions = useDocumentActions()
  return (
    <ContextMenuButton
      name={createContextMenuMessages().contextMenu.openFolder}
      icon={<IcFolderOpen className="mr-2" />}
      action={() => documentActions.openParent(currentDocument)}
      close={close}
    />
  )
}
