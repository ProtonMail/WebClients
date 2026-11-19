import { IcArrowRotateRight } from '@proton/icons/icons/IcArrowRotateRight'

import { ContextMenuButton } from '../ContextMenuButton'
import { useDocumentActions } from '../../../documentActionsContext'
import type { RecentDocumentsItem } from '../../../recentDocumentsItem'
import { useHomepageMessages } from '../../../messages/HomepageMessagesProvider'
import { useState } from 'react'

export type RestoreFromTrashButtonProps = {
  currentDocument: RecentDocumentsItem
}

export function RestoreFromTrashButton({ currentDocument }: RestoreFromTrashButtonProps) {
  const documentActions = useDocumentActions()
  const [isLoading, setLoading] = useState(documentActions.currentlyRestoringId === currentDocument.uniqueId())
  const messages = useHomepageMessages().contextMenu
  return (
    <ContextMenuButton
      disabled={isLoading}
      name={!isLoading ? messages.restoreFromTrash : messages.restoring}
      icon={!isLoading ? <IcArrowRotateRight className="mr-2" /> : <IcArrowRotateRight className="mr-2 animate-spin" />}
      action={async () => {
        if (isLoading) {
          return
        }
        setLoading(true)
        await documentActions.restore(currentDocument)
        setLoading(false)
      }}
      close={() => {}}
    />
  )
}
