import { ContextMenuButton } from '../ContextMenuButton'
import { useDocumentActions } from '../../../documentActionsContext'
import type { RecentDocumentsItem } from '../../../recentDocumentsItem'
import { createContextMenuMessages } from '../../../messages/contextMenu'
import { MIME_ICON_BY_TYPE } from '../../shared'

export type OpenButtonProps = {
  currentDocument: RecentDocumentsItem
  close: () => void
}

export function OpenButton({ currentDocument, close }: OpenButtonProps) {
  const documentActions = useDocumentActions()
  const DocumentTypeIcon = MIME_ICON_BY_TYPE[currentDocument.type]
  return (
    <ContextMenuButton
      name={createContextMenuMessages().contextMenu.open}
      icon={<DocumentTypeIcon className="mr-2" />}
      action={() => documentActions.open(currentDocument)}
      close={close}
    />
  )
}
