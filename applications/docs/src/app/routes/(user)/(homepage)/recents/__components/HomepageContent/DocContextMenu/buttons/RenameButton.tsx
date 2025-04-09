import { Icon } from '@proton/components'

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
      icon={<Icon name="pen-square" className="mr-2" />}
      action={() => documentActions.startRename(currentDocument)}
      close={close}
    />
  )
}
