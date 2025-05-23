import { Icon } from '@proton/components'

import { ContextMenuButton } from '../ContextMenuButton'
import { useDocumentActions } from '../../../../__utils/document-actions'
import type { RecentDocumentsItem } from '@proton/docs-core'
import { c } from 'ttag'

export type OpenFolderButtonProps = {
  currentDocument: RecentDocumentsItem
  close: () => void
}

export function OpenFolderButton({ currentDocument, close }: OpenFolderButtonProps) {
  const documentActions = useDocumentActions()
  return (
    <ContextMenuButton
      name={c('Action').t`Open folder`}
      icon={<Icon name="folder-open" className="mr-2" />}
      action={() => documentActions.openParent(currentDocument)}
      close={close}
    />
  )
}
