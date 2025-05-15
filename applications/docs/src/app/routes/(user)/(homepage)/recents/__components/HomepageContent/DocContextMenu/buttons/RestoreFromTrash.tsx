import { Icon } from '@proton/components'

import { ContextMenuButton } from '../ContextMenuButton'
import { useDocumentActions } from '../../../../__utils/document-actions'
import type { RecentDocumentsItem } from '@proton/docs-core'
import { c } from 'ttag'
import { useState } from 'react'

export type RestoreFromTrashButtonProps = {
  currentDocument: RecentDocumentsItem
}

export function RestoreFromTrashButton({ currentDocument }: RestoreFromTrashButtonProps) {
  const documentActions = useDocumentActions()
  const [isLoading, setLoading] = useState(documentActions.currentlyRestoringId === currentDocument.uniqueId())
  return (
    <ContextMenuButton
      disabled={isLoading}
      name={!isLoading ? c('Action').t`Restore from trash` : c('Action').t`Restoring...`}
      icon={
        !isLoading ? (
          <Icon name="arrow-rotate-right" className="mr-2" />
        ) : (
          <Icon name="arrow-rotate-right" className="mr-2 animate-spin" />
        )
      }
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
