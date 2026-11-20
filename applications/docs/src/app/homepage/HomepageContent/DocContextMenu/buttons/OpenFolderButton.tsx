import { Icon } from '../../../components/Icon'
import * as Icons from '../../../components/icons'

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
      icon={<Icon data={Icons.folderOpen} className="mr-2" />}
      action={() => documentActions.openParent(currentDocument)}
      close={close}
    />
  )
}
