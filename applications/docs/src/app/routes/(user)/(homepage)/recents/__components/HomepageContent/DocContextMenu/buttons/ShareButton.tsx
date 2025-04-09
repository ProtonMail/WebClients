import { Icon } from '@proton/components'

import { ContextMenuButton } from '../ContextMenuButton'
import { useDocumentActions } from '../../../../__utils/document-actions'
import type { RecentDocumentsItem } from '@proton/docs-core'
import { c } from 'ttag'

export type ShareButtonProps = {
  currentDocument: RecentDocumentsItem
  close: () => void
}

export function ShareButton({ currentDocument, close }: ShareButtonProps) {
  const documentActions = useDocumentActions()
  return (
    <ContextMenuButton
      name={c('Action').t`Share`}
      icon={<Icon name="user-plus" className="mr-2" />}
      action={() => documentActions.share(currentDocument)}
      close={close}
    />
  )
}
