import { IcFolderOpen } from '@proton/icons/icons/IcFolderOpen'

import { ContextMenuButton } from '../ContextMenuButton'
import { useDocumentActions } from '../../../documentActionsContext'
import type { RecentDocumentsItem } from '../../../recentDocumentsItem'
import { useHomepageMessages } from '../../../messages/HomepageMessagesProvider'

export type OpenFolderButtonProps = {
  currentDocument: RecentDocumentsItem
  close: () => void
}

export function OpenFolderButton({ currentDocument, close }: OpenFolderButtonProps) {
  const documentActions = useDocumentActions()
  const messages = useHomepageMessages().contextMenu
  return (
    <ContextMenuButton
      name={messages.openFolder}
      icon={<IcFolderOpen className="mr-2" />}
      action={() => documentActions.openParent(currentDocument)}
      close={close}
    />
  )
}
