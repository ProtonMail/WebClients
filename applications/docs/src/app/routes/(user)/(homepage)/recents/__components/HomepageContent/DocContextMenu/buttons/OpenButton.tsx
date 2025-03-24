import { MimeIcon } from '@proton/components'

import { ContextMenuButton } from '../ContextMenuButton'
import { useRecentDocuments } from '../../../../__utils/recent-documents'
import type { RecentDocumentsItem } from '@proton/docs-core'
import { c } from 'ttag'

export type OpenButtonProps = {
  currentDocument: RecentDocumentsItem
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
