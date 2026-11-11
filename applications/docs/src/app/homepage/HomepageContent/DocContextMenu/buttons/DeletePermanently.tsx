import { IcCrossCircle } from '@proton/icons/icons/IcCrossCircle'

import { ContextMenuButton } from '../ContextMenuButton'
import { useDocumentActions } from '../../../documentActionsContext'
import type { RecentDocumentsItem } from '../../../recentDocumentsItem'
import { c } from 'ttag'

export type DeletePermanentlyButtonProps = {
  currentDocument: RecentDocumentsItem
  close: () => void
}

export function DeletePermanentlyButton({ currentDocument, close }: DeletePermanentlyButtonProps) {
  const documentActions = useDocumentActions()
  return (
    <ContextMenuButton
      name={c('Action').t`Delete permanently`}
      icon={<IcCrossCircle className="mr-2" />}
      action={async () => {
        close()
        await documentActions.deletePermanently(currentDocument)
      }}
      close={() => {}}
    />
  )
}
