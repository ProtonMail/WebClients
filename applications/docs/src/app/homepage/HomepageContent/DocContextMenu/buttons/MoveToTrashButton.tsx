import { Icon } from '../../../components/Icon'
import * as Icons from '../../../components/icons'
import { clsx } from '../../../utils/clsx'

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
      icon={
        <Icon
          data={isLoading ? Icons.arrowRotateRight : Icons.trash}
          className={clsx('mr-2', isLoading && 'animate-spin')}
        />
      }
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
