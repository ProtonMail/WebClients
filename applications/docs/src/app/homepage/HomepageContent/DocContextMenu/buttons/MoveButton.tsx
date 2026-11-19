import { IcArrowsCross } from '@proton/icons/icons/IcArrowsCross'

import { ContextMenuButton } from '../ContextMenuButton'
import { useDocumentActions } from '../../../documentActionsContext'
import type { RecentDocumentsItem } from '../../../recentDocumentsItem'
import { createContextMenuMessages } from '../../../messages/contextMenu'

export type MoveButtonProps = {
  currentDocument: RecentDocumentsItem
  close: () => void
}

export function MoveButton({ currentDocument, close }: MoveButtonProps) {
  const documentActions = useDocumentActions()
  return (
    <ContextMenuButton
      name={createContextMenuMessages().contextMenu.move}
      icon={<IcArrowsCross className="mr-2" />}
      action={() => documentActions.move(currentDocument)}
      close={close}
    />
  )
}
