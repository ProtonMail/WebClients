import { IcArrowsCross } from '@proton/icons/icons/IcArrowsCross'

import { ContextMenuButton } from '../ContextMenuButton'
import { useDocumentActions } from '../../../../__utils/document-actions'
import type { RecentDocumentsItem } from '@proton/docs-core'
import { c } from 'ttag'

export type MoveButtonProps = {
  currentDocument: RecentDocumentsItem
  close: () => void
}

export function MoveButton({ currentDocument, close }: MoveButtonProps) {
  const documentActions = useDocumentActions()
  return (
    <ContextMenuButton
      name={c('Action').t`Move`}
      icon={<IcArrowsCross className="mr-2" />}
      action={() => documentActions.move(currentDocument)}
      close={close}
    />
  )
}
