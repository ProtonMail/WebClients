import { MimeIcon } from '@proton/components'

import { ContextMenuButton } from '../ContextMenuButton'
import { useRecentDocuments } from '../../../utils/recent-documents'
import type { RecentDocumentItem } from 'packages/docs-core'
import { c } from 'ttag'

export type OpenButtonProps = {
  currentDocument: RecentDocumentItem
  close: () => void
}

export function OpenButton({ currentDocument, close }: OpenButtonProps) {
  const { handleOpenDocument } = useRecentDocuments()
  return (
    <ContextMenuButton
      name={c('Action').t`Open`}
      icon={<MimeIcon name="proton-doc" className="mr-2" />}
      action={() => {
        handleOpenDocument(currentDocument)
      }}
      close={close}
    />
  )
}
