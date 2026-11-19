import { IcUserPlus } from '@proton/icons/icons/IcUserPlus'

import { ContextMenuButton } from '../ContextMenuButton'
import { useDocumentActions } from '../../../documentActionsContext'
import type { RecentDocumentsItem } from '../../../recentDocumentsItem'
import { createContextMenuMessages } from '../../../messages/contextMenu'

export type ShareButtonProps = {
  currentDocument: RecentDocumentsItem
  close: () => void
}

export function ShareButton({ currentDocument, close }: ShareButtonProps) {
  const documentActions = useDocumentActions()
  return (
    <ContextMenuButton
      name={createContextMenuMessages().contextMenu.share}
      icon={<IcUserPlus className="mr-2" />}
      action={() => documentActions.share(currentDocument)}
      close={close}
    />
  )
}
