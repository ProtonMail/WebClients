import { Icon } from '../../../components/Icon'
import * as Icons from '../../../components/icons'

import { ContextMenuButton } from '../ContextMenuButton'
import { useDocumentActions } from '../../../documentActionsContext'
import type { RecentDocumentsItem } from '../../../recentDocumentsItem'
import { useHomepageMessages } from '../../../messages/HomepageMessagesProvider'

export type MoveButtonProps = {
  currentDocument: RecentDocumentsItem
  close: () => void
  onMoved?: (moved: RecentDocumentsItem[]) => void
}

export function MoveButton({ currentDocument, close, onMoved }: MoveButtonProps) {
  const documentActions = useDocumentActions()
  const messages = useHomepageMessages().contextMenu
  return (
    <ContextMenuButton
      name={messages.move}
      icon={<Icon data={Icons.arrowsCross} className="mr-2" />}
      action={() => documentActions.move(currentDocument, onMoved)}
      close={close}
    />
  )
}
