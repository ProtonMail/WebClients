import { MimeIcon } from '@proton/components'

import { ContextMenuButton } from '../ContextMenuButton'
import { useDocumentActions } from '../../../../__utils/document-actions'
import type { RecentDocumentsItem } from '@proton/docs-core'
import { c } from 'ttag'

export type OpenButtonProps = {
  currentDocument: RecentDocumentsItem
  close: () => void
}

export function OpenButton({ currentDocument, close }: OpenButtonProps) {
  const documentActions = useDocumentActions()
  return (
    <ContextMenuButton
      name={c('Action').t`Open`}
      icon={<MimeIcon name="proton-doc" className="mr-2" />}
      action={() => documentActions.open(currentDocument)}
      close={close}
    />
  )
}
