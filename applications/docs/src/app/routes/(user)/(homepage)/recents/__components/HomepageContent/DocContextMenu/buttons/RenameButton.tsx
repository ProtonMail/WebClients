import { IcPenSquare } from '@proton/icons/icons/IcPenSquare'

import { ContextMenuButton } from '../ContextMenuButton'
import { useDocumentActions } from '../../../../__utils/document-actions'
import type { RecentDocumentsItem } from '@proton/docs-core'
import { c } from 'ttag'

export type RenameButtonProps = {
  currentDocument: RecentDocumentsItem
  close: () => void
}

export function RenameButton({ currentDocument, close }: RenameButtonProps) {
  const documentActions = useDocumentActions()
  return (
    <ContextMenuButton
      name={c('Action').t`Rename`}
      icon={<IcPenSquare className="mr-2" />}
      action={() => documentActions.startRename(currentDocument)}
      close={close}
    />
  )
}
