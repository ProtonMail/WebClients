import { Icon } from '@proton/components'

import { ContextMenuButton } from '../ContextMenuButton'
import { useDocumentActions } from '../../../../__utils/document-actions'
import type { RecentDocumentsItem } from '@proton/docs-core'
import { c } from 'ttag'
import { useHomepageView } from '../../../../__utils/homepage-view'

export type MoveToTrashButtonProps = {
  currentDocument: RecentDocumentsItem
  close: () => void
}

export function MoveToTrashButton({ currentDocument, close }: MoveToTrashButtonProps) {
  const { updateRecentDocuments } = useHomepageView()
  const documentActions = useDocumentActions()
  return (
    <ContextMenuButton
      name={c('Action').t`Move to trash`}
      icon={<Icon name="trash" className="mr-2" />}
      action={async () => {
        await documentActions.trash(currentDocument)
        void updateRecentDocuments()
      }}
      close={close}
    />
  )
}
