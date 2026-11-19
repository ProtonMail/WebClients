import { IcUserPlus } from '@proton/icons/icons/IcUserPlus'

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
      icon={<IcUserPlus className="mr-2" />}
      action={() => documentActions.share(currentDocument)}
      close={close}
    />
  )
}
