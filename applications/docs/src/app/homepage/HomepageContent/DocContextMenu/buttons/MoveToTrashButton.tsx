import { IcArrowRotateRight } from '@proton/icons/icons/IcArrowRotateRight'
import { IcTrash } from '@proton/icons/icons/IcTrash'

import { ContextMenuButton } from '../ContextMenuButton'
import { useDocumentActions } from '../../../documentActionsContext'
import type { RecentDocumentsItem } from '../../../recentDocumentsItem'
import { useHomepageMessages } from '../../../messages/HomepageMessagesProvider'
import { useState } from 'react'

export type MoveToTrashButtonProps = {
  currentDocument: RecentDocumentsItem
}

export function MoveToTrashButton({ currentDocument }: MoveToTrashButtonProps) {
  const documentActions = useDocumentActions()
  const [isLoading, setLoading] = useState(documentActions.currentlyTrashingId === currentDocument.uniqueId())
  const messages = useHomepageMessages().contextMenu
  return (
    <ContextMenuButton
      disabled={isLoading}
      name={!isLoading ? messages.moveToTrash : messages.trashing}
      icon={!isLoading ? <IcTrash className="mr-2" /> : <IcArrowRotateRight className="mr-2 animate-spin" />}
      action={async () => {
        if (isLoading) {
          return
        }
        setLoading(true)
        await documentActions.trash(currentDocument)
        setLoading(false)
      }}
      close={() => {}}
    />
  )
}
