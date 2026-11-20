import { Icon } from '../../../components/Icon'
import * as Icons from '../../../components/icons'

import { ContextMenuButton } from '../ContextMenuButton'
import { useDocumentActions } from '../../../documentActionsContext'
import type { RecentDocumentsItem } from '../../../recentDocumentsItem'
import { useHomepageMessages } from '../../../messages/HomepageMessagesProvider'

export type RenameButtonProps = {
  currentDocument: RecentDocumentsItem
  close: () => void
}

export function RenameButton({ currentDocument, close }: RenameButtonProps) {
  const documentActions = useDocumentActions()
  const messages = useHomepageMessages().contextMenu
  return (
    <ContextMenuButton
      name={messages.rename}
      icon={<Icon data={Icons.penSquare} className="mr-2" />}
      action={() => documentActions.startRename(currentDocument)}
      close={close}
    />
  )
}
