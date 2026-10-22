import { ContextMenuButton } from '../ContextMenuButton'
import { useDocumentActions } from '../../../../__utils/document-actions'
import type { RecentDocumentsItem } from '@proton/docs-core/Services/recent-documents'
import { c } from 'ttag'
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
      name={c('Action').t`Open`}
      icon={<DocumentTypeIcon className="mr-2" />}
      action={() => documentActions.open(currentDocument)}
      close={close}
    />
  )
}
