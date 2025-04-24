import { Icon } from '@proton/components'

import { ContextMenuButton } from '../ContextMenuButton'
import { useDocumentActions } from '../../../../__utils/document-actions'
import type { RecentDocumentsItem } from '@proton/docs-core'
import { c } from 'ttag'
import { useState } from 'react'

export type MoveToTrashButtonProps = {
  currentDocument: RecentDocumentsItem
  close: () => void
}

export function MoveToTrashButton({ currentDocument, close }: MoveToTrashButtonProps) {
  const documentActions = useDocumentActions()
  const [isLoading, setLoading] = useState(false)
  return (
    <ContextMenuButton
      name={!isLoading ? c('Action').t`Move to trash` : c('Action').t`Trashing...`}
      icon={
        !isLoading ? (
          <Icon name="trash" className="mr-2" />
        ) : (
          <Icon name="arrow-rotate-right" className="mr-2 animate-spin" />
        )
      }
      action={async () => {
        if (isLoading) {
          return
        }
        setLoading(true)
        await documentActions.trash(currentDocument)
        setLoading(false)
        close()
      }}
      close={() => {}}
    />
  )
}
