import { Icon } from '../../../components/Icon'
import * as Icons from '../../../components/icons'

import { ContextMenuButton } from '../ContextMenuButton'
import { useDocumentActions } from '../../../documentActionsContext'
import type { RecentDocumentsItem } from '../../../recentDocumentsItem'
import { useHomepageMessages } from '../../../messages/HomepageMessagesProvider'

export type ShareButtonProps = {
  currentDocument: RecentDocumentsItem
  close: () => void
}

export function ShareButton({ currentDocument, close }: ShareButtonProps) {
  const documentActions = useDocumentActions()
  const messages = useHomepageMessages().contextMenu
  return (
    <ContextMenuButton
      name={messages.share}
      icon={<Icon data={Icons.userPlus} className="mr-2" />}
      action={() => documentActions.share(currentDocument)}
      close={close}
    />
  )
}
