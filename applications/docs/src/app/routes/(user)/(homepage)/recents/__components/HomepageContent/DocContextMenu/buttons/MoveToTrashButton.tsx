import { IcArrowRotateRight } from '@proton/icons/icons/IcArrowRotateRight'
import { IcTrash } from '@proton/icons/icons/IcTrash'

import { ContextMenuButton } from '../ContextMenuButton'
import { useDocumentActions } from '../../../../__utils/document-actions'
import type { RecentDocumentsItem } from '@proton/docs-core'
import { c } from 'ttag'
import { useState } from 'react'

export type MoveToTrashButtonProps = {
  currentDocument: RecentDocumentsItem
}

export function MoveToTrashButton({ currentDocument }: MoveToTrashButtonProps) {
  const documentActions = useDocumentActions()
  const [isLoading, setLoading] = useState(documentActions.currentlyTrashingId === currentDocument.uniqueId())
  return (
    <ContextMenuButton
      disabled={isLoading}
      name={!isLoading ? c('Action').t`Move to trash` : c('Action').t`Trashing...`}
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
