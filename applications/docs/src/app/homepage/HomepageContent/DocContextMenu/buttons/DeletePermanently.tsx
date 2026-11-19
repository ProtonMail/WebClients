import { IcCrossCircle } from '@proton/icons/icons/IcCrossCircle'

import { ContextMenuButton } from '../ContextMenuButton'
import { useDocumentActions } from '../../../documentActionsContext'
import type { RecentDocumentsItem } from '../../../recentDocumentsItem'
import { useHomepageMessages } from '../../../messages/HomepageMessagesProvider'

export type DeletePermanentlyButtonProps = {
  currentDocument: RecentDocumentsItem
  close: () => void
}

export function DeletePermanentlyButton({ currentDocument, close }: DeletePermanentlyButtonProps) {
  const documentActions = useDocumentActions()
  const messages = useHomepageMessages().contextMenu
  return (
    <ContextMenuButton
      name={messages.deletePermanently}
      icon={<IcCrossCircle className="mr-2" />}
      action={async () => {
        close()
        await documentActions.deletePermanently(currentDocument)
      }}
      close={() => {}}
    />
  )
}
