import { ContextMenuButton } from '../ContextMenuButton'
import { useDocumentActions } from '../../../documentActionsContext'
import type { RecentDocumentsItem } from '../../../recentDocumentsItem'
import { useHomepageMessages } from '../../../messages/HomepageMessagesProvider'
import { MIME_ICON_BY_TYPE } from '../../shared'

export type OpenButtonProps = {
  currentDocument: RecentDocumentsItem
  close: () => void
}

export function OpenButton({ currentDocument, close }: OpenButtonProps) {
  const documentActions = useDocumentActions()
  const messages = useHomepageMessages().contextMenu
  const DocumentTypeIcon = MIME_ICON_BY_TYPE[currentDocument.type]
  return (
    <ContextMenuButton
      name={messages.open}
      icon={<DocumentTypeIcon className="mr-2" />}
      action={() => documentActions.open(currentDocument)}
      close={close}
    />
  )
}
